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

import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.net.URI;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.sqlobject.transaction.Transaction;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.resources.tags.TagResource;
import org.openmetadata.catalog.type.ChangeDescription;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.Include;
import org.openmetadata.catalog.type.Tag;
import org.openmetadata.catalog.type.TagLabel;
import org.openmetadata.catalog.type.TagLabel.Source;
import org.openmetadata.catalog.util.EntityInterface;
import org.openmetadata.catalog.util.EntityUtil.Fields;
import org.openmetadata.catalog.util.FullyQualifiedName;
import org.openmetadata.catalog.util.JsonUtils;

@Slf4j
public class TagRepository extends EntityRepository<Tag> {
  public TagRepository(CollectionDAO dao) {
    super(TagResource.TAG_COLLECTION_PATH, Entity.TAG, Tag.class, dao.tagDAO1(), dao, "", "");
  }

  @Transaction
  public Tag createPrimaryTag(String category, Tag tag) throws IOException {
    // Validate category
    Entity.getEntityReferenceByName(Entity.TAG_CATEGORY, category, Include.ALL);
    return createTagInternal(category, tag);
  }

  @Transaction
  public Tag createSecondaryTag(String category, String primaryTag, Tag tag) throws IOException {
    // Validate category TODO fix this
    Entity.getEntityReferenceByName(Entity.TAG_CATEGORY, category, Include.ALL);

    String primaryTagFQN = FullyQualifiedName.add(category, primaryTag);
    // TODO fix this.
    dao.findEntityByName(primaryTagFQN);

    return createTagInternal(primaryTagFQN, tag);
  }

  @Transaction
  public Tag getTag(String category, String fqn, Fields fields) throws IOException {
    // Validate category TODO fix this
    Entity.getEntityReferenceByName(Entity.TAG_CATEGORY, category, Include.ALL);

    // Get tags that match <category>.<tagName>
    Tag tag = setFields(dao.findEntityByName(fqn), fields);
    return populateChildrenTags(tag, fields);
  }

  @Transaction
  public Tag updatePrimaryTag(String category, String primaryTag, Tag updated) throws IOException {
    // Validate categoryName
    Entity.getEntityReferenceByName(Entity.TAG_CATEGORY, category, Include.ALL);
    return updateTag(category, primaryTag, updated);
  }

  @Transaction
  public Tag updateSecondaryTag(String category, String primaryTag, String secondaryTag, Tag updated)
      throws IOException {
    // Validate categoryName
    Entity.getEntityReferenceByName(Entity.TAG_CATEGORY, category, Include.ALL);
    String fqnPrefix = FullyQualifiedName.add(category, primaryTag);
    return updateTag(fqnPrefix, secondaryTag, updated);
  }

  private Tag updateTag(String fqnPrefix, String tagName, Tag updated) throws IOException {
    // Validate tag that needs to be updated exists
    String originalFQN = FullyQualifiedName.add(fqnPrefix, tagName);
    Tag original = dao.findEntityByName(originalFQN);

    if (!original.getName().equals(updated.getName())) {
      // Tag name changed
      LOG.info("Tag name changed from {} to {}", original.getName(), updated.getName());
      String updatedFQN = FullyQualifiedName.add(fqnPrefix, updated.getName());
      updateChildrenTagNames(originalFQN, updatedFQN);
      original.withName(updated.getName()).withFullyQualifiedName(updatedFQN);
    }
    original.withDescription(updated.getDescription()).withAssociatedTags(updated.getAssociatedTags());
    daoCollection.tagDAO().updateTag(originalFQN, JsonUtils.pojoToJson(original));

    // Populate children
    return populateChildrenTags(original, null);
  }

  /**
   * Replace category name: prefix = cat1 and newPrefix = cat2 replaces the FQN of all the children tags of a category
   * from cat1.primaryTag1.secondaryTag1 to cat2.primaryTag1.secondaryTag1
   *
   * <p>Replace primary tag name: Prefix = cat1.primaryTag1 and newPrefix = cat1.primaryTag2 replaces the FQN of all the
   * children tags from cat1.primaryTag1.secondaryTag1 to cat2.primaryTag2.secondaryTag1
   */
  private void updateChildrenTagNames(String prefix, String newPrefix) throws IOException {
    // Update the fully qualified names of all the primary and secondary tags
    List<String> groupJsons = daoCollection.tagDAO().listChildrenTags(prefix);

    for (String json : groupJsons) {
      Tag tag = JsonUtils.readValue(json, Tag.class);
      String oldFQN = tag.getFullyQualifiedName();
      String newFQN = oldFQN.replace(prefix, newPrefix);
      LOG.info("Replacing tag fqn from {} to {}", oldFQN, newFQN);
      tag.setFullyQualifiedName(oldFQN.replace(prefix, newPrefix));
      daoCollection.tagDAO().updateTag(oldFQN, JsonUtils.pojoToJson(tag));
      updateChildrenTagNames(oldFQN, newFQN);
    }
  }

