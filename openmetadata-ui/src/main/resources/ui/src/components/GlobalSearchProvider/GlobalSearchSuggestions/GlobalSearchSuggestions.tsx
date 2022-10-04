/*
 *  Copyright 2022 Collate
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

import { Select, Typography } from 'antd';
import { AxiosError } from 'axios';
import { isEmpty } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { suggestQuery } from '../../../axiosAPIs/searchAPI';
import { FQN_SEPARATOR_CHAR } from '../../../constants/char.constants';
import { FqnPart } from '../../../enums/entity.enum';
import { SearchIndex } from '../../../enums/search.enum';
import {
  DashboardSearchSource,
  MlmodelSearchSource,
  PipelineSearchSource,
  SuggestResponse,
  TableSearchSource,
  TopicSearchSource,
} from '../../../interface/search.interface';
import jsonData from '../../../jsons/en';
import { getPartialNameFromTableFQN } from '../../../utils/CommonUtils';
import { serviceTypeLogo } from '../../../utils/ServiceUtils';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';
import { getEntityLink } from '../../../utils/TableUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import CmdKIcon from '../../common/CmdKIcon/CmdKIcon.component';
import ErrorPlaceHolder from '../../common/error-with-placeholder/ErrorPlaceHolder';
import Loader from '../../Loader/Loader';
import { GlobalSearchSuggestionsProp } from './GlobalSearchSuggestions.interface';
import './GlobalSearchSuggestions.less';

const GlobalSearchSuggestions = ({
  isSuggestionsLoading,
  handleIsSuggestionsLoading,
  searchText,
  onOptionSelection,
  value,
  onInputKeyDown,
  onSearch,
  selectRef,
}: GlobalSearchSuggestionsProp) => {
  const history = useHistory();
  const [options, setOptions] = useState<SuggestResponse<SearchIndex>>([]);
  const [tableSuggestions, setTableSuggestions] = useState<TableSearchSource[]>(
    []
  );
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSearchSource[]>(
    []
  );
  const [dashboardSuggestions, setDashboardSuggestions] = useState<
    DashboardSearchSource[]
  >([]);

  const [pipelineSuggestions, setPipelineSuggestions] = useState<
    PipelineSearchSource[]
  >([]);
  const [mlModelSuggestions, setMlModelSuggestions] = useState<
    MlmodelSearchSource[]
  >([]);
  const isMounting = useRef(true);

  const setSuggestions = (options: SuggestResponse<SearchIndex>) => {
    setTableSuggestions(
      options
        .filter((option) => option._index === SearchIndex.TABLE)
        .map((option) => option._source as TableSearchSource)
    );
    setTopicSuggestions(
      options
        .filter((option) => option._index === SearchIndex.TOPIC)
        .map((option) => option._source as TopicSearchSource)
    );
    setDashboardSuggestions(
      options
        .filter((option) => option._index === SearchIndex.DASHBOARD)
        .map((option) => option._source as DashboardSearchSource)
    );
    setPipelineSuggestions(
      options
        .filter((option) => option._index === SearchIndex.PIPELINE)
        .map((option) => option._source as PipelineSearchSource)
    );
    setMlModelSuggestions(
      options
        .filter((option) => option._index === SearchIndex.MLMODEL)
        .map((option) => option._source as MlmodelSearchSource)
    );
  };

  const getGroupLabel = (index: string) => {
    let label = '';
    let icon = '';
    switch (index) {
      case SearchIndex.TOPIC:
        label = 'Topics';
        icon = Icons.TOPIC_GREY;

        break;
      case SearchIndex.DASHBOARD:
        label = 'Dashboards';
        icon = Icons.DASHBOARD_GREY;

        break;
      case SearchIndex.PIPELINE:
        label = 'Pipelines';
        icon = Icons.PIPELINE_GREY;

        break;
      case SearchIndex.MLMODEL:
        label = 'ML Models';
        // TODO: Change this to mlmodel icon
        icon = Icons.SERVICE;

        break;
      case SearchIndex.TABLE:
      default:
        label = 'Tables';
        icon = Icons.TABLE_GREY;

        break;
    }

    return (
      <Select.Option disabled>
        <div className="tw-flex tw-items-center">
          <SVGIcons alt="icon" className="tw-h-3 tw-w-4" icon={icon} />
          <p className="tw-px-2 tw-text-grey-muted tw-text-xs tw-h-4 tw-mb-0">
            {label}
          </p>
        </div>
      </Select.Option>
    );
  };

  const getSuggestionElement: (args: {
    fullyQualifiedName: string | undefined;
    name: string | undefined;
    serviceType: string | undefined;
    index: SearchIndex;
  }) => React.ReactNode = ({
    fullyQualifiedName = '',
    name = '',
    serviceType = '',
    index,
  }) => {
    let database;
    let schema;
    if (index === SearchIndex.TABLE) {
      database = getPartialNameFromTableFQN(fullyQualifiedName, [
        FqnPart.Database,
      ]);
      schema = getPartialNameFromTableFQN(fullyQualifiedName, [FqnPart.Schema]);
    }
    const entitiyLink = getEntityLink(index, fullyQualifiedName);

    return (
      <Select.Option key={entitiyLink} value={entitiyLink}>
        <div className="tw-flex tw-items-center" key={fullyQualifiedName}>
          <img
            alt={serviceType}
            className="tw-inline tw-h-4"
            src={serviceTypeLogo(serviceType)}
          />
          <Link
            className="tw-px-2 tw-text-sm"
            data-testid="data-name"
            id={fullyQualifiedName.replace(/\./g, '')}
            to={entitiyLink}
            onClick={() => onOptionSelection()}>
            {database && schema
              ? `${database}${FQN_SEPARATOR_CHAR}${schema}${FQN_SEPARATOR_CHAR}${name}`
              : name}
          </Link>
        </div>
      </Select.Option>
    );
  };

  const getEntitiesSuggestions = () => {
    return (
      <>
        {tableSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.TABLE)}

            {tableSuggestions.map((suggestion) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement({
                fullyQualifiedName,
                serviceType,
                name,
                index: SearchIndex.TABLE,
              });
            })}
          </>
        )}
        {topicSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.TOPIC)}

            {topicSuggestions.map((suggestion) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement({
                fullyQualifiedName,
                serviceType,
                name,
                index: SearchIndex.TOPIC,
              });
            })}
          </>
        )}
        {dashboardSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.DASHBOARD)}

            {dashboardSuggestions.map((suggestion) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement({
                fullyQualifiedName,
                serviceType,
                name,
                index: SearchIndex.DASHBOARD,
              });
            })}
          </>
        )}
        {pipelineSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.PIPELINE)}

            {pipelineSuggestions.map((suggestion) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement({
                fullyQualifiedName,
                serviceType,
                name,
                index: SearchIndex.PIPELINE,
              });
            })}
          </>
        )}
        {mlModelSuggestions.length > 0 && (
          <>
            {getGroupLabel(SearchIndex.MLMODEL)}

            {mlModelSuggestions.map((suggestion) => {
              const { fullyQualifiedName, name, serviceType } = suggestion;

              return getSuggestionElement({
                fullyQualifiedName,
                serviceType,
                name,
                index: SearchIndex.MLMODEL,
              });
            })}
          </>
        )}
      </>
    );
  };

  useEffect(() => {
    if (!isMounting.current) {
      suggestQuery({ query: searchText, fetchSource: true })
        .then((res) => {
          setOptions(res);
          setSuggestions(res);
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['fetch-suggestions-error']
          );
        })
        .finally(() => {
          handleIsSuggestionsLoading(false);
        });
    }
  }, [searchText]);

  // always Keep this useEffect at the end...
  useEffect(() => {
    isMounting.current = false;
  }, []);

  return (
    <div className="tw-flex tw-items-center tw-border tw-rounded">
      <SVGIcons
        alt={Icons.SEARCHV1}
        className="tw-ml-2 tw-mr-1 tw-h-4"
        icon={Icons.SEARCHV1}
      />
      <Select
        autoFocus
        showSearch
        bordered={false}
        className="global-search-input"
        defaultActiveFirstOption={false}
        dropdownMatchSelectWidth={613}
        dropdownStyle={{
          paddingTop: '10px',
          boxShadow: 'none',
        }}
        filterOption={false}
        listHeight={220}
        notFoundContent={
          <div className="tw-flex tw-flex-col tw-w-full tw-h-56 tw-items-center tw-justify-center tw-pb-9">
            {isSuggestionsLoading ? (
              <Loader size="small" />
            ) : (
              <ErrorPlaceHolder classes="tw-mt-0 opacity-60">
                <Typography.Text className="tw-text-sm tw-grey-body ">
                  No Data Available
                </Typography.Text>
              </ErrorPlaceHolder>
            )}
          </div>
        }
        open={!isEmpty(value)}
        placeholder="Search"
        placement="bottomRight"
        ref={selectRef}
        size="large"
        style={{ width: '572px' }}
        suffixIcon={<CmdKIcon />}
        transitionName=""
        value={value}
        onChange={(value) => {
          history.push(value);
          onOptionSelection();
        }}
        onInputKeyDown={onInputKeyDown}
        onSearch={onSearch}>
        {options.length > 0 ? getEntitiesSuggestions() : null}
      </Select>
    </div>
  );
};

export default GlobalSearchSuggestions;
