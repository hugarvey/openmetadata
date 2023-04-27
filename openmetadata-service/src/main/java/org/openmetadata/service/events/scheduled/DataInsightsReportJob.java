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

package org.openmetadata.service.events.scheduled;

import static org.openmetadata.schema.dataInsight.DataInsightChartResult.DataInsightChartType.PERCENTAGE_OF_ENTITIES_WITH_DESCRIPTION_BY_TYPE;
import static org.openmetadata.schema.dataInsight.DataInsightChartResult.DataInsightChartType.PERCENTAGE_OF_ENTITIES_WITH_OWNER_BY_TYPE;
import static org.openmetadata.schema.dataInsight.DataInsightChartResult.DataInsightChartType.TOTAL_ENTITIES_BY_TIER;
import static org.openmetadata.schema.dataInsight.DataInsightChartResult.DataInsightChartType.TOTAL_ENTITIES_BY_TYPE;
import static org.openmetadata.service.Entity.EVENT_SUBSCRIPTION;
import static org.openmetadata.service.Entity.KPI;
import static org.openmetadata.service.Entity.TEAM;
import static org.openmetadata.service.elasticsearch.ElasticSearchIndexDefinition.ElasticSearchIndexType.ENTITY_REPORT_DATA_INDEX;
import static org.openmetadata.service.events.scheduled.ReportsHandler.ES_REST_CLIENT;
import static org.openmetadata.service.events.scheduled.ReportsHandler.JOB_CONTEXT_CHART_REPO;
import static org.openmetadata.service.util.SubscriptionUtil.getAdminsData;

import com.fasterxml.jackson.core.type.TypeReference;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.DataInsightInterface;
import org.openmetadata.schema.api.events.CreateEventSubscription;
import org.openmetadata.schema.dataInsight.DataInsightChartResult;
import org.openmetadata.schema.dataInsight.kpi.Kpi;
import org.openmetadata.schema.dataInsight.type.KpiResult;
import org.openmetadata.schema.dataInsight.type.PercentageOfEntitiesWithDescriptionByType;
import org.openmetadata.schema.dataInsight.type.PercentageOfEntitiesWithOwnerByType;
import org.openmetadata.schema.dataInsight.type.TotalEntitiesByTier;
import org.openmetadata.schema.dataInsight.type.TotalEntitiesByType;
import org.openmetadata.schema.entity.events.EventSubscription;
import org.openmetadata.schema.entity.teams.Team;
import org.openmetadata.schema.type.Include;
import org.openmetadata.service.Entity;
import org.openmetadata.service.events.scheduled.template.DataInsightDescriptionAndOwnerTemplate;
import org.openmetadata.service.events.scheduled.template.DataInsightTotalAssetTemplate;
import org.openmetadata.service.jdbi3.DataInsightChartRepository;
import org.openmetadata.service.jdbi3.KpiRepository;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.jdbi3.TeamRepository;
import org.openmetadata.service.util.EmailUtil;
import org.openmetadata.service.util.JsonUtils;
import org.quartz.Job;
import org.quartz.JobExecutionContext;

@Slf4j
public class DataInsightsReportJob implements Job {
  private static final String KPI_NOT_SET = "No Kpi Set";

  @Override
  public void execute(JobExecutionContext jobExecutionContext) {
    DataInsightChartRepository repository =
        (DataInsightChartRepository) jobExecutionContext.getJobDetail().getJobDataMap().get(JOB_CONTEXT_CHART_REPO);
    RestHighLevelClient client =
        (RestHighLevelClient) jobExecutionContext.getJobDetail().getJobDataMap().get(ES_REST_CLIENT);
    EventSubscription dataReport =
        (EventSubscription) jobExecutionContext.getJobDetail().getJobDataMap().get(EVENT_SUBSCRIPTION);
    Date nextFireTime = jobExecutionContext.getTrigger().getNextFireTime();
    // Long currentTime = Instant.now().toEpochMilli();
    // Long timeDifference = nextFireTime.getTime() - currentTime;
    // Long scheduleTime = currentTime - timeDifference;
    Long scheduleTime = 1682170583702L;
    Long currentTime = 1682429783703L;

    try {
      sendReportsToTeams(repository, client, scheduleTime, currentTime);
      sendToAdmins(repository, client, scheduleTime, currentTime);
    } catch (Exception e) {
      LOG.error("[DIReport] Failed in sending report due to", e);
      throw new RuntimeException(e);
    }
  }

  private void sendReportsToTeams(
      DataInsightChartRepository repository, RestHighLevelClient client, Long scheduleTime, Long currentTime)
      throws IOException, ParseException, TemplateException {
    TeamRepository teamRepository = (TeamRepository) Entity.getEntityRepository(TEAM);
    List<Team> teamsList =
        teamRepository.listAll(teamRepository.getFields("name,email"), new ListFilter(Include.NON_DELETED));
    for (Team team : teamsList) {
      String email = team.getEmail();
      if (!CommonUtil.nullOrEmpty(email)) {
        try {
          DataInsightTotalAssetTemplate totalAssetTemplate =
              createTotalAssetTemplate(repository, client, team.getName(), scheduleTime, currentTime);
          DataInsightDescriptionAndOwnerTemplate descriptionTemplate =
              createDescriptionTemplate(repository, client, team.getName(), scheduleTime, currentTime);
          DataInsightDescriptionAndOwnerTemplate ownershipTemplate =
              createOwnershipTemplate(repository, client, team.getName(), scheduleTime, currentTime);
          DataInsightDescriptionAndOwnerTemplate tierTemplate =
              createTierTemplate(repository, client, team.getName(), scheduleTime, currentTime);
          EmailUtil.getInstance()
              .sendDataInsightEmailNotificationToUser(
                  email,
                  totalAssetTemplate,
                  descriptionTemplate,
                  ownershipTemplate,
                  tierTemplate,
                  EmailUtil.getInstance().getDataInsightReportSubject(),
                  EmailUtil.DATA_INSIGHT_REPORT_TEMPLATE);
        } catch (Exception ex) {
          LOG.error("[DataInsightReport] Failed for Team: {}, Reason : {}", team.getName(), ex.getMessage());
        }
      }
    }
  }

  private void sendToAdmins(
      DataInsightChartRepository repository, RestHighLevelClient client, Long scheduleTime, Long currentTime)
      throws ParseException, IOException, TemplateException {
    // Get Admins
    Set<String> emailList = getAdminsData(CreateEventSubscription.SubscriptionType.DATA_INSIGHT);

    // Build Insights Report
    DataInsightTotalAssetTemplate totalAssetTemplate =
        createTotalAssetTemplate(repository, client, null, scheduleTime, currentTime);
    DataInsightDescriptionAndOwnerTemplate descriptionTemplate =
        createDescriptionTemplate(repository, client, null, scheduleTime, currentTime);
    DataInsightDescriptionAndOwnerTemplate ownershipTemplate =
        createOwnershipTemplate(repository, client, null, scheduleTime, currentTime);
    DataInsightDescriptionAndOwnerTemplate tierTemplate =
        createTierTemplate(repository, client, null, scheduleTime, currentTime);
    for (String recv : emailList) {
      EmailUtil.getInstance()
          .sendDataInsightEmailNotificationToUser(
              recv,
              totalAssetTemplate,
              descriptionTemplate,
              ownershipTemplate,
              tierTemplate,
              EmailUtil.getInstance().getDataInsightReportSubject(),
              EmailUtil.DATA_INSIGHT_REPORT_TEMPLATE);
    }
  }

  private List<Kpi> getAvailableKpi() throws IOException {
    KpiRepository repository = (KpiRepository) Entity.getEntityRepository(KPI);
    return repository.listAll(repository.getFields("dataInsightChart"), new ListFilter(Include.NON_DELETED));
  }

  private KpiResult getKpiResult(String fqn) throws IOException {
    KpiRepository repository = (KpiRepository) Entity.getEntityRepository(KPI);
    return repository.getKpiResult(fqn);
  }

