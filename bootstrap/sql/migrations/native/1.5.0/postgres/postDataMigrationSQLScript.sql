-- matchEnum Test Definition Parameter for columnValuesToBeInSet
UPDATE test_definition
SET json = jsonb_set(json, '{parameterDefinition}', json->'parameterDefinition' || '['
    '{"name": "matchEnum", "displayName": "Match enum", "description": "If enabled, validate that each value independently matches the enum.", "dataType": "BOOLEAN", "required": false, "optionValues": []}'
    ']'::jsonb
)
WHERE name = 'columnValuesToBeInSet'
AND JSONB_ARRAY_LENGTH(json->'parameterDefinition') < 2;


-- Test Case dyanic test migration
UPDATE test_definition
SET json = JSONB_SET(json, '{supportsDynamicAssertion}', 'true', true)
WHERE name IN (
	'columnValueMaxToBeBetween',
    'columnValueMeanToBeBetween',
    'columnValueMedianToBeBetween',
    'columnValueMinToBeBetween',
    'columnValueStdDevToBeBetween',
    'columnValuesLengthsToBeBetween',
    'columnValuesSumToBeBetween',
    'columnValuesToBeBetween',
    'tableRowCountToBeBetween'
);

-- Update DeltaLake service due to connection schema changes to enable DeltaLake ingestion from Storage
UPDATE dbservice_entity
SET json = JSONB_SET(
  JSONB_SET(
    json,
    '{connection,config,configSource}',
    JSONB_BUILD_OBJECT('connection', json->'connection'->'config'->'metastoreConnection')
  ),
  '{connection,config,configSource,appName}',
  json->'connection'->'config'->'appName'
) #- '{connection,config,metastoreConnection}' #- '{connection,config,appName}'
WHERE serviceType = 'DeltaLake';

-- KPI Migrations
UPDATE entity_relationship
SET    toid = (SELECT id
               FROM   di_chart_entity
               WHERE  NAME = 'percentage_of_data_asset_with_owner_kpi'),
       toentity = 'dataInsightCustomChart'
WHERE  toid = (SELECT id
               FROM   data_insight_chart dic
               WHERE  NAME = 'PercentageOfEntitiesWithOwnerByType')
       AND fromId IN (SELECT id from kpi_entity WHERE json ->> 'metricType' = 'PERCENTAGE')
       AND toentity = 'dataInsightChart'
       AND fromentity = 'kpi';


UPDATE entity_relationship
SET    toid = (SELECT id
               FROM   di_chart_entity
               WHERE  NAME = 'number_of_data_asset_with_owner_kpi'),
       toentity = 'dataInsightCustomChart'
WHERE  toid = (SELECT id
               FROM   data_insight_chart dic
               WHERE  NAME = 'PercentageOfEntitiesWithOwnerByType')
       AND fromId IN (SELECT id from kpi_entity WHERE json ->> 'metricType' = 'NUMBER')
       AND toentity = 'dataInsightChart'
       AND fromentity = 'kpi';


UPDATE entity_relationship
SET    toid = (SELECT id
               FROM   di_chart_entity
               WHERE  NAME = 'percentage_of_data_asset_with_description_kpi'),
       toentity = 'dataInsightCustomChart'
WHERE  toid = (SELECT id
               FROM   data_insight_chart dic
               WHERE  NAME = 'PercentageOfEntitiesWithDescriptionByType')
       AND fromId IN (SELECT id from kpi_entity WHERE json ->> 'metricType' = 'PERCENTAGE')
       AND toentity = 'dataInsightChart'
       AND fromentity = 'kpi';


UPDATE entity_relationship
SET    toid = (SELECT id
               FROM   di_chart_entity
               WHERE  NAME = 'number_of_data_asset_with_description_kpi'),
       toentity = 'dataInsightCustomChart'
WHERE  toid = (SELECT id
               FROM   data_insight_chart dic
               WHERE  NAME = 'PercentageOfEntitiesWithDescriptionByType')
       AND fromId IN (SELECT id from kpi_entity WHERE json ->> 'metricType' = 'NUMBER')
       AND toentity = 'dataInsightChart'
       AND fromentity = 'kpi';
-- KPI MIgrations end
