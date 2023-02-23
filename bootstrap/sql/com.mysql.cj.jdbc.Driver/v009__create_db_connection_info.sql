-- Unique constraint for user email address
ALTER TABLE user_entity
ADD UNIQUE (email);


-- Remove classificationName in BigQuery
UPDATE dbservice_entity
SET json = JSON_REMOVE(json, '$.connection.config.classificationName') where serviceType in ('BigQuery');

-- migrate ingestAllDatabases in postgres
UPDATE dbservice_entity de2
SET json = JSON_REPLACE(
    JSON_INSERT(json,
      '$.connection.config.database',
      (select JSON_EXTRACT(json, '$.name')
        from database_entity de
        where id = (select er.toId
            from entity_relationship er
            where er.fromId = de2.id
              and er.toEntity = 'database'
            LIMIT 1
          ))
    ), '$.connection.config.ingestAllDatabases',
    true
  )
where de2.serviceType = 'Postgres'
  and JSON_EXTRACT(json, '$.connection.config.database') is NULL;


drop table alert_entity;
drop table alert_action_def;

CREATE TABLE IF NOT EXISTS event_subscription_entity (
    id VARCHAR(36) GENERATED ALWAYS AS (json ->> '$.id') STORED NOT NULL,
    name VARCHAR(256) GENERATED ALWAYS AS (json ->> '$.name') NOT NULL,
    deleted BOOLEAN GENERATED ALWAYS AS (json -> '$.deleted'),
    json JSON NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
    -- No versioning, updatedAt, updatedBy, or changeDescription fields for webhook
);