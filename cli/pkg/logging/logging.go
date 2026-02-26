package logging

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func Setup(dryRun bool) {
	// Configure zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Create log file
	logFile, err := os.OpenFile("./cli/pu.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		// If we can't open log file, just log to stderr
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
		log.Error().Err(err).Msg("Failed to open log file")
		return
	}

	// Multi-writer: Console (Stylized) + File (JSON)
	consoleWriter := zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}
	multi := zerolog.MultiLevelWriter(consoleWriter, logFile)

	log.Logger = zerolog.New(multi).With().Timestamp().Logger()

	if dryRun {
		log.Info().Msg("Dry-run mode enabled")
	}
}
