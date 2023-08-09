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

package org.openmetadata.service.jdbi3;

import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.entity.data.Report;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.reports.ReportResource;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.EntityUtil.Fields;

@Slf4j
public class ReportRepository extends EntityRepository<Report> {
  public ReportRepository(CollectionDAO dao) {
    super(ReportResource.COLLECTION_PATH, Entity.REPORT, Report.class, dao.reportDAO(), dao, "", "");
  }

  @Override
  public Report setFields(Report report, Fields fields) {
    if (report.getService() == null) {
      report.setService(getService(report)); // service is a default field
    }
    if (report.getUsageSummary() == null) {
      report.withUsageSummary(
          fields.contains("usageSummary")
              ? EntityUtil.getLatestUsage(daoCollection.usageDAO(), report.getId())
              : report.getUsageSummary());
    }
    return report;
  }

  @Override
  public Report clearFields(Report report, Fields fields) {
    return report.withUsageSummary(fields.contains("usageSummary") ? report.getUsageSummary() : null);
  }

  @Override
  public void prepare(Report report) {
    // TODO report does not have service yet
  }

  @Override
  public void storeEntity(Report report, boolean update) {
    store(report, update);
  }

  @Override
  public void storeRelationships(Report report) {
    EntityReference service = report.getService();
    addRelationship(service.getId(), report.getId(), service.getType(), Entity.CHART, Relationship.CONTAINS);
  }

  private EntityReference getService(Report report) {
    // TODO What are the report services?
    return null;
  }
}
