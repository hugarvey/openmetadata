package org.openmetadata.service.search.indexes;

import static org.openmetadata.service.search.EntityBuilderConstant.ES_MESSAGE_SCHEMA_FIELD;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import org.openmetadata.schema.entity.data.Topic;
import org.openmetadata.schema.type.Field;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.search.ParseTags;
import org.openmetadata.service.search.models.FlattenSchemaField;
import org.openmetadata.service.search.models.SearchSuggest;
import org.openmetadata.service.util.FullyQualifiedName;

public class TopicIndex implements SearchIndex {
  final Set<String> excludeTopicFields = Set.of("sampleData", "messageSchema");
  final Topic topic;

  public TopicIndex(Topic topic) {
    this.topic = topic;
  }

  @Override
  public List<SearchSuggest> getSuggest() {
    List<SearchSuggest> suggest = new ArrayList<>();
    suggest.add(SearchSuggest.builder().input(topic.getFullyQualifiedName()).weight(5).build());
    suggest.add(SearchSuggest.builder().input(topic.getName()).weight(10).build());
    return suggest;
  }

  @Override
  public Object getEntity() {
    return topic;
  }

  @Override
  public Set<String> getExcludedFields() {
    return excludeTopicFields;
  }

  public Map<String, Object> buildSearchIndexDocInternal(Map<String, Object> doc) {
    List<SearchSuggest> fieldSuggest = new ArrayList<>();
    List<SearchSuggest> serviceSuggest = new ArrayList<>();
    Set<List<TagLabel>> tagsWithChildren = new HashSet<>();
    List<String> fieldsWithChildrenName = new ArrayList<>();
    serviceSuggest.add(
        SearchSuggest.builder().input(topic.getService().getName()).weight(5).build());

    if (topic.getMessageSchema() != null
        && topic.getMessageSchema().getSchemaFields() != null
        && !topic.getMessageSchema().getSchemaFields().isEmpty()) {
      List<FlattenSchemaField> flattenFields = new ArrayList<>();
      parseSchemaFields(topic.getMessageSchema().getSchemaFields(), flattenFields, null);

      for (FlattenSchemaField field : flattenFields) {
        fieldSuggest.add(SearchSuggest.builder().input(field.getName()).weight(5).build());
        fieldsWithChildrenName.add(field.getName());
        if (field.getTags() != null) {
          tagsWithChildren.add(field.getTags());
        }
      }
      doc.put("fieldNames", fieldsWithChildrenName);
    }

    ParseTags parseTags = new ParseTags(Entity.getEntityTags(Entity.TOPIC, topic));
    tagsWithChildren.add(parseTags.getTags());
    List<TagLabel> flattenedTagList =
        tagsWithChildren.stream()
            .flatMap(List::stream)
            .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    Map<String, Object> commonAttributes = getCommonAttributesMap(topic, Entity.TOPIC);
    doc.putAll(commonAttributes);
    doc.put(
        "displayName", topic.getDisplayName() != null ? topic.getDisplayName() : topic.getName());
    doc.put("tags", flattenedTagList);
    doc.put("tier", parseTags.getTierTag());
    doc.put("field_suggest", fieldSuggest);
    doc.put("service_suggest", serviceSuggest);
    doc.put("serviceType", topic.getServiceType());
    doc.put("lineage", SearchIndex.getLineageData(topic.getEntityReference()));
    doc.put("messageSchema", topic.getMessageSchema() != null ? topic.getMessageSchema() : null);
    doc.put("service", getEntityWithDisplayName(topic.getService()));
    return doc;
  }

  private void parseSchemaFields(
      List<Field> fields, List<FlattenSchemaField> flattenSchemaFields, String parentSchemaField) {
    Optional<String> optParentField =
        Optional.ofNullable(parentSchemaField).filter(Predicate.not(String::isEmpty));
    List<TagLabel> tags = new ArrayList<>();
    for (Field field : fields) {
      String fieldName = field.getName();
      if (optParentField.isPresent()) {
        fieldName = FullyQualifiedName.add(optParentField.get(), fieldName);
      }
      if (field.getTags() != null) {
        tags = field.getTags();
      }

      FlattenSchemaField flattenSchemaField =
          FlattenSchemaField.builder().name(fieldName).description(field.getDescription()).build();

      if (!tags.isEmpty()) {
        flattenSchemaField.setTags(tags);
      }
      flattenSchemaFields.add(flattenSchemaField);
      if (field.getChildren() != null) {
        parseSchemaFields(field.getChildren(), flattenSchemaFields, field.getName());
      }
    }
  }

  public static Map<String, Float> getFields() {
    Map<String, Float> fields = SearchIndex.getDefaultFields();
    fields.put(ES_MESSAGE_SCHEMA_FIELD, 7.0f);
    fields.put("messageSchema.schemaFields.name.keyword", 5.0f);
    fields.put("messageSchema.schemaFields.description", 1.0f);
    fields.put("messageSchema.schemaFields.children.name", 7.0f);
    fields.put("messageSchema.schemaFields.children.keyword", 5.0f);
    return fields;
  }
}
