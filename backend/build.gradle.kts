import com.github.gradle.node.pnpm.task.PnpmInstallTask
import com.github.gradle.node.pnpm.task.PnpmTask
import com.github.jk1.license.filter.DependencyFilter
import com.github.jk1.license.filter.LicenseBundleNormalizer
import com.github.jk1.license.importer.PnpmLicenseImporter
import com.github.jk1.license.render.JsonReportRenderer
import com.github.jk1.license.render.ReportRenderer
import org.apache.tools.ant.filters.ReplaceTokens
import org.springframework.boot.gradle.tasks.run.BootRun
import groovy.json.JsonSlurper

plugins {
    kotlin("plugin.serialization")
    id("com.github.node-gradle.node") version "7.1.0"
    id ("com.github.jk1.dependency-license-report") version "3.1.4"
}

springBoot {
    buildInfo()
}

dependencies {
    // Logging
    implementation("io.github.oshai:kotlin-logging-jvm:8.0.4")

    // Jackson
    implementation("tools.jackson.module:jackson-module-kotlin:3.2.2")

    // TODO: remove on update of io.swagger.v3 and springdoc-openapi-starter-webmvc-ui
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.22.2")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.22.2")

    // Rate limiting
    implementation("com.bucket4j:bucket4j-core:8.10.1")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    implementation("io.jsonwebtoken:jjwt-impl:0.13.0")
    implementation("io.jsonwebtoken:jjwt-jackson:0.13.0")

    // NanoID
    implementation("io.viascom.nanoid:nanoid:2.0.1")

    // DNS Checker lib
    implementation("dnsjava:dnsjava:3.6.5")

    // HttpClient library
    implementation("org.apache.httpcomponents.client5:httpclient5")

    // MFA Stuff
    implementation("dev.turingcomplete:kotlin-onetimepassword:3.0.0")
    implementation("commons-codec:commons-codec:1.22.1")

    // HTML to Markdown Converter
    implementation("com.vladsch.flexmark:flexmark-all:0.64.8")
    // HTML to Mrkdown (Slack) Converter
    implementation("org.jsoup:jsoup:1.23.1")

    // Kotlin stuff
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.11.0")

    // Database stuff
    implementation("org.liquibase:liquibase-core:5.0.3")
    runtimeOnly("org.postgresql:postgresql:42.7.13")

    implementation("com.zaxxer:HikariCP:7.1.0")

    val exposedVersion = "1.4.0"
    implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-java-time:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-json:${exposedVersion}")
    implementation("org.jetbrains.exposed:spring-transaction:$exposedVersion")

    // Spring
    implementation("org.aspectj:aspectjweaver")

    implementation("org.springframework.boot:spring-boot-starter-liquibase")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-hateoas")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Spring SSE
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Spring Mail
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

    // Spring Cache
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("com.github.ben-manes.caffeine:caffeine:3.2.4")

    // Retry for RabbitMQ
    implementation("org.springframework.retry:spring-retry:2.0.13")

    // Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.0")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.11.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-liquibase-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
    testImplementation("org.springframework.boot:spring-boot-webmvc-test")
    testImplementation("org.springframework.amqp:spring-rabbit-test")
    testImplementation("org.springframework.security:spring-security-test")

    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter:1.21.4")
    testImplementation("org.testcontainers:postgresql:1.21.4")
    testImplementation("org.testcontainers:rabbitmq:1.21.4")

    testImplementation("com.icegreen:greenmail-junit5:2.1.12")
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
    importers = arrayOf(PnpmLicenseImporter("Frontend Licenses", listOf("web")))
    renderers = arrayOf<ReportRenderer>(JsonReportRenderer("licenses.json"))
    filters = arrayOf<DependencyFilter>(LicenseBundleNormalizer())
    outputDir = licenseReportPath
}

val packageJson = JsonSlurper().parse(rootDir.resolve("./package.json")) as Map<*, *>

val engines = packageJson["engines"] as? Map<*, *>
    ?: error("package.json must define engines.node")

val nodeVersionFromPackageJson = engines["node"] as? String
    ?: error("""package.json must define engines.node, e.g. "24.14.1"""")

val packageManager = packageJson["packageManager"] as? String
    ?: error("""package.json must define packageManager, e.g. "pnpm@10.33.2"""")

require(packageManager.startsWith("pnpm@")) {
    "Expected packageManager to be pnpm@<version>, but got: $packageManager"
}

val pnpmVersionFromPackageJson = packageManager.removePrefix("pnpm@")

node {
    download = true
    version = nodeVersionFromPackageJson
    pnpmVersion = pnpmVersionFromPackageJson
    workDir = rootDir.resolve(".gradle/nodejs")
    pnpmWorkDir = rootDir.resolve(".gradle/pnpm")
    nodeProjectDir = rootDir.resolve(".")
}

val emailPnpmInstall = tasks.register<PnpmInstallTask>("emailPnpmInstall") {
    args.set(listOf("--ignore-scripts", "--filter", "emails"))
}

val exportEmails = tasks.register<PnpmTask>("exportEmails") {
    inputs.dir(rootDir.resolve("emails/emails"))
    inputs.files(rootDir.resolve("package.json"), rootDir.resolve("pnpm-lock.yaml"))
    outputs.dir(projectDir.resolve("src/main/resources/templates/html"))
    dependsOn(emailPnpmInstall)
    pnpmCommand.addAll("run", "emails:export")
}

val copyLicenseReport = tasks.register<Copy>("copyLicenseReport") {
    dependsOn("generateLicenseReport")
    from("$licenseReportPath/licenses.json")
    into(project.layout.projectDirectory.dir("src/main/resources/static").asFile.path)
}

val copyChangelogs = tasks.register<Copy>("copyChangelogs") {
    from("${project.rootDir.path}/changelogs/CHANGELOG.md", "${project.rootDir.path}/changelogs/CHANGELOG-beta.md")
    into(project.layout.projectDirectory.dir("src/main/resources/static").asFile.path)
}

/**
 * Needed to use properties from external sources and forward them to application*.yaml files.
 * For more details: https://www.baeldung.com/spring-boot-auto-property-expansion
 */
tasks.processResources {
    dependsOn(copyLicenseReport, exportEmails, copyChangelogs)

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

tasks.register<BootRun>("seed") {
    group = "application"
    description = "Seed the database and exit"
    mainClass.set("org.poweruptime.backend.MainKt")
    // pick up your normal runtime classpath
    classpath = sourceSets["main"].runtimeClasspath
    // activate only the seed profile
    args = listOf("--spring.profiles.active=seed")
}

/**
 * Needs to be set if the project kotlin version is not supported by detekt.
 */
configurations.detekt {
    resolutionStrategy.eachDependency {
        if (requested.group == "org.jetbrains.kotlin") {
            useVersion("2.4.10")
        }
    }
}
