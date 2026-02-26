package cmd

import (
	"fmt"

	"github.com/poweruptime/pu/pkg/runner"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var updateCmd = &cobra.Command{
	Use:   "update [target]",
	Short: "Checkout, backup DB & redeploy stack",
	RunE: func(cmd *cobra.Command, args []string) error {
		r := &runner.Runner{DryRun: dryRun}
		target := "main"
		if len(args) > 0 {
			target = args[0]
		}

		logger := log.With().Str("target", target).Logger()
		logger.Info().Msg("Update started")

		// git operations
		if target == "main" || target == "beta" {
			if r.DryRun {
				logger.Info().Msg("[DryRun] Skipping branch validation and git pull")
			} else {
				currentBranch, err := r.RunOutput("git", "rev-parse", "--abbrev-ref", "HEAD")
				if err != nil {
					return err
				}
				if currentBranch != target {
					return fmt.Errorf("you are on '%s', but '%s' is needed. Please checkout manually or use update <tag>", currentBranch, target)
				}
				if err := r.Run("git", "pull"); err != nil {
					return err
				}
			}
		} else {
			if !confirm(fmt.Sprintf("Checkout '%s'?", target)) {
				return fmt.Errorf("checkout cancelled")
			}
			if err := r.Run("git", "fetch", "--tags"); err != nil {
				return err
			}
			if err := r.Run("git", "checkout", target); err != nil {
				return err
			}
		}

		logger.Info().Msg("Backing up DB")
		if err := backupCmd.RunE(backupCmd, nil); err != nil {
			return err
		}

		logger.Info().Msg("Pruning backups")
		if err := backupPruneCmd.RunE(backupPruneCmd, nil); err != nil {
			return err
		}

		logger.Info().Msg("Redeploying stack")
		// update command calls 'up'
		if err := upCmd.RunE(upCmd, nil); err != nil {
			return err
		}

		logger.Info().Msg("Update finished")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(updateCmd)
}
