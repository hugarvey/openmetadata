RENAME TABLE tag_category TO classification;

-- Rename tagCategoryName in BigQuery for classificationName
UPDATE dbservice_entity
SET json = JSON_INSERT(
    JSON_REMOVE(json, '$.connection.config.tagCategoryName'),
    '$.connection.config.classificationName',
    JSON_EXTRACT(json, '$.connection.config.tagCategoryName')
) where serviceType in ('BigQuery');

-- Deprecate SampleData db service type
DELETE er
FROM entity_relationship er
JOIN dbservice_entity db
  ON db.id = er.fromId
  OR db.id = er.toId
WHERE db.serviceType = 'SampleData';

DELETE FROM dbservice_entity where serviceType = 'SampleData';

-- Delete supportsUsageExtraction from vertica
UPDATE dbservice_entity 
SET json = JSON_REMOVE(json, '$.connection.config.supportsUsageExtraction')
WHERE serviceType = 'Vertica';

UPDATE ingestion_pipeline_entity
SET json = JSON_REMOVE(json ,'$.sourceConfig.config.dbtConfigSource.dbtUpdateDescriptions')
WHERE json -> '$.sourceConfig.config.type' = 'DBT';

UPDATE test_definition 
SET json = JSON_INSERT(
	JSON_REMOVE(json, '$.supportedDataTypes'),
	'$.supportedDataTypes',
	JSON_ARRAY('NUMBER', 'INT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'TINYINT', 'SMALLINT', 'BIGINT', 'BYTEINT', 'TIMESTAMP', 'TIMESTAMPZ','DATETIME', 'DATE')
)
WHERE name = 'columnValuesToBeBetween';

UPDATE pipeline_entity 
SET json = JSON_INSERT(
        JSON_REMOVE(json, '$.name'),
        '$.name',
		REPLACE(JSON_UNQUOTE(JSON_EXTRACT(json, '$.name')),':','')
    )
WHERE JSON_EXTRACT(json, '$.serviceType') = 'Dagster';

UPDATE pipeline_entity 
SET json = JSON_INSERT(
        JSON_REMOVE(json, '$.fullyQualifiedName'),
        '$.fullyQualifiedName',
		REPLACE(JSON_UNQUOTE(JSON_EXTRACT(json, '$.fullyQualifiedName')),':','')
    )
WHERE JSON_EXTRACT(json, '$.serviceType') = 'Dagster';