  private Tag createTagInternal(String parentFQN, Tag tag) throws JsonProcessingException {
    // First add the tag
    List<Tag> tags = tag.getChildren();
    tag.setChildren(null); // Children of tag group are not stored as json but constructed on the fly
    tag.setFullyQualifiedName(FullyQualifiedName.add(parentFQN, tag.getName()));
    dao.insert(tag);
    tag.setChildren(tags);
    LOG.info("Added tag {}", tag.getFullyQualifiedName());

    // Then add the children
    for (Tag children : listOrEmpty(tags)) {
      children.setChildren(null); // No children allowed for the leaf tag
      children.setFullyQualifiedName(FullyQualifiedName.add(children.getFullyQualifiedName(), children.getName()));
      LOG.info("Added tag {}", children.getFullyQualifiedName());
      dao.insert(children);
    }
    return tag;
  }

  // Populate the children tags for a given tag
  private Tag populateChildrenTags(Tag tag, Fields fields) throws IOException {
    List<String> tagJsons = daoCollection.tagDAO().listChildrenTags(tag.getFullyQualifiedName());

    // Get tags under the given tag
    List<Tag> tagList = new ArrayList<>();
    for (String json : listOrEmpty(tagJsons)) {
      Tag childTag = setFields(JsonUtils.readValue(json, Tag.class), fields);
      tagList.add(populateChildrenTags(childTag, fields));
    }
    return tag.withChildren(!tagList.isEmpty() ? tagList : null);
  }

  @Override
  public EntityInterface<Tag> getEntityInterface(Tag entity) {
    return new TagEntityInterface(entity);
  }

  @Override
  public void prepare(Tag entity) throws IOException {}

  @Override
  public void storeEntity(Tag entity, boolean update) throws IOException {}

  @Override
  public void storeRelationships(Tag entity) {}

  @Override
  public Tag setFields(Tag tag, Fields fields) {
    if (fields == null) {
      return tag;
    }
    return tag.withUsageCount(fields.contains("usageCount") ? getUsageCount(tag) : null);
  }

  private Integer getUsageCount(Tag tag) {
    return daoCollection.tagDAO().getTagCount(Source.TAG.ordinal(), tag.getFullyQualifiedName());
  }

  public static class TagLabelMapper implements RowMapper<TagLabel> {
    @Override
    public TagLabel map(ResultSet r, org.jdbi.v3.core.statement.StatementContext ctx) throws SQLException {
      return new TagLabel()
          .withLabelType(TagLabel.LabelType.values()[r.getInt("labelType")])
          .withState(TagLabel.State.values()[r.getInt("state")])
          .withTagFQN(r.getString("tagFQN"));
    }
  }

  public static class TagEntityInterface extends EntityInterface<Tag> {
    public TagEntityInterface(Tag entity) {
      super(Entity.TAG, entity);
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
      return null;
    }

    @Override
    public String getName() {
      return entity.getName();
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
      return null;
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
      return null;
    }

    @Override
    public Tag getEntity() {
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
      return;
    }

    @Override
    public void setName(String name) {
      entity.setName(name);
    }

    @Override
    public void setUpdateDetails(String updatedBy, long updatedAt) {
      entity.setUpdatedBy(updatedBy);
      entity.setUpdatedAt(updatedAt);
    }

    @Override
    public void setChangeDescription(Double newVersion, ChangeDescription changeDescription) {
      entity.setVersion(newVersion);
      // TODO entity.setChangeDescription(changeDescription);
    }

    @Override
    public void setDeleted(boolean flag) {
      entity.setDeleted(flag);
    }

    @Override
    public Tag withHref(URI href) {
      return entity.withHref(href);
    }

    @Override
    public void setTags(List<TagLabel> tags) {
      return;
    }
  }
}
