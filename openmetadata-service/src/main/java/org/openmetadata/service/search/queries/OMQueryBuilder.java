package org.openmetadata.service.search.queries;

import org.openmetadata.schema.entity.teams.User;

import java.util.List;

public interface OMQueryBuilder {
  OMQueryBuilder must(OMQueryBuilder query);
  OMQueryBuilder should(OMQueryBuilder query);
  OMQueryBuilder mustNot(OMQueryBuilder query);
  OMQueryBuilder termQuery(String field, String value);
  OMQueryBuilder existsQuery(String field);
  OMQueryBuilder minimumShouldMatch(int count);
  Object build();  // Returns the native query object for execution
  OMQueryBuilder boolQuery();
}