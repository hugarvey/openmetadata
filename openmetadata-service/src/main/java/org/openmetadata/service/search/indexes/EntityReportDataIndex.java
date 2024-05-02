package org.openmetadata.service.search.indexes;

import java.util.Map;
import org.openmetadata.schema.analytics.ReportData;
import org.openmetadata.service.util.JsonUtils;

public record EntityReportDataIndex(ReportData reportData) implements SearchIndex {

  @Override
  public Object getEntity() {
    return reportData;
  }

  @Override
  public Map<String, Object> buildESDocInternal(Map<String, Object> esDoc) {
    Map<String, Object> doc = JsonUtils.getMap(reportData);
    doc.put("entityType", "entityReportData");
    return doc;
  }
}
