/*
 *  Copyright 2023 Collate.
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
import { SearchOutlined } from '@ant-design/icons';
import i18next from 'i18next';
import { ReactComponent as ClassificationIcon } from '../assets/svg/classification.svg';
import { ReactComponent as IconDataModel } from '../assets/svg/data-model.svg';
import { ReactComponent as GlossaryIcon } from '../assets/svg/glossary.svg';
import { ReactComponent as DashboardIcon } from '../assets/svg/ic-dashboard.svg';
import { ReactComponent as DataProductIcon } from '../assets/svg/ic-data-product.svg';
import { ReactComponent as DatabaseIcon } from '../assets/svg/ic-database.svg';
import { ReactComponent as MlModelIcon } from '../assets/svg/ic-ml-model.svg';
import { ReactComponent as PipelineIcon } from '../assets/svg/ic-pipeline.svg';
import { ReactComponent as SchemaIcon } from '../assets/svg/ic-schema.svg';
import { ReactComponent as ContainerIcon } from '../assets/svg/ic-storage.svg';
import { ReactComponent as IconStoredProcedure } from '../assets/svg/ic-stored-procedure.svg';
import { ReactComponent as TableIcon } from '../assets/svg/ic-table.svg';
import { ReactComponent as TopicIcon } from '../assets/svg/ic-topic.svg';
import { ReactComponent as IconTable } from '../assets/svg/table-grey.svg';
import { ExploreSearchIndex } from '../components/Explore/ExplorePage.interface';
import { SourceType } from '../components/SearchedData/SearchedData.interface';
import {
  COMMON_DROPDOWN_ITEMS,
  CONTAINER_DROPDOWN_ITEMS,
  DASHBOARD_DATA_MODEL_TYPE,
  DASHBOARD_DROPDOWN_ITEMS,
  DATA_PRODUCT_DROPDOWN_ITEMS,
  GLOSSARY_DROPDOWN_ITEMS,
  ML_MODEL_DROPDOWN_ITEMS,
  PIPELINE_DROPDOWN_ITEMS,
  SEARCH_INDEX_DROPDOWN_ITEMS,
  TABLE_DROPDOWN_ITEMS,
  TAG_DROPDOWN_ITEMS,
  TOPIC_DROPDOWN_ITEMS,
} from '../constants/AdvancedSearch.constants';
import {
  entitySortingFields,
  INITIAL_SORT_FIELD,
  tableSortingFields,
  tagSortingFields,
  TAGS_INITIAL_SORT_FIELD,
  TAGS_INITIAL_SORT_ORDER,
} from '../constants/explore.constants';
import {
  Option,
  SearchSuggestions,
} from '../context/GlobalSearchProvider/GlobalSearchSuggestions/GlobalSearchSuggestions.interface';
import { EntityType } from '../enums/entity.enum';
import { ExplorePageTabs } from '../enums/Explore.enum';
import { SearchIndex } from '../enums/search.enum';
import { TestSuite } from '../generated/tests/testCase';
import { SearchSourceAlias } from '../interface/search.interface';
import { TabsInfoData } from '../pages/ExplorePage/ExplorePage.interface';
import {
  getEntityBreadcrumbs,
  getEntityLinkFromType,
  getEntityName,
} from './EntityUtils';
import i18n from './i18next/LocalUtil';
import { getServiceIcon } from './TableUtils';
import { getTestSuiteDetailsPath, getTestSuiteFQN } from './TestSuiteUtils';

class SearchClassBase {
  public getEntityTypeSearchIndexMapping(): Record<string, SearchIndex> {
    return {
      [EntityType.ALL]: SearchIndex.ALL,
      [EntityType.TABLE]: SearchIndex.TABLE,
      [EntityType.CHART]: SearchIndex.CHART,
      [EntityType.PIPELINE]: SearchIndex.PIPELINE,
      [EntityType.DASHBOARD]: SearchIndex.DASHBOARD,
      [EntityType.MLMODEL]: SearchIndex.MLMODEL,
      [EntityType.TOPIC]: SearchIndex.TOPIC,
      [EntityType.CONTAINER]: SearchIndex.CONTAINER,
      [EntityType.TAG]: SearchIndex.TAG,
      [EntityType.GLOSSARY_TERM]: SearchIndex.GLOSSARY_TERM,
      [EntityType.STORED_PROCEDURE]: SearchIndex.STORED_PROCEDURE,
      [EntityType.DASHBOARD_DATA_MODEL]: SearchIndex.DASHBOARD_DATA_MODEL,
      [EntityType.SEARCH_INDEX]: SearchIndex.SEARCH_INDEX,
      [EntityType.DATABASE_SERVICE]: SearchIndex.DATABASE_SERVICE,
      [EntityType.MESSAGING_SERVICE]: SearchIndex.MESSAGING_SERVICE,
      [EntityType.DASHBOARD_SERVICE]: SearchIndex.DASHBOARD_SERVICE,
      [EntityType.PIPELINE_SERVICE]: SearchIndex.PIPELINE_SERVICE,
      [EntityType.MLMODEL_SERVICE]: SearchIndex.ML_MODEL_SERVICE,
      [EntityType.STORAGE_SERVICE]: SearchIndex.STORAGE_SERVICE,
      [EntityType.SEARCH_SERVICE]: SearchIndex.SEARCH_SERVICE,
      [EntityType.DOMAIN]: SearchIndex.DOMAIN,
      [EntityType.DATA_PRODUCT]: SearchIndex.DATA_PRODUCT,
      [EntityType.DATABASE]: SearchIndex.DATABASE,
      [EntityType.DATABASE_SCHEMA]: SearchIndex.DATABASE_SCHEMA,
      [EntityType.USER]: SearchIndex.USER,
      [EntityType.TEAM]: SearchIndex.TEAM,
      [EntityType.TEST_CASE]: SearchIndex.TEST_CASE,
      [EntityType.TEST_SUITE]: SearchIndex.TEST_SUITE,
      [EntityType.GLOSSARY]: SearchIndex.GLOSSARY,
      [EntityType.INGESTION_PIPELINE]: SearchIndex.INGESTION_PIPELINE,
    };
  }

  public getSearchIndexEntityTypeMapping(): Partial<
    Record<SearchIndex, EntityType>
  > {
    return {
      [SearchIndex.ALL]: EntityType.ALL,
      [SearchIndex.TABLE]: EntityType.TABLE,
      [SearchIndex.CHART]: EntityType.CHART,
      [SearchIndex.PIPELINE]: EntityType.PIPELINE,
      [SearchIndex.DASHBOARD]: EntityType.DASHBOARD,
      [SearchIndex.MLMODEL]: EntityType.MLMODEL,
      [SearchIndex.TOPIC]: EntityType.TOPIC,
      [SearchIndex.CONTAINER]: EntityType.CONTAINER,
      [SearchIndex.TAG]: EntityType.TAG,
      [SearchIndex.GLOSSARY_TERM]: EntityType.GLOSSARY_TERM,
      [SearchIndex.STORED_PROCEDURE]: EntityType.STORED_PROCEDURE,
      [SearchIndex.DASHBOARD_DATA_MODEL]: EntityType.DASHBOARD_DATA_MODEL,
      [SearchIndex.SEARCH_INDEX]: EntityType.SEARCH_INDEX,
      [SearchIndex.DATABASE_SERVICE]: EntityType.DATABASE_SERVICE,
      [SearchIndex.MESSAGING_SERVICE]: EntityType.MESSAGING_SERVICE,
      [SearchIndex.DASHBOARD_SERVICE]: EntityType.DASHBOARD_SERVICE,
      [SearchIndex.PIPELINE_SERVICE]: EntityType.PIPELINE_SERVICE,
      [SearchIndex.ML_MODEL_SERVICE]: EntityType.MLMODEL_SERVICE,
      [SearchIndex.STORAGE_SERVICE]: EntityType.STORAGE_SERVICE,
      [SearchIndex.SEARCH_SERVICE]: EntityType.SEARCH_SERVICE,
      [SearchIndex.DOMAIN]: EntityType.DOMAIN,
      [SearchIndex.DATA_PRODUCT]: EntityType.DATA_PRODUCT,
      [SearchIndex.DATABASE]: EntityType.DATABASE,
      [SearchIndex.DATABASE_SCHEMA]: EntityType.DATABASE_SCHEMA,
      [SearchIndex.USER]: EntityType.USER,
      [SearchIndex.TEAM]: EntityType.TEAM,
      [SearchIndex.TEST_CASE]: EntityType.TEST_CASE,
      [SearchIndex.TEST_SUITE]: EntityType.TEST_SUITE,
      [SearchIndex.GLOSSARY]: EntityType.GLOSSARY,
      [SearchIndex.INGESTION_PIPELINE]: EntityType.INGESTION_PIPELINE,
    };
  }

  public getGlobalSearchOptions() {
    return [
      { value: '', label: i18n.t('label.all') },
      { value: SearchIndex.TABLE, label: i18n.t('label.table') },
      { value: SearchIndex.TOPIC, label: i18n.t('label.topic') },
      { value: SearchIndex.DASHBOARD, label: i18n.t('label.dashboard') },
      { value: SearchIndex.PIPELINE, label: i18n.t('label.pipeline') },
      { value: SearchIndex.MLMODEL, label: i18n.t('label.ml-model') },
      { value: SearchIndex.CONTAINER, label: i18n.t('label.container') },
      {
        value: SearchIndex.STORED_PROCEDURE,
        label: i18n.t('label.stored-procedure'),
      },
      {
        value: SearchIndex.DASHBOARD_DATA_MODEL,
        label: i18n.t('label.data-model'),
      },
      { value: SearchIndex.GLOSSARY_TERM, label: i18n.t('label.glossary') },
      { value: SearchIndex.TAG, label: i18n.t('label.tag') },
      { value: SearchIndex.SEARCH_INDEX, label: i18n.t('label.search-index') },
      { value: SearchIndex.DATA_PRODUCT, label: i18n.t('label.data-product') },
    ];
  }

  public getTabsInfo(): Record<ExploreSearchIndex, TabsInfoData> {
    return {
      [SearchIndex.TABLE]: {
        label: i18n.t('label.table-plural'),
        sortingFields: tableSortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.TABLES,
        icon: TableIcon,
      },
      [SearchIndex.STORED_PROCEDURE]: {
        label: i18n.t('label.stored-procedure-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.STORED_PROCEDURE,
        icon: IconStoredProcedure,
      },
      [SearchIndex.DATABASE]: {
        label: i18n.t('label.database-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.DATABASE,
        icon: DatabaseIcon,
      },
      [SearchIndex.DATABASE_SCHEMA]: {
        label: i18n.t('label.database-schema-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.DATABASE_SCHEMA,
        icon: SchemaIcon,
      },
      [SearchIndex.DASHBOARD]: {
        label: i18n.t('label.dashboard-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.DASHBOARDS,
        icon: DashboardIcon,
      },
      [SearchIndex.DASHBOARD_DATA_MODEL]: {
        label: i18n.t('label.dashboard-data-model-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.DASHBOARD_DATA_MODEL,
        icon: IconDataModel,
      },
      [SearchIndex.PIPELINE]: {
        label: i18n.t('label.pipeline-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.PIPELINES,
        icon: PipelineIcon,
      },
      [SearchIndex.TOPIC]: {
        label: i18n.t('label.topic-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.TOPICS,
        icon: TopicIcon,
      },
      [SearchIndex.MLMODEL]: {
        label: i18n.t('label.ml-model-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.MLMODELS,
        icon: MlModelIcon,
      },
      [SearchIndex.CONTAINER]: {
        label: i18n.t('label.container-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.CONTAINERS,
        icon: ContainerIcon,
      },
      [SearchIndex.SEARCH_INDEX]: {
        label: i18n.t('label.search-index-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.SEARCH_INDEX,
        icon: SearchOutlined,
      },
      [SearchIndex.GLOSSARY_TERM]: {
        label: i18n.t('label.glossary-term-plural'),
        sortingFields: entitySortingFields,
        sortField: INITIAL_SORT_FIELD,
        path: ExplorePageTabs.GLOSSARY,
        icon: GlossaryIcon,
      },
      [SearchIndex.TAG]: {
        label: i18n.t('label.tag-plural'),
        sortingFields: tagSortingFields,
        sortField: TAGS_INITIAL_SORT_FIELD,
        sortOrder: TAGS_INITIAL_SORT_ORDER,
        path: ExplorePageTabs.TAG,
        icon: ClassificationIcon,
      },
      [SearchIndex.DATA_PRODUCT]: {
        label: i18n.t('label.data-product-plural'),
        sortingFields: tagSortingFields,
        sortField: TAGS_INITIAL_SORT_FIELD,
        sortOrder: TAGS_INITIAL_SORT_ORDER,
        path: ExplorePageTabs.DATA_PRODUCT,
        icon: DataProductIcon,
      },
    };
  }
  public getDropDownItems(index: string) {
    switch (index) {
      case SearchIndex.TABLE:
        return [...COMMON_DROPDOWN_ITEMS, ...TABLE_DROPDOWN_ITEMS];

      case SearchIndex.TOPIC:
        return [...COMMON_DROPDOWN_ITEMS, ...TOPIC_DROPDOWN_ITEMS];

      case SearchIndex.DASHBOARD:
        return [...COMMON_DROPDOWN_ITEMS, ...DASHBOARD_DROPDOWN_ITEMS];

      case SearchIndex.PIPELINE:
        return [...COMMON_DROPDOWN_ITEMS, ...PIPELINE_DROPDOWN_ITEMS];

      case SearchIndex.SEARCH_INDEX:
        return [...COMMON_DROPDOWN_ITEMS, ...SEARCH_INDEX_DROPDOWN_ITEMS];

      case SearchIndex.MLMODEL:
        return [...COMMON_DROPDOWN_ITEMS, ...ML_MODEL_DROPDOWN_ITEMS];
      case SearchIndex.CONTAINER:
        return [...COMMON_DROPDOWN_ITEMS, ...CONTAINER_DROPDOWN_ITEMS];
      case SearchIndex.DASHBOARD_DATA_MODEL:
        return [...COMMON_DROPDOWN_ITEMS, ...DASHBOARD_DATA_MODEL_TYPE];
      case SearchIndex.GLOSSARY_TERM:
        return GLOSSARY_DROPDOWN_ITEMS;
      case SearchIndex.TAG:
        return TAG_DROPDOWN_ITEMS;
      case SearchIndex.DATA_PRODUCT:
        return DATA_PRODUCT_DROPDOWN_ITEMS;
      case SearchIndex.STORED_PROCEDURE:
      case SearchIndex.DATABASE:
      case SearchIndex.DATABASE_SCHEMA:
        return COMMON_DROPDOWN_ITEMS;

      default:
        return [];
    }
  }

  public getListOfEntitiesWithoutTier() {
    return [
      EntityType.GLOSSARY_TERM,
      EntityType.TAG,
      EntityType.DATA_PRODUCT,
      EntityType.TEST_CASE,
    ];
  }

  public getServiceIcon(source: SearchSourceAlias) {
    return getServiceIcon(source);
  }

  public getListOfEntitiesWithoutDomain(): string[] {
    return [EntityType.TEST_CASE];
  }

  public getEntityBreadcrumbs(
    entity: SearchSourceAlias,
    entityType?: EntityType,
    includeCurrent?: boolean
  ) {
    return getEntityBreadcrumbs(entity, entityType, includeCurrent);
  }

  public getEntityLink(
    entity: SearchSourceAlias
  ): string | { pathname: string } {
    if (entity.entityType === EntityType.TEST_SUITE) {
      return getTestSuiteDetailsPath({
        isExecutableTestSuite: (entity as TestSuite).executable,
        fullyQualifiedName: entity.fullyQualifiedName ?? '',
      });
    }

    if (entity.fullyQualifiedName && entity.entityType) {
      return getEntityLinkFromType(
        entity.fullyQualifiedName,
        entity.entityType as EntityType,
        entity
      );
    }

    return '';
  }

  public getEntityName(entity: SearchSourceAlias) {
    if (entity.entityType === EntityType.TEST_SUITE) {
      return getTestSuiteFQN(getEntityName(entity));
    }

    return getEntityName(entity);
  }

  public getSearchEntityLinkTarget(
    _source: SearchSourceAlias,
    openEntityInNewPage?: boolean
  ) {
    return openEntityInNewPage ? '_blank' : '_self';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getEntitySummaryComponent(_entity: SourceType): JSX.Element | null {
    return null;
  }

  public getEntitiesSuggestions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: Array<Option>
  ): Array<{ suggestions: SearchSuggestions; searchIndex: SearchIndex }> {
    return [];
  }

  public getIndexGroupLabel(index: string) {
    switch (index) {
      case SearchIndex.TABLE:
      default:
        return {
          label: i18next.t('label.table-plural'),
          GroupIcon: IconTable,
        };
    }
  }
}

const searchClassBase = new SearchClassBase();

export default searchClassBase;

export { SearchClassBase };
