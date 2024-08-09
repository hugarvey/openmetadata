package org.openmetadata.service.apps.bundles.insights.workflows.dataAssets.processors;

import static org.openmetadata.schema.EntityInterface.ENTITY_TYPE_TO_CLASS_MAP;
import static org.openmetadata.service.apps.bundles.insights.utils.TimestampUtils.END_TIMESTAMP_KEY;
import static org.openmetadata.service.apps.bundles.insights.utils.TimestampUtils.START_TIMESTAMP_KEY;
import static org.openmetadata.service.workflows.searchIndex.ReindexingUtil.ENTITY_TYPE_KEY;
import static org.openmetadata.service.workflows.searchIndex.ReindexingUtil.TIMESTAMP_KEY;
import static org.openmetadata.service.workflows.searchIndex.ReindexingUtil.getUpdatedStats;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.glassfish.jersey.internal.util.ExceptionUtils;
import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.ColumnsEntityInterface;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.entity.teams.User;
import org.openmetadata.schema.system.IndexingError;
import org.openmetadata.schema.system.StepStats;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.apps.bundles.insights.utils.TimestampUtils;
import org.openmetadata.service.exception.SearchIndexException;
import org.openmetadata.service.jdbi3.EntityRepository;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.ResultList;
import org.openmetadata.service.workflows.interfaces.Processor;

