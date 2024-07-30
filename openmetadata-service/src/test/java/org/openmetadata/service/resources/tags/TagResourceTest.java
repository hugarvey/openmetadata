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

package org.openmetadata.service.resources.tags;

import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static javax.ws.rs.core.Response.Status.CREATED;
import static javax.ws.rs.core.Response.Status.NOT_FOUND;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.openmetadata.common.utils.CommonUtil.listOf;
import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;
import static org.openmetadata.service.exception.CatalogExceptionMessage.entityNotFound;
import static org.openmetadata.service.util.EntityUtil.fieldUpdated;
import static org.openmetadata.service.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.service.util.TestUtils.UpdateType.MINOR_UPDATE;
import static org.openmetadata.service.util.TestUtils.UpdateType.NO_CHANGE;
import static org.openmetadata.service.util.TestUtils.assertEntityPagination;
import static org.openmetadata.service.util.TestUtils.assertListNotNull;
import static org.openmetadata.service.util.TestUtils.assertListNull;
import static org.openmetadata.service.util.TestUtils.assertResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.TestMethodOrder;
import org.openmetadata.schema.api.classification.CreateClassification;
import org.openmetadata.schema.api.classification.CreateTag;
import org.openmetadata.schema.entity.classification.Classification;
import org.openmetadata.schema.entity.classification.Tag;
import org.openmetadata.schema.entity.type.Style;
import org.openmetadata.schema.type.ChangeDescription;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.ProviderType;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.exception.CatalogExceptionMessage;
import org.openmetadata.service.resources.EntityResourceTest;
import org.openmetadata.service.resources.tags.TagResource.TagList;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.FullyQualifiedName;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.ResultList;
import org.openmetadata.service.util.TestUtils.UpdateType;

