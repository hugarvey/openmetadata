package org.openmetadata.catalog.elasticsearch;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.entity.data.Dashboard;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.util.JsonUtils;

public class DashboardIndex implements ElasticSearchIndex {
  Dashboard dashboard;
  final List<String> excludeFields = List.of("changeDescription");

  public DashboardIndex(Dashboard dashboard) {
    this.dashboard = dashboard;
  }

  public Map<String, Object> buildESDoc() {
    Map<String, Object> doc = JsonUtils.getMap(dashboard);
    ElasticSearchIndexUtils.removeNonIndexableFields(doc, excludeFields);
    List<ElasticSearchSuggest> suggest = new ArrayList<>();
    List<ElasticSearchSuggest> serviceSuggest = new ArrayList<>();
    List<ElasticSearchSuggest> chartSuggest = new ArrayList<>();
    suggest.add(ElasticSearchSuggest.builder().input(dashboard.getFullyQualifiedName()).weight(5).build());
    suggest.add(ElasticSearchSuggest.builder().input(dashboard.getName()).weight(10).build());
    serviceSuggest.add(ElasticSearchSuggest.builder().input(dashboard.getService().getName()).weight(5).build());
    ParseTags parseTags = new ParseTags(ElasticSearchIndexUtils.parseTags(dashboard.getTags()));
    if (dashboard.getCharts() != null) {
      for (EntityReference chart : dashboard.getCharts()) {
        chartSuggest.add(ElasticSearchSuggest.builder().input(chart.getDisplayName()).weight(5).build());
      }
    }
    doc.put("name", dashboard.getDisplayName());
    doc.put("tags", parseTags.tags);
    doc.put("followers", ElasticSearchIndexUtils.parseFollowers(dashboard.getFollowers()));
    doc.put("tier", parseTags.tierTag);
    doc.put("suggest", suggest);
    doc.put("chart_suggest", chartSuggest);
    doc.put("service_suggest", serviceSuggest);
    doc.put("entityType", Entity.DASHBOARD);
    if (dashboard.getService() != null) {
      doc.put("serviceType", dashboard.getService().getType());
    }
    return doc;
  }
}
