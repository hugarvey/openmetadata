/*
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements. See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License. You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.catalog.jdbi3;

import java.io.IOException;
import java.net.URI;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.entity.data.GlossaryTerm;
import org.openmetadata.catalog.resources.glossary.GlossaryResource;
import org.openmetadata.catalog.resources.glossary.GlossaryTermResource;
import org.openmetadata.catalog.type.ChangeDescription;
import org.openmetadata.catalog.type.EntityReference;
<<<<<<< HEAD
import org.openmetadata.catalog.type.Relationship;
=======
>>>>>>> 06bc2f51 (Fixes #2760 - Add entities for Glossary and initial API)
import org.openmetadata.catalog.type.TagLabel;
import org.openmetadata.catalog.util.EntityInterface;
import org.openmetadata.catalog.util.EntityUtil;
import org.openmetadata.catalog.util.EntityUtil.Fields;
import org.openmetadata.catalog.util.JsonUtils;

@Slf4j
public class GlossaryTermRepository extends EntityRepository<GlossaryTerm> {
  private static final Fields UPDATE_FIELDS = new Fields(GlossaryResource.FIELD_LIST, "tags");
  private static final Fields PATCH_FIELDS = new Fields(GlossaryResource.FIELD_LIST, "tags");
  private final CollectionDAO dao;

  public GlossaryTermRepository(CollectionDAO dao) {
    super(
        GlossaryTermResource.COLLECTION_PATH,
        Entity.GLOSSARY_TERM,
        GlossaryTerm.class,
        dao.glossaryTermDAO(),
        dao,
        PATCH_FIELDS,
        UPDATE_FIELDS,
        true,
        false,
        false);
    this.dao = dao;
  }

  @Override
  public GlossaryTerm setFields(GlossaryTerm entity, Fields fields) throws IOException, ParseException {
    entity.setGlossary(getGlossary(entity));
    entity.setTags(fields.contains("tags") ? getTags(entity.getFullyQualifiedName()) : null);
    return entity;
  }

  @Override
  public void prepare(GlossaryTerm entity) throws IOException, ParseException {
    // Set fully qualified name
    if (entity.getParent() == null) {
      entity.setFullyQualifiedName(entity.getGlossary().getName() + "." + entity.getName());
    } else {
      entity.setFullyQualifiedName(entity.getParent().getName() + "." + entity.getName());
    }

    // Validate related terms
    List<EntityReference> validatedRelatedTerms = new ArrayList<>();
    for (EntityReference related : entity.getRelatedTerms()) {
      validatedRelatedTerms.add(daoCollection.glossaryTermDAO().findEntityReferenceById(related.getId()));
    }
    entity.setRelatedTerms(validatedRelatedTerms);

    // Set tags
    entity.setTags(EntityUtil.addDerivedTags(dao.tagDAO(), entity.getTags()));
  }

  @Override
  public void storeEntity(GlossaryTerm entity, boolean update) throws IOException {
    // Relationships and fields such as href are derived and not stored as part of json
    List<TagLabel> tags = entity.getTags();
    // TODO Add relationships for reviewers
    EntityReference glossary = entity.getGlossary();
    EntityReference parentTerm = entity.getParent();

    // Don't store owner, dashboard, href and tags as JSON. Build it on the fly based on relationships
    entity.withGlossary(null).withParent(null).withHref(null).withTags(null);

    if (update) {
      dao.glossaryTermDAO().update(entity.getId(), JsonUtils.pojoToJson(entity));
    } else {
      dao.glossaryTermDAO().insert(entity);
    }

    // Restore the relationships
    entity.withGlossary(glossary).withParent(parentTerm).withTags(tags);
  }

  @Override
  public void storeRelationships(GlossaryTerm entity) {
    // TODO Add relationships for  related terms, and reviewers
    daoCollection
        .relationshipDAO()
        .insert(
            entity.getGlossary().getId(),
            entity.getId(),
            Entity.GLOSSARY,
            Entity.GLOSSARY_TERM,
            Relationship.CONTAINS.ordinal());
    if (entity.getParent() != null) {
      daoCollection
          .relationshipDAO()
          .insert(
              entity.getParent().getId(),
              entity.getId(),
              Entity.GLOSSARY,
              Entity.GLOSSARY_TERM,
              Relationship.CONTAINS.ordinal());
    }

    applyTags(entity);
  }

  @Override
  public void restorePatchAttributes(GlossaryTerm original, GlossaryTerm updated) {}

  protected EntityReference getGlossary(GlossaryTerm term) throws IOException {
    List<String> refs =
        daoCollection
            .relationshipDAO()
            .findFrom(
                term.getId().toString(), Entity.GLOSSARY_TERM, Relationship.CONTAINS.ordinal(), Entity.GLOSSARY, null);
    if (refs.size() != 1) {
      LOG.warn(
          "Possible database issues - multiple owners found for entity {} with type {}", term.getId(), Entity.GLOSSARY);
    }
    return daoCollection.glossaryDAO().findEntityReferenceById(UUID.fromString(refs.get(0)));
  }

  @Override
  public EntityInterface<GlossaryTerm> getEntityInterface(GlossaryTerm entity) {
    return new GlossaryTermEntityInterface(entity);
  }

  @Override
  public EntityUpdater getUpdater(GlossaryTerm original, GlossaryTerm updated, Operation operation) {
    return new GlossaryTermUpdater(original, updated, operation);
  }

  public static class GlossaryTermEntityInterface implements EntityInterface<GlossaryTerm> {
    private final GlossaryTerm entity;

    public GlossaryTermEntityInterface(GlossaryTerm entity) {
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
    public Boolean isDeleted() {
      return entity.getDeleted();
    }

    @Override
    public EntityReference getOwner() {
      return null;
    }

    @Override
    public String getFullyQualifiedName() {
      return entity.getFullyQualifiedName();
    }

    @Override
    public List<TagLabel> getTags() {
      return entity.getTags();
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
          .withType(Entity.GLOSSARY_TERM);
    }

    @Override
    public GlossaryTerm getEntity() {
      return entity;
    }

    @Override
    public EntityReference getContainer() {
      return null;
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
    public void setDeleted(boolean flag) {
      entity.setDeleted(flag);
    }

    @Override
    public GlossaryTerm withHref(URI href) {
      return entity.withHref(href);
    }

    @Override
    public void setTags(List<TagLabel> tags) {
      entity.setTags(tags);
    }
  }

  /** Handles entity updated from PUT and POST operation. */
  public class GlossaryTermUpdater extends EntityUpdater {
    public GlossaryTermUpdater(GlossaryTerm original, GlossaryTerm updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() throws IOException {
      // TODO
    }
  }
}
