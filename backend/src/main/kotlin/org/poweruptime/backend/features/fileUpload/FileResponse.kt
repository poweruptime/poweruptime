package org.poweruptime.backend.features.fileUpload

data class FileResponse(
    val name: String,
    val fileId: String
) {
    constructor(file: File) : this(file.name, file.fileId)
}
