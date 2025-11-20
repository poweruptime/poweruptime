package org.poweruptime.backend.features.fileUpload

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@Tag(name = "File API")
class FileController(
    private val fileService: FileService,
) {
    @Operation(summary = "Download file")
    @GetMapping("/v1/public/file/{fileId}")
    fun serveFile(@PathVariable("fileId") fileId: String): ResponseEntity<Resource> {
        val dbFile = fileService.getByFileId(fileId)
        val file = fileService.loadAsResource(fileId).orThrowNotFound("File not found: $fileId")

        return ResponseEntity.ok().header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + dbFile.name + "\"",
        ).body(file)
    }

    @Operation(
        summary = "Upload file",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PostMapping("/v1/file")
    fun handleFileUpload(@RequestPart("file") file: MultipartFile): FileResponse = FileResponse(
        fileService.store(file),
    )
}
