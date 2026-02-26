package cmd

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strings"

	"github.com/poweruptime/pu/pkg/runner"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var setupCmd = &cobra.Command{
	Use:   "setup",
	Short: "Initial project setup",
	RunE: func(cmd *cobra.Command, args []string) error {
		r := &runner.Runner{DryRun: dryRun}

		// 1. Check if .env exists
		if _, err := os.Stat(".env"); err == nil && !dryRun {
			return fmt.Errorf("setup already completed (.env exists). Exiting")
		}

		// 2. Check ports
		if !dryRun {
			// In dry-run we skip port checks as we can't really "check" without side effects or it's pointless
			// But the shell script prompts. We'll skip prompt and just check.
			if err := checkPorts([]string{"80", "443"}); err != nil {
				return err
			}
			log.Info().Msg("Ports 80 and 443 are free")
		}

		// 3. Copy .env.example -> .env
		log.Info().Msg("Copying .env.example to .env...")
		if err := r.Run("cp", ".env.example", ".env"); err != nil {
			return err
		}

		// 4. Generate secrets
		log.Info().Msg("Generating secrets...")
		dbPass, err := generateSecret()
		if err != nil {
			return err
		}
		rabbitPass, err := generateSecret()
		if err != nil {
			return err
		}

		if dryRun {
			log.Info().Msgf("[DryRun] Update secrets in .env: DB_PASS=***, RABBIT_PASS=***")
		} else {
			if err := updateEnvSecrets(dbPass, rabbitPass); err != nil {
				return err
			}
			log.Info().Msg("Updated DATABASE_PASSWORD & RABBIT_PASSWORD in .env")
		}

		// 5. Open Editor
		editor := getEditor()
		log.Info().Msgf("Opening .env with %s...", editor)
		if err := r.Run(editor, ".env"); err != nil {
			return err
		}

		log.Info().Msg("Setup complete. You can start the stack with './pu up'")
		return nil
	},
}

func updateEnvSecrets(dbPass, rabbitPass string) error {
	content, err := os.ReadFile(".env")
	if err != nil {
		return err
	}

	lines := strings.Split(string(content), "\n")
	var newLines []string
	dbFound, rabbitFound := false, false

	for _, line := range lines {
		if strings.HasPrefix(line, "DATABASE_PASSWORD=") {
			newLines = append(newLines, fmt.Sprintf("DATABASE_PASSWORD=\"%s\"", dbPass))
			dbFound = true
		} else if strings.HasPrefix(line, "RABBIT_PASSWORD=") {
			newLines = append(newLines, fmt.Sprintf("RABBIT_PASSWORD=\"%s\"", rabbitPass))
			rabbitFound = true
		} else {
			newLines = append(newLines, line)
		}
	}

	if !dbFound {
		newLines = append(newLines, fmt.Sprintf("DATABASE_PASSWORD=\"%s\"", dbPass))
	}
	if !rabbitFound {
		newLines = append(newLines, fmt.Sprintf("RABBIT_PASSWORD=\"%s\"", rabbitPass))
	}

	output := strings.Join(newLines, "\n")

	return os.WriteFile(".env", []byte(output), 0600)
}

func checkPorts(ports []string) error {
	for _, port := range ports {
		ln, err := net.Listen("tcp", ":"+port)
		if err != nil {
			return fmt.Errorf("port %s is already in use. Please free it and retry", port)
		}
		ln.Close()
	}
	return nil
}

func generateSecret() (string, error) {
	b := make([]byte, 45) // 45 bytes * 4/3 approx 60 chars base64
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func getEditor() string {
	if env := os.Getenv("VISUAL"); env != "" {
		return env
	}
	if env := os.Getenv("EDITOR"); env != "" {
		return env
	}
	// Fallback to commonly available editors
	editors := []string{"nano", "vim", "vi", "code", "gedit"}
	for _, e := range editors {
		path, err := exec.LookPath(e)
		if err == nil {
			return path
		}
	}
	return "vi" // Ultimate fallback
}

func init() {
	rootCmd.AddCommand(setupCmd)
}
