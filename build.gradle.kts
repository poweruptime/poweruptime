import dev.detekt.gradle.Detekt
import org.gradle.kotlin.dsl.detekt
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import java.io.ByteArrayOutputStream
import java.time.Instant

group = "org.poweruptime.backend"

java {
    sourceCompatibility = JavaVersion.VERSION_25
    targetCompatibility = JavaVersion.VERSION_25
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
    maven { url = uri("https://artifactory-oss.prod.netflix.net/artifactory/maven-oss-candidates") }
}

plugins {
    id("org.springframework.boot") version "4.0.3" apply false
    id("io.spring.dependency-management") version "1.1.7"

    id("dev.detekt") version "2.0.0-alpha.2"

    kotlin("jvm") version "2.3.20"
    kotlin("plugin.spring") version "2.3.20"
    kotlin("plugin.serialization") version "2.3.20"
}

allprojects {
    apply(plugin = "dev.detekt")

    detekt {
        config.from(rootDir.resolve("detekt.yml"))
        buildUponDefaultConfig = true
        // Autocorrection can only be done locally
        autoCorrect = System.getenv("CI")?.lowercase() != true.toString()
    }

    dependencies {
        detektPlugins("dev.detekt:detekt-rules-ktlint-wrapper:2.0.0-alpha.2")
    }

    tasks.withType<Detekt>().configureEach {
        parallel = true
        reports {
            html.required = true
        }
        jvmTarget = "24"
    }
}

subprojects {
    apply(plugin = "org.springframework.boot")
    apply(plugin = "io.spring.dependency-management")
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlin.plugin.spring")

    repositories {
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        maven { url = uri("https://artifactory-oss.prod.netflix.net/artifactory/maven-oss-candidates") }
    }

    tasks.withType<KotlinCompile> {
        compilerOptions {
            freeCompilerArgs.add("-Xjsr305=strict") // Needed for the ISoftDeleteRepository to be able to override the findAll with a default implementation.
            freeCompilerArgs.add("-Xjvm-default=all") // Generate JVM (1.8) default methods for non-abstract Kotlin interface member.
            freeCompilerArgs.add("-Xannotation-default-target=param-property")
        }
    }

    tasks.named("bootJar") { enabled = false }
    tasks.jar { enabled = true }

    dependencyManagement {
        imports {
            mavenBom("org.springframework.cloud:spring-cloud-dependencies:2025.1.1")
        }
    }
}

tasks.register("releaseBeta") {
    val versionParam = project.properties["version"].toString().nullOrParameter()

    doLast {
        val version = getNewBetaVersion(versionParam)
        val timestamp = Instant.now().epochSecond
        val tagName = "$version-beta-$timestamp"

        setPowerUpTimeVersion(tagName)

        execOps.exec {
            commandLine(
                "pnpm",
                "exec",
                "git-cliff",
                "--count-tags",
                "beta",
                "--output",
                "./changelogs/CHANGELOG-beta.md",
                "--tag",
                tagName
            )
        }

        execOps.exec {
            commandLine(
                "pnpm",
                "exec",
                "prettier",
                "--write",
                "./changelogs/CHANGELOG-beta.md"
            )
        }

        println("""Confirm changelog changes""")

        System.`in`.bufferedReader().readLine()

        commitChanges(
            "chore: set POWERUPTIME_VERSION to $tagName",
            listOf(
                "./infrastructure/versions.env",
                "./changelogs/CHANGELOG-beta.md"
            )
        )

        println()
        println("Creating git tag $tagName")
        execOps.exec {
            commandLine("git", "tag", tagName)
        }
    }
}

tasks.register("releaseProd") {
    val versionParam = project.properties["version"].toString().nullOrParameter()

    doLast {
        val version = getNewProdVersion(versionParam)

        setPowerUpTimeVersion(version.toString())

        execOps.exec {
            commandLine(
                "pnpm",
                "exec",
                "git-cliff",
                "--ignore-tags",
                "beta",
                "--output",
                "./changelogs/CHANGELOG.md",
                "--tag",
                version
            )
        }

        execOps.exec {
            commandLine(
                "pnpm",
                "exec",
                "prettier",
                "--write",
                "./changelogs/CHANGELOG.md"
            )
        }

        println("""Confirm changelog changes""")

        System.`in`.bufferedReader().readLine()

        commitChanges(
            "chore: set POWERUPTIME_VERSION to $version",
            listOf(
                "./infrastructure/versions.env",
                "./changelogs/CHANGELOG.md"
            )
        )

        println()
        println("Creating git tag $version")
        execOps.exec {
            commandLine("git", "tag", version)
        }
    }
}

fun getNewBetaVersion(version: String?): VersionNumber {
    if (version != null) return VersionNumber.fromString(version)

    val lastBetaTagVersion = getLastVersion(false)
    val lastProdTagVersion = getLastVersion(true)
    println("The latest beta tag is: $lastBetaTagVersion")
    println("The latest production tag is: $lastProdTagVersion")

    println(
        """
      Version: $lastBetaTagVersion
      What do you want to increase?
      1: Major
      2: Minor
      3: Patch
      4: Reuse from current beta tag (default)
    """.trimIndent()
    )

    val increaseInput: String? = System.`in`.bufferedReader().readLine()
    val newVersion: VersionNumber = lastBetaTagVersion
    when (increaseInput) {
        "1" -> newVersion.increaseMajor()
        "2" -> newVersion.increaseMinor()
        "3" -> newVersion.increasePatch()
    }
    return newVersion
}

fun getNewProdVersion(version: String?): VersionNumber {
    if (version != null) return VersionNumber.fromString(version)

    val lastBetaTagVersion = getLastVersion(false)
    val lastProdTagVersion = getLastVersion(true)
    println("The latest beta tag is: $lastBetaTagVersion")
    println("The latest production tag is: $lastProdTagVersion")
    println()
    println(
        """
      Version: $lastProdTagVersion
      What do you want to increase?
      1: Major
      2: Minor
      3: Patch (default)
    """.trimIndent()
    )

    val increaseInput: String? = System.`in`.bufferedReader().readLine()
    val newVersion: VersionNumber = lastProdTagVersion
    when (increaseInput) {
        "1" -> newVersion.increaseMajor()
        "2" -> newVersion.increaseMinor()
        else -> newVersion.increasePatch()
    }
    return newVersion
}


fun getLastTag(prod: Boolean): String {
    // Fetch all the remote tags
    execOps.exec {
        commandLine("git", "fetch", "--tags")
    }

    // Capture the names of all tags
    val osAllTags = ByteArrayOutputStream()
    execOps.exec {
        commandLine("git", "tag", "-l")
        standardOutput = osAllTags
    }

    val allExistingVersions: List<String> =
        osAllTags.toString(Charsets.UTF_8.name())
            .trim()
            .lines()
            .filter { if (prod) !it.contains("beta") else it.contains("beta") }
            .filter { it.substringBefore('-').matches(VersionNumber.versionRegex) }

    return allExistingVersions.max()
}

fun getLastVersion(prod: Boolean): VersionNumber {
    return VersionNumber.fromString(getLastTag(prod).substringBefore('-'))
}


fun setPowerUpTimeVersion(version: String) {
    val versionsFile = file("./infrastructure/versions.env")
    val lines = versionsFile.readLines().toMutableList()

    var found = false
    for (i in lines.indices) {
        if (lines[i].startsWith("POWERUPTIME_VERSION=")) {
            lines[i] = "POWERUPTIME_VERSION=\"$version\""
            found = true
            break
        }
    }

    if (!found) {
        lines.add("POWERUPTIME_VERSION=\"$version\"")
    }

    versionsFile.writeText(lines.joinToString("\n"))
    println("Set POWERUPTIME_VERSION to $version in versions.env file")
}

fun commitChanges(message: String, files: List<String>) {
    files.forEach { path ->
        execOps.exec {
            commandLine("git", "add", path)
        }
    }
    execOps.exec {
        commandLine("git", "commit", "-m", message)
    }
    println("Committed changes with message: $message")
}


data class VersionNumber(
    var major: Int,
    var minor: Int,
    var patch: Int
) : Comparable<VersionNumber> {
    override fun toString(): String = "$major.$minor.$patch"

    fun increaseMajor() {
        major += 1
        minor = 0
        patch = 0
    }

    fun increaseMinor() {
        minor += 1
        patch = 0
    }

    fun increasePatch() {
        patch += 1
    }

    override operator fun compareTo(other: VersionNumber): Int = when {
        this.major != other.major -> this.major.compareTo(other.major)
        this.minor != other.minor -> this.minor.compareTo(other.minor)
        this.patch != other.patch -> this.patch.compareTo(other.patch)
        else -> 0
    }

    companion object {
        val versionRegex = Regex("""\d+\.\d+\.\d+""")
        fun fromString(version: String): VersionNumber {
            val split = version.split('.')
            require(version.matches(versionRegex)) {
                "The provided Version '$version' is not a valid version. It must follow the pattern $versionRegex"
            }

            return VersionNumber(
                major = split[0].toInt(),
                minor = split[1].toInt(),
                patch = split[2].toInt()
            )
        }
    }
}

fun String.nullOrParameter(): String? {
    return if (this == "unspecified") {
        null
    } else {
       this
    }
}

abstract class ExecSupport {
    @get:Inject
    abstract val execOps: ExecOperations
}

val execSupport = objects.newInstance(ExecSupport::class.java)
val execOps = execSupport.execOps

