-- matchEnum Test Definition Parameter for columnValuesToBeInSet
UPDATE test_definition
set json = JSON_MERGE_PRESERVE(
	json,
    '{"parameterDefinition": ['
    '{"name": "matchEnum", "displayName": "Match enum", "description": "If enabled, validate that each value independently matches the enum.", "dataType": "BOOLEAN", "required": false, "optionValues": []}'
    ']}'
)
WHERE name = 'columnValuesToBeInSet'
AND JSON_LENGTH(json, '$.parameterDefinition') < 2;

-- Test Case dyanic test migration
UPDATE test_definition
SET json = JSON_SET(json, '$.supportsDynamicAssertion', true)
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
UPDATE dbservice_entity dbse
SET
  dbse.json = JSON_REMOVE(JSON_REMOVE(
  JSON_MERGE_PATCH(
    dbse.json,
    JSON_OBJECT(
      'connection', JSON_OBJECT(
        'config', JSON_OBJECT(
          'configSource', JSON_OBJECT(
            'connection', JSON_EXTRACT(dbse.json, '$.connection.config.metastoreConnection'),
            'appName', JSON_UNQUOTE(JSON_EXTRACT(dbse.json, '$.connection.config.appName'))
          )
        )
      )
    )
  )
  , '$.connection.config.appName'), '$.connection.config.metastoreConnection')
WHERE dbse.serviceType = 'DeltaLake';


-- KPI Migrations
UPDATE entity_relationship
SET    toid = (SELECT id
               FROM   di_chart_entity
               WHERE  NAME = 'percentage_of_data_asset_with_owner_kpi'),
       toentity = 'dataInsightCustomChart'
WHERE  toid = (SELECT id
               FROM   data_insight_chart dic
               WHERE  NAME = 'PercentageOfEntitiesWithOwnerByType')
       AND fromId IN (SELECT id from kpi_entity WHERE JSON_EXTRACT(json, '$.metricType') = 'PERCENTAGE')
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
       AND fromId IN (SELECT id from kpi_entity WHERE JSON_EXTRACT(json, '$.metricType') = 'NUMBER')
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
       AND fromId IN (SELECT id from kpi_entity WHERE JSON_EXTRACT(json, '$.metricType') = 'PERCENTAGE')
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
       AND fromId IN (SELECT id from kpi_entity WHERE JSON_EXTRACT(json, '$.metricType') = 'NUMBER')
       AND toentity = 'dataInsightChart'
       AND fromentity = 'kpi';
-- KPI MIgrations end

-- Update schedule type for applications
UPDATE installed_apps
SET json = JSON_MERGE_PATCH(json, '{"scheduleType": "ScheduledOrManual"}')
WHERE JSON_UNQUOTE(json->'$.scheduleType') = 'Scheduled';

-- recreate all scheduled apps
DELETE FROM apps_marketplace
WHERE JSON_UNQUOTE(json->'$.scheduleType') = 'Scheduled';
