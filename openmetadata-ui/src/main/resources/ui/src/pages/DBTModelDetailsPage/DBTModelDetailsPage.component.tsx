import { AxiosResponse } from 'axios';
import { compare } from 'fast-json-patch';
import { observer } from 'mobx-react';
import { EntityTags } from 'Models';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AppState from '../../AppState';
import { getDatabase } from '../../axiosAPIs/databaseAPI';
import {
  addFollower,
  getDBTModelDetailsByFQN,
  patchDBTModelDetails,
  removeFollower,
} from '../../axiosAPIs/dbtModelAPI';
import { getServiceById } from '../../axiosAPIs/serviceAPI';
import { TitleBreadcrumbProps } from '../../components/common/title-breadcrumb/title-breadcrumb.interface';
import DBTModelDetails from '../../components/DBTModelDetails/DBTModelDetails.component';
import Loader from '../../components/Loader/Loader';
import {
  getDatabaseDetailsPath,
  getDBTModelDetailsPath,
  getServiceDetailsPath,
} from '../../constants/constants';
import { EntityType } from '../../enums/entity.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { Dbtmodel } from '../../generated/entity/data/dbtmodel';
import { User } from '../../generated/entity/teams/user';
import { addToRecentViewed, getCurrentUserId } from '../../utils/CommonUtils';
import {
  dbtModelTabs,
  getCurrentDBTModelTab,
} from '../../utils/DBTModelDetailsUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import { getOwnerFromId } from '../../utils/TableUtils';
import { getTableTags } from '../../utils/TagsUtils';

