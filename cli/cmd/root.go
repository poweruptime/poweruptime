package cmd

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/poweruptime/pu/pkg/logging"
	"github.com/poweruptime/pu/pkg/updater"
	"github.com/spf13/cobra"
)

var (
	local               bool
	dryRun              bool
	disableReverseProxy bool
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "pu",
	Short: "poweruptime CLI for managing the Docker Compose stack",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// Env Override for --local
		if !cmd.Flags().Changed("local") {
			if env := getConfig("POWERUPTIME_ENV"); strings.ToLower(env) == "local" {
				local = true
			}
		}

		// Reverse Proxy Logic is handled in cmd/docker.go by checking the flag/env
		// We just need to ensure the flag is available globally or accessible

		logging.Setup(dryRun)
		// Check for updates
		if err := updater.CheckAndUpdate(dryRun); err != nil {
			// Log error but don't stop execution? Or warning?
		}
	},
}

// getConfig looks up a variable in the environment, falling back to .env file
func getConfig(key string) string {
	// 1. Process environment has precedence
	if val := os.Getenv(key); val != "" {
		return val
	}

	// 2. Fallback to .env file
	envMap, err := godotenv.Read(".env")
	if err == nil {
		return envMap[key]
	}
	return ""
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().BoolVar(&local, "local", false, "Use local compose files ((env POWERUPTIME_ENV='local'))")
	rootCmd.PersistentFlags().BoolVar(&dryRun, "dry-run", false, "Print commands without executing")
	rootCmd.PersistentFlags().BoolVar(&disableReverseProxy, "disable-reverse-proxy", false, "Disable Traefik reverse proxy (env POWERUPTIME_DISABLE_REVERSE_PROXY)")
}
