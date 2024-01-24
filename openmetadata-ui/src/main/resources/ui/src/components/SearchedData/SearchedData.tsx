/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { Pagination } from 'antd';
import classNames from 'classnames';
import { isNumber } from 'lodash';
import Qs from 'qs';
import React, { useMemo } from 'react';
import { PAGE_SIZE } from '../../constants/constants';
import { MAX_RESULT_HITS } from '../../constants/explore.constants';
import { ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE } from '../../enums/common.enum';
import { pluralize } from '../../utils/CommonUtils';
import { highlightEntityNameAndDescription } from '../../utils/EntityUtils';
import ErrorPlaceHolderES from '../common/ErrorWithPlaceholder/ErrorPlaceHolderES';
import ExploreSearchCard from '../ExploreV1/ExploreSearchCard/ExploreSearchCard';
import Loader from '../Loader/Loader';
import { SearchedDataProps } from './SearchedData.interface';

const ASSETS_NAME = [
  'table_name',
  'topic_name',
  'dashboard_name',
  'pipeline_name',
];

const SearchedData: React.FC<SearchedDataProps> = ({
  children,
  data,
  isLoading = false,
  onPaginationChange,
  showResultCount = false,
  totalValue,
  isFilterSelected,
  isSummaryPanelVisible,
  selectedEntityId,
  handleSummaryPanelDisplay,
  filter,
}) => {
  const searchResultCards = useMemo(() => {
    return data.map(({ _source: table, highlight }, index) => {
      const matches = highlight
        ? Object.entries(highlight)
            .map((d) => {
              let highlightedTextCount = 0;
              d[1].forEach((value) => {
                const currentCount = value.match(
                  /<span(.*?)>(.*?)<\/span>/g
                )?.length;

                highlightedTextCount =
                  highlightedTextCount + (currentCount || 0);
              });

              return {
                key: d[0],
                value: highlightedTextCount,
              };
            })
            .filter((d) => !ASSETS_NAME.includes(d.key))
        : [];

      const source = highlightEntityNameAndDescription(table, highlight);

      return (
        <div className="m-b-md" key={`tabledatacard${index}`}>
          <ExploreSearchCard
            className={classNames(
              table.id === selectedEntityId && isSummaryPanelVisible
                ? 'highlight-card'
                : ''
            )}
            handleSummaryPanelDisplay={handleSummaryPanelDisplay}
            id={`tabledatacard${index}`}
            matches={matches}
            showTags={false}
            source={source}
          />
        </div>
      );
    });
  }, [
    data,
    isSummaryPanelVisible,
    handleSummaryPanelDisplay,
    selectedEntityId,
  ]);

  const ResultCount = () => {
    if (showResultCount && (isFilterSelected || filter?.quickFilter)) {
      if (MAX_RESULT_HITS === totalValue) {
        return <div>{`About ${totalValue} results`}</div>;
      } else {
        return <div>{pluralize(totalValue, 'result')}</div>;
      }
    } else {
      return null;
    }
  };

  const { page = 1, size = PAGE_SIZE } = useMemo(
    () =>
      Qs.parse(
        location.search.startsWith('?')
          ? location.search.substr(1)
          : location.search
      ),
    [location.search]
  );

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div
          className={classNames({
            'mt-36': totalValue <= 0,
          })}
          data-testid="search-container">
          {totalValue > 0 ? (
            <>
              {children}
              <ResultCount />
              <div data-testid="search-results">
                {searchResultCards}
                <Pagination
                  hideOnSinglePage
                  className="text-center m-b-sm"
                  current={isNumber(Number(page)) ? Number(page) : 1}
                  pageSize={
                    size && isNumber(Number(size)) ? Number(size) : PAGE_SIZE
                  }
                  pageSizeOptions={[10, 25, 50]}
                  total={totalValue}
                  onChange={onPaginationChange}
                />
              </div>
            </>
          ) : (
            <>
              {children}
              <ErrorPlaceHolderES
                query={filter}
                type={ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE.NO_DATA}
              />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SearchedData;
