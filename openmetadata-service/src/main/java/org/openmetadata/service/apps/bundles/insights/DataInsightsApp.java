package org.openmetadata.service.apps.bundles.insights;

import static org.openmetadata.service.exception.CatalogExceptionMessage.INVALID_APP_TYPE;

import com.cronutils.model.Cron;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.api.services.ingestionPipelines.CreateIngestionPipeline;
import org.openmetadata.schema.entity.app.App;
import org.openmetadata.schema.entity.app.AppType;
import org.openmetadata.schema.entity.app.ScheduleType;
import org.openmetadata.schema.entity.services.ServiceType;
import org.openmetadata.schema.entity.services.ingestionPipelines.AirflowConfig;
import org.openmetadata.schema.entity.services.ingestionPipelines.IngestionPipeline;
import org.openmetadata.schema.entity.services.ingestionPipelines.PipelineType;
import org.openmetadata.schema.metadataIngestion.SourceConfig;
import org.openmetadata.schema.services.connections.metadata.ComponentConfig;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.ProviderType;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.service.Entity;
import org.openmetadata.service.apps.AbstractNativeApplication;
import org.openmetadata.service.exception.EntityNotFoundException;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.EntityRepository;
import org.openmetadata.service.jdbi3.IngestionPipelineRepository;
import org.openmetadata.service.search.SearchRepository;
import org.openmetadata.service.util.FullyQualifiedName;

@Slf4j
public class DataInsightsApp extends AbstractNativeApplication {

  private static final String INGESTION_PIPELINE_NAME = "OpenMetadata_dataInsight";
  private static final String SERVICE_NAME = "OpenMetadata";
  private static final String SERVICE_TYPE = "Metadata";
  private static final String PIPELINE_DESCRIPTION = "OpenMetadata DataInsight Pipeline";

  @Override
  public void init(App app, CollectionDAO dao, SearchRepository searchRepository) {
    super.init(app, dao, searchRepository);
    LOG.info("Data Insights App is initialized");
  }

  @Override
  public void initializeExternalApp() {
    if (getApp().getAppType() == AppType.External && getApp().getScheduleType().equals(ScheduleType.Scheduled)) {
      IngestionPipelineRepository ingestionPipelineRepository =
          (IngestionPipelineRepository) Entity.getEntityRepository(Entity.INGESTION_PIPELINE);

      try {
        // Check if the Pipeline Already Exists
        String fqn = FullyQualifiedName.add(SERVICE_NAME, INGESTION_PIPELINE_NAME);
        IngestionPipeline storedPipeline =
            ingestionPipelineRepository.getByName(null, fqn, ingestionPipelineRepository.getFields("id"));

        // Init Application Code for Some Initialization
        List<CollectionDAO.EntityRelationshipRecord> records =
            collectionDAO
                .relationshipDAO()
                .findTo(getApp().getId(), Entity.APPLICATION, Relationship.HAS.ordinal(), Entity.INGESTION_PIPELINE);

        if (records.isEmpty()) {
          // Add Ingestion Pipeline to Application
          collectionDAO
              .relationshipDAO()
              .insert(
                  getApp().getId(),
                  storedPipeline.getId(),
                  Entity.APPLICATION,
                  Entity.INGESTION_PIPELINE,
                  Relationship.HAS.ordinal());
        }
      } catch (EntityNotFoundException ex) {
        // Pipeline needs to be created
        EntityRepository<?> serviceRepository = Entity.getServiceEntityRepository(ServiceType.fromValue(SERVICE_TYPE));
        EntityReference service =
            serviceRepository.getByName(null, SERVICE_NAME, serviceRepository.getFields("id")).getEntityReference();

        Cron quartzCron = getCronParser().parse(getApp().getAppSchedule().getCronExpression());

        CreateIngestionPipeline createPipelineRequest =
            new CreateIngestionPipeline()
                .withName(INGESTION_PIPELINE_NAME)
                .withDisplayName(INGESTION_PIPELINE_NAME)
                .withDescription(PIPELINE_DESCRIPTION)
                .withPipelineType(PipelineType.DATA_INSIGHT)
                .withSourceConfig(new SourceConfig().withConfig(new ComponentConfig()))
                .withAirflowConfig(new AirflowConfig().withScheduleInterval(getCronMapper().map(quartzCron).asString()))
                .withService(service);

        // Get Pipeline
        IngestionPipeline dataInsightPipeline =
            getIngestionPipeline(createPipelineRequest, String.format("%sBot", getApp().getName()), "admin")
                .withProvider(ProviderType.USER);
        ingestionPipelineRepository.setFullyQualifiedName(dataInsightPipeline);
        ingestionPipelineRepository.initializeEntity(dataInsightPipeline);

        // Add Ingestion Pipeline to Application
        collectionDAO
            .relationshipDAO()
            .insert(
                getApp().getId(),
                dataInsightPipeline.getId(),
                Entity.APPLICATION,
                Entity.INGESTION_PIPELINE,
                Relationship.HAS.ordinal());
      }
    } else {
      throw new IllegalArgumentException(INVALID_APP_TYPE);
    }
  }
}
