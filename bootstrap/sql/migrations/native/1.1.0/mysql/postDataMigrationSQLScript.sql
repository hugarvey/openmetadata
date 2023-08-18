ALTER TABLE bot_entity ADD UNIQUE (nameHash);
ALTER TABLE chart_entity ADD UNIQUE (fqnHash);
ALTER TABLE classification ADD UNIQUE (nameHash);
ALTER TABLE storage_container_entity ADD UNIQUE (fqnHash);
ALTER TABLE dashboard_data_model_entity ADD UNIQUE (fqnHash);
ALTER TABLE dashboard_entity ADD UNIQUE (fqnHash);
ALTER TABLE dashboard_service_entity ADD UNIQUE (nameHash);
ALTER TABLE data_insight_chart ADD UNIQUE (fqnHash);
ALTER TABLE database_entity ADD UNIQUE (fqnHash);
ALTER TABLE database_schema_entity ADD UNIQUE (fqnHash);
ALTER TABLE dbservice_entity ADD UNIQUE (nameHash);
ALTER TABLE event_subscription_entity ADD UNIQUE (nameHash);
ALTER TABLE glossary_entity ADD UNIQUE (nameHash);
ALTER TABLE glossary_term_entity ADD UNIQUE (fqnHash);
ALTER TABLE ingestion_pipeline_entity ADD UNIQUE (fqnHash);
ALTER TABLE kpi_entity ADD UNIQUE (nameHash);
ALTER TABLE messaging_service_entity ADD UNIQUE (nameHash);
ALTER TABLE metadata_service_entity ADD UNIQUE (nameHash);
ALTER TABLE metric_entity ADD UNIQUE (fqnHash);
ALTER TABLE ml_model_entity ADD UNIQUE (fqnHash);
ALTER TABLE mlmodel_service_entity ADD UNIQUE (nameHash);
ALTER TABLE pipeline_entity ADD UNIQUE (fqnHash);
ALTER TABLE pipeline_service_entity ADD UNIQUE (nameHash);
ALTER TABLE policy_entity ADD UNIQUE (fqnHash);
ALTER TABLE query_entity ADD UNIQUE (nameHash);
ALTER TABLE report_entity ADD UNIQUE (fqnHash);
ALTER TABLE role_entity ADD UNIQUE (nameHash);
ALTER TABLE storage_service_entity ADD UNIQUE (nameHash);
ALTER TABLE table_entity ADD UNIQUE (fqnHash);
ALTER TABLE tag ADD UNIQUE (fqnHash);
ALTER TABLE team_entity ADD UNIQUE (nameHash);
ALTER TABLE test_case ADD UNIQUE (fqnHash);
ALTER TABLE test_connection_definition ADD UNIQUE (nameHash);
ALTER TABLE test_definition ADD UNIQUE (nameHash);
ALTER TABLE test_suite ADD UNIQUE (nameHash);
ALTER TABLE topic_entity ADD UNIQUE (fqnHash);
ALTER TABLE type_entity ADD UNIQUE (nameHash);
ALTER TABLE user_entity ADD UNIQUE (nameHash);
ALTER TABLE web_analytic_event ADD UNIQUE (fqnHash);
ALTER TABLE automations_workflow ADD UNIQUE (nameHash);
ALTER TABLE entity_extension_time_series DROP COLUMN entityFQN;
ALTER TABLE field_relationship DROP KEY `PRIMARY`,ADD CONSTRAINT  `field_relationship_primary` PRIMARY KEY(fromFQNHash, toFQNHash, relation), MODIFY fromFQN VARCHAR(2096) NOT NULL, MODIFY toFQN VARCHAR(2096) NOT NULL;
ALTER TABLE tag_usage DROP index `source`, DROP COLUMN targetFQN, ADD UNIQUE KEY `tag_usage_key` (source, tagFQNHash, targetFQNHash);