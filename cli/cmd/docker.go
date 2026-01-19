package cmd

import (
	"strings"

	"github.com/poweruptime/pu/pkg/runner"
	"github.com/spf13/cobra"
)

func getComposeArgs() []string {
	args := []string{}

	// Determine if proxy profile should be active
	// Need to access root flags or config.
	// Since getComposeArgs is in same package 'cmd', we can access exported or package-level vars from root.go?
	// root.go is in package cmd. disableReverseProxy is unexported in cmd package.
	// But they are in the same package 'cmd', so we can access 'disableReverseProxy' variable.

	proxyDisabled := disableReverseProxy
	// We also need to check Env if flag not set, similar to logic we had in root.go
	// But root.go had access to cmd.Flags().Changed.
	// We can't easily check Changed status here without passing command.
	// However, we can just check logic again if we move the logic.
	// OR, better: in root PersistentPreRun, we set a package-level variable 'activeProfiles' or similar?
	// Or we just re-implement the check here using getConfig which is in root.go (same package).

	if !rootCmd.Flags().Changed("disable-reverse-proxy") {
		if env := getConfig("POWERUPTIME_DISABLE_REVERSE_PROXY"); strings.ToLower(env) == "true" || env == "1" {
			proxyDisabled = true
		}
	}

	if !proxyDisabled {
		args = append(args, "--profile", "proxy")
	}

	args = append(args, "-f", "_base.yml")
	if local {
		args = append(args, "-f", "local.yml")
	} else {
		args = append(args, "-f", "prod.yml")
	}
	args = append(args, "--env-file", "versions.env", "--env-file", ".env")
	return args
}

func runCompose(args ...string) error {
	r := &runner.Runner{DryRun: dryRun}
	composeArgs := append([]string{"compose"}, getComposeArgs()...)
	composeArgs = append(composeArgs, args...)
	return r.Run("docker", composeArgs...)
}

// Commands

var upCmd = &cobra.Command{
	Use:     "up",
	Aliases: []string{"start"},
	Short:   "Deploy the stack (incl. pull)",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Pull first
		if err := runCompose("pull", "--quiet"); err != nil {
			return err
		}
		// Up
		return runCompose("up", "-d", "--quiet-pull")
	},
}

var downCmd = &cobra.Command{
	Use:     "down",
	Aliases: []string{"stop"},
	Short:   "Stop & remove the stack",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runCompose("down")
	},
}

var psCmd = &cobra.Command{
	Use:   "ps",
	Short: "List containers",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runCompose("ps")
	},
}

var restartCmd = &cobra.Command{
	Use:   "restart",
	Short: "Restart the stack",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runCompose("restart")
	},
}

var pullCmd = &cobra.Command{
	Use:   "pull",
	Short: "Pull images per versions.env",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runCompose("pull", "--quiet")
	},
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Print combined compose config",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runCompose("config")
	},
}

func init() {
	rootCmd.AddCommand(upCmd)
	rootCmd.AddCommand(downCmd)
	rootCmd.AddCommand(psCmd)
	rootCmd.AddCommand(restartCmd)
	rootCmd.AddCommand(pullCmd)
	rootCmd.AddCommand(configCmd)
}
