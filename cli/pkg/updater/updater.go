package updater

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/poweruptime/pu/pkg/version"
	"github.com/rs/zerolog/log"
)

func CheckAndUpdate(dryRun bool) error {
	// Read versions.env
	if _, err := os.Stat("versions.env"); os.IsNotExist(err) {
		return nil // No versions file, skip update check
	}
	env, err := godotenv.Read("versions.env")
	if err != nil {
		return err
	}

	targetVersion, ok := env["POWERUPTIME_VERSION"]
	if !ok {
		return nil
	}

	if targetVersion == version.Current {
		return nil
	}

	log.Warn().Msgf("Version mismatch: CLI is %s, versions.env requires %s", version.Current, targetVersion)

	if dryRun {
		log.Info().Msg("[DryRun] Would prompt to update CLI")
		return nil
	}

	if !confirm("Do you want to update the CLI now?") {
		return nil
	}

	if err := doUpdate(targetVersion); err != nil {
		return fmt.Errorf("update failed: %w", err)
	}

	// Re-exec with new binary
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	log.Info().Msg("CLI updated. Re-executing command...")

	cmd := exec.Command(exe, os.Args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}
	os.Exit(0)
	return nil
}

func doUpdate(ver string) error {
	repo := "poweruptime/poweruptime"
	versionString := "v" + ver

	// Construct asset name to download (matching setup-cli.sh logic: pu-{OS}-{ARCH})
	osName := runtime.GOOS
	arch := runtime.GOARCH
	downloadFileName := fmt.Sprintf("pu-%s-%s-%s", versionString, osName, arch)
	url := fmt.Sprintf("https://github.com/%s/releases/download/v%s/%s", repo, ver, downloadFileName)

	// Construct local filename: pu-v{VERSION}-{OS}-{ARCH}
	localFileName := fmt.Sprintf("pu-%s-%s-%s", versionString, osName, arch)

	// Ensure cli directory exists (it should, but good to be safe)
	if err := os.MkdirAll("cli", 0755); err != nil {
		return fmt.Errorf("failed to ensure cli directory exists: %w", err)
	}

	targetPath := fmt.Sprintf("cli/%s", localFileName)

	log.Info().Msgf("Downloading update from %s to %s...", url, targetPath)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to download: status %d", resp.StatusCode)
	}

	out, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}

	if _, err := io.Copy(out, resp.Body); err != nil {
		out.Close()
		return err
	}
	out.Close()

	// Update symlink "pu" -> "cli/localFileName"
	// We are in infrastructure root (CWD)
	symlinkName := "pu"
	symlinkTarget := fmt.Sprintf("cli/%s", localFileName)

	// Remove existing link/file if it exists
	if err := os.Remove(symlinkName); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove existing symlink: %w", err)
	}

	if err := os.Symlink(symlinkTarget, symlinkName); err != nil {
		return fmt.Errorf("failed to create symlink: %w", err)
	}

	log.Info().Msgf("Updated symlink %s -> %s", symlinkName, symlinkTarget)

	return nil
}

func confirm(prompt string) bool {
	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Printf("%s [y/N]: ", prompt)
		response, err := reader.ReadString('\n')
		if err != nil {
			return false
		}
		response = strings.ToLower(strings.TrimSpace(response))
		if response == "y" || response == "yes" {
			return true
		}
		if response == "n" || response == "no" || response == "" {
			return false
		}
	}
}