@Slf4j
public class DataInsightsEntityEnricherProcessor
    implements Processor<List<Map<String, Object>>, ResultList<? extends EntityInterface>> {

  private final StepStats stats = new StepStats();

  public DataInsightsEntityEnricherProcessor(int total) {
    this.stats.withTotalRecords(total).withSuccessRecords(0).withFailedRecords(0);
  }

  @Override
  public List<Map<String, Object>> process(
      ResultList<? extends EntityInterface> input, Map<String, Object> contextData)
      throws SearchIndexException {
    List<Map<String, Object>> enrichedMaps;
    try {
      enrichedMaps =
          input.getData().stream()
              .map(entity -> getEntityVersions(entity, contextData))
              .flatMap(Collection::stream)
              .map(entityVersionMap -> enrichEntity(entityVersionMap, contextData))
              .map(this::generateDailyEntitySnapshots)
              .flatMap(Collection::stream)
              .toList();
      updateStats(input.getData().size(), 0);
    } catch (Exception e) {
      IndexingError error =
          new IndexingError()
              .withErrorSource(IndexingError.ErrorSource.PROCESSOR)
              .withSubmittedCount(input.getData().size())
              .withFailedCount(input.getData().size())
              .withSuccessCount(0)
              .withMessage(
                  String.format("Entities Enricher Encountered Failure: %s", e.getMessage()))
              .withStackTrace(ExceptionUtils.exceptionStackTraceAsString(e));
      LOG.debug(
          "[DataInsightsEntityEnricherProcessor] Failed. Details: {}", JsonUtils.pojoToJson(error));
      updateStats(0, input.getData().size());
      throw new SearchIndexException(error);
    }
    return enrichedMaps;
  }

  private List<Map<String, Object>> getEntityVersions(
      EntityInterface entity, Map<String, Object> contextData) {
    String entityType = (String) contextData.get(ENTITY_TYPE_KEY);
    Long endTimestamp = (Long) contextData.get(END_TIMESTAMP_KEY);
    Long startTimestamp = (Long) contextData.get(START_TIMESTAMP_KEY);
    EntityRepository<?> entityRepository = Entity.getEntityRepository(entityType);
    EntityHistory entityHistory = entityRepository.listVersions(entity.getId());

    Long pointerTimestamp = endTimestamp;
    List<Map<String, Object>> entityVersions = new java.util.ArrayList<>();

    for (Object version : entityHistory.getVersions()) {
      EntityInterface versionEntity =
          JsonUtils.readOrConvertValue(
              version, ENTITY_TYPE_TO_CLASS_MAP.get(entityType.toLowerCase()));
      Long versionTimestamp = TimestampUtils.getEndOfDayTimestamp(versionEntity.getUpdatedAt());
      if (versionTimestamp > pointerTimestamp) {
        continue;
      } else if (versionTimestamp < startTimestamp) {
        Map<String, Object> versionMap = new HashMap<>();

        versionMap.put("endTimestamp", pointerTimestamp);
        versionMap.put("startTimestamp", startTimestamp);
        versionMap.put("versionEntity", versionEntity);

        entityVersions.add(versionMap);
        break;
      } else {
        Map<String, Object> versionMap = new HashMap<>();

        versionMap.put("endTimestamp", pointerTimestamp);
        versionMap.put("startTimestamp", versionTimestamp);
        versionMap.put("versionEntity", versionEntity);

        entityVersions.add(versionMap);
        if (versionTimestamp.equals(pointerTimestamp)) {
          pointerTimestamp = TimestampUtils.subtractDays(pointerTimestamp, 1);
        } else {
          pointerTimestamp = versionTimestamp;
        }
      }
    }
    return entityVersions;
  }

  private Map<String, Object> enrichEntity(
      Map<String, Object> entityVersionMap, Map<String, Object> contextData) {
    EntityInterface entity = (EntityInterface) entityVersionMap.get("versionEntity");
    Long startTimestamp = (Long) entityVersionMap.get("startTimestamp");
    Long endTimestamp = (Long) entityVersionMap.get("endTimestamp");

    Map<String, Object> entityMap = JsonUtils.getMap(entity);
    String entityType = (String) contextData.get(ENTITY_TYPE_KEY);
    List<Class<?>> interfaces = List.of(entity.getClass().getInterfaces());

    // Enrich with EntityType
    if (CommonUtil.nullOrEmpty(entityType)) {
      throw new IllegalArgumentException(
          "[EsEntitiesProcessor] entityType cannot be null or empty.");
    }

    entityMap.put(ENTITY_TYPE_KEY, entityType);

    // Enrich with Timestamp
    entityMap.put("startTimestamp", startTimestamp);
    entityMap.put("endTimestamp", endTimestamp);

    // Enrich with Team
    Optional<List<EntityReference>> oEntityOwners = Optional.ofNullable(entity.getOwners());
    if (oEntityOwners.isPresent() && !oEntityOwners.get().isEmpty()) {
      EntityReference entityOwner = oEntityOwners.get().get(0);
      String ownerType = entityOwner.getType();
      if (ownerType.equals(Entity.TEAM)) {
        entityMap.put("team", entityOwner.getName());
      } else {
        Optional<User> oOwner =
            Optional.ofNullable(
                Entity.getEntityByName(
                    Entity.USER, entityOwner.getFullyQualifiedName(), "teams", Include.ALL));

        if (oOwner.isPresent()) {
          User owner = oOwner.get();
          List<EntityReference> teams = owner.getTeams();

          if (!teams.isEmpty()) {
            entityMap.put("team", teams.get(0).getName());
          }
        }
      }
    }

    // Enrich with Tier
    Optional<List<TagLabel>> oEntityTags = Optional.ofNullable(entity.getTags());

    if (oEntityTags.isPresent()) {
      Optional<String> oEntityTier =
          getEntityTier(oEntityTags.get().stream().map(TagLabel::getTagFQN).toList());
      oEntityTier.ifPresent(s -> entityMap.put("tier", s));
    }

    // Enrich with Description Stats
    if (interfaces.contains(ColumnsEntityInterface.class)) {
      entityMap.put("numberOfColumns", ((ColumnsEntityInterface) entity).getColumns().size());
      entityMap.put(
          "numberOfColumnsWithDescription",
          ((ColumnsEntityInterface) entity)
              .getColumns().stream()
                  .map(column -> CommonUtil.nullOrEmpty(column.getDescription()) ? 0 : 1)
                  .reduce(0, Integer::sum));
      entityMap.put("hasDescription", CommonUtil.nullOrEmpty(entity.getDescription()) ? 0 : 1);
    }

    // Modify Custom Property key
    Optional<Object> oCustomProperties = Optional.ofNullable(entityMap.remove("extension"));
    oCustomProperties.ifPresent(
        o -> entityMap.put(String.format("%sCustomProperty", entityType), o));

    // Remove 'changeDescription' field
    entityMap.remove("changeDescription");
    // Remove 'sampleData'
    entityMap.remove("sampleData");

    return entityMap;
  }

  private Optional<String> getEntityTier(List<String> entityTags) {
    Optional<String> entityTier = Optional.empty();

    List<String> tierTags = entityTags.stream().filter(tag -> tag.startsWith("Tier")).toList();

    // We can directly get the first element if the list is not empty since there can only be ONE
    // Tier tag.
    if (!tierTags.isEmpty()) {
      entityTier = Optional.of(tierTags.get(0));
    }

    return entityTier;
  }

  private List<Map<String, Object>> generateDailyEntitySnapshots(
      Map<String, Object> entityVersionMap) {
    Long startTimestamp = (Long) entityVersionMap.remove("startTimestamp");
    Long endTimestamp = (Long) entityVersionMap.remove("endTimestamp");

    List<Map<String, Object>> dailyEntitySnapshots = new java.util.ArrayList<>();

    Long pointerTimestamp = endTimestamp;

    while (pointerTimestamp >= startTimestamp) {
      Map<String, Object> dailyEntitySnapshot = new HashMap<>(entityVersionMap);

      dailyEntitySnapshot.put(
          TIMESTAMP_KEY, TimestampUtils.getStartOfDayTimestamp(pointerTimestamp));
      dailyEntitySnapshots.add(dailyEntitySnapshot);

      pointerTimestamp = TimestampUtils.subtractDays(pointerTimestamp, 1);
    }
    return dailyEntitySnapshots;
  }

  @Override
  public void updateStats(int currentSuccess, int currentFailed) {
    getUpdatedStats(stats, currentSuccess, currentFailed);
  }

  @Override
  public StepStats getStats() {
    return stats;
  }
}
