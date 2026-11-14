package org.poweruptime.backend.features.info.changelog

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class ChangelogServiceTest {
    private val service = ChangelogService()
    private val history = """
        # Changelog

        ## 0.6.1

        Stable notes.

        ## 0.6.1-beta.1

        Second beta notes.

        ### Patch Changes

        - Nested section.

        ## 0.6.1-beta.0

        First beta notes.

        ## 0.6.0-beta-1794308547 - 2026-11-10

        Historical beta notes.

        ## 0.5.9 - 2026-10-12

        Historical stable notes.
    """.trimIndent().lines()

    @Test
    fun `production hides all beta sections and beta shows both channels`() {
        val production = service.filterChangelog(history, false, null)
        assertThat(production).contains("Stable notes.", "Historical stable notes.")
            .doesNotContain("beta", "Nested section.")
        assertThat(
            service.filterChangelog(history, true, null),
        ).contains("First beta notes.", "Historical beta notes.", "Historical stable notes.")
    }

    @Test
    fun `cut off previous release before filtering including beta to stable promotion`() {
        assertThat(service.filterChangelog(history, false, "0.6.1-beta.1"))
            .contains("Stable notes.").doesNotContain("Historical stable notes.", "Second beta notes.")
        assertThat(service.filterChangelog(history, true, "0.6.1-beta.0"))
            .contains("Second beta notes.", "Nested section.")
            .doesNotContain("First beta notes.", "Historical beta notes.")
        assertThat(service.filterChangelog(history, true, "0.6.0-beta-1794308547"))
            .doesNotContain("Historical beta notes.")
        assertThat(service.filterChangelog(history, false, "0.5.9"))
            .contains("Stable notes.").doesNotContain("Historical stable notes.")
    }

    private val promotedHistory = """
        # Changelog

        ## 0.6.2-beta.0

        ### Patch Changes

        - ccc: Third fix.

        ## 0.6.1

        ### Minor Changes

        - aaa: First feature.

          Upgrade details.

        ### Patch Changes

        - bbb: Second fix.
        - ddd: Promotion fix.

        ## 0.6.1-beta.1

        ### Patch Changes

        - bbb: Second fix.

        ## 0.6.1-beta.0

        ### Minor Changes

        - aaa: First feature.

          Upgrade details.
    """.trimIndent().lines()

    @Test
    fun `beta users see stable notes only when no beta of that version contained them`() {
        val beta = service.filterChangelog(promotedHistory, true, "0.6.1-beta.1")
        assertThat(beta.lines()).contains("## 0.6.1")
        assertThat(beta).contains("Third fix.", "### Patch Changes", "Promotion fix.")
            .doesNotContain("First feature.", "Upgrade details.", "Second fix.", "### Minor Changes")
        val withoutPromotionNote = service.filterChangelog(promotedHistory.filterNot { "Promotion" in it }, true, null)
        assertThat(withoutPromotionNote.lines()).doesNotContain("## 0.6.1")
        assertThat(withoutPromotionNote).contains("## 0.6.1-beta.0", "First feature.", "Upgrade details.")
        assertThat(service.filterChangelog(promotedHistory, false, null))
            .contains("First feature.", "Upgrade details.", "Second fix.", "Promotion fix.")
    }

    @Test
    fun `beta users keep stable-only paragraphs when every note repeats a beta`() {
        val history = """
            ## 0.6.1

            Migrate the database before upgrading.

            ### Patch Changes

            - aaa: First fix.

            ## 0.6.1-beta.0

            ### Patch Changes

            - aaa: First fix.

            ## 0.6.0 - 2026-11-01

            ### Bug Fixes

            - Old fix by Dafnik

            [**Full Changelog**](https://github.com/poweruptime/poweruptime/compare/0.5.9...0.6.0)

            ## 0.6.0-beta-1794308547 - 2026-10-30

            ### Bug Fixes

            - Old fix by Dafnik
        """.trimIndent().lines()
        val beta = service.filterChangelog(history, true, "0.6.1-beta.0")
        assertThat(beta.lines()).contains("## 0.6.1", "Migrate the database before upgrading.")
            .doesNotContain("### Patch Changes", "- aaa: First fix.")
        // A generated compare link alone does not keep a fully repeated historical section.
        assertThat(service.filterChangelog(history, true, null).lines())
            .doesNotContain("## 0.6.0 - 2026-11-01").contains("## 0.6.0-beta-1794308547 - 2026-10-30")
    }

    @Test
    fun `unknown previous version falls back to full filtered history`() {
        assertThat(service.filterChangelog(history, false, "local"))
            .isEqualTo(service.filterChangelog(history, false, null))
        assertThat(service.filterChangelog(history, true, "0.6.1")).doesNotContain("notes.")
    }
}