const DBTModelDetailsPage: FunctionComponent = () => {
  const history = useHistory();
  const USERId = getCurrentUserId();
  const { dbtModelFQN: dbtModelFQN, tab } = useParams() as Record<
    string,
    string
  >;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(
    getCurrentDBTModelTab(tab)
  );
  const [dbtModelDetails, setDbtModelDetails] = useState<Dbtmodel>(
    {} as Dbtmodel
  );
  const [, setCurrentVersion] = useState<string>();

  const [dbtModelId, setDbtModelId] = useState('');
  //   const [tier, setTier] = useState<string>();
  const [name, setName] = useState('');
  const [followers, setFollowers] = useState<Array<User>>([]);
  const [slashedTableName, setSlashedTableName] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<Dbtmodel['columns']>([]);
  const [tableTags, setTableTags] = useState<Array<EntityTags>>([]);
  const [owner, setOwner] = useState<
    Dbtmodel['owner'] & { displayName?: string }
  >();

  const activeTabHandler = (tabValue: number) => {
    const currentTabIndex = tabValue - 1;
    if (dbtModelTabs[currentTabIndex].path !== tab) {
      setActiveTab(getCurrentDBTModelTab(dbtModelTabs[currentTabIndex].path));
      history.push({
        pathname: getDBTModelDetailsPath(
          dbtModelFQN,
          dbtModelTabs[currentTabIndex].path
        ),
      });
    }
  };

  const saveUpdatedTableData = (
    updatedData: Dbtmodel
  ): Promise<AxiosResponse> => {
    const jsonPatch = compare(dbtModelDetails, updatedData);

    return patchDBTModelDetails(
      dbtModelId,
      jsonPatch
    ) as unknown as Promise<AxiosResponse>;
  };

  const descriptionUpdateHandler = (updatedTable: Dbtmodel) => {
    saveUpdatedTableData(updatedTable).then((res: AxiosResponse) => {
      const { description, version } = res.data;
      setCurrentVersion(version);
      setDbtModelDetails(res.data);
      setDescription(description);
    });
  };

  const columnsUpdateHandler = (updatedTable: Dbtmodel) => {
    saveUpdatedTableData(updatedTable).then((res: AxiosResponse) => {
      const { columns, version } = res.data;
      setCurrentVersion(version);
      setDbtModelDetails(res.data);
      setColumns(columns);
      setTableTags(getTableTags(columns || []));
    });
  };

  const settingsUpdateHandler = (updatedTable: Dbtmodel): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      saveUpdatedTableData(updatedTable)
        .then((res) => {
          const { version, owner } = res.data;
          setCurrentVersion(version);
          setDbtModelDetails(res.data);
          setOwner(getOwnerFromId(owner?.id));
          resolve();
        })
        .catch(() => reject());
    });
  };

  const followDBTModel = () => {
    addFollower(dbtModelId, USERId).then((res: AxiosResponse) => {
      const { newValue } = res.data.changeDescription.fieldsAdded[0];

      setFollowers([...followers, ...newValue]);
    });
  };
  const unfollowDBTModel = () => {
    removeFollower(dbtModelId, USERId).then((res: AxiosResponse) => {
      const { oldValue } = res.data.changeDescription.fieldsDeleted[0];

      setFollowers(
        followers.filter((follower) => follower.id !== oldValue[0].id)
      );
    });
  };

  useEffect(() => {
    if (dbtModelTabs[activeTab - 1].path !== tab) {
      setActiveTab(getCurrentDBTModelTab(tab));
    }
  }, [tab]);

  useEffect(() => {
    setIsLoading(true);
    getDBTModelDetailsByFQN(
      dbtModelFQN,
      'columns,owner,database,tags,followers,viewDefinition'
    )
      .then((res: AxiosResponse) => {
        const {
          description,
          id,
          name,
          columns,
          database,
          owner,
          followers,
          fullyQualifiedName,
          version,
        } = res.data;
        setDbtModelDetails(res.data);
        setDbtModelId(id);
        setCurrentVersion(version);
        setOwner(getOwnerFromId(owner?.id));
        setFollowers(followers);
        getDatabase(database.id, 'service').then((resDB: AxiosResponse) => {
          getServiceById('databaseServices', resDB.data.service?.id).then(
            (resService: AxiosResponse) => {
              setSlashedTableName([
                {
                  name: resService.data.name,
                  url: resService.data.name
                    ? getServiceDetailsPath(
                        resService.data.name,
                        resService.data.serviceType,
                        ServiceCategory.DATABASE_SERVICES
                      )
                    : '',
                  imgSrc: resService.data.serviceType
                    ? serviceTypeLogo(resService.data.serviceType)
                    : undefined,
                },
                {
                  name: resDB.data.name,
                  url: getDatabaseDetailsPath(resDB.data.fullyQualifiedName),
                },
                {
                  name: name,
                  url: '',
                  activeTitle: true,
                },
              ]);

              addToRecentViewed({
                entityType: EntityType.DBT_MODEL,
                fqn: fullyQualifiedName,
                serviceType: resService.data.serviceType,
                timestamp: 0,
              });
            }
          );
        });
        setName(name);

        setDescription(description);
        setColumns(columns || []);
        setTableTags(getTableTags(columns || []));
      })
      .finally(() => {
        setIsLoading(false);
      });

    setActiveTab(getCurrentDBTModelTab(tab));
  }, [dbtModelFQN]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <DBTModelDetails
          activeTab={activeTab}
          columns={columns}
          columnsUpdateHandler={columnsUpdateHandler}
          dbtModelDetails={dbtModelDetails}
          dbtModelFQN={dbtModelFQN}
          description={description}
          descriptionUpdateHandler={descriptionUpdateHandler}
          entityName={name}
          followers={followers}
          followTableHandler={followDBTModel}
          owner={owner as Dbtmodel['owner'] & { displayName: string }}
          setActiveTabHandler={activeTabHandler}
          settingsUpdateHandler={settingsUpdateHandler}
          slashedTableName={slashedTableName}
          tableTags={tableTags}
          unfollowTableHandler={unfollowDBTModel}
          users={AppState.users}
        />
      )}
    </>
  );
};

export default observer(DBTModelDetailsPage);