  private DataInsightTotalAssetTemplate createTotalAssetTemplate(
      DataInsightChartRepository repository,
      RestHighLevelClient client,
      String team,
      Long scheduleTime,
      Long currentTime)
      throws ParseException, IOException {
    // Get total Assets Data
    TreeMap<Long, List<Object>> dateWithDataMap =
        getSortedDate(
            repository,
            client,
            team,
            scheduleTime,
            currentTime,
            TOTAL_ENTITIES_BY_TYPE,
            ENTITY_REPORT_DATA_INDEX.indexName);
    List<TotalEntitiesByType> first =
        JsonUtils.convertValue(dateWithDataMap.firstEntry().getValue(), new TypeReference<>() {});
    List<TotalEntitiesByType> last =
        JsonUtils.convertValue(dateWithDataMap.lastEntry().getValue(), new TypeReference<>() {});

    if (first != null && last != null) {
      Double previousCount = getCountOfEntitiesFromList(first);
      Double currentCount = getCountOfEntitiesFromList(last);

      return new DataInsightTotalAssetTemplate(currentCount, ((currentCount - previousCount) / previousCount) * 100);
    }

    throw new IOException("Failed to get Total Asset Template Data.");
  }

  private DataInsightDescriptionAndOwnerTemplate createDescriptionTemplate(
      DataInsightChartRepository repository,
      RestHighLevelClient client,
      String team,
      Long scheduleTime,
      Long currentTime)
      throws ParseException, IOException {
    // Get total Assets Data
    // This assumes that on a particular date the correct count per entities are given
    TreeMap<Long, List<Object>> dateWithDataMap =
        getSortedDate(
            repository,
            client,
            team,
            scheduleTime,
            currentTime,
            PERCENTAGE_OF_ENTITIES_WITH_DESCRIPTION_BY_TYPE,
            ENTITY_REPORT_DATA_INDEX.indexName);
    List<PercentageOfEntitiesWithDescriptionByType> first =
        JsonUtils.convertValue(dateWithDataMap.firstEntry().getValue(), new TypeReference<>() {});
    List<PercentageOfEntitiesWithDescriptionByType> last =
        JsonUtils.convertValue(dateWithDataMap.lastEntry().getValue(), new TypeReference<>() {});
    if (first != null && last != null) {
      Double previousCompletedDescription = 0D, previousTotalCount = 0D;
      Double currentCompletedDescription = 0D, currentTotalCount = 0D;

      // Populate Count
      populateCompletedDescriptionPercent(previousCompletedDescription, previousTotalCount, first);
      populateCompletedDescriptionPercent(currentCompletedDescription, currentTotalCount, last);

      // Calculate Percent Change
      double previousDiff = previousTotalCount - previousCompletedDescription;
      double currentDiff = currentTotalCount - currentCompletedDescription;

      // Change
      double percentChange = 0D;
      if (previousDiff != 0) {
        percentChange = ((currentDiff - previousDiff) / previousDiff) * 100;
      }
      // Completion
      double percentCompleted = 0;
      if (currentTotalCount != 0) {
        percentCompleted = (currentCompletedDescription / currentTotalCount) * 100;
      }

      return getTemplate(
          DataInsightDescriptionAndOwnerTemplate.MetricType.DESCRIPTION,
          PERCENTAGE_OF_ENTITIES_WITH_DESCRIPTION_BY_TYPE,
          percentCompleted,
          percentChange);
    }

    throw new IOException("Failed to get Description Template Data.");
  }

  private DataInsightDescriptionAndOwnerTemplate createOwnershipTemplate(
      DataInsightChartRepository repository,
      RestHighLevelClient client,
      String team,
      Long scheduleTime,
      Long currentTime)
      throws ParseException, IOException {
    // Get total Assets Data
    // This assumes that on a particular date the correct count per entities are given
    TreeMap<Long, List<Object>> dateWithDataMap =
        getSortedDate(
            repository,
            client,
            team,
            scheduleTime,
            currentTime,
            PERCENTAGE_OF_ENTITIES_WITH_OWNER_BY_TYPE,
            ENTITY_REPORT_DATA_INDEX.indexName);
    List<PercentageOfEntitiesWithOwnerByType> first =
        JsonUtils.convertValue(dateWithDataMap.firstEntry().getValue(), new TypeReference<>() {});
    List<PercentageOfEntitiesWithOwnerByType> last =
        JsonUtils.convertValue(dateWithDataMap.lastEntry().getValue(), new TypeReference<>() {});

    if (first != null && last != null) {
      Double previousHasOwner = 0D, previousTotalCount = 0D;
      Double currentHasOwner = 0D, currentTotalCount = 0D;

      // Populate data
      populateCompletedOwnershipPercent(previousHasOwner, previousTotalCount, first);
      populateCompletedOwnershipPercent(currentHasOwner, currentTotalCount, last);

      // Calculate Change
      double previousDiff = previousTotalCount - previousHasOwner;
      double currentDiff = currentTotalCount - currentHasOwner;

      // Change
      double percentChange = 0D;
      if (previousDiff != 0) {
        percentChange = ((currentDiff - previousDiff) / previousDiff) * 100;
      }

      // Completion
      double percentCompleted = 0;
      if (currentTotalCount != 0) {
        percentCompleted = (currentHasOwner / currentTotalCount) * 100;
      }

      return getTemplate(
          DataInsightDescriptionAndOwnerTemplate.MetricType.OWNER,
          PERCENTAGE_OF_ENTITIES_WITH_OWNER_BY_TYPE,
          percentCompleted,
          percentChange);
    }

    throw new IOException("Failed to get OwnerShip Template Data.");
  }

  private DataInsightDescriptionAndOwnerTemplate createTierTemplate(
      DataInsightChartRepository repository,
      RestHighLevelClient client,
      String team,
      Long scheduleTime,
      Long currentTime)
      throws ParseException, IOException {
    // Get total Assets Data
    // This assumes that on a particular date the correct count per entities are given
    TreeMap<Long, List<Object>> dateWithDataMap =
        getSortedDate(
            repository,
            client,
            team,
            scheduleTime,
            currentTime,
            TOTAL_ENTITIES_BY_TIER,
            ENTITY_REPORT_DATA_INDEX.indexName);
    List<TotalEntitiesByTier> last =
        JsonUtils.convertValue(dateWithDataMap.lastEntry().getValue(), new TypeReference<>() {});

    if (last != null) {
      Map<String, Double> tierData = getTierData(last);
      return new DataInsightDescriptionAndOwnerTemplate(
          DataInsightDescriptionAndOwnerTemplate.MetricType.TIER, null, 10D, KPI_NOT_SET, 10D, false, "", tierData);
    }

    throw new IOException("Failed to get Tier Template Data.");
  }

  private Double getCountOfEntitiesFromList(List<TotalEntitiesByType> entitiesByTypeList) {
    // If there are multiple entries for same entities then this can yield invalid results
    Double totalCount = 0D;
    for (TotalEntitiesByType obj : entitiesByTypeList) {
      totalCount += obj.getEntityCount();
    }
    return totalCount;
  }

  private Map<String, Double> getTierData(List<TotalEntitiesByTier> entitiesByTypeList) {
    // If there are multiple entries for same entities then this can yield invalid results
    Map<String, Double> data = new HashMap<>();
    for (TotalEntitiesByTier obj : entitiesByTypeList) {
      data.put(obj.getEntityTier(), obj.getEntityCountFraction() * 100);
    }
    return data;
  }

  private void populateCompletedDescriptionPercent(
      Double entityCount,
      Double completedDescriptions,
      List<PercentageOfEntitiesWithDescriptionByType> entitiesByTypeList) {
    // If there are multiple entries for same entities then this can yield invalid results
    for (PercentageOfEntitiesWithDescriptionByType obj : entitiesByTypeList) {
      entityCount += obj.getEntityCount();
      completedDescriptions += obj.getCompletedDescription();
    }
  }

