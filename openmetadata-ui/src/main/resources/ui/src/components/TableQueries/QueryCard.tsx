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

import { Button, Card, Col, Row, Space, Typography } from 'antd';
import classNames from 'classnames';
import { getTableTabPath, getUserPath, PIPE_SYMBOL } from 'constants/constants';
import { QUERY_DATE_FORMAT, QUERY_LINE_HEIGHT } from 'constants/Query.constant';
import { useClipboard } from 'hooks/useClipBoard';
import { isUndefined, split } from 'lodash';
import { Duration } from 'luxon';
import Qs from 'qs';
import React, { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import {
  INVALID_SQL_ERROR,
  parseSearchParams,
  sqlQueryValidator,
} from 'utils/Query/QueryUtils';
import { getQueryPath } from 'utils/RouterUtils';
import { getFormattedDateFromSeconds } from 'utils/TimeUtils';
import { CSMode } from '../../enums/codemirror.enum';
import SchemaEditor from '../schema-editor/SchemaEditor';
import QueryCardExtraOption from './QueryCardExtraOption/QueryCardExtraOption.component';
import QueryUsedByOtherTable from './QueryUsedByOtherTable/QueryUsedByOtherTable.component';
import './table-queries.style.less';
import { QueryCardProp } from './TableQueries.interface';
import { ReactComponent as ExitFullScreen } from '/assets/svg/exit-full-screen.svg';
import { ReactComponent as FullScreen } from '/assets/svg/full-screen.svg';
import { ReactComponent as CopyIcon } from '/assets/svg/icon-copy.svg';

const { Text, Paragraph } = Typography;

const QueryCard: FC<QueryCardProp> = ({
  isExpanded = false,
  className,
  query,
  selectedId,
  tableId,
  onQuerySelection,
  onQueryUpdate,
  permission,
  onUpdateVote,
  afterDeleteAction,
}: QueryCardProp) => {
  const { t } = useTranslation();
  const { datasetFQN } = useParams<{ datasetFQN: string }>();
  const location = useLocation();
  const history = useHistory();
  const { onCopyToClipBoard } = useClipboard(query.query);
  const searchFilter = useMemo(
    () => parseSearchParams(location.search),
    [location.search]
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [sqlQuery, setSqlQuery] = useState({
    query: query.query,
    isLoading: false,
  });
  const [isSqlInvalid, setIsSqlInvalid] = useState<boolean>(false);

  const { isAllowExpand, queryDate } = useMemo(() => {
    const queryArr = split(query.query, '\n');
    const queryDate = getFormattedDateFromSeconds(
      query.queryDate || 0,
      QUERY_DATE_FORMAT
    );

    return { isAllowExpand: queryArr.length > QUERY_LINE_HEIGHT, queryDate };
  }, [query]);

  const duration = useMemo(() => {
    const durationInSeconds = query.duration;

    if (isUndefined(durationInSeconds)) {
      return undefined;
    }

    const duration = Duration.fromObject({ seconds: durationInSeconds });

    let formatString;
    if (durationInSeconds < 1) {
      formatString = "SSS 'milisec'";
    } else if (durationInSeconds < 5) {
      formatString = "s 'sec'";
    } else {
      formatString = "m 'min'";
    }

    // Format the duration as a string using the chosen format string
    return duration.toFormat(`'${t('label.runs-for')}' ${formatString}`);
  }, [query]);

  const updateSqlQuery = async () => {
    try {
      await sqlQueryValidator(sqlQuery.query);

      setSqlQuery((pre) => ({ ...pre, isLoading: true }));
      if (query.query !== sqlQuery.query) {
        const updatedData = {
          ...query,
          query: sqlQuery.query,
        };
        await onQueryUpdate(updatedData, 'query');
      }
      setSqlQuery((pre) => ({ ...pre, isLoading: false }));
      setIsEditMode(false);
    } catch (error) {
      if (error === INVALID_SQL_ERROR) {
        setIsSqlInvalid(true);
      }
    }
  };

  const handleQueryChange = (value: string) => {
    if (isSqlInvalid) {
      setIsSqlInvalid(false);
    }
    setSqlQuery((pre) => ({ ...pre, query: value }));
  };

  const handleExpandClick = () => {
    if (isExpanded) {
      history.push({
        search: Qs.stringify(searchFilter),
        pathname: getTableTabPath(datasetFQN, 'table_queries'),
      });
    } else {
      history.push({
        search: Qs.stringify({ ...searchFilter, query: query.id }),
        pathname: getQueryPath(datasetFQN, query.id || ''),
      });
    }
  };

  const handleCardClick = () => {
    onQuerySelection && onQuerySelection(query);
  };

  return (
    <Row gutter={[0, 8]}>
      <Col span={24}>
        <Card
          bordered={false}
          className={classNames(
            'query-card-container',
            { selected: selectedId === query?.id },
            className
          )}
          data-testid="query-card-container"
          extra={
            <QueryCardExtraOption
              afterDeleteAction={afterDeleteAction}
              permission={permission}
              query={query}
              onEditClick={setIsEditMode}
              onUpdateVote={onUpdateVote}
            />
          }
          title={
            <Space className="font-normal p-y-xs" size={8}>
              <Text>{queryDate}</Text>
              <Text className="text-gray-400">{PIPE_SYMBOL}</Text>
              {duration && (
                <>
                  <Text>{duration}</Text>
                  <Text className="text-gray-400">{PIPE_SYMBOL}</Text>
                </>
              )}
              {query.updatedBy && (
                <Text>
                  {`${t('label.by-lowercase')} `}
                  <Link to={getUserPath(query.updatedBy)}>
                    {query.updatedBy}
                  </Link>
                </Text>
              )}
            </Space>
          }
          onClick={handleCardClick}>
          <Space className="query-entity-button" size={8}>
            <Button
              className="flex-center bg-white"
              data-testid="query-entity-expand-button"
              icon={
                isExpanded ? (
                  <ExitFullScreen height={16} width={16} />
                ) : (
                  <FullScreen height={16} width={16} />
                )
              }
              onClick={handleExpandClick}
            />
            <Button
              className="flex-center bg-white"
              data-testid="query-entity-copy-button"
              icon={<CopyIcon height={16} width={16} />}
              onClick={onCopyToClipBoard}
            />
          </Space>

          <div
            className={classNames(
              'sql-editor-container',
              !isExpanded && {
                'h-max-24': !isAllowExpand,
                'h-24': !isEditMode,
                'h-max-56': isEditMode && isAllowExpand,
              }
            )}>
            <SchemaEditor
              editorClass={classNames('custom-code-mirror-theme', {
                'full-screen-editor-height': isExpanded,
              })}
              mode={{ name: CSMode.SQL }}
              options={{
                styleActiveLine: isEditMode,
                readOnly: isEditMode ? false : 'nocursor',
              }}
              value={query.query ?? ''}
              onChange={handleQueryChange}
            />
          </div>
          {isSqlInvalid && (
            <Paragraph className="ml-8 p-l-md error-text">
              {t('message.field-text-is-invalid', {
                fieldText: t('label.sql-uppercase-query'),
              })}
            </Paragraph>
          )}
          <Row align="middle" className="p-y-xs border-top">
            <Col className="p-y-0.5 p-l-md" span={16}>
              <QueryUsedByOtherTable query={query} tableId={tableId} />
            </Col>
            <Col span={8}>
              {isEditMode && (
                <Space
                  align="end"
                  className="w-full justify-end p-r-md"
                  size={16}>
                  <Button
                    data-testid="cancel-query-btn"
                    key="cancel"
                    size="small"
                    onClick={() => setIsEditMode(false)}>
                    {t('label.cancel')}
                  </Button>

                  <Button
                    data-testid="save-query-btn"
                    key="save"
                    loading={sqlQuery.isLoading}
                    size="small"
                    type="primary"
                    onClick={updateSqlQuery}>
                    {t('label.save')}
                  </Button>
                </Space>
              )}
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default QueryCard;
