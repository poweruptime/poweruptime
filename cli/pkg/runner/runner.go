package runner

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/rs/zerolog/log"
)

type Runner struct {
	DryRun bool
}

func (r *Runner) Run(name string, args ...string) error {
	if r.DryRun {
		log.Info().Msgf("[DryRun] %s %s", name, strings.Join(args, " "))
		fmt.Printf("+ %s %s\n", name, strings.Join(args, " "))
		return nil
	}

	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	log.Debug().Str("cmd", name).Strs("args", args).Msg("Executing command")
	return cmd.Run()
}

func (r *Runner) RunOutput(name string, args ...string) (string, error) {
	if r.DryRun {
		log.Info().Msgf("[DryRun] %s %s", name, strings.Join(args, " "))
		return "", nil
	}

	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()
	return strings.TrimSpace(string(output)), err
}
