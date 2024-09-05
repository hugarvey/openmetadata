ALTER TABLE data_quality_data_time_series
ADD COLUMN id VARCHAR(36) GENERATED ALWAYS AS (json ->> 'id') STORED,
ADD CONSTRAINT id_unique UNIQUE (id);