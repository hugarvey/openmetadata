/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.catalog.jdbi3;

import static org.openmetadata.catalog.Entity.DATABASE_SERVICE;
import static org.openmetadata.catalog.Entity.helper;
import static org.openmetadata.catalog.util.EntityUtil.toBoolean;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.net.URI;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.entity.services.DatabaseService;
import org.openmetadata.catalog.resources.services.database.DatabaseServiceResource;
import org.openmetadata.catalog.type.ChangeDescription;
import org.openmetadata.catalog.type.DatabaseConnection;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.util.EntityInterface;
import org.openmetadata.catalog.util.EntityUtil;
import org.openmetadata.catalog.util.EntityUtil.Fields;

public class DatabaseServiceRepository extends EntityRepository<DatabaseService> {
  public static final String COLLECTION_PATH = "v1/services/databaseServices";

  public DatabaseServiceRepository(CollectionDAO dao) {
    super(
        DatabaseServiceResource.COLLECTION_PATH,
        Entity.DATABASE_SERVICE,
        DatabaseService.class,
        dao.dbServiceDAO(),
        dao,
        Fields.EMPTY_FIELDS,
        Fields.EMPTY_FIELDS,
        false,
        true,
        false);
  }

  @Override
  public DatabaseService setFields(DatabaseService entity, Fields fields) throws IOException, ParseException {
    entity.setAirflowPipelines(fields.contains("airflowPipeline") ? getAirflowPipelines(entity) : null);
    entity.setOwner(fields.contains("owner") ? getOwner(entity) : null);
    return entity;
  }

  private List<EntityReference> getAirflowPipelines(DatabaseService databaseService) throws IOException {
    if (databaseService == null) {
      return null;
    }
    String databaseServiceId = databaseService.getId().toString();
    List<String> airflowPipelineIds =
        daoCollection
            .relationshipDAO()
            .findTo(
                databaseServiceId,
                Entity.DATABASE_SERVICE,
                Relationship.CONTAINS.ordinal(),
                Entity.AIRFLOW_PIPELINE,
                toBoolean(toInclude(databaseService)));
    List<EntityReference> airflowPipelines = new ArrayList<>();
    for (String airflowPipelineId : airflowPipelineIds) {
      airflowPipelines.add(
          daoCollection.airflowPipelineDAO().findEntityReferenceById(UUID.fromString(airflowPipelineId)));
    }
    return airflowPipelines;
  }

  @Override
  public void restorePatchAttributes(DatabaseService original, DatabaseService updated) {
    /* Nothing to do */
  }

  @Override
  public EntityInterface<DatabaseService> getEntityInterface(DatabaseService entity) {
    return new DatabaseServiceEntityInterface(entity);
  }

  @Override
  public void prepare(DatabaseService entity) throws IOException, ParseException {
    // Check if owner is valid and set the relationship
    entity.setOwner(helper(entity).validateOwnerOrNull());
  }

  @Override
  public void storeEntity(DatabaseService service, boolean update) throws IOException {
    service.withHref(null);
    store(service.getId(), service, update);
  }

  @Override
  public void storeRelationships(DatabaseService entity) {
    // Add owner relationship
    EntityUtil.setOwner(daoCollection.relationshipDAO(), entity.getId(), DATABASE_SERVICE, entity.getOwner());
  }

  @Override
  public EntityUpdater getUpdater(DatabaseService original, DatabaseService updated, Operation operation) {
    return new DatabaseServiceUpdater(original, updated, operation);
  }

  public static class DatabaseServiceEntityInterface implements EntityInterface<DatabaseService> {
    private final DatabaseService entity;

    public DatabaseServiceEntityInterface(DatabaseService entity) {
      this.entity = entity;
    }

    @Override
    public UUID getId() {
      return entity.getId();
    }

    @Override
    public String getDescription() {
      return entity.getDescription();
    }

    @Override
    public String getDisplayName() {
      return entity.getDisplayName();
    }

    @Override
    public EntityReference getOwner() {
      return entity.getOwner();
    }

    @Override
    public Boolean isDeleted() {
      return entity.getDeleted();
    }

    @Override
    public String getFullyQualifiedName() {
      return entity.getName();
    }

    @Override
    public Double getVersion() {
      return entity.getVersion();
    }

    @Override
    public String getUpdatedBy() {
      return entity.getUpdatedBy();
    }

    @Override
    public long getUpdatedAt() {
      return entity.getUpdatedAt();
    }

    @Override
    public URI getHref() {
      return entity.getHref();
    }

    @Override
    public ChangeDescription getChangeDescription() {
      return entity.getChangeDescription();
    }

    @Override
    public EntityReference getEntityReference() {
      return new EntityReference()
          .withId(getId())
          .withName(getFullyQualifiedName())
          .withDescription(getDescription())
          .withDisplayName(getDisplayName())
          .withType(Entity.DATABASE_SERVICE);
    }

    @Override
    public DatabaseService getEntity() {
      return entity;
    }

    @Override
    public void setId(UUID id) {
      entity.setId(id);
    }

    @Override
    public void setDescription(String description) {
      entity.setDescription(description);
    }

    @Override
    public void setDisplayName(String displayName) {
      entity.setDisplayName(displayName);
    }

    @Override
    public void setUpdateDetails(String updatedBy, long updatedAt) {
      entity.setUpdatedBy(updatedBy);
      entity.setUpdatedAt(updatedAt);
    }

    @Override
    public void setChangeDescription(Double newVersion, ChangeDescription changeDescription) {
      entity.setVersion(newVersion);
      entity.setChangeDescription(changeDescription);
    }

    @Override
    public void setOwner(EntityReference owner) {
      entity.setOwner(owner);
    }

    @Override
    public void setDeleted(boolean flag) {
      entity.setDeleted(flag);
    }

    @Override
    public DatabaseService withHref(URI href) {
      return entity.withHref(href);
    }
  }

  public class DatabaseServiceUpdater extends EntityUpdater {
    public DatabaseServiceUpdater(DatabaseService original, DatabaseService updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() throws IOException {
      updateDatabaseConnectionConfig();
    }

    private void updateDatabaseConnectionConfig() throws JsonProcessingException {
      DatabaseConnection origConn = original.getEntity().getDatabaseConnection();
      DatabaseConnection updatedConn = updated.getEntity().getDatabaseConnection();
      recordChange("databaseConnection", origConn, updatedConn, true);
    }
  }
}
