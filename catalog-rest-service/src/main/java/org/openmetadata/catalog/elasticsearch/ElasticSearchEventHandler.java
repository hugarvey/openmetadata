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

package org.openmetadata.catalog.elasticsearch;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.elasticsearch.action.ActionListener;
import org.elasticsearch.action.update.UpdateRequest;
import org.elasticsearch.action.update.UpdateResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import org.elasticsearch.script.Script;
import org.elasticsearch.script.ScriptType;
import org.jdbi.v3.core.Jdbi;
import org.openmetadata.catalog.CatalogApplicationConfig;
import org.openmetadata.catalog.ElasticSearchConfiguration;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.elasticsearch.ElasticSearchIndexDefinition.ElasticSearchIndexType;
import org.openmetadata.catalog.entity.data.Dashboard;
import org.openmetadata.catalog.entity.data.DbtModel;
import org.openmetadata.catalog.entity.data.Pipeline;
import org.openmetadata.catalog.entity.data.Table;
import org.openmetadata.catalog.entity.data.Topic;
import org.openmetadata.catalog.events.EventHandler;
import org.openmetadata.catalog.type.ChangeDescription;
import org.openmetadata.catalog.type.ChangeEvent;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.FieldChange;
import org.openmetadata.catalog.util.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;


public class ElasticSearchEventHandler implements EventHandler {
  private static final Logger LOG = LoggerFactory.getLogger(ElasticSearchEventHandler.class);
  private RestHighLevelClient client;
  private ElasticSearchIndexDefinition esIndexDefinition;

  private final ActionListener<UpdateResponse> listener = new ActionListener<>() {
    @Override
    public void onResponse(UpdateResponse updateResponse) {
      LOG.info("Updated Elastic Search {}", updateResponse);
    }

    @Override
    public void onFailure(Exception e) {
      LOG.error("Failed to update Elastic Search", e);
    }
  };

