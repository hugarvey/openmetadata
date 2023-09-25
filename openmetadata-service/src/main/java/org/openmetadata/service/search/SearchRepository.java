package org.openmetadata.service.search;

import static org.openmetadata.service.Entity.FIELD_FOLLOWERS;
import static org.openmetadata.service.Entity.FIELD_USAGE_SUMMARY;
import static org.openmetadata.service.Entity.QUERY;
import static org.openmetadata.service.exception.CatalogExceptionMessage.NOT_IMPLEMENTED_METHOD;
import static org.openmetadata.service.search.IndexUtil.ELASTIC_SEARCH_ENTITY_FQN_STREAM;
import static org.openmetadata.service.search.IndexUtil.ELASTIC_SEARCH_EXTENSION;
import static org.openmetadata.service.search.SearchIndexDefinition.ENTITY_TO_CHILDREN_MAPPING;

import com.fasterxml.jackson.core.type.TypeReference;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import javax.ws.rs.core.Response;
import lombok.SneakyThrows;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.EntityTimeSeriesInterface;
import org.openmetadata.schema.dataInsight.DataInsightChartResult;
import org.openmetadata.schema.entity.classification.Classification;
import org.openmetadata.schema.service.configuration.elasticsearch.ElasticSearchConfiguration;
import org.openmetadata.schema.system.EventPublisherJob;
import org.openmetadata.schema.system.Failure;
import org.openmetadata.schema.system.FailureDetails;
import org.openmetadata.schema.type.ChangeDescription;
import org.openmetadata.schema.type.FieldChange;
import org.openmetadata.schema.type.UsageDetails;
import org.openmetadata.service.exception.CustomExceptionMessage;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.search.SearchIndexDefinition.ElasticSearchIndexType;
import org.openmetadata.service.util.JsonUtils;
import org.opensearch.action.bulk.BulkRequest;
import org.opensearch.action.bulk.BulkResponse;
import org.opensearch.action.update.UpdateRequest;
import org.opensearch.client.RequestOptions;

public interface SearchRepository {
  String GLOBAL_SEARCH_ALIAS = "AllEntities";
  String DATABASE_ALIAS = "databaseAlias";
  String DATABASE_SCHEMA_ALIAS = "databaseSchemaAlias";

  String DEFAULT_UPDATE_SCRIPT = "for (k in params.keySet()) { ctx._source.put(k, params.get(k)) }";
  String CLASSIFICATION_DISABLE_SCRIPT = "ctx._source.disabled=%s";

  default void handleOwnerUpdates(EntityInterface original, EntityInterface updated, String eventType) {
    if (eventType.equalsIgnoreCase("added")) {
      this.updateSearchChildrenUpdated(
          updated,
          getOwnerChangeScript(eventType, ""),
          updated.getEntityReference().getType() + ".id",
          ENTITY_TO_CHILDREN_MAPPING.get(updated.getEntityReference().getType()).toString(),
          updated.getOwner());
    } else if (eventType.equalsIgnoreCase("updated")) {
      this.updateSearchChildrenUpdated(
          updated,
          getOwnerChangeScript(eventType, original.getOwner().getId().toString()),
          updated.getEntityReference().getType() + ".id",
          ENTITY_TO_CHILDREN_MAPPING.get(updated.getEntityReference().getType()).toString(),
          updated.getOwner());
    }
    if (eventType.equalsIgnoreCase("deleted")) {
      this.updateSearchChildrenUpdated(
          updated,
          getOwnerChangeScript(eventType, original.getOwner().getId().toString()),
          updated.getEntityReference().getType() + ".id",
          ENTITY_TO_CHILDREN_MAPPING.get(updated.getEntityReference().getType()).toString(),
          updated.getOwner());
    }
  }

  default void handleDomainUpdates(EntityInterface original, EntityInterface updated, String eventType) {
    if (eventType.equalsIgnoreCase("added")) {
      this.updateSearchChildrenUpdated(
          updated,
          getDomainChangeScript(eventType, ""),
          updated.getEntityReference().getType() + ".id",
          ENTITY_TO_CHILDREN_MAPPING.get(updated.getEntityReference().getType()).toString(),
          updated.getDomain());
    } else if (eventType.equalsIgnoreCase("updated")) {
      this.updateSearchChildrenUpdated(
          updated,
          getDomainChangeScript(eventType, original.getDomain().getId().toString()),
          updated.getEntityReference().getType() + ".id",
          ENTITY_TO_CHILDREN_MAPPING.get(updated.getEntityReference().getType()).toString(),
          updated.getDomain());
    }
    if (eventType.equalsIgnoreCase("deleted")) {
      this.updateSearchChildrenUpdated(
          updated,
          getDomainChangeScript(eventType, original.getDomain().getId().toString()),
          updated.getEntityReference().getType() + ".id",
          ENTITY_TO_CHILDREN_MAPPING.get(updated.getEntityReference().getType()).toString(),
          updated.getDomain());
    }
  }

