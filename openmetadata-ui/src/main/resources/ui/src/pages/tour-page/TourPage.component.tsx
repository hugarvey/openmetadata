import { observer } from 'mobx-react';
import { CurrentTourPageType, LeafNodes, SearchResponse } from 'Models';
import React, { useEffect, useState } from 'react';
import AppState from '../../AppState';
import DatasetDetails from '../../components/DatasetDetails/DatasetDetails.component';
import { DatasetOwner } from '../../components/DatasetDetails/DatasetDetails.interface';
import Explore from '../../components/Explore/Explore.component';
import { ExploreSearchData } from '../../components/Explore/explore.interface';
import MyData from '../../components/MyData/MyData.component';
import Tour from '../../components/tour/Tour';
import {
  Table,
  TableJoins,
  TypeUsedToReturnUsageDetailsOfAnEntity,
} from '../../generated/entity/data/table';
import { useTour } from '../../hooks/useTour';
import { datasetData } from './datasetDetailsData';
import data from './mockData.json';

const mockData = {
  data: { hits: { hits: [] } },
};

const exploreSearchData = data as unknown as ExploreSearchData;

const exploreCount = {
  table: 4,
  topic: 0,
  dashboard: 0,
  pipeline: 0,
  dbtModel: 0,
};

const TourPage = () => {
  const { handleIsTourOpen } = useTour();
  const [currentPage, setCurrentPage] = useState(AppState.currentTourPage);
  const [myDataSearchResult, setMyDataSearchResult] = useState(mockData);
  const [exploreSearchResult, setExploreSearchResult] =
    useState(exploreSearchData);
  const [datasetActiveTab, setdatasetActiveTab] = useState(1);
  const [explorePageCounts, setExplorePageCounts] = useState(exploreCount);

  const handleCountChange = () => {
    setExplorePageCounts(exploreCount);
  };

  useEffect(() => {
    handleIsTourOpen(true);
    AppState.currentTourPage = 'myDataPage';
  }, []);

  useEffect(() => {
    setCurrentPage(AppState.currentTourPage);
  }, [AppState.currentTourPage]);

  const getCurrentPage = (page: CurrentTourPageType) => {
    switch (page) {
      case 'myDataPage':
        return (
          <MyData
            countServices={4}
            entityCounts={{
              tableCount: 21,
              topicCount: 20,
              dashboardCount: 10,
              pipelineCount: 8,
            }}
            error=""
            fetchData={() => {
              setMyDataSearchResult(mockData);
            }}
            ingestionCount={0}
            searchResult={myDataSearchResult as unknown as SearchResponse}
            userDetails={AppState.userDetails}
          />
        );

      case 'explorePage':
        return (
          <Explore
            error=""
            fetchCount={handleCountChange}
            fetchData={() => setExploreSearchResult(exploreSearchData)}
            handlePathChange={handleCountChange}
            handleSearchText={() => setExploreSearchResult(exploreSearchData)}
            searchQuery=""
            searchResult={exploreSearchResult as unknown as ExploreSearchData}
            searchText=""
            sortValue=""
            tab=""
            tabCounts={explorePageCounts}
            updateDashboardCount={handleCountChange}
            updateDbtModelCount={handleCountChange}
            updatePipelineCount={handleCountChange}
            updateTableCount={handleCountChange}
            updateTopicCount={handleCountChange}
          />
        );

      case 'datasetPage':
        return (
          <DatasetDetails
            activeTab={datasetActiveTab}
            columns={datasetData.columns as unknown as Table['columns']}
            columnsUpdateHandler={handleCountChange}
            datasetFQN={datasetData.datasetFQN}
            description={datasetData.description}
            descriptionUpdateHandler={handleCountChange}
            entityLineage={datasetData.entityLineage}
            entityName={datasetData.entityName}
            followers={datasetData.followers}
            followTableHandler={handleCountChange}
            isNodeLoading={{
              id: undefined,
              state: false,
            }}
            joins={datasetData.joins as unknown as TableJoins}
            lineageLeafNodes={{} as LeafNodes}
            loadNodeHandler={handleCountChange}
            owner={undefined as unknown as DatasetOwner}
            sampleData={datasetData.sampleData}
            setActiveTabHandler={(tab) => setdatasetActiveTab(tab)}
            settingsUpdateHandler={() => Promise.resolve()}
            slashedTableName={datasetData.slashedTableName}
            tableDetails={datasetData.tableDetails as unknown as Table}
            tableProfile={
              datasetData.tableProfile as unknown as Table['tableProfile']
            }
            tableTags={datasetData.tableTags}
            tier=""
            unfollowTableHandler={handleCountChange}
            usageSummary={
              datasetData.usageSummary as unknown as TypeUsedToReturnUsageDetailsOfAnEntity
            }
            users={[]}
            versionHandler={handleCountChange}
          />
        );

      default:
        return;
    }
  };

  return (
    <div>
      <Tour />
      {getCurrentPage(currentPage)}
    </div>
  );
};

export default observer(TourPage);
