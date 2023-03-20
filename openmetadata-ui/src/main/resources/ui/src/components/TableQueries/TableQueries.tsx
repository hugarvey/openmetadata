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

import { Col, Row } from 'antd';
import { AxiosError } from 'axios';
import NextPrevious from 'components/common/next-previous/NextPrevious';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from 'components/PermissionProvider/PermissionProvider.interface';
import { INITIAL_PAGING_VALUE, PAGE_SIZE } from 'constants/constants';
import { compare } from 'fast-json-patch';
import { Query } from 'generated/entity/data/query';
import { isNil, isString, isUndefined } from 'lodash';
import { PagingResponse } from 'Models';
import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getQueriesList, ListQueriesParams, patchQueries } from 'rest/queryAPI';
import { DEFAULT_ENTITY_PERMISSION } from 'utils/PermissionsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import ErrorPlaceHolder from '../common/error-with-placeholder/ErrorPlaceHolder';
import Loader from '../Loader/Loader';
import QueryCard from './QueryCard';
import TableQueryRightPanel from './TableQueryRightPanel/TableQueryRightPanel.component';

interface TableQueriesProp {
  isTableDeleted?: boolean;
  tableId: string;
}

const TableQueries: FC<TableQueriesProp> = ({
  isTableDeleted,
  tableId,
}: TableQueriesProp) => {
  const { t } = useTranslation();

  const [tableQueries, setTableQueries] = useState<PagingResponse<Query[]>>({
    data: [],
    paging: INITIAL_PAGING_VALUE,
  });
  const [isQueriesLoading, setIsQueriesLoading] = useState(true);
  const [isRightPanelLoading, setIsRightPanelLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<Query>();
  const [queryPermissions, setQueryPermissions] = useState<OperationPermission>(
    DEFAULT_ENTITY_PERMISSION
  );
  const [currentPage, setCurrentPage] = useState(1);

  const { getEntityPermission } = usePermissionProvider();

  const fetchResourcePermission = async () => {
    if (isUndefined(selectedQuery)) {
      return;
    }
    setIsRightPanelLoading(true);
    try {
      const permission = await getEntityPermission(
        ResourceEntity.QUERY,
        selectedQuery.id || ''
      );
      setQueryPermissions(permission);
    } catch (error) {
      showErrorToast(
        t('label.fetch-entity-permissions-error', {
          entity: t('label.resource-permission-lowercase'),
        })
      );
    } finally {
      setIsRightPanelLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuery && selectedQuery.id) {
      fetchResourcePermission();
    }
  }, [selectedQuery]);

  const fetchTableQuery = async (params?: ListQueriesParams) => {
    setIsQueriesLoading(true);
    try {
      const queries = await getQueriesList({
        ...params,
        limit: PAGE_SIZE,
        entityId: tableId,
        fields: 'owner,vote,tags,queryUsedIn',
      });
      setTableQueries(queries);
      setSelectedQuery(queries.data[0]);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsQueriesLoading(false);
    }
  };

  const handleQueryUpdate = async (updatedQuery: Query, key: keyof Query) => {
    if (isUndefined(selectedQuery)) {
      return;
    }

    const jsonPatch = compare(selectedQuery, updatedQuery);

    try {
      const res = await patchQueries(selectedQuery.id || '', jsonPatch);
      setSelectedQuery((pre) => (pre ? { ...pre, [key]: res[key] } : res));
      setTableQueries((pre) => {
        return {
          ...pre,
          data: pre.data.map((query) =>
            query.id === updatedQuery.id ? { ...query, [key]: res[key] } : query
          ),
        };
      });
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const pagingHandler = (cursorType: string | number, activePage?: number) => {
    console.log({ cursorType, activePage });
    if (isString(cursorType)) {
      const { paging } = tableQueries;
      fetchTableQuery({ [cursorType]: paging[cursorType] });
      activePage && setCurrentPage(activePage);
    }
  };

  const handleSelectedQuery = (query: Query) => {
    if (query.id !== selectedQuery?.id) {
      setIsRightPanelLoading(true);
      setSelectedQuery(query);
    }
  };

  useEffect(() => {
    setIsQueriesLoading(true);
    if (tableId && !isTableDeleted) {
      fetchTableQuery();
    } else {
      setIsQueriesLoading(false);
    }
  }, [tableId]);

  if (isQueriesLoading) {
    return <Loader />;
  }

  return (
    <Row className="h-full" id="tablequeries">
      {tableQueries.data.length && !isUndefined(selectedQuery) ? (
        <>
          <Col span={18}>
            <Row
              className="p-r-lg"
              data-testid="queries-container"
              gutter={[16, 16]}>
              {/* <Col span={24}>filters</Col> */}

              {tableQueries.data.map((query) => (
                <Col key={query.id} span={24}>
                  <QueryCard
                    permission={queryPermissions}
                    query={query}
                    selectedId={selectedQuery.id}
                    tableId={tableId}
                    onQuerySelection={handleSelectedQuery}
                    onQueryUpdate={handleQueryUpdate}
                  />
                </Col>
              ))}
              <Col span={24}>
                {Boolean(
                  !isNil(tableQueries.paging.after) ||
                    !isNil(tableQueries.paging.before)
                ) && (
                  <NextPrevious
                    currentPage={currentPage}
                    pageSize={PAGE_SIZE}
                    paging={tableQueries.paging}
                    pagingHandler={pagingHandler}
                    totalCount={tableQueries.paging.total}
                  />
                )}
              </Col>
            </Row>
          </Col>
          <Col className="bg-white border-main border-1 border-t-0" span={6}>
            <div className="sticky top-0">
              <TableQueryRightPanel
                isLoading={isRightPanelLoading}
                permission={queryPermissions}
                query={selectedQuery}
                onQueryUpdate={handleQueryUpdate}
              />
            </div>
          </Col>
        </>
      ) : (
        <Col className="flex-center font-medium" span={24}>
          <div data-testid="no-queries">
            <ErrorPlaceHolder heading="queries" />
          </div>
        </Col>
      )}
    </Row>
  );
};

export default TableQueries;