  default void handleClassificationUpdate(Classification entity) {
    this.updateSearchEntityUpdated(entity, String.format(CLASSIFICATION_DISABLE_SCRIPT, entity.getDisabled()), "");
  }

  default String getOwnerChangeScript(String eventType, String ownerId) {
    String scriptTxt = "";
    if (eventType.equals("added")) {
      scriptTxt = "if(ctx._source.owner == null){ ctx._source.put('owner', params)}";
    } else if (eventType.equals("deleted")) {
      scriptTxt = String.format("if(ctx._source.owner.id == '%s'){ ctx._source.remove('owner')}", ownerId);
    } else if (eventType.equals("updated")) {
      scriptTxt = String.format("if(ctx._source.owner.id == '%s'){ ctx._source.put('owner', params)}", ownerId);
    }
    return scriptTxt;
  }

  default String getDomainChangeScript(String eventType, String domainId) {
    String scriptTxt = "";
    if (eventType.equals("added")) {
      scriptTxt = "if(ctx._source.domain == null){ ctx._source.put('domain', params)}";
    } else if (eventType.equals("deleted")) {
      scriptTxt = String.format("if(ctx._source.domain.id == '%s'){ ctx._source.remove('domain')}", domainId);
    } else if (eventType.equals("updated")) {
      scriptTxt = String.format("if(ctx._source.domain.id == '%s'){ ctx._source.put('domain', params)}", domainId);
    }
    return scriptTxt;
  }

  boolean createIndex(ElasticSearchIndexType elasticSearchIndexType, String lang);

  void updateIndex(ElasticSearchIndexType elasticSearchIndexType, String lang);

  void deleteIndex(ElasticSearchIndexType elasticSearchIndexType);

  Response search(SearchRequest request) throws IOException;

  Response searchBySourceUrl(String sourceUrl) throws IOException;

  Response searchByField(String fieldName, String fieldValue, String index) throws IOException;

  Response aggregate(String index, String fieldName, String value, String query) throws IOException;

  Response suggest(SearchRequest request) throws IOException;

  ElasticSearchConfiguration.SearchType getSearchType();

  default void updateElasticSearch(UpdateRequest updateRequest) throws IOException {
    throw new CustomExceptionMessage(Response.Status.NOT_IMPLEMENTED, NOT_IMPLEMENTED_METHOD);
  }

  default void updateElasticSearch(org.elasticsearch.action.update.UpdateRequest updateRequest) throws IOException {
    throw new CustomExceptionMessage(Response.Status.NOT_IMPLEMENTED, NOT_IMPLEMENTED_METHOD);
  }

  void updateSearchEntityCreated(EntityInterface entity);

  void updateSearchEntityCreated(EntityTimeSeriesInterface entity);

  void deleteByScript(String index, String scriptTxt, HashMap<String, Object> params);

  void updateSearchEntityDeleted(EntityInterface entity, String script, String field);

  void deleteEntityAndRemoveRelationships(EntityInterface entity, String script, String field);

  void softDeleteOrRestoreEntityFromSearch(EntityInterface entity, boolean delete, String field);

  void updateSearchEntityUpdated(EntityInterface entity, String script, String field);

  void updateSearchChildrenUpdated(EntityInterface entity, String scriptTxt, String field, String alias, Object data);

  void updateSearchByQuery(EntityInterface entity, String script, String field, Object data);

  void close();

  default BulkResponse bulk(BulkRequest data, RequestOptions options) throws IOException {
    throw new CustomExceptionMessage(Response.Status.NOT_IMPLEMENTED, NOT_IMPLEMENTED_METHOD);
  }

  default org.elasticsearch.action.bulk.BulkResponse bulk(
      org.elasticsearch.action.bulk.BulkRequest data, org.elasticsearch.client.RequestOptions options)
      throws IOException {
    throw new CustomExceptionMessage(Response.Status.NOT_IMPLEMENTED, NOT_IMPLEMENTED_METHOD);
  }

  default int getSuccessFromBulkResponse(BulkResponse response) {
    throw new CustomExceptionMessage(Response.Status.NOT_IMPLEMENTED, NOT_IMPLEMENTED_METHOD);
  }

  default int getSuccessFromBulkResponse(org.elasticsearch.action.bulk.BulkResponse response) {
    throw new CustomExceptionMessage(Response.Status.NOT_IMPLEMENTED, NOT_IMPLEMENTED_METHOD);
  }

  TreeMap<Long, List<Object>> getSortedDate(
      String team,
      Long scheduleTime,
      Long currentTime,
      DataInsightChartResult.DataInsightChartType chartType,
      String indexName)
      throws IOException, ParseException;

  Response listDataInsightChartResult(
      Long startTs,
      Long endTs,
      String tier,
      String team,
      DataInsightChartResult.DataInsightChartType dataInsightChartName,
      String dataReportIndex)
      throws IOException, ParseException;

