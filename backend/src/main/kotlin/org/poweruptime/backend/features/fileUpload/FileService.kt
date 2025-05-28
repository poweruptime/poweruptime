package org.poweruptime.backend.features.fileUpload

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.Config
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.net.MalformedURLException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.Instant

@Service
class FileService(
    private val fileRepository: FileRepository,
    @Value(Config.STORAGE_DIRECTORY) private val directoryPath: String,
) {
    private val rootLocation = Path.of(directoryPath)
    private final val logger = KotlinLogging.logger {}

    fun store(uploadFile: MultipartFile): File {
        isAllowedToUpload(uploadFile)

        val dbFile = File(
            name = uploadFile.resource.filename!!, // gets checked by isAllowedToUpload
        )

        val destinationFile: Path = rootLocation
            .resolve(Paths.get(dbFile.fileId))
            .normalize()
            .toAbsolutePath()

        if (!destinationFile.parent.equals(rootLocation.toAbsolutePath())) {
            // This is a security check
            throw BadRequestException("Path error")
        }

        try {
            uploadFile.inputStream.use { inputStream ->
                Files.copy(
                    inputStream,
                    destinationFile,
                    StandardCopyOption.REPLACE_EXISTING,
                )
            }
        } catch (e: IOException) {
            logger.debug { "Could not save file: $e" }
            throw BadRequestException()
        }

        return fileRepository.save(dbFile)
    }

    fun loadAsResource(fileId: String): Resource? = try {
        val file = loadFile(fileId)
        val resource = UrlResource(file.toUri())
        if (resource.exists() && resource.isReadable) {
            resource
        } else {
            null
        }
    } catch (_: MalformedURLException) {
        null
    }

    fun getByFileId(fileId: String): File? {
        return fileRepository.findByFileId(fileId)
    }

    fun init() {
        Files.createDirectories(rootLocation)
    }

    fun deleteOlderThan(past: Instant): List<File> {
        val filesToDelete = fileRepository.findUnusedCreatedAfterThan(past)

        filesToDelete.forEach { file ->
            try {
                val filePath = rootLocation.resolve(file.fileId).normalize().toAbsolutePath()

                if (!filePath.parent.toAbsolutePath().equals(rootLocation.toAbsolutePath())) {
                    // This is a security check
                    throw IOException(
                        "Path error, '${filePath.parent.toAbsolutePath()}', '${rootLocation.toAbsolutePath()}'",
                    )
                }

                Files.deleteIfExists(filePath)
            } catch (e: IOException) {
                logger.warn {
                    "Failed to delete file from disk: ${file.fileId}, ex: $e"
                }
            }
        }

        fileRepository.deleteAll(filesToDelete)

        // Find files on disk without a database entry
        val filesOnDisk = getAllFilesOnDisk()
        val fileIdsInDatabase = fileRepository.findAll().map { it.fileId }.toSet()

        val filesToDeleteFromDisk = filesOnDisk.filter { file ->
            !fileIdsInDatabase.contains(file.fileName.toString())
        }

        // Delete files that are only on disk
        filesToDeleteFromDisk.forEach { filePath ->
            try {
                if (!filePath.parent.toAbsolutePath().equals(rootLocation.toAbsolutePath())) {
                    throw IOException(
                        "Path error, '${filePath.parent.toAbsolutePath()}', '${rootLocation.toAbsolutePath()}'",
                    )
                }

                logger.info { "Removed file '$filePath'" }
                Files.deleteIfExists(filePath)
            } catch (e: IOException) {
                logger.warn { "Failed to delete file from disk (no DB entry): $filePath, ex: $e" }
            }
        }

        return filesToDelete
    }

    private fun getAllFilesOnDisk(): List<Path> {
        return Files.walk(rootLocation)
            .filter { Files.isRegularFile(it) }
            .toList()
    }

    private fun loadFile(fileId: String): Path {
        return rootLocation.resolve(fileId)
    }

    private fun isAllowedToUpload(file: MultipartFile) {
        if (file.isEmpty) {
            throw BadRequestException("Failed to store empty file.")
        }

        if (file.resource.filename.isNullOrEmpty()) {
            throw BadRequestException("File name must be provided")
        }

        when (file.contentType) {
            "image/jpeg", "image/png", "image/webp", "image/avif" -> {}
            else -> {
                logger.debug { "File type '${file.contentType}' is not allowed." }
                throw BadRequestException("""File type "${file.contentType}" is not allowed.""")
            }
        }
    }
}
