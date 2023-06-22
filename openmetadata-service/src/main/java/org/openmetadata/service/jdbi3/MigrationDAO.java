package org.openmetadata.service.jdbi3;

import static org.openmetadata.service.jdbi3.locator.ConnectionType.MYSQL;
import static org.openmetadata.service.jdbi3.locator.ConnectionType.POSTGRES;

import java.util.List;
import java.util.Optional;
import lombok.Getter;
import lombok.Setter;
import org.jdbi.v3.core.statement.StatementException;
import org.jdbi.v3.sqlobject.SingleValue;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.openmetadata.service.jdbi3.locator.ConnectionAwareSqlQuery;
import org.openmetadata.service.jdbi3.locator.ConnectionAwareSqlUpdate;

public interface MigrationDAO {
  @ConnectionAwareSqlQuery(value = "SELECT MAX(version) FROM DATABASE_CHANGE_LOG", connectionType = MYSQL)
  @ConnectionAwareSqlQuery(value = "SELECT max(version) FROM \"DATABASE_CHANGE_LOG\"", connectionType = POSTGRES)
  @SingleValue
  Optional<String> getMaxVersion() throws StatementException;

  @ConnectionAwareSqlQuery(value = "SELECT MAX(version) FROM SERVER_CHANGE_LOG", connectionType = MYSQL)
  @ConnectionAwareSqlQuery(value = "SELECT max(version) FROM \"SERVER_CHANGE_LOG\"", connectionType = POSTGRES)
  @SingleValue
  Optional<String> getMaxServerVersion() throws StatementException;

  @ConnectionAwareSqlQuery(
      value = "SELECT migrationFileName FROM SERVER_CHANGE_LOG ORDER BY installed_rank DESC LIMIT 1",
      connectionType = MYSQL)
  @ConnectionAwareSqlQuery(
      value = "SELECT migrationFileName FROM \"SERVER_CHANGE_LOG\" ORDER BY installed_rank DESC LIMIT 1",
      connectionType = POSTGRES)
  @SingleValue
  Optional<String> getLastRunMigrationStepFile() throws StatementException;

  @ConnectionAwareSqlUpdate(
      value =
          "INSERT INTO SERVER_CHANGE_LOG (version, migrationFileName, success, installed_on)"
              + "VALUES (:version, :migrationFileName, :success, CURRENT_TIMESTAMP) "
              + "ON DUPLICATE KEY UPDATE "
              + "migrationFileName = :migrationFileName, "
              + "success = :success, "
              + "installed_on = CURRENT_TIMESTAMP",
      connectionType = MYSQL)
  @ConnectionAwareSqlUpdate(
      value =
          "INSERT INTO server_change_log (version, migration_file_name, success, installed_on)"
              + "VALUES (:version, :migrationFileName, :success, current_timestamp) "
              + "ON CONFLICT (version) DO UPDATE SET "
              + "migration_file_name = EXCLUDED.migration_file_name, "
              + "success = EXCLUDED.success, "
              + "installed_on = EXCLUDED.installed_on",
      connectionType = POSTGRES)
  void upsertServerMigration(
      @Bind("version") String version,
      @Bind("migrationFileName") String migrationFileName,
      @Bind("success") boolean success);

  @ConnectionAwareSqlUpdate(
      value =
          "INSERT INTO SERVER_MIGRATION_SQL_LOGS (version, sqlStatement, checksum, executedAt)"
              + "VALUES (:version, :sqlStatement, :checksum, CURRENT_TIMESTAMP) "
              + "ON DUPLICATE KEY UPDATE "
              + "version = :version, "
              + "sqlStatement = :sqlStatement, "
              + "executedAt = CURRENT_TIMESTAMP",
      connectionType = MYSQL)
  @ConnectionAwareSqlUpdate(
      value =
          "INSERT INTO SERVER_MIGRATION_SQL_LOGS (version, sqlStatement, checksum, executedAt)"
              + "VALUES (:version, :sqlStatement, :checksum, current_timestamp) "
              + "ON CONFLICT (checksum) DO UPDATE SET "
              + "version = EXCLUDED.version, "
              + "sqlStatement = EXCLUDED.sqlStatement, "
              + "executedAt = EXCLUDED.executedAt",
      connectionType = POSTGRES)
  void upsertServerMigrationSQL(
      @Bind("version") String version, @Bind("sqlStatement") String sqlStatement, @Bind("checksum") String success);

  @ConnectionAwareSqlQuery(
      value = "SELECT checksum FROM SERVER_MIGRATION_SQL_LOGS where version = :version",
      connectionType = MYSQL)
  @ConnectionAwareSqlQuery(
      value = "SELECT checksum FROM \"SERVER_MIGRATION_SQL_LOGS\" where version = :version",
      connectionType = POSTGRES)
  List<String> getServerMigrationSQLWithVersion(@Bind("version") String version);

  @Getter
  @Setter
  class ServerMigrationSQLTable {
    private String version;
    private String sqlStatement;
    private String checkSum;
  }
}
