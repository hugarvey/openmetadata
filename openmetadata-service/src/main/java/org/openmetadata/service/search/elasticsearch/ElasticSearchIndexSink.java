package org.openmetadata.service.search.elasticsearch;

import static org.openmetadata.schema.system.IndexingError.ErrorSource.SINK;
import static org.openmetadata.service.workflows.searchIndex.ReindexingUtil.ENTITY_NAME_LIST_KEY;
import static org.openmetadata.service.workflows.searchIndex.ReindexingUtil.getUpdatedStats;

import es.org.elasticsearch.action.DocWriteRequest;
import es.org.elasticsearch.action.bulk.BulkItemResponse;
import es.org.elasticsearch.action.bulk.BulkRequest;
import es.org.elasticsearch.action.bulk.BulkResponse;
import es.org.elasticsearch.client.RequestOptions;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.glassfish.jersey.internal.util.ExceptionUtils;
import org.openmetadata.schema.system.EntityError;
import org.openmetadata.schema.system.IndexingError;
import org.openmetadata.schema.system.StepStats;
import org.openmetadata.service.exception.SearchIndexException;
import org.openmetadata.service.search.SearchRepository;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.workflows.interfaces.Sink;

@Slf4j
public class ElasticSearchIndexSink implements Sink<BulkRequest, BulkResponse> {
  private final StepStats stats = new StepStats();
  private final SearchRepository searchRepository;
  private final int maxPayLoadSizeInBytes;

  public ElasticSearchIndexSink(SearchRepository searchRepository, int total) {
    this.searchRepository = searchRepository;
    this.maxPayLoadSizeInBytes = searchRepository.getElasticSearchConfiguration().getPayLoadSize();
    this.stats.withTotalRecords(total).withSuccessRecords(0).withFailedRecords(0);
  }

  @Override
  public BulkResponse write(BulkRequest data, Map<String, Object> contextData)
      throws SearchIndexException {
    LOG.debug("[EsSearchIndexSink] Processing a Batch of Size: {}", data.numberOfActions());
    try {
      BulkResponse response = null;
      int offset = 0;
      int currentSuccess = 0;
      int currentFailed = 0;
      List<EntityError> entityErrorList = new ArrayList<>();
      List<?> entityNames =
          (List<?>)
              Optional.ofNullable(contextData.get(ENTITY_NAME_LIST_KEY))
                  .orElse(Collections.emptyList());

      while (offset != data.requests().size()) { // until all requests in the batch are processed
        BulkRequest bufferData = new BulkRequest();
        List<Integer> offsetList = new ArrayList<>();

        for (int i = offset; i < data.requests().size(); i++) {
          DocWriteRequest<?> requestItem = data.requests().get(i);
          BulkRequest singleBulkRequest = new BulkRequest();
          singleBulkRequest.add(requestItem);

          if (singleBulkRequest.estimatedSizeInBytes() > maxPayLoadSizeInBytes) {
            entityErrorList.add(
                new EntityError()
                    .withMessage("Entity size greater than payload size")
                    .withEntity(entityNames.get(offset)));
            currentFailed++;
            offset++;
            continue;
          }

          if (bufferData.estimatedSizeInBytes() + singleBulkRequest.estimatedSizeInBytes()
              <= maxPayLoadSizeInBytes) {
            bufferData.add(requestItem);
            offsetList.add(i);
            offset++;
          } else {
            break;
          }
        }

        if (!bufferData.requests().isEmpty()) { // Send the buffered requests to Elasticsearch
          response = searchRepository.getSearchClient().bulk(bufferData, RequestOptions.DEFAULT);
          BulkItemResponse[] responses = response.getItems();
          for (int j = 0; j < responses.length; j++) {
            BulkItemResponse bulkItemResponse = responses[j];
            if (bulkItemResponse.isFailed()) { // get Errors From BulkResponse
              currentFailed++;
              entityErrorList.add(
                  new EntityError()
                      .withMessage(bulkItemResponse.getFailureMessage())
                      .withEntity(entityNames.get(offsetList.get(j))));
            } else {
              currentSuccess++;
            }
          }
        }

        if (offset == data.requests().size() && currentFailed > 0) {
          throw new SearchIndexException(
              new IndexingError()
                  .withErrorSource(SINK)
                  .withSubmittedCount(data.numberOfActions())
                  .withSuccessCount(currentSuccess)
                  .withFailedCount(currentFailed)
                  .withMessage("Issues in Sink To Elastic Search.")
                  .withFailedEntities(entityErrorList));
        }

        LOG.debug(
            "[EsSearchIndexSink] Batch Stats :- Submitted : {} Success: {} Failed: {}",
            data.numberOfActions(),
            currentSuccess,
            currentFailed);
        updateStats(currentSuccess, currentFailed);
      }
      return response;
    } catch (SearchIndexException ex) {
      updateStats(ex.getIndexingError().getSuccessCount(), ex.getIndexingError().getFailedCount());
      throw ex;
    } catch (Exception e) {
      IndexingError indexingError =
          new IndexingError()
              .withErrorSource(IndexingError.ErrorSource.SINK)
              .withSubmittedCount(data.numberOfActions())
              .withSuccessCount(0)
              .withFailedCount(data.numberOfActions())
              .withMessage("Issue in Sink to Elastic Search.")
              .withStackTrace(ExceptionUtils.exceptionStackTraceAsString(e));
      LOG.debug("[ESSearchIndexSink] Failed, Details : {}", JsonUtils.pojoToJson(indexingError));
      updateStats(0, data.numberOfActions());
      throw new SearchIndexException(indexingError);
    }
  }

  @Override
  public void updateStats(int currentSuccess, int currentFailed) {
    getUpdatedStats(stats, currentSuccess, currentFailed);
  }

  @Override
  public StepStats getStats() {
    return stats;
  }
}