  public void init(CatalogApplicationConfig config, Jdbi jdbi) {
    ElasticSearchConfiguration esConfig = config.getElasticSearchConfiguration();
    RestClientBuilder restClientBuilder = RestClient.builder(new HttpHost(esConfig.getHost(), esConfig.getPort(),
        "http"));
    if(StringUtils.isNotEmpty(esConfig.getUsername())){
      CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
      credentialsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(esConfig.getUsername(),
          esConfig.getPassword()));
      restClientBuilder.setHttpClientConfigCallback(httpAsyncClientBuilder -> {
        httpAsyncClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
        return  httpAsyncClientBuilder;
      });
    }
    client = new RestHighLevelClient(restClientBuilder);
    esIndexDefinition = new ElasticSearchIndexDefinition(client);
    esIndexDefinition.createIndexes();
  }


  public Void process(ContainerRequestContext requestContext,
                      ContainerResponseContext responseContext) {
    try {
      LOG.info("request Context "+ requestContext.toString());
      if (responseContext.getEntity() != null) {
        Object entity = responseContext.getEntity();
        UpdateRequest updateRequest = null;
        String entityClass = entity.getClass().toString();
        if (entityClass.toLowerCase().endsWith(Entity.TABLE.toLowerCase())) {
          boolean exists =
              esIndexDefinition.checkIndexExistsOrCreate(ElasticSearchIndexType.TABLE_SEARCH_INDEX);
          if (exists) {
            Table instance = (Table) entity;
            updateRequest = updateTable(instance);
          }
        } else if (entityClass.toLowerCase().endsWith(Entity.DASHBOARD.toLowerCase())) {
          boolean exists =
              esIndexDefinition.checkIndexExistsOrCreate(ElasticSearchIndexType.DASHBOARD_SEARCH_INDEX);
           if (exists) {
            Dashboard instance = (Dashboard) entity;
            updateRequest = updateDashboard(instance);
          }
        } else if (entityClass.toLowerCase().endsWith(Entity.TOPIC.toLowerCase())) {
          boolean exists =
              esIndexDefinition.checkIndexExistsOrCreate(ElasticSearchIndexType.TOPIC_SEARCH_INDEX);
          if (exists) {
            Topic instance = (Topic) entity;
            updateRequest = updateTopic(instance);
          }
        } else if (entityClass.toLowerCase().endsWith(Entity.PIPELINE.toLowerCase())) {
          boolean exists =
              esIndexDefinition.checkIndexExistsOrCreate(ElasticSearchIndexType.PIPELINE_SEARCH_INDEX);
          if (exists) {
            Pipeline instance = (Pipeline) entity;
            updateRequest = updatePipeline(instance);
          }
        } else if (entityClass.toLowerCase().endsWith(Entity.DBTMODEL.toLowerCase())) {
          boolean exists =
              esIndexDefinition.checkIndexExistsOrCreate(ElasticSearchIndexType.DBT_MODEL_SEARCH_INDEX);
          if (exists) {
            DbtModel instance = (DbtModel) entity;
            updateRequest = updateDbtModel(instance);
          }
        } else if (entityClass.toLowerCase().equalsIgnoreCase(ChangeEvent.class.toString())) {
          ChangeEvent changeEvent = (ChangeEvent) entity;
          updateRequest = applyChangeEvent(changeEvent);
        }
        if (updateRequest != null) {
          client.updateAsync(updateRequest, RequestOptions.DEFAULT, listener);
        }
      }
    } catch (Exception e) {
      LOG.error("failed to update ES doc", e);
    }
    return null;
  }

  private UpdateRequest applyChangeEvent(ChangeEvent event) {
    String entityType = event.getEntityType();
    String esIndex = getESIndex(entityType);
    UUID entityId = event.getEntityId();
    ChangeDescription changeDescription = event.getChangeDescription();
    List<FieldChange> fieldsAdded = changeDescription.getFieldsAdded();
    StringBuilder scriptTxt = new StringBuilder();
    Map<String, Object> fieldAddParams = new HashMap<>();
    for (FieldChange fieldChange: fieldsAdded) {
      if (fieldChange.getName().equalsIgnoreCase("followers")) {
        List<EntityReference> entityReferences = (List<EntityReference>) fieldChange.getNewValue();
        List<String> newFollowers = new ArrayList<>();
        for (EntityReference follower : entityReferences) {
          newFollowers.add(follower.getId().toString());
        }
        fieldAddParams.put(fieldChange.getName(), newFollowers);
        scriptTxt.append("ctx._source.followers.addAll(params.followers);");
      }
    }

    for (FieldChange fieldChange: changeDescription.getFieldsDeleted()) {
      if (fieldChange.getName().equalsIgnoreCase("followers")) {
        List<EntityReference> entityReferences = (List<EntityReference>) fieldChange.getOldValue();
        for (EntityReference follower : entityReferences) {
          fieldAddParams.put(fieldChange.getName(), follower.getId().toString());
        }

        scriptTxt.append("ctx._source.followers.removeAll(Collections.singleton(params.followers))");
      }
    }

    if (!scriptTxt.toString().isEmpty()) {
      Script script = new Script(ScriptType.INLINE, "painless",
          scriptTxt.toString(),
          fieldAddParams);
      UpdateRequest updateRequest = new UpdateRequest(esIndex, entityId.toString());
      updateRequest.script(script);
      return updateRequest;
    } else {
      return null;
    }
  }

  private UpdateRequest updateTable(Table instance) throws JsonProcessingException {
    TableESIndex tableESIndex = TableESIndex.builder(instance).build();
    UpdateRequest updateRequest = new UpdateRequest(ElasticSearchIndexType.TABLE_SEARCH_INDEX.indexName
        , instance.getId().toString());
    String json = JsonUtils.pojoToJson(tableESIndex);
    updateRequest.doc(json, XContentType.JSON);
    updateRequest.docAsUpsert(true);
    return updateRequest;
  }

  private UpdateRequest updateTopic(Topic instance) throws JsonProcessingException {
    TopicESIndex topicESIndex = TopicESIndex.builder(instance).build();
    UpdateRequest updateRequest = new UpdateRequest(ElasticSearchIndexType.TOPIC_SEARCH_INDEX.indexName,
        instance.getId().toString());
    updateRequest.doc(JsonUtils.pojoToJson(topicESIndex), XContentType.JSON);
    updateRequest.docAsUpsert(true);
    return updateRequest;
  }

  private UpdateRequest updateDashboard(Dashboard instance) throws JsonProcessingException {
    DashboardESIndex dashboardESIndex = DashboardESIndex.builder(instance).build();
    UpdateRequest updateRequest = new UpdateRequest(ElasticSearchIndexType.DASHBOARD_SEARCH_INDEX.indexName,
        instance.getId().toString());
    updateRequest.doc(JsonUtils.pojoToJson(dashboardESIndex), XContentType.JSON);
    updateRequest.docAsUpsert(true);
    return updateRequest;
  }

  private UpdateRequest updatePipeline(Pipeline instance) throws JsonProcessingException {
    PipelineESIndex pipelineESIndex = PipelineESIndex.builder(instance).build();
    UpdateRequest updateRequest = new UpdateRequest(ElasticSearchIndexType.PIPELINE_SEARCH_INDEX.indexName,
        instance.getId().toString());
    updateRequest.doc(JsonUtils.pojoToJson(pipelineESIndex), XContentType.JSON);
    updateRequest.docAsUpsert(true);
    return updateRequest;
  }

  private UpdateRequest updateDbtModel(DbtModel instance) throws JsonProcessingException {
    DbtModelESIndex dbtModelESIndex = DbtModelESIndex.builder(instance).build();
    UpdateRequest updateRequest = new UpdateRequest(ElasticSearchIndexType.DBT_MODEL_SEARCH_INDEX.indexName,
        instance.getId().toString());
    updateRequest.doc(JsonUtils.pojoToJson(dbtModelESIndex), XContentType.JSON);
    updateRequest.docAsUpsert(true);
    return updateRequest;
  }


  private String getESIndex(String type) {
    if (type.equalsIgnoreCase("table")) {
      return "table_search_index";
    } else if (type.equalsIgnoreCase("dashboard")) {
      return "dashboard_search_index";
    } else if (type.equalsIgnoreCase("pipeline")) {
      return "pipeline_search_index";
    } else if (type.equalsIgnoreCase("topic")) {
      return "topic_search_index";
    } else if (type.equalsIgnoreCase("dbtmodel")) {
      return "dbt_model_search_index";
    }
    throw new RuntimeException("Failed to find index doc for type {}".format(type));
  }


  public void close() {
    try {
      this.client.close();
    } catch (Exception e) {
      LOG.error("Failed to close elastic search", e);
    }
  }

}
