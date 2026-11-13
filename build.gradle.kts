import dev.detekt.gradle.Detekt
import org.gradle.kotlin.dsl.detekt
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

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
    id("org.springframework.boot") version "4.1.2" apply false
    id("io.spring.dependency-management") version "1.1.7"

    id("dev.detekt") version "2.0.0-alpha.6"

    kotlin("jvm") version "2.4.21"
    kotlin("plugin.spring") version "2.4.21"
    kotlin("plugin.serialization") version "2.4.21"
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
        detektPlugins("dev.detekt:detekt-rules-ktlint-wrapper:2.0.0-alpha.6") {
            exclude(group = "dev.detekt", module = "ktlint-repackage")
        }
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

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(25)
        }
    }

    repositories {
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        maven { url = uri("https://artifactory-oss.prod.netflix.net/artifactory/maven-oss-candidates") }
    }

    tasks.withType<KotlinCompile> {
        compilerOptions {
            freeCompilerArgs.add("-Xjsr305=strict") // Needed for the ISoftDeleteRepository to be able to override the findAll with a default implementation.
            freeCompilerArgs.add("-jvm-default=enable") // Generate JVM (1.8) default methods for non-abstract Kotlin interface member.
        }
    }

    tasks.named("bootJar") { enabled = false }
    tasks.jar { enabled = true }

    dependencyManagement {
        imports {
            mavenBom("org.springframework.cloud:spring-cloud-dependencies:2025.1.4")
        }
    }
}