/** Tests not covered here: Classification and Tag usage counts are covered in TableResourceTest */
@Slf4j
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TagResourceTest extends EntityResourceTest<Tag, CreateTag> {
  private final ClassificationResourceTest classificationResourceTest =
      new ClassificationResourceTest();

  public TagResourceTest() {
    super(Entity.TAG, Tag.class, TagList.class, "tags", TagResource.FIELDS);
    supportsSearchIndex = true;
  }

  public void setupTags() throws IOException {
    PERSONAL_DATA_TAG_LABEL = getTagLabel(FullyQualifiedName.add("PersonalData", "Personal"));
    PII_SENSITIVE_TAG_LABEL = getTagLabel(FullyQualifiedName.add("PII", "Sensitive"));
    TIER1_TAG_LABEL = getTagLabel(FullyQualifiedName.add("Tier", "Tier1"));
    TIER2_TAG_LABEL = getTagLabel(FullyQualifiedName.add("Tier", "Tier2"));

    USER_CLASSIFICATION = createClassification("User");

    ADDRESS_TAG =
        createTag(
            "Address",
            USER_CLASSIFICATION.getName(),
            null,
            PERSONAL_DATA_TAG_LABEL.getTagFQN(),
            PII_SENSITIVE_TAG_LABEL.getTagFQN());
    USER_ADDRESS_TAG_LABEL =
        getTagLabel(FullyQualifiedName.add(USER_CLASSIFICATION.getName(), "Address"));
  }

  private TagLabel getTagLabel(String tagName) throws HttpResponseException {
    return EntityUtil.toTagLabel(getEntityByName(tagName, "", ADMIN_AUTH_HEADERS));
  }

  @Order(1)
  @Test
  void post_validTags_200() throws IOException {
    Classification classification = getClassification(USER_CLASSIFICATION.getName());
    Map<String, String> queryParams = new HashMap<>();
    queryParams.put("parent", classification.getFullyQualifiedName());
    List<Tag> childrenBefore = listEntities(queryParams, ADMIN_AUTH_HEADERS).getData();

    Tag tag1 = createTag("tag1", classification.getName(), null);
    List<Tag> childrenAfter = listEntities(queryParams, ADMIN_AUTH_HEADERS).getData();

    assertEquals(childrenBefore.size() + 1, childrenAfter.size());

    createTag("SecondaryTag", classification.getName(), tag1.getFullyQualifiedName());
  }

  @Test
  void post_newTagsOnNonExistentParents_404() {
    String nonExistent = "nonExistent";
    assertResponse(
        () -> createTag("primary", nonExistent, null),
        NOT_FOUND,
        entityNotFound(Entity.CLASSIFICATION, nonExistent));

    // POST .../tags/{user}/{nonExistent}/tag where primaryTag does not exist
    String parentFqn = FullyQualifiedName.build(USER_CLASSIFICATION.getName(), nonExistent);
    CreateTag create1 = createRequest(nonExistent).withParent(parentFqn);
    assertResponse(
        () -> createEntity(create1, ADMIN_AUTH_HEADERS),
        NOT_FOUND,
        entityNotFound(Entity.TAG, parentFqn));
  }

  @Test
  void put_tagNameChange(TestInfo test) throws IOException {
    //
    // Create classification with tags t1, t2
    // Create under tag1 secondary tags t11 t12
    // Create under tag2 secondary tags t21 t22
    //
    String classificationName = test.getDisplayName().substring(0, 10);
    Classification classification = createClassification(classificationName);

    Tag t1 = createOrUpdate(classificationName, null, "t'_1", CREATED);
    createOrUpdate(classificationName, t1, "t'_11", CREATED);
    createOrUpdate(classificationName, t1, "t'_12", CREATED);
    Tag t2 = createOrUpdate(classificationName, null, "t'_2", CREATED);
    createOrUpdate(classificationName, t2, "t'_21", CREATED);
    Tag t22 = createOrUpdate(classificationName, t2, "t'_22", CREATED);

    // Rename leaf node t22 to newt22
    renameTagAndCheck(t22, "newt`_22");

    // Change the tag t2 name and ensure all the children's FQN are updated
    renameTagAndCheck(t2, "newt`_2");

    // Change classification name and ensure all the tags have the new names
    String newClassificationName = "new1`_" + classificationName;
    classificationResourceTest.renameClassificationAndCheck(classification, newClassificationName);
  }

  @Test
  void delete_systemTag() throws HttpResponseException {
    Tag tag = getEntityByName("Tier.Tier1", ADMIN_AUTH_HEADERS);
    assertResponse(
        () -> deleteEntity(tag.getId(), ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        CatalogExceptionMessage.systemEntityDeleteNotAllowed(tag.getName(), Entity.TAG));
  }

  @Test
  void get_TagsWithPagination_200(TestInfo test) throws IOException {
    // get Pagination results for same name entities
    boolean supportsSoftDelete = true;
    int numEntities = 5;

    List<UUID> createdUUIDs = new ArrayList<>();
    for (int i = 0; i < numEntities; i++) {
      // Create Tags with same name and different parent classifications
      Classification classification = createClassification("Classification" + (i + 1));
      CreateTag createTag = createRequest("commonTag", classification.getName());
      Tag tag = createEntity(createTag, ADMIN_AUTH_HEADERS);
      createdUUIDs.add(tag.getId());
    }

    Classification classification = createClassification("Classification0");
    Tag entity =
        createEntity(createRequest("commonTag", classification.getName()), ADMIN_AUTH_HEADERS);
    deleteAndCheckEntity(entity, ADMIN_AUTH_HEADERS);

    Predicate<Tag> matchDeleted = e -> e.getId().equals(entity.getId());

    // Test listing entities that include deleted, non-deleted, and all the entities
    for (Include include : List.of(Include.NON_DELETED, Include.ALL, Include.DELETED)) {
      if (!supportsSoftDelete && include.equals(Include.DELETED)) {
        continue;
      }
      Map<String, String> queryParams = new HashMap<>();
      queryParams.put("include", include.value());

      // List all entities and use it for checking pagination
      ResultList<Tag> allEntities =
          listEntities(queryParams, 1000000, null, null, ADMIN_AUTH_HEADERS);
      int totalRecords = allEntities.getData().size();

      // List entity with "limit" set from 1 to numEntities size with fixed steps
      for (int limit = 1; limit < numEntities; limit += 2) { // fixed step for consistency
        String after = null;
        String before;
        int pageCount = 0;
        int indexInAllTables = 0;
        ResultList<Tag> forwardPage;
        ResultList<Tag> backwardPage;
        boolean foundDeleted = false;
        do { // For each limit (or page size) - forward scroll till the end
          LOG.debug(
              "Limit {} forward pageCount {} indexInAllTables {} totalRecords {} afterCursor {}",
              limit,
              pageCount,
              indexInAllTables,
              totalRecords,
              after);
          forwardPage = listEntities(queryParams, limit, null, after, ADMIN_AUTH_HEADERS);
          foundDeleted = forwardPage.getData().stream().anyMatch(matchDeleted) || foundDeleted;
          after = forwardPage.getPaging().getAfter();
          before = forwardPage.getPaging().getBefore();
          assertEntityPagination(allEntities.getData(), forwardPage, limit, indexInAllTables);

          if (pageCount == 0) { // CASE 0 - First page is being returned. There is no before-cursor
            assertNull(before);
          } else {
            // Make sure scrolling back based on before cursor returns the correct result
            backwardPage = listEntities(queryParams, limit, before, null, ADMIN_AUTH_HEADERS);
            assertEntityPagination(
                allEntities.getData(), backwardPage, limit, (indexInAllTables - limit));
          }

          indexInAllTables += forwardPage.getData().size();
          pageCount++;
        } while (after != null);

        boolean includeAllOrDeleted =
            Include.ALL.equals(include) || Include.DELETED.equals(include);
        if (includeAllOrDeleted) {
          assertTrue(!supportsSoftDelete || foundDeleted);
        } else { // non-delete
          assertFalse(foundDeleted);
        }

        // We have now reached the last page - test backward scroll till the beginning
        pageCount = 0;
        indexInAllTables = totalRecords - limit - forwardPage.getData().size();
        foundDeleted = forwardPage.getData().stream().anyMatch(matchDeleted);
        do {
          LOG.debug(
              "Limit {} backward pageCount {} indexInAllTables {} totalRecords {} afterCursor {}",
              limit,
              pageCount,
              indexInAllTables,
              totalRecords,
              after);
          forwardPage = listEntities(queryParams, limit, before, null, ADMIN_AUTH_HEADERS);
          foundDeleted = forwardPage.getData().stream().anyMatch(matchDeleted) || foundDeleted;
          before = forwardPage.getPaging().getBefore();
          assertEntityPagination(allEntities.getData(), forwardPage, limit, indexInAllTables);
          pageCount++;
          indexInAllTables -= forwardPage.getData().size();
        } while (before != null);

        if (includeAllOrDeleted) {
          assertTrue(!supportsSoftDelete || foundDeleted);
        } else { // non-delete
          assertFalse(foundDeleted);
        }
      }

      // Before running "deleted" delete all created entries otherwise the test doesn't work with
      // just one element.
      if (Include.ALL.equals(include)) {
        for (Tag toBeDeleted : allEntities.getData()) {
          if (createdUUIDs.contains(toBeDeleted.getId())
              && Boolean.FALSE.equals(toBeDeleted.getDeleted())) {
            deleteAndCheckEntity(toBeDeleted, ADMIN_AUTH_HEADERS);
          }
        }
      }
    }
  }

  private Tag createOrUpdate(String classificationName, Tag parent, String name, Status status)
      throws IOException {
    String parentFqn = parent != null ? parent.getFullyQualifiedName() : null;
    CreateTag createTag =
        createRequest(name)
            .withParent(parentFqn)
            .withClassification(classificationName)
            .withDescription("description");
    return updateAndCheckEntity(createTag, status, ADMIN_AUTH_HEADERS, NO_CHANGE, null);
  }

  public void renameTagAndCheck(Tag tag, String newName) throws IOException {
    String oldName = tag.getName();
    String json = JsonUtils.pojoToJson(tag);
    ChangeDescription change = getChangeDescription(tag, MINOR_UPDATE);
    fieldUpdated(change, "name", oldName, newName);
    tag.setName(newName);
    tag = patchEntityAndCheck(tag, json, ADMIN_AUTH_HEADERS, MINOR_UPDATE, change);

    // GET the tag and check all the children are renamed
    Tag getTag = getEntity(tag.getId(), ADMIN_AUTH_HEADERS);
    for (EntityReference ref : getTag.getChildren()) {
      assertTrue(ref.getFullyQualifiedName().startsWith(getTag.getFullyQualifiedName()));
    }

    // List children tags with this term as the parent and ensure rename
    Map<String, String> queryParams = new HashMap<>();
    queryParams.put("parent", getTag.getFullyQualifiedName());
    List<Tag> children = listEntities(queryParams, ADMIN_AUTH_HEADERS).getData();
    for (Tag child : listOrEmpty(children)) {
      assertTrue(child.getFullyQualifiedName().startsWith(getTag.getFullyQualifiedName()));
    }
  }

  @Override
  public CreateTag createRequest(String name) {
    return new CreateTag()
        .withName(name)
        .withDescription("description")
        .withClassification(USER_CLASSIFICATION.getName());
  }

  public CreateTag createRequest(String name, String classificationName) {
    return new CreateTag()
        .withName(name)
        .withDescription("description")
        .withClassification(classificationName);
  }

  @Override
  public void validateCreatedEntity(
      Tag createdEntity, CreateTag request, Map<String, String> authHeaders) {
    assertEquals(
        request.getClassification(), createdEntity.getClassification().getFullyQualifiedName());
    if (request.getParent() == null) {
      assertNull(createdEntity.getParent());
    } else {
      assertEquals(request.getParent(), createdEntity.getParent().getFullyQualifiedName());
    }
    assertEquals(
        request.getProvider() == null ? ProviderType.USER : request.getProvider(),
        createdEntity.getProvider());
    assertEquals(request.getMutuallyExclusive(), createdEntity.getMutuallyExclusive());
  }

  @Override
  public void compareEntities(Tag expected, Tag updated, Map<String, String> authHeaders) {
    assertReference(expected.getClassification(), updated.getClassification());
    assertReference(expected.getParent(), updated.getParent());
    assertEquals(
        expected.getProvider() == null ? ProviderType.USER : expected.getProvider(),
        updated.getProvider());
    assertEquals(expected.getMutuallyExclusive(), updated.getMutuallyExclusive());
  }

  @Override
  public Tag validateGetWithDifferentFields(Tag tag, boolean byName) throws HttpResponseException {
    String fields = "";
    tag =
        byName
            ? getEntityByName(tag.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(tag.getId(), fields, ADMIN_AUTH_HEADERS);
    assertListNotNull(tag.getClassification());
    assertListNull(tag.getUsageCount(), tag.getChildren());

    fields = "children,usageCount";
    tag =
        byName
            ? getEntityByName(tag.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(tag.getId(), fields, ADMIN_AUTH_HEADERS);
    assertListNotNull(tag.getClassification(), tag.getUsageCount(), tag.getChildren());
    return tag;
  }

  @Override
  public void assertFieldChange(String fieldName, Object expected, Object actual) {
    assertCommonFieldChange(fieldName, expected, actual);
  }

  @Override
  public Tag createAndCheckEntity(CreateTag create, Map<String, String> authHeaders)
      throws IOException {
    int termCount = getClassification(create.getClassification()).getTermCount();
    Tag tag = super.createAndCheckEntity(create, authHeaders);
    assertEquals(termCount + 1, getClassification(create.getClassification()).getTermCount());
    return tag;
  }

  @Override
  public Tag updateAndCheckEntity(
      CreateTag request,
      Status status,
      Map<String, String> authHeaders,
      UpdateType updateType,
      ChangeDescription changeDescription)
      throws IOException {
    int termCount = getClassification(request.getClassification()).getTermCount();
    Tag tag =
        super.updateAndCheckEntity(request, status, authHeaders, updateType, changeDescription);
    if (status == Response.Status.CREATED) {
      assertEquals(termCount + 1, getClassification(request.getClassification()).getTermCount());
    }
    return tag;
  }

  public Tag createTag(
      String name, String classification, String parentFqn, String... associatedTags)
      throws IOException {
    List<String> associatedTagList = associatedTags.length == 0 ? null : listOf(associatedTags);
    CreateTag createTag =
        createRequest(name)
            .withParent(parentFqn)
            .withStyle(new Style().withColor("#6495ED").withIconURL("https://tagIcon"))
            .withClassification(classification)
            .withAssociatedTags(associatedTagList);
    return createEntity(createTag, ADMIN_AUTH_HEADERS);
  }

  public Classification createClassification(String name) throws IOException {
    CreateClassification create = classificationResourceTest.createRequest(name);
    return classificationResourceTest.createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
  }

  public Classification getClassification(String name) throws IOException {
    return classificationResourceTest.getEntityByName(
        name, classificationResourceTest.getAllowedFields(), ADMIN_AUTH_HEADERS);
  }
}
