package org.openmetadata.service.migration.postgres.v140;

import static org.openmetadata.service.migration.utils.v140.MigrationUtil.migrateGenericToWebhook;
import static org.openmetadata.service.migration.utils.v140.MigrationUtil.migrateTablePartition;

import lombok.SneakyThrows;
import org.jdbi.v3.core.Handle;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.migration.api.MigrationProcessImpl;
import org.openmetadata.service.migration.utils.MigrationFile;

public class Migration extends MigrationProcessImpl {
  private CollectionDAO collectionDAO;
  private Handle handle;

  public Migration(MigrationFile migrationFile) {
    super(migrationFile);
  }

  @Override
  public void initialize(Handle handle) {
    super.initialize(handle);
    this.handle = handle;
    this.collectionDAO = handle.attach(CollectionDAO.class);
  }

  @Override
  @SneakyThrows
  public void runDataMigration() {
    migrateTablePartition(handle, collectionDAO);

    // Migrate Generic to Webhook
    migrateGenericToWebhook(collectionDAO);
  }
}
