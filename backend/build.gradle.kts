import com.github.gradle.node.pnpm.task.PnpmTask
import com.github.jk1.license.filter.DependencyFilter
import com.github.jk1.license.filter.LicenseBundleNormalizer
import com.github.jk1.license.render.ReportRenderer
import com.github.jk1.license.render.XmlReportRenderer
import org.apache.tools.ant.filters.ReplaceTokens

plugins {
    kotlin("plugin.jpa")
    kotlin("plugin.serialization")
    id("com.github.node-gradle.node") version "7.1.0"
    id ("com.github.jk1.dependency-license-report") version "2.9"
}

springBoot {
    buildInfo()
}

dependencies {
    // Jackson
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.18.3")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.18.3")
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-csv:2.18.3")

    // Rate limiting
    implementation("com.bucket4j:bucket4j-core:8.10.1")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    implementation("io.jsonwebtoken:jjwt-impl:0.12.6")
    implementation("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // NanoID
    implementation("io.viascom.nanoid:nanoid:1.0.1")

    // DNS Checker lib
    implementation("dnsjava:dnsjava:3.6.3")

    // HttpClient library
    implementation("org.apache.httpcomponents.client5:httpclient5:5.4.4")

    implementation("dev.turingcomplete:kotlin-onetimepassword:2.4.1")
    implementation("commons-codec:commons-codec:1.18.0")

    // Kotlin stuff
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.1")

    // Database stuff
    implementation("org.liquibase:liquibase-core:4.31.1")
    runtimeOnly("org.postgresql:postgresql:42.7.5")
    // Postgres Arrays
    implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.9.10")

    // Spring
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-hateoas")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

    // Retry for RabbitMQ
    implementation("org.springframework.retry:spring-retry:2.0.11")

    // Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.amqp:spring-rabbit-test")
    testImplementation("org.springframework.security:spring-security-test")

    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter:1.21.0")
    testImplementation("org.testcontainers:postgresql:1.21.0")
    testImplementation("org.testcontainers:rabbitmq:1.21.0")

    testImplementation("com.icegreen:greenmail-junit5:2.1.3")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// needed to skip generation of plain jar
tasks.getByName<Jar>("jar") {
    enabled = false
}

tasks.bootJar {
    enabled = true
    archiveFileName.set("backend.jar")
}

val licenseReportPath: String = project.layout.buildDirectory.dir("reports/dependency-license").get().asFile.path

licenseReport {
    renderers = arrayOf<ReportRenderer>(XmlReportRenderer("backend.xml", "Backend Licenses"))
    filters = arrayOf<DependencyFilter>(LicenseBundleNormalizer())
    outputDir = licenseReportPath
}


node {
    download = true
    version = "22.0.0"
    workDir = rootDir.resolve(".gradle/nodejs")
    pnpmWorkDir = rootDir.resolve(".gradle/pnpm")
    nodeProjectDir = rootDir.resolve(".")
}

val exportEmails = tasks.register<PnpmTask>("exportEmails") {
    inputs.dir(rootDir.resolve("emails/emails"))
    inputs.files(rootDir.resolve("package.json"), rootDir.resolve("pnpm-lock.yaml"))
    outputs.dir(projectDir.resolve("src/main/resources/templates/html"))
    dependsOn("pnpmInstall")
    pnpmCommand.addAll("run", "emails:export")
}

/**
 * Needs to be set if the project kotlin version is not supported by detekt.
 */
configurations.detekt {
    resolutionStrategy.eachDependency {
        if (requested.group == "org.jetbrains.kotlin") {
            useVersion("2.0.21") // Add the version of Kotlin that detekt needs
        }
    }
}

val copyLicenseReport = tasks.register<Copy>("copyLicenseReport") {
    dependsOn("generateLicenseReport")
    from("$licenseReportPath/backend.xml")
    into(project.layout.projectDirectory.dir("src/main/resources/static").asFile.path)
}

/**
 * Needed to use properties from external sources and forward them to application*.yaml files.
 * For more details: https://www.baeldung.com/spring-boot-auto-property-expansion
 */
tasks.processResources {
    dependsOn(exportEmails, copyLicenseReport)

    copySpec {
        from("src/main/resources")
        include("**/application*.yml")
        include("**/application*.yaml")
        include("**/application*.properties")
        project.properties.forEach { prop ->
            filter(mapOf(prop.key to prop.value), ReplaceTokens::class.java)
            filter(mapOf(("project." + prop.key) to prop.value), ReplaceTokens::class.java)
        }
    }
}

/**
 * Setup test data
 */
val addLiquibaseTestdataInitChange = tasks.register("addLiquibaseTestdataInitChange") {
    // Use Gradle's "layout" API to get project directory at configuration time
    val testResourcesDir = layout.projectDirectory.dir("src/test/resources/db")

    // Declare outputs to help with up-to-date checks and configuration cache
    outputs.dir(testResourcesDir)

    doFirst {
        // This will run during the task execution phase
        copy {
            from("src/main/resources/db")
            into(testResourcesDir)
            rename("db.changelog-master.yaml", "db.changelog-test.yaml")
        }
    }

    doLast {
        val dbChangelogTestFile = testResourcesDir.file("db.changelog-test.yaml").asFile

        val content = """
              - changeSet:
                  id: 9999999
                  author: Gradle
                  dbms: postgresql
                  changes:
                    - sqlFile:
                        dbms: postgresql
                        encoding: utf8
                        path: changelog/scripts/9999-data.sql
                        relativeToChangelogFile: true
                        splitStatements: true
                        stripComments: true
        """.replaceIndent("  ")

        dbChangelogTestFile.appendText("\n")
        dbChangelogTestFile.appendText(content)
    }
}

tasks.processTestResources {
    dependsOn(addLiquibaseTestdataInitChange)
}

tasks.test {
    dependsOn(addLiquibaseTestdataInitChange)
    jvmArgs("-XX:+EnableDynamicAgentLoading")
}
