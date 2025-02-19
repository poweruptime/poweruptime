package org.poweruptime.backend.features.fileUpload

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.multipart.MultipartFile

@Controller
@Tag(name = "File API")
class FileController(
    private val storageService: StorageService,
) {
    @GetMapping("/v1/public/file/{type}/{fileId:.+}")
    @ResponseBody
    fun serveFile(
        @PathVariable("type") type: FileType,
        @PathVariable("fileId") fileId: String
    ): ResponseEntity<Resource> {
        val file = storageService.storageServices[type]?.loadAsResource(fileId) ?: throw NotFoundException()

        return ResponseEntity.ok().header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + file.filename + "\"",
        ).body(file)
    }

    @Operation(
        summary = "Upload file",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @PostMapping("/v1/file/{type}")
    @ResponseBody
    fun handleFileUpload(
        @PathVariable("type") type: FileType,
        @RequestPart("file") file: MultipartFile,
    ): FileUploadResponse = FileUploadResponse(
        storageService.storageServices[type]?.store(file) ?: throw NotFoundException(),
    )
}
