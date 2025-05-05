package org.poweruptime.backend.core

import org.springframework.test.context.jdbc.Sql

@Target(AnnotationTarget.TYPE, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@Sql(DELETE_ALL_SQL, ADD_TEST_DATA)
annotation class ClearInitDatabase

@Target(AnnotationTarget.TYPE, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@Sql(DELETE_ALL_SQL)
annotation class ClearDatabase

private const val DELETE_ALL_SQL = "/db/changelog/scripts/10000-delete-all.sql"
private const val ADD_TEST_DATA = "/db/changelog/scripts/9999-data.sql"
