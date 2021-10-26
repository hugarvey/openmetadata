import { isNil } from 'lodash';
import {
  getDatabaseDetailsPath,
  getServiceDetailsPath,
  getTeamDetailsPath,
} from '../constants/constants';
import { EntityType } from '../enums/entity.enum';
import { Dashboard } from '../generated/entity/data/dashboard';
import { Pipeline } from '../generated/entity/data/pipeline';
import { Table } from '../generated/entity/data/table';
import { Topic } from '../generated/entity/data/topic';
import { TagLabel } from '../generated/type/tagLabel';
import { getPartialNameFromFQN } from './CommonUtils';
import {
  getOwnerFromId,
  getTierFromTableTags,
  getUsagePercentile,
} from './TableUtils';
import { getTableTags } from './TagsUtils';
import { getRelativeDay } from './TimeUtils';

export const getEntityTags = (
  type: string,
  entityDetail: Partial<Table> &
    Partial<Pipeline> &
    Partial<Dashboard> &
    Partial<Topic>
): Array<string | undefined> => {
  switch (type) {
    case EntityType.TABLE: {
      const tableTags: Array<TagLabel> = [
        ...getTableTags(entityDetail.columns || []),
        ...(entityDetail.tags || []),
      ];

      return tableTags.map((t) => t.tagFQN);
    }
    case EntityType.PIPELINE: {
      return entityDetail.tags?.map((t) => t.tagFQN) || [];
    }

    default:
      return [];
  }
};

export const getEntityOverview = (
  type: string,
  entityDetail: Partial<Table> &
    Partial<Pipeline> &
    Partial<Dashboard> &
    Partial<Topic>,
  serviceType: string
): Array<{
  name: string;
  value: string;
  isLink: boolean;
  isExternal?: boolean;
  url?: string;
}> => {
  switch (type) {
    case EntityType.TABLE: {
      const { fullyQualifiedName, owner, tags, usageSummary, tableProfile } =
        entityDetail;
      const [service, database] = getPartialNameFromFQN(
        fullyQualifiedName ?? '',
        ['service', 'database'],
        '.'
      ).split('.');
      const ownerValue = getOwnerFromId(owner?.id);
      const tier = getTierFromTableTags(tags || []);
      const usage = !isNil(usageSummary?.weeklyStats?.percentileRank)
        ? getUsagePercentile(usageSummary?.weeklyStats?.percentileRank || 0)
        : '--';
      const queries = usageSummary?.weeklyStats?.count.toLocaleString() || '--';
      const getProfilerRowDiff = (tableProfile: Table['tableProfile']) => {
        let retDiff;
        if (tableProfile && tableProfile.length > 0) {
          let rowDiff: string | number = tableProfile[0].rowCount || 0;
          const dayDiff = getRelativeDay(
            tableProfile[0].profileDate
              ? new Date(tableProfile[0].profileDate).getTime()
              : Date.now()
          );
          if (tableProfile.length > 1) {
            rowDiff = rowDiff - (tableProfile[1].rowCount || 0);
          }
          retDiff = `${(rowDiff >= 0 ? '+' : '') + rowDiff} rows ${dayDiff}`;
        }

        return retDiff;
      };

      const profilerRowDiff = getProfilerRowDiff(tableProfile);
      const overview = [
        {
          name: 'Service',
          value: service,
          url: getServiceDetailsPath(service, serviceType),
          isLink: true,
        },
        {
          name: 'Database',
          value: database,
          url: getDatabaseDetailsPath(
            getPartialNameFromFQN(
              fullyQualifiedName ?? '',
              ['service', 'database'],
              '.'
            )
          ),
          isLink: true,
        },
        {
          name: 'Owner',
          value: ownerValue?.displayName || ownerValue?.name || '--',
          url: getTeamDetailsPath(owner?.name || ''),
          isLink: ownerValue
            ? ownerValue.type === 'team'
              ? true
              : false
            : false,
        },
        {
          name: 'Tier',
          value: tier ? tier.split('.')[1] : '--',
          isLink: false,
        },
        {
          name: 'Usage',
          value: usage,
          isLink: false,
        },
        {
          name: 'Queries',
          value: `${queries} past week`,
          isLink: false,
        },
        {
          name: 'Rows',
          value:
            tableProfile && tableProfile[0]?.rowCount
              ? tableProfile[0].rowCount
              : '--',
          isLink: false,
        },
        {
          name: 'Columns',
          value:
            tableProfile && tableProfile[0]?.columnCount
              ? tableProfile[0].columnCount
              : '--',
          isLink: false,
        },
      ];
      if (!isNil(profilerRowDiff)) {
        overview.push({ value: profilerRowDiff, name: '', isLink: false });
      }

      return overview;
    }

    case EntityType.PIPELINE: {
      const { owner, tags, pipelineUrl, service, fullyQualifiedName } =
        entityDetail;
      const ownerValue = getOwnerFromId(owner?.id);
      const tier = getTierFromTableTags(tags || []);

      const overview = [
        {
          name: 'Service',
          value: service?.name as string,
          url: getServiceDetailsPath(service?.name as string, serviceType),
          isLink: true,
        },
        {
          name: 'Owner',
          value: ownerValue?.displayName || ownerValue?.name || '--',
          url: getTeamDetailsPath(owner?.name || ''),
          isLink: ownerValue
            ? ownerValue.type === 'team'
              ? true
              : false
            : false,
        },
        {
          name: 'Tier',
          value: tier ? tier.split('.')[1] : '--',
          isLink: false,
        },
        {
          name: `${serviceType} url`,
          value: fullyQualifiedName?.split('.')[1] as string,
          url: pipelineUrl as string,
          isLink: true,
          isExternal: true,
        },
      ];

      return overview;
    }

    default:
      return [];
  }
};
