package org.openmetadata.service.secrets.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.openmetadata.schema.auth.SSOAuthMechanism;
import org.openmetadata.schema.entity.automations.TestServiceConnectionRequest;
import org.openmetadata.schema.entity.automations.Workflow;
import org.openmetadata.schema.metadataIngestion.DbtPipeline;
import org.openmetadata.schema.metadataIngestion.dbtconfig.DbtGCSConfig;
import org.openmetadata.schema.security.credentials.GCSCredentials;
import org.openmetadata.schema.services.connections.dashboard.LookerConnection;
import org.openmetadata.schema.services.connections.dashboard.SupersetConnection;
import org.openmetadata.schema.services.connections.dashboard.TableauConnection;
import org.openmetadata.schema.services.connections.database.BigQueryConnection;
import org.openmetadata.schema.services.connections.database.DatalakeConnection;
import org.openmetadata.schema.services.connections.database.datalake.GCSConfig;
import org.openmetadata.schema.services.connections.metadata.OpenMetadataConnection;
import org.openmetadata.schema.services.connections.pipeline.AirflowConnection;
import org.openmetadata.schema.services.connections.storage.GcsConnection;

public class ClassConverterFactoryTest {

  @ParameterizedTest
  @ValueSource(
      classes = {
        AirflowConnection.class,
        BigQueryConnection.class,
        DatalakeConnection.class,
        DbtGCSConfig.class,
        DbtPipeline.class,
        GCSConfig.class,
        GCSCredentials.class,
        GcsConnection.class,
        LookerConnection.class,
        OpenMetadataConnection.class,
        SSOAuthMechanism.class,
        SupersetConnection.class,
        TableauConnection.class,
        TestServiceConnectionRequest.class,
        Workflow.class
      })
  void testClassConverterIsSet(Class<?> clazz) {
    assertFalse(ClassConverterFactory.getConverter(clazz) instanceof DefaultConnectionClassConverter);
  }

  @Test
  void testClassConvertedMapIsNotModified() {
    assertEquals(ClassConverterFactory.getConverterMap().size(), 15);
  }
}