  private void populateCompletedOwnershipPercent(
      Double entityCount, Double hasOwner, List<PercentageOfEntitiesWithOwnerByType> entitiesByTypeList) {
    // If there are multiple entries for same entities then this can yield invalid results
    for (PercentageOfEntitiesWithOwnerByType obj : entitiesByTypeList) {
      entityCount += obj.getEntityCount();
      hasOwner += obj.getHasOwner();
    }
  }

  private DataInsightDescriptionAndOwnerTemplate getTemplate(
      DataInsightDescriptionAndOwnerTemplate.MetricType metricType,
      DataInsightChartResult.DataInsightChartType chartType,
      Double percentCompleted,
      Double percentChange)
      throws IOException {

    List<Kpi> kpiList = getAvailableKpi();
    Kpi validKpi = null;
    boolean isKpiAvailable = false;
    for (Kpi kpiObj : kpiList) {
      if (Objects.equals(kpiObj.getDataInsightChart().getName(), chartType.value())) {
        validKpi = kpiObj;
        isKpiAvailable = true;
        break;
      }
    }

    DataInsightDescriptionAndOwnerTemplate.KpiCriteria criteria = null;
    boolean isTargetMet;
    String totalDaysLeft = "";
    String targetKpi = KPI_NOT_SET;

    if (isKpiAvailable) {
      targetKpi = String.valueOf(Double.parseDouble(validKpi.getTargetDefinition().get(0).getValue()) * 100);
      KpiResult result = getKpiResult(validKpi.getName());
      if (result != null) {
        isTargetMet = result.getTargetResult().get(0).getTargetMet();
        criteria = DataInsightDescriptionAndOwnerTemplate.KpiCriteria.IN_PROGRESS;
        if (isTargetMet) {
          criteria = DataInsightDescriptionAndOwnerTemplate.KpiCriteria.MET;
        } else {
          long leftDaysInMilli = validKpi.getEndDate() - System.currentTimeMillis();
          if (leftDaysInMilli >= 0) {
            totalDaysLeft = String.valueOf((int) (leftDaysInMilli / (24 * 60 * 60 * 1000)));
          } else {
            criteria = DataInsightDescriptionAndOwnerTemplate.KpiCriteria.NOT_MET;
          }
        }
      }
    }

    return new DataInsightDescriptionAndOwnerTemplate(
        metricType, criteria, percentCompleted, targetKpi, percentChange, isKpiAvailable, totalDaysLeft, null);
  }

  private TreeMap<Long, List<Object>> getSortedDate(
      DataInsightChartRepository repository,
      RestHighLevelClient client,
      String team,
      Long scheduleTime,
      Long currentTime,
      DataInsightChartResult.DataInsightChartType chartType,
      String indexName)
      throws IOException, ParseException {
    SearchRequest searchRequestTotalAssets =
        repository.buildSearchRequest(scheduleTime, currentTime, null, team, chartType, indexName);
    SearchResponse searchResponseTotalAssets = client.search(searchRequestTotalAssets, RequestOptions.DEFAULT);
    DataInsightChartResult processedDataTotalAssets =
        repository.processDataInsightChartResult(searchResponseTotalAssets, chartType);
    TreeMap<Long, List<Object>> dateWithDataMap = new TreeMap<>();
    for (Object data : processedDataTotalAssets.getData()) {
      DataInsightInterface convertedData = (DataInsightInterface) data;
      Long timestamp = convertedData.getTimestamp();
      List<Object> totalEntitiesByTypeList = new ArrayList<>();
      if (dateWithDataMap.containsKey(timestamp)) {
        totalEntitiesByTypeList = dateWithDataMap.get(timestamp);
      }
      totalEntitiesByTypeList.add(convertedData);
      dateWithDataMap.put(timestamp, totalEntitiesByTypeList);
    }
    return dateWithDataMap;
  }
}
