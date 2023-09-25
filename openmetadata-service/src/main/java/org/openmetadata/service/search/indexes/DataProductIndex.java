package org.openmetadata.service.search.indexes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.entity.domains.DataProduct;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.service.Entity;
import org.openmetadata.service.search.SearchIndexUtils;
import org.openmetadata.service.search.models.SearchSuggest;
import org.openmetadata.service.util.JsonUtils;

public class DataProductIndex implements ElasticSearchIndex {

  private static final List<String> excludeFields = List.of("changeDescription");

  final DataProduct dataProduct;

  public DataProductIndex(DataProduct dataProduct) {
    this.dataProduct = dataProduct;
  }

  public Map<String, Object> buildESDoc() {
    Map<String, Object> doc = JsonUtils.getMap(dataProduct);
    SearchIndexUtils.removeNonIndexableFields(doc, excludeFields);
    List<SearchSuggest> suggest = new ArrayList<>();
    suggest.add(SearchSuggest.builder().input(dataProduct.getName()).weight(5).build());
    suggest.add(SearchSuggest.builder().input(dataProduct.getFullyQualifiedName()).weight(5).build());
    doc.put(
        "fqnParts",
        getFQNParts(
            dataProduct.getFullyQualifiedName(),
            suggest.stream().map(SearchSuggest::getInput).collect(Collectors.toList())));
    doc.put("entityType", Entity.DATA_PRODUCT);
    if (dataProduct.getOwner() != null) {
      EntityReference owner = dataProduct.getOwner();
      owner.setDisplayName(CommonUtil.nullOrEmpty(owner.getDisplayName()) ? owner.getName() : owner.getDisplayName());
      doc.put("owner", owner);
    }
    if (dataProduct.getDomain() != null) {
      EntityReference domain = dataProduct.getDomain();
      domain.setDisplayName(
          CommonUtil.nullOrEmpty(domain.getDisplayName()) ? domain.getName() : domain.getDisplayName());
      doc.put("domain", domain);
    }
    return doc;
  }
}
