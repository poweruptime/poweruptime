package cmd

import (
	"fmt"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Show current version",
	RunE: func(cmd *cobra.Command, args []string) error {
		env, err := godotenv.Read("versions.env")
		if err != nil {
			return fmt.Errorf("failed to read versions.env: %w", err)
		}

		version, ok := env["POWERUPTIME_VERSION"]
		if !ok {
			return fmt.Errorf("POWERUPTIME_VERSION not set in versions.env")
		}

		fmt.Println(version)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
