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

import { isArray, isObject, transform } from 'lodash';
import { SearchIndex } from '../enums/search.enum';
import { GlossaryTerm } from '../generated/entity/data/glossaryTerm';
import { DataProduct } from '../generated/entity/domains/dataProduct';
import { Domain } from '../generated/entity/domains/domain';
import { Team } from '../generated/entity/teams/team';
import { User } from '../generated/entity/teams/user';
import { SearchResponse } from '../interface/search.interface';

export type SearchEntityHits = SearchResponse<
  | SearchIndex.DATA_PRODUCT
  | SearchIndex.PIPELINE
  | SearchIndex.DASHBOARD
  | SearchIndex.TABLE
  | SearchIndex.MLMODEL
  | SearchIndex.DATABASE
  | SearchIndex.DATABASE_SCHEMA
  | SearchIndex.TOPIC
  | SearchIndex.CONTAINER
  | SearchIndex.STORED_PROCEDURE
  | SearchIndex.DASHBOARD_DATA_MODEL
  | SearchIndex.GLOSSARY_TERM
  | SearchIndex.TAG
  | SearchIndex.SEARCH_INDEX
>['hits']['hits'];

export const formatUsersResponse = (
  hits: SearchResponse<SearchIndex.USER>['hits']['hits']
): User[] => {
  return hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName,
      fullyQualifiedName: d._source.fullyQualifiedName,
      email: d._source.email,
      type: d._source.entityType,
      id: d._source.id,
      teams: d._source.teams,
      roles: d._source.roles,
      href: d._source.href,
    };
  });
};

export const formatTeamsResponse = (
  hits: SearchResponse<SearchIndex.TEAM>['hits']['hits']
): Team[] => {
  return hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName,
      type: d._source.entityType,
      id: d._source.id,
      isJoinable: d._source.isJoinable,
      teamType: d._source.teamType,
      href: d._source.href,
    };
  });
};

export const formatDomainsResponse = (
  hits: SearchResponse<SearchIndex.DOMAIN>['hits']['hits']
): Domain[] => {
  return hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName,
      description: d._source.description,
      fullyQualifiedName: d._source.fullyQualifiedName,
      type: d._source.entityType,
      id: d._source.id,
      href: d._source.href,
      domainType: d._source.domainType,
      experts: d._source.experts,
      parent: d._source.parent,
      owners: d._source.owners,
    };
  });
};

export const formatDataProductResponse = (
  hits: SearchResponse<SearchIndex.DATA_PRODUCT>['hits']['hits']
): DataProduct[] => {
  return hits.map((d) => {
    return {
      name: d._source.name,
      displayName: d._source.displayName ?? '',
      description: d._source.description ?? '',
      fullyQualifiedName: d._source.fullyQualifiedName,
      type: d._source.entityType,
      id: d._source.id,
      href: d._source.href,
      domain: d._source.domain,
      experts: d._source.experts,
      owners: d._source.owners,
    };
  });
};

export const formatSearchGlossaryTermResponse = (
  hits: SearchResponse<SearchIndex.GLOSSARY_TERM>['hits']['hits']
): GlossaryTerm[] => {
  return hits.map((d) => ({
    name: d._source.name,
    description: d._source.description,
    id: d._source.id,
    glossary: d._source.glossary,
    displayName: d._source.displayName,
    fqdn: d._source.fullyQualifiedName,
    fullyQualifiedName: d._source.fullyQualifiedName,
    type: d._source.entityType || 'glossaryTerm',
  }));
};

export const omitDeep = <T>(
  obj: T,
  predicate: (value: string, key: string | number | symbol) => boolean
): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return transform(obj as any, function (result, value, key) {
    if (isObject(value)) {
      value = omitDeep(value, predicate) as unknown as string;
    }
    const doOmit = predicate(value, key);
    if (!doOmit) {
      if (isArray(obj) && isArray(result)) {
        result.push(value);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = value;
      }
    }
  });
};
