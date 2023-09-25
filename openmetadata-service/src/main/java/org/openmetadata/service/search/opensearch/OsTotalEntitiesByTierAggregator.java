package org.openmetadata.service.search.opensearch;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import org.openmetadata.schema.dataInsight.DataInsightChartResult;
import org.openmetadata.schema.dataInsight.type.TotalEntitiesByTier;
import org.openmetadata.service.dataInsight.DataInsightAggregatorInterface;
import org.opensearch.search.aggregations.Aggregations;
import org.opensearch.search.aggregations.bucket.MultiBucketsAggregation;
import org.opensearch.search.aggregations.bucket.histogram.Histogram;
import org.opensearch.search.aggregations.metrics.Sum;

public class OsTotalEntitiesByTierAggregator extends DataInsightAggregatorInterface {
  public OsTotalEntitiesByTierAggregator(
      Aggregations aggregations, DataInsightChartResult.DataInsightChartType dataInsightChartType) {
    super(aggregations, dataInsightChartType);
  }

  @Override
  public DataInsightChartResult process() throws ParseException {
    List<Object> data = this.aggregate();
    return new DataInsightChartResult().withData(data).withChartType(this.dataInsightChartType);
  }

  @Override
  public List<Object> aggregate() throws ParseException {
    Histogram timestampBuckets = this.aggregationsOs.get(TIMESTAMP);
    List<Object> data = new ArrayList<>();

    for (Histogram.Bucket timestampBucket : timestampBuckets.getBuckets()) {
      List<TotalEntitiesByTier> timestampData = new ArrayList<>();
      double totalEntityCount = 0.0;

      String dateTimeString = timestampBucket.getKeyAsString();
      Long timestamp = this.convertDatTimeStringToTimestamp(dateTimeString);
      MultiBucketsAggregation entityTypeBuckets = timestampBucket.getAggregations().get(ENTITY_TIER);
      for (MultiBucketsAggregation.Bucket entityTierBucket : entityTypeBuckets.getBuckets()) {
        String entityTier = entityTierBucket.getKeyAsString();
        Sum sumEntityCount = entityTierBucket.getAggregations().get(ENTITY_COUNT);
        timestampData.add(
            new TotalEntitiesByTier()
                .withTimestamp(timestamp)
                .withEntityTier(entityTier)
                .withEntityCount(sumEntityCount.getValue()));
        totalEntityCount = totalEntityCount + sumEntityCount.getValue();
      }
      for (TotalEntitiesByTier el : timestampData) {
        if (totalEntityCount != 0.0) {
          el.withEntityCountFraction(el.getEntityCount() / totalEntityCount);
        } else {
          el.withEntityCountFraction(Double.NaN);
        }
        data.add((el));
      }
    }

    return data;
  }
}
