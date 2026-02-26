package cmd

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/poweruptime/pu/pkg/runner"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var (
	target string
)

func loadEnv() (map[string]string, error) {
	if _, err := os.Stat(".env"); os.IsNotExist(err) {
		return nil, fmt.Errorf(".env file not found. Run './pu setup' first")
	}
	env, err := godotenv.Read(".env")
	if err != nil {
		return nil, err
	}
	required := []string{"DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"}
	for _, req := range required {
		if env[req] == "" {
			return nil, fmt.Errorf("missing required environment variable: %s", req)
		}
	}
	return env, nil
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

var backupCmd = &cobra.Command{
	Use:   "backup",
	Short: "Create DB backup",
	RunE: func(cmd *cobra.Command, args []string) error {
		env, err := loadEnv()
		if err != nil {
			return err
		}

		backupDir := filepath.Join("backup", "poweruptime-db")
		if err := os.MkdirAll(backupDir, 0755); err != nil {
			return err
		}

		ts := time.Now().Format("20060102150405")
		outFile := filepath.Join(backupDir, fmt.Sprintf("%s.sql.gpg", ts))

		pgCmd := exec.Command("docker", "exec",
			"--env", "PGPASSWORD="+env["DATABASE_PASSWORD"],
			"poweruptime-db", "pg_dump", "-U", env["DATABASE_USER"], env["DATABASE_NAME"])

		gpgCmd := exec.Command("gpg", "--batch", "--passphrase", env["DATABASE_PASSWORD"], "-c", "-o", outFile)

		if dryRun {
			fmt.Printf("+ docker exec --env PGPASSWORD=*** poweruptime-db pg_dump -U %s %s | gpg --batch --passphrase *** -c -o %s", env["DATABASE_USER"], env["DATABASE_NAME"], outFile)
			return nil
		}

		// Sets up the pipe
		pipeReader, pipeWriter := io.Pipe()
		pgCmd.Stdout = pipeWriter
		gpgCmd.Stdin = pipeReader
		pgCmd.Stderr = os.Stderr
		gpgCmd.Stderr = os.Stderr

		log.Info().Msgf("Backing up to %s", outFile)

		if err := pgCmd.Start(); err != nil {
			return err
		}
		if err := gpgCmd.Start(); err != nil {
			return err
		}

		// Wait for pgCmd to finish writing to pipe, then close.
		go func() {
			err := pgCmd.Wait()
			pipeWriter.CloseWithError(err)
		}()

		if err := gpgCmd.Wait(); err != nil {
			return fmt.Errorf("backup failed during encryption: %w", err)
		}

		log.Info().Msg("Backup completed successfully")
		return nil
	},
}

var backupPruneCmd = &cobra.Command{
	Use:   "backup-prune",
	Short: "Prune all but latest 5 backups",
	RunE: func(cmd *cobra.Command, args []string) error {
		backupDir := filepath.Join("backup", "poweruptime-db")
		entries, err := os.ReadDir(backupDir)
		if err != nil {
			if os.IsNotExist(err) {
				return nil
			}
			return err
		}

		var files []os.DirEntry
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql.gpg") {
				files = append(files, e)
			}
		}

		// Sort by ModTime (although filenames are timestamps, modtime is safer/easier if standard)
		// Filename format is YYYYMMDDHHMMSS, so sorting by name descending is sorting by time descending.
		sort.Slice(files, func(i, j int) bool {
			return files[i].Name() > files[j].Name() // Descending
		})

		retention := getBackupRetention()
		if len(files) <= retention {
			log.Info().Msg("No backups to prune")
			return nil
		}

		r := &runner.Runner{DryRun: dryRun}
		for _, f := range files[retention:] {
			path := filepath.Join(backupDir, f.Name())
			if err := r.Run("rm", "-f", path); err != nil {
				log.Error().Err(err).Msgf("Failed to delete %s", path)
			} else {
				log.Info().Msgf("Pruned %s", path)
			}
		}

		return nil
	},
}

var backupVerifyCmd = &cobra.Command{
	Use:   "backup-verify [file]",
	Short: "Verify encrypted DB backup",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		env, err := loadEnv()
		if err != nil {
			return err
		}
		targetFile := args[0]
		if _, err := os.Stat(targetFile); err != nil {
			return err
		}

		r := &runner.Runner{DryRun: dryRun}
		return r.Run("gpg", "--batch", "--passphrase", env["DATABASE_PASSWORD"], "--decrypt", targetFile)
	},
}