  default void getScriptWithParams(EntityInterface entity, StringBuilder script, Map<String, Object> fieldAddParams) {
    ChangeDescription changeDescription = entity.getChangeDescription();

    List<FieldChange> fieldsAdded = changeDescription.getFieldsAdded();
    StringBuilder scriptTxt = new StringBuilder();
    fieldAddParams.put("updatedAt", entity.getUpdatedAt());
    scriptTxt.append("ctx._source.updatedAt=params.updatedAt;");
    for (FieldChange fieldChange : fieldsAdded) {
      if (fieldChange.getName().equalsIgnoreCase(FIELD_FOLLOWERS)) {
        @SuppressWarnings("unchecked")
        List<LinkedHashMap<String, Object>> entityReferencesMap =
            (List<LinkedHashMap<String, Object>>) fieldChange.getNewValue();
        List<String> newFollowers = new ArrayList<>();
        for (LinkedHashMap<String, Object> entityReferenceMap : entityReferencesMap) {
          newFollowers.add(entityReferenceMap.get("id").toString());
        }
        fieldAddParams.put(fieldChange.getName(), newFollowers);
        scriptTxt.append("ctx._source.followers.addAll(params.followers);");
      }
    }

    for (FieldChange fieldChange : changeDescription.getFieldsDeleted()) {
      if (fieldChange.getName().equalsIgnoreCase(FIELD_FOLLOWERS)) {
        @SuppressWarnings("unchecked")
        List<LinkedHashMap<String, Object>> entityReferencesMap =
            (List<LinkedHashMap<String, Object>>) fieldChange.getOldValue();
        for (LinkedHashMap<String, Object> entityReferenceMap : entityReferencesMap) {
          fieldAddParams.put(fieldChange.getName(), entityReferenceMap.get("id").toString());
        }
        scriptTxt.append("ctx._source.followers.removeAll(Collections.singleton(params.followers));");
      }
    }

    for (FieldChange fieldChange : changeDescription.getFieldsUpdated()) {
      if (fieldChange.getName().equalsIgnoreCase(FIELD_USAGE_SUMMARY)) {
        UsageDetails usageSummary = (UsageDetails) fieldChange.getNewValue();
        fieldAddParams.put(fieldChange.getName(), JsonUtils.getMap(usageSummary));
        scriptTxt.append("ctx._source.usageSummary = params.usageSummary;");
      }
      if (entity.getEntityReference().getType().equals(QUERY)
          && fieldChange.getName().equalsIgnoreCase("queryUsedIn")) {
        fieldAddParams.put(
            fieldChange.getName(),
            JsonUtils.convertValue(
                fieldChange.getNewValue(), new TypeReference<List<LinkedHashMap<String, String>>>() {}));
        scriptTxt.append("ctx._source.queryUsedIn = params.queryUsedIn;");
      }
      if (fieldChange.getName().equalsIgnoreCase("votes")) {
        Map<String, Object> doc = JsonUtils.getMap(entity);
        fieldAddParams.put(fieldChange.getName(), doc.get("votes"));
        scriptTxt.append("ctx._source.votes = params.votes;");
      }
    }

    // Set to the Output variables
    script.append(scriptTxt);
  }

  default String getIndexMapping(SearchIndexDefinition.ElasticSearchIndexType elasticSearchIndexType, String lang)
      throws IOException {
    InputStream in =
        SearchIndexDefinition.class.getResourceAsStream(
            String.format(elasticSearchIndexType.indexMappingFile, lang.toLowerCase()));
    assert in != null;
    return new String(in.readAllBytes());
  }

  CollectionDAO getDao();

  @SneakyThrows
  default void updateElasticSearchFailureStatus(String failedFor, String failureMessage) {
    try {
      long updateTime = Date.from(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant()).getTime();
      String recordString =
          getDao()
              .entityExtensionTimeSeriesDao()
              .getExtension(ELASTIC_SEARCH_ENTITY_FQN_STREAM, ELASTIC_SEARCH_EXTENSION);
      EventPublisherJob lastRecord = JsonUtils.readValue(recordString, EventPublisherJob.class);
      long originalLastUpdate = lastRecord.getTimestamp();
      lastRecord.setStatus(EventPublisherJob.Status.ACTIVE_WITH_ERROR);
      lastRecord.setTimestamp(updateTime);
      lastRecord.setFailure(
          new Failure()
              .withSinkError(
                  new FailureDetails()
                      .withContext(failedFor)
                      .withLastFailedAt(updateTime)
                      .withLastFailedReason(failureMessage)));

      getDao()
          .entityExtensionTimeSeriesDao()
          .update(
              ELASTIC_SEARCH_ENTITY_FQN_STREAM,
              ELASTIC_SEARCH_EXTENSION,
              JsonUtils.pojoToJson(lastRecord),
              originalLastUpdate);
    } catch (Exception e) {
      // Failure to update
    }
  }
}
