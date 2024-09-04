package org.openmetadata.service.jdbi3;

import static org.openmetadata.service.Entity.DATA_INSIGHT_CHART;
import static org.openmetadata.service.Entity.DATA_INSIGHT_CUSTOM_CHART;
import static org.openmetadata.service.Entity.KPI;
import static org.openmetadata.service.Entity.getEntity;
import static org.openmetadata.service.Entity.getEntityByName;
import static org.quartz.DateBuilder.MILLISECONDS_IN_DAY;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.jdbi.v3.sqlobject.transaction.Transaction;
import org.openmetadata.schema.dataInsight.custom.DataInsightCustomChart;
import org.openmetadata.schema.dataInsight.custom.DataInsightCustomChartResult;
import org.openmetadata.schema.dataInsight.custom.DataInsightCustomChartResultList;
import org.openmetadata.schema.dataInsight.kpi.Kpi;
import org.openmetadata.schema.dataInsight.type.KpiResult;
import org.openmetadata.schema.dataInsight.type.KpiTarget;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.EntityTimeSeriesDAO.OrderBy;
import org.openmetadata.service.resources.kpi.KpiResource;
import org.openmetadata.service.util.EntityUtil;

public class KpiRepository extends EntityRepository<Kpi> {
  private static final String KPI_RESULT_FIELD = "kpiResult";
  public static final String COLLECTION_PATH = "/v1/kpi";
  private static final String UPDATE_FIELDS =
      "targetValue,dataInsightChart,startDate,endDate,metricType";
  private static final String PATCH_FIELDS =
      "targetValue,dataInsightChart,description,startDate,endDate,metricType";

  public KpiRepository() {
    super(
        KpiResource.COLLECTION_PATH,
        KPI,
        Kpi.class,
        Entity.getCollectionDAO().kpiDAO(),
        PATCH_FIELDS,
        UPDATE_FIELDS);
  }

  @Override
  public void setFields(Kpi kpi, EntityUtil.Fields fields) {
    kpi.setDataInsightChart(
        fields.contains("dataInsightChart") ? getDataInsightChart(kpi) : kpi.getDataInsightChart());
    kpi.withKpiResult(
        fields.contains(KPI_RESULT_FIELD)
            ? getKpiResult(kpi.getFullyQualifiedName())
            : kpi.getKpiResult());
  }

  @Override
  public void clearFields(Kpi kpi, EntityUtil.Fields fields) {
    kpi.setDataInsightChart(fields.contains("dataInsightChart") ? kpi.getDataInsightChart() : null);
    kpi.withKpiResult(fields.contains(KPI_RESULT_FIELD) ? kpi.getKpiResult() : null);
  }

  @Override
  public void prepare(Kpi kpi, boolean update) {
    // validate targetDefinition
    DataInsightCustomChart chart =
        Entity.getEntity(kpi.getDataInsightChart(), null, Include.NON_DELETED);
    kpi.setDataInsightChart(chart.getEntityReference());
  }

  @Override
  public void storeEntity(Kpi kpi, boolean update) {
    EntityReference dataInsightChart = kpi.getDataInsightChart();
    KpiResult kpiResults = kpi.getKpiResult();
    kpi.withDataInsightChart(null).withKpiResult(null);
    store(kpi, update);
    kpi.withDataInsightChart(dataInsightChart).withKpiResult(kpiResults);
  }

  @Override
  public void storeRelationships(Kpi kpi) {
    // Add relationship from Kpi to dataInsightChart
    addRelationship(
        kpi.getId(),
        kpi.getDataInsightChart().getId(),
        KPI,
        DATA_INSIGHT_CUSTOM_CHART,
        Relationship.USES);
  }

  private EntityReference getDataInsightChart(Kpi kpi) {
    return getToEntityRef(kpi.getId(), Relationship.USES, DATA_INSIGHT_CUSTOM_CHART, true);
  }

  public KpiResult getKpiResult(String fqn) {

    long end = System.currentTimeMillis();
    long start = end - MILLISECONDS_IN_DAY;

    Kpi kpi = getEntityByName(KPI, fqn, UPDATE_FIELDS, null);
    DataInsightCustomChart dataInsightCustomChart =
        getEntity(kpi.getDataInsightChart(), null, Include.NON_DELETED);
    DataInsightCustomChartResultList resultList;
    try {
      resultList =
          searchRepository.getSearchClient().buildDIChart(dataInsightCustomChart, start, end);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
    if (resultList != null && !resultList.getResults().isEmpty()) {
      DataInsightCustomChartResult result = resultList.getResults().get(0);
      KpiTarget target =
          new KpiTarget()
              .withValue(result.getCount().toString())
              .withTargetMet(result.getCount() >= kpi.getTargetValue());
      List<KpiTarget> targetList = new ArrayList<>();
      targetList.add(target);
      return new KpiResult()
          .withKpiFqn(kpi.getFullyQualifiedName())
          .withTimestamp(end)
          .withTargetResult(targetList);
    }
    return null;
  }

  public DataInsightCustomChartResultList getKpiResults(
      String fqn, Long startTs, Long endTs, OrderBy orderBy) throws IOException {
    Kpi kpi = getEntityByName(KPI, fqn, UPDATE_FIELDS, null);
    DataInsightCustomChart dataInsightCustomChart =
        getEntity(kpi.getDataInsightChart(), null, Include.NON_DELETED);
    return searchRepository.getSearchClient().buildDIChart(dataInsightCustomChart, startTs, endTs);
  }

  @Override
  public EntityUpdater getUpdater(Kpi original, Kpi updated, Operation operation) {
    return new KpiUpdater(original, updated, operation);
  }

  public class KpiUpdater extends EntityUpdater {
    public KpiUpdater(Kpi original, Kpi updated, Operation operation) {
      super(original, updated, operation);
    }

    @Transaction
    @Override
    public void entitySpecificUpdate() {
      updateToRelationship(
          "dataInsightChart",
          KPI,
          original.getId(),
          Relationship.USES,
          DATA_INSIGHT_CHART,
          original.getDataInsightChart(),
          updated.getDataInsightChart(),
          false);
      recordChange("targetValue", original.getTargetValue(), updated.getTargetValue(), true);
      recordChange("startDate", original.getStartDate(), updated.getStartDate());
      recordChange("endDate", original.getEndDate(), updated.getEndDate());
      recordChange("metricType", original.getMetricType(), updated.getMetricType());
    }
  }
}
