/*
 *  Copyright 2021 Collate
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

import {
  EntityFieldThreadCount,
  EntityFieldThreads,
  EntityThread,
  EntityThreadField,
} from 'Models';
import TurndownService from 'turndown';
import {
  getInitialEntity,
  getInitialUsers,
  getSuggestions,
  getUserSuggestions,
} from '../axiosAPIs/miscAPI';
import {
  entityLinkRegEx,
  entityRegex,
  EntityRegEx,
  hashtagRegEx,
  linkRegEx,
  mentionRegEx,
} from '../constants/feed.constants';
import { getRelativeDateByTimeStamp } from './TimeUtils';

export const getEntityType = (entityLink: string) => {
  const match = EntityRegEx.exec(entityLink);

  return match?.[1];
};
export const getEntityFQN = (entityLink: string) => {
  const match = EntityRegEx.exec(entityLink);

  return match?.[2];
};
export const getEntityField = (entityLink: string) => {
  const match = EntityRegEx.exec(entityLink);

  return match?.[3];
};

export const getFeedListWithRelativeDays = (feedList: EntityThread[]) => {
  const updatedFeedList = feedList.map((feed) => ({
    ...feed,
    relativeDay: getRelativeDateByTimeStamp(feed.updatedAt),
  }));
  const relativeDays = [...new Set(updatedFeedList.map((f) => f.relativeDay))];

  return { updatedFeedList, relativeDays };
};

export const HTMLToMarkdown = new TurndownService({
  bulletListMarker: '-',
  fence: '```',
  codeBlockStyle: 'fenced',
})
  .addRule('codeblock', {
    filter: ['pre'],
    replacement: function (content: string) {
      return '```\n' + content + '\n```';
    },
  })
  .addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: function (content: string) {
      return '~~' + content + '~~';
    },
  });

export const getReplyText = (count: number) => {
  if (count === 0) return 'Reply in thread';
  if (count === 1) return `${count} Reply`;

  return `${count} Replies`;
};

export const getEntityFieldThreadCounts = (
  field: EntityThreadField,
  entityFieldThreadCount: EntityFieldThreadCount[]
) => {
  const entityFieldThreads: EntityFieldThreads[] = [];

  entityFieldThreadCount.map((fieldCount) => {
    const entityField = getEntityField(fieldCount.entityLink);
    if (entityField?.startsWith(field)) {
      entityFieldThreads.push({
        entityLink: fieldCount.entityLink,
        count: fieldCount.count,
        entityField,
      });
    }
  });

  return entityFieldThreads;
};

export const getThreadField = (value: string, separator = '/') => {
  return value.split(separator).slice(-2);
};

export async function suggestions(searchTerm: string, mentionChar: string) {
  if (mentionChar === '@') {
    let atValues = [];
    if (!searchTerm) {
      const data = await getInitialUsers();
      const hits = data.data.hits.hits;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atValues = hits.map((hit: any) => {
        return {
          id: hit._id,
          value: `@${hit._source.display_name}`,
          link: `${document.location.protocol}//${document.location.host}/${hit._source.entity_type}/${hit._source.name}`,
        };
      });
    } else {
      const data = await getUserSuggestions(searchTerm);
      const hits = data.data.suggest['table-suggest'][0]['options'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atValues = hits.map((hit: any) => {
        return {
          id: hit._id,
          value: `@${hit._source.display_name}`,
          link: `${document.location.protocol}//${document.location.host}/${hit._source.entity_type}/${hit._source.name}`,
        };
      });
    }

    return atValues;
  } else {
    let hashValues = [];
    if (!searchTerm) {
      const data = await getInitialEntity();
      const hits = data.data.hits.hits;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hashValues = hits.map((hit: any) => {
        return {
          id: hit._id,
          value: `#${hit._source.name}`,
          link: `${document.location.protocol}//${document.location.host}/${hit._source.entity_type}/${hit._source.fqdn}`,
        };
      });
    } else {
      const data = await getSuggestions(searchTerm);
      const hits = data.data.suggest['table-suggest'][0]['options'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hashValues = hits.map((hit: any) => {
        return {
          id: hit._id,
          value: `#${hit._source.name}`,
          link: `${document.location.protocol}//${document.location.host}/${hit._source.entity_type}/${hit._source.fqdn}`,
        };
      });
    }

    return hashValues;
  }
}

export async function matcher(
  searchTerm: string,
  renderList: Function,
  mentionChar: string
) {
  const matches = await suggestions(searchTerm, mentionChar);
  renderList(matches, searchTerm);
}

const getMentionList = (message: string) => {
  return message.match(mentionRegEx);
};

const getHahsTagList = (message: string) => {
  return message.match(hashtagRegEx);
};

const getEntityDetail = (item: string) => {
  return item.match(linkRegEx);
};

const getEntityLinkList = (message: string) => {
  return message.match(entityLinkRegEx);
};

const getEntityLinkDetail = (item: string) => {
  return item.match(entityRegex);
};

export const getBackendFormat = (message: string) => {
  let updatedMessage = message;
  const mentionList = getMentionList(message) ?? [];
  const hashtagList = getHahsTagList(message) ?? [];

  mentionList.forEach((m) => {
    const details = getEntityDetail(m) ?? [];
    const updatedDetails = details.slice(-2);
    const entityLink = `<#E/${updatedDetails[0]}/${updatedDetails[1]}|${m}>`;
    updatedMessage = updatedMessage.replace(m, entityLink);
  });
  hashtagList.forEach((h) => {
    const details = getEntityDetail(h) ?? [];
    const updatedDetails = details.slice(-2);
    const entityLink = `<#E/${updatedDetails[0]}/${updatedDetails[1]}|${h}>`;
    updatedMessage = updatedMessage.replace(h, entityLink);
  });

  return updatedMessage;
};

export const getFrontEndFormat = (message: string) => {
  let updatedMessage = message;
  const entityLinkList = getEntityLinkList(message) ?? [];

  entityLinkList.forEach((m) => {
    const details = getEntityLinkDetail(m) ?? [];
    const markdownLink = details[3];
    updatedMessage = updatedMessage.replace(m, markdownLink);
  });

  return updatedMessage;
};