var backupExtractCmd = &cobra.Command{
	Use:   "backup-extract [file]",
	Short: "Extract encrypted DB backup",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		env, err := loadEnv()
		if err != nil {
			return err
		}
		targetFile := args[0]
		outFile := strings.TrimSuffix(targetFile, ".gpg")

		r := &runner.Runner{DryRun: dryRun}
		return r.Run("gpg", "--batch", "--passphrase", env["DATABASE_PASSWORD"], "--decrypt", targetFile, "-o", outFile)
	},
}

var insecureImport bool

var backupImportCmd = &cobra.Command{
	Use:   "backup-import [file]",
	Short: "Import encrypted or plain DB backup (DANGEROUS)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		env, err := loadEnv()
		if err != nil {
			return err
		}
		targetFile := args[0]

		val, ok := env["DATABASE_NAME"]
		if !ok {
			return fmt.Errorf("DATABASE_NAME not set")
		}

		if !confirm(fmt.Sprintf("Restore '%s' into '%s'?", targetFile, val)) {
			return fmt.Errorf("import cancelled")
		}

		psqlCmd := exec.Command("docker", "exec", "-i", "--env", "PGPASSWORD="+env["DATABASE_PASSWORD"],
			"poweruptime-db", "psql", "-U", env["DATABASE_USER"], "-d", env["DATABASE_NAME"])

		// Input handling: either gpg decrypt or cat (if insecure)
		var inputCmd *exec.Cmd
		if insecureImport {
			inputCmd = exec.Command("cat", targetFile)
		} else {
			inputCmd = exec.Command("gpg", "--batch", "--passphrase", env["DATABASE_PASSWORD"], "--decrypt", targetFile)
		}

		pipeReader, pipeWriter := io.Pipe()
		inputCmd.Stdout = pipeWriter
		psqlCmd.Stdin = pipeReader

		inputCmd.Stderr = os.Stderr
		psqlCmd.Stdout = os.Stdout
		psqlCmd.Stderr = os.Stderr

		if dryRun {
			if insecureImport {
				fmt.Printf("+ cat %s | docker exec -i --env PGPASSWORD=*** poweruptime-db psql -U %s -d %s\n", targetFile, env["DATABASE_USER"], env["DATABASE_NAME"])
			} else {
				fmt.Printf("+ gpg --batch --passphrase *** --decrypt %s | docker exec -i --env PGPASSWORD=*** poweruptime-db psql -U %s -d %s\n", targetFile, env["DATABASE_USER"], env["DATABASE_NAME"])
			}
			return nil
		}

		log.Info().Msgf("Importing %s", targetFile)

		if err := inputCmd.Start(); err != nil {
			return err
		}
		if err := psqlCmd.Start(); err != nil {
			return err
		}

		go func() {
			err := inputCmd.Wait()
			pipeWriter.CloseWithError(err)
		}()

		if err := psqlCmd.Wait(); err != nil {
			return fmt.Errorf("import failed: %w", err)
		}

		log.Info().Msg("Import completed")
		return nil
	},
}

var backupRetention int

func getBackupRetention() int {
	if backupRetention > 0 {
		return backupRetention
	}
	if env := getConfig("POWERUPTIME_BACKUP_PRUNE_RETENTION"); env != "" {
		if val, err := strconv.Atoi(env); err == nil && val > 0 {
			return val
		}
	}
	return 5
}

func init() {
	rootCmd.AddCommand(backupCmd)
	rootCmd.AddCommand(backupPruneCmd)
	rootCmd.AddCommand(backupVerifyCmd)
	rootCmd.AddCommand(backupExtractCmd)

	backupImportCmd.Flags().BoolVar(&insecureImport, "insecure", false, "Import unencrypted backup (skips GPG decryption)")
	rootCmd.AddCommand(backupImportCmd)

	backupPruneCmd.Flags().IntVar(&backupRetention, "backup-retention", 0, "Number of backups to keep (env POWERUPTIME_BACKUP_PRUNE_RETENTION, default 5)")
	backupCmd.Flags().IntVar(&backupRetention, "backup-retention", 0, "Number of backups to keep (env POWERUPTIME_BACKUP_PRUNE_RETENTION, default 5)")
}
