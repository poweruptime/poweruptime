package org.poweruptime.backend.features.fileUpload

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findByPublicId
import org.poweruptime.backend.core.domain.findIdByPublicId
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.Config
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.net.MalformedURLException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.Instant

@Service
@Transactional(readOnly = true)
class FileService(@Value(Config.STORAGE_DIRECTORY) private val directoryPath: String) {
    private val rootLocation = Path.of(directoryPath)
    private final val logger = KotlinLogging.logger {}

    @Transactional
    fun store(uploadFile: MultipartFile): FileRecord {
        isAllowedToUpload(uploadFile)

        val dbFile = File
            .insertAndGetId {
                it[File.name] = uploadFile.resource.filename!!
            }.let { id ->
                File.findByIdOrThrow(id.value) {
                    File.rowToFileRecord(it)
                }
            }

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

        return dbFile
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

    fun getByFileId(fileId: String): FileRecord = File
        .findByPublicId(fileId) {
            File.rowToFileRecord(it)
        }.orThrowNotFound("File not found: $fileId")

    fun getIdByFileId(fileId: String): ULong = File.findIdByPublicId(fileId).orThrowNotFound("File not found: $fileId")

    fun init() {
        Files.createDirectories(rootLocation)
    }

    @Transactional
    fun deleteOlderThan(past: Instant): List<FileRecord> {
        val filesToDelete = File.findUnusedCreatedAfterThan(past)

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

        File.deleteById(filesToDelete.map { it.id })

        // Find files on disk without a database entry
        val filesOnDisk = getAllFilesOnDisk()
        val fileIdsInDatabase = File.selectAll().map { it[File.publicId] }.toSet()

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

    private fun getAllFilesOnDisk(): List<Path> = Files
        .walk(rootLocation)
        .filter { Files.isRegularFile(it) }
        .toList()

    private fun loadFile(fileId: String): Path = rootLocation.resolve(fileId)

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
