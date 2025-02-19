package org.poweruptime.backend.features.fileUpload

import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.utils.RandomGenerator
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.net.MalformedURLException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption

val storageServices = mapOf(
    FileType.STATUS_PAGE to FileService(Path.of("/status-page")),
)

class FileService(
    private val rootLocation: Path
) {
    private fun isAllowedToUpload(file: MultipartFile) {
        if (file.isEmpty) {
            throw BadRequestException("Failed to store empty file.")
        }

        when (file.contentType) {
            "image/jpeg", "image/png", "image/webp", "image/avif" -> throw BadRequestException(
                "Only images are allowed",
            )
            else -> {}
        }
    }

    fun store(file: MultipartFile): String {
        isAllowedToUpload(file)

        val fileId = RandomGenerator.nanoId()

        val destinationFile: Path = rootLocation
            .resolve(Paths.get(fileId))
            .normalize()
            .toAbsolutePath()

        if (!destinationFile.parent.equals(rootLocation.toAbsolutePath())) {
            // This is a security check
            throw BadRequestException()
        }

        try {
            file.inputStream.use { inputStream ->
                Files.copy(
                    inputStream,
                    destinationFile,
                    StandardCopyOption.REPLACE_EXISTING,
                )
            }
        } catch (_: IOException) {
            throw BadRequestException()
        }

        return fileId
    }

    fun exists(fileId: String): Boolean = try {
        loadAsResource(fileId)
        true
    } catch (_: Exception) {
        false
    }

    fun loadAsResource(fileId: String): Resource = try {
        val file = load(fileId)
        val resource = UrlResource(file.toUri())
        if (resource.exists() && resource.isReadable) {
            resource
        } else {
            throw NotFoundException("File not found: $fileId")
        }
    } catch (e: MalformedURLException) {
        throw NotFoundException("File not found: $fileId")
    }

    fun init() {
        Files.createDirectories(rootLocation)
    }

    private fun load(fileId: String): Path {
        return rootLocation.resolve(fileId)
    }
}
