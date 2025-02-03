package org.poweruptime.backend.core.utils

import com.fasterxml.jackson.databind.ObjectWriter
import com.fasterxml.jackson.dataformat.csv.CsvMapper
import com.fasterxml.jackson.dataformat.csv.CsvParser
import com.fasterxml.jackson.dataformat.csv.CsvSchema
import java.io.OutputStream

val csvWriter: ObjectWriter = CsvMapper().apply {
    enable(CsvParser.Feature.TRIM_SPACES)
    enable(CsvParser.Feature.SKIP_EMPTY_LINES)
}.writer()

fun OutputStream.writeCsv(it: List<*>, csvSchema: CsvSchema) {
    csvWriter.with(csvSchema).writeValues(this).writeAll(it)
}
