ALTER TABLE tag_category
RENAME TO classification;

-- Rename tagCategoryName in BigQuery for classificationName
UPDATE dbservice_entity
SET json = jsonb_set(json, '{connection,config,classificationName}', json#>'{connection,config,tagCategoryName}')
where serviceType in ('BigQuery')
  and json#>'{connection,config,tagCategoryName}' is not null;

-- Deprecate SampleData db service type
DELETE FROM entity_relationship er
USING dbservice_entity db
WHERE (db.id = er.fromId OR db.id = er.toId)
  AND db.serviceType = 'SampleData';

DELETE FROM dbservice_entity WHERE serviceType = 'SampleData';

-- Delete supportsUsageExtraction from vertica
UPDATE dbservice_entity
SET json = json::jsonb #- '{connection,config,supportsUsageExtraction}'
WHERE serviceType = 'Vertica';

UPDATE ingestion_pipeline_entity
SET json = json::jsonb #- '{sourceConfig,config,dbtConfigSource,dbtUpdateDescriptions}'
WHERE json#>>'{sourceConfig,config,type}' = 'DBT';

UPDATE test_definition
SET json = jsonb_set(
  json,
  '{supportedDataTypes}',
  '["NUMBER", "INT", "FLOAT", "DOUBLE", "DECIMAL", "TINYINT", "SMALLINT", "BIGINT", "BYTEINT", "TIMESTAMP", "TIMESTAMPZ","DATETIME", "DATE"]',
  false
)
WHERE json->>'name' = 'columnValuesToBeBetween';

UPDATE pipeline_entity
SET json = jsonb_set(
        json,
        '{name}',
        to_jsonb(replace(json ->> 'name',':',''))
    )
WHERE json ->> 'serviceType' = 'Dagster';

UPDATE pipeline_entity
SET json = jsonb_set(
        json,
        '{fullyQualifiedName}',
        to_jsonb(replace(json ->> 'fullyQualifiedName',':',''))
    )
WHERE json ->> 'serviceType' = 'Dagster';