package org.openmetadata.service.search.indexes;

import java.util.Map;
import org.openmetadata.schema.analytics.ReportData;
import org.openmetadata.service.util.JsonUtils;

public record ReportDataIndexes(ReportData reportData) implements SearchIndex {
  @Override
  public Object getEntity() {
    return reportData;
  }

  @Override
  public Map<String, Object> buildESDocInternal(Map<String, Object> esDoc) {
    Map<String, Object> doc = JsonUtils.getMap(reportData);
    doc.put("id", null);
    doc.put("timestamp", reportData.getTimestamp());
    doc.put("reportDataType", reportData.getReportDataType());
    doc.put("data", reportData.getData());
    return doc;
  }
}
