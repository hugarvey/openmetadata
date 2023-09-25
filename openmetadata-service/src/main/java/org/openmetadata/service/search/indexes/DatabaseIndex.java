package org.openmetadata.service.search.indexes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.entity.data.Database;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.service.Entity;
import org.openmetadata.service.search.SearchIndexUtils;
import org.openmetadata.service.search.models.SearchSuggest;
import org.openmetadata.service.util.JsonUtils;

public class DatabaseIndex implements ElasticSearchIndex {

  final Database database;

  private static final List<String> excludeFields = List.of("changeDescription");

  public DatabaseIndex(Database database) {
    this.database = database;
  }

  public Map<String, Object> buildESDoc() {
    Map<String, Object> doc = JsonUtils.getMap(database);
    SearchIndexUtils.removeNonIndexableFields(doc, excludeFields);
    List<SearchSuggest> suggest = new ArrayList<>();
    suggest.add(SearchSuggest.builder().input(database.getName()).weight(5).build());
    suggest.add(SearchSuggest.builder().input(database.getFullyQualifiedName()).weight(5).build());
    doc.put(
        "fqnParts",
        getFQNParts(
            database.getFullyQualifiedName(),
            suggest.stream().map(SearchSuggest::getInput).collect(Collectors.toList())));
    doc.put("suggest", suggest);
    doc.put("entityType", Entity.DATABASE);
    if (database.getOwner() != null) {
      EntityReference owner = database.getOwner();
      owner.setDisplayName(CommonUtil.nullOrEmpty(owner.getDisplayName()) ? owner.getName() : owner.getDisplayName());
      doc.put("owner", owner);
    }
    if (database.getDomain() != null) {
      EntityReference domain = database.getDomain();
      domain.setDisplayName(
          CommonUtil.nullOrEmpty(domain.getDisplayName()) ? domain.getName() : domain.getDisplayName());
      doc.put("domain", domain);
    }
    return doc;
  }
}
