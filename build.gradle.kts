import io.gitlab.arturbosch.detekt.Detekt
import io.gitlab.arturbosch.detekt.report.ReportMergeTask
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

group = "org.poweruptime.backend"

java.sourceCompatibility = JavaVersion.VERSION_17
java.targetCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
    maven { url = uri("https://artifactory-oss.prod.netflix.net/artifactory/maven-oss-candidates") }
}

plugins {
    id("org.jetbrains.kotlinx.kover") version "0.9.1"

    id("org.springframework.boot") version "3.4.2" apply false
    id("io.spring.dependency-management") version "1.1.7"

    id("io.gitlab.arturbosch.detekt") version "1.23.7"

    kotlin("jvm") version "2.1.10"
    kotlin("plugin.spring") version "2.1.10"
    kotlin("plugin.jpa") version "2.1.10"
    kotlin("plugin.serialization") version "2.1.10"
}

val detektReportMergeSarif by tasks.registering(ReportMergeTask::class) {
    output = layout.buildDirectory.file("reports/detekt/merge.sarif")
}

allprojects {
    apply(plugin = "io.gitlab.arturbosch.detekt")

    detekt {
        config.from(rootDir.resolve("detekt.yml"))
        buildUponDefaultConfig = true
        basePath = rootDir.path
        // Autocorrection can only be done locally
        autoCorrect = System.getenv("CI")?.lowercase() != true.toString()
    }

    dependencies {
        detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:1.23.7")
    }

    tasks.withType<Detekt>().configureEach {
        parallel = true
        reports {
            html.required = true
            sarif.required = true
        }
        finalizedBy(detektReportMergeSarif)
        jvmTarget = "17"
    }
    detektReportMergeSarif {
        input.from(tasks.withType<Detekt>().map { it.sarifReportFile })
    }
}

subprojects {
    apply(plugin = "org.springframework.boot")
    apply(plugin = "io.spring.dependency-management")
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlin.plugin.spring")
    apply(plugin = "org.jetbrains.kotlinx.kover")

    repositories {
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        maven { url = uri("https://artifactory-oss.prod.netflix.net/artifactory/maven-oss-candidates") }
    }

    tasks.withType<KotlinCompile> {
        compilerOptions {
            // -Xjvm-default=all: Generate JVM (1.8) default methods for non-abstract Kotlin interface member.
            //   Needed for the ISoftDeleteRepository to be able to override the findAll with a default implementation.
            freeCompilerArgs.add("-Xjsr305=strict")
            freeCompilerArgs.add("-Xjvm-default=all")
        }
    }

    tasks.named("bootJar") { enabled = false }
    tasks.jar { enabled = true }

    dependencyManagement {
        imports {
            mavenBom("org.springframework.cloud:spring-cloud-dependencies:2024.0.0")
        }
    }
}

/**
 * Setup coverage report
 */
tasks.register<TotalCoverageTask>("totalCoverage") {
    dependsOn("koverXmlReport")
}

abstract class TotalCoverageTask : DefaultTask() {
    @TaskAction
    fun calculateTotalCoverage() = try {
        val coverageLine = File("backend/build/reports/kover/report.xml")
            .readLines()
            .dropLastWhile { !it.contains("\"INSTRUCTION\"") }
            .last()

        val coverRegex = Regex("missed=\"(\\d+)\" covered=\"(\\d+)\"")
        val (missed, covered) = coverRegex.find(coverageLine)!!.groupValues.drop(1).map(String::toInt)

        val coverage = ((covered * 10_000) / (missed + covered)).toString().padStart(4, '0')

        println("Total-Test-Coverage-${coverage.take(2).toInt()}.${coverage.takeLast(2).toInt()}")
    } catch (e: Throwable) {
        println("Calculation of test-coverage failed: ${e.stackTraceToString()}")
    }
}
