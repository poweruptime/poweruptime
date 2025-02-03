package org.poweruptime.backend.core.resource

import org.springframework.http.ContentDisposition
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import java.io.ByteArrayOutputStream

fun getDownloadHttpEntity(stream: ByteArrayOutputStream, fileName: String): HttpEntity<ByteArray> {
    val byteArray = stream.toByteArray()
    val header = HttpHeaders()
    header.contentType = CSV_MEDIA_TYPE
    header.contentDisposition =
        ContentDisposition.parse("""attachment; filename=$fileName""")
    header.contentLength = byteArray.size.toLong()
    return HttpEntity(byteArray, header)
}
