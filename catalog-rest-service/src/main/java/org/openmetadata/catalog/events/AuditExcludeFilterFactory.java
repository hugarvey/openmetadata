package org.openmetadata.catalog.events;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;
import com.fasterxml.jackson.annotation.JsonTypeName;
import io.dropwizard.logging.filter.FilterFactory;
import org.slf4j.Marker;

@JsonTypeName("audit-exclude-filter-factory")
public class AuditExcludeFilterFactory implements FilterFactory<ILoggingEvent> {
  private static Filter<ILoggingEvent> auditFilter =
      new Filter<ILoggingEvent>() {
        @Override
        public FilterReply decide(final ILoggingEvent event) {
          Marker marker = event.getMarker();
          if (marker != null && "AUDIT".equals(marker.getName())) {
            return FilterReply.DENY;
          }
          return FilterReply.NEUTRAL;
        }
      };

  @Override
  public Filter<ILoggingEvent> build() {
    return auditFilter;
  }
}
