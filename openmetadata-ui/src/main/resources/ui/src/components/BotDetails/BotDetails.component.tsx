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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button as AntdButton, Card, Select, Space, Typography } from 'antd';
import { AxiosError } from 'axios';
import { isArray, isEmpty, isNil, toLower } from 'lodash';
import React, {
  FC,
  Fragment,
  HTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { createBotWithPut } from '../../axiosAPIs/botsAPI';
import {
  createUserWithPut,
  getAuthMechanismForBotUser,
  getRoles,
} from '../../axiosAPIs/userAPI';
import { PAGE_SIZE_LARGE, TERM_ADMIN } from '../../constants/constants';
import {
  GlobalSettingOptions,
  GlobalSettingsMenuCategory,
} from '../../constants/globalSettings.constants';
import { EntityType } from '../../enums/entity.enum';
import { Bot, EntityReference } from '../../generated/entity/bot';
import { Role } from '../../generated/entity/teams/role';
import {
  AuthenticationMechanism,
  AuthType,
  User,
} from '../../generated/entity/teams/user';
import jsonData from '../../jsons/en';
import { getEntityName } from '../../utils/CommonUtils';
import { getSettingPath } from '../../utils/RouterUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import { Button } from '../buttons/Button/Button';
import Description from '../common/description/Description';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import PageLayout, { leftPanelAntCardStyle } from '../containers/PageLayout';
import ConfirmationModal from '../Modals/ConfirmationModal/ConfirmationModal';
import { OperationPermission } from '../PermissionProvider/PermissionProvider.interface';
import { Option, UserDetails } from '../Users/Users.interface';
import AuthMechanism from './AuthMechanism';
import AuthMechanismForm from './AuthMechanismForm';

interface BotsDetailProp extends HTMLAttributes<HTMLDivElement> {
  botUserData: User;
  botData: Bot;
  botPermission: OperationPermission;
  updateBotsDetails: (data: UserDetails) => Promise<void>;
  revokeTokenHandler: () => void;
  onEmailChange: () => void;
  isAdminUser: boolean;
  isAuthDisabled: boolean;
  updateUserDetails: (data: UserDetails) => Promise<void>;
}

const BotDetails: FC<BotsDetailProp> = ({
  botData,
  botUserData,
  updateBotsDetails,
  revokeTokenHandler,
  botPermission,
  onEmailChange,
  isAdminUser,
  isAuthDisabled,
  updateUserDetails,
}) => {
  const [displayName, setDisplayName] = useState(botData.displayName);
  const [isDisplayNameEdit, setIsDisplayNameEdit] = useState(false);
  const [isDescriptionEdit, setIsDescriptionEdit] = useState(false);
  const [isRevokingToken, setIsRevokingToken] = useState<boolean>(false);
  const [isRolesEdit, setIsRolesEdit] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Option | Array<Option>>(
    []
  );
  const [roles, setRoles] = useState<Array<Role>>([]);

  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const { t } = useTranslation();
  const [authenticationMechanism, setAuthenticationMechanism] =
    useState<AuthenticationMechanism>();

  const [isAuthMechanismEdit, setIsAuthMechanismEdit] =
    useState<boolean>(false);

  const editAllPermission = useMemo(
    () => botPermission.EditAll,
    [botPermission]
  );
  const displayNamePermission = useMemo(
    () => botPermission.EditDisplayName,
    [botPermission]
  );

  const descriptionPermission = useMemo(
    () => botPermission.EditDescription,
    [botPermission]
  );

  const fetchAuthMechanismForBot = async () => {
    try {
      const response = await getAuthMechanismForBotUser(botUserData.id);
      setAuthenticationMechanism(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRoles(
        '',
        undefined,
        undefined,
        false,
        PAGE_SIZE_LARGE
      );
      setRoles(response.data);
    } catch (err) {
      setRoles([]);
      showErrorToast(
        err as AxiosError,
        jsonData['api-error-messages']['fetch-roles-error']
      );
    }
  };

  const handleAuthMechanismUpdate = async (
    updatedAuthMechanism: AuthenticationMechanism
  ) => {
    setIsUpdating(true);
    try {
      const {
        isAdmin,
        timezone,
        name,
        description,
        displayName,
        profile,
        email,
        isBot,
      } = botUserData;
      const response = await createUserWithPut({
        isAdmin,
        timezone,
        name,
        description,
        displayName,
        profile,
        email,
        isBot,
        authenticationMechanism: {
          ...botUserData.authenticationMechanism,
          authType: updatedAuthMechanism.authType,
          config:
            updatedAuthMechanism.authType === AuthType.Jwt
              ? {
                  JWTTokenExpiry: updatedAuthMechanism.config?.JWTTokenExpiry,
                }
              : {
                  ssoServiceType: updatedAuthMechanism.config?.ssoServiceType,
                  authConfig: updatedAuthMechanism.config?.authConfig,
                },
        },
        botName: botData.name,
      });
      if (response) {
        await createBotWithPut({
          name: botData.name,
          description: botData.description,
          displayName: botData.displayName,
          botUser: { id: response.id, type: EntityType.USER },
        });
        fetchAuthMechanismForBot();
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsUpdating(false);
      setIsAuthMechanismEdit(false);
    }
  };

  const handleAuthMechanismEdit = () => setIsAuthMechanismEdit(true);

  const onDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };

  const handleDisplayNameChange = () => {
    if (displayName !== botData.displayName) {
      updateBotsDetails({ displayName: displayName || '' });
    }
    setIsDisplayNameEdit(false);
  };

  const handleDescriptionChange = async (description: string) => {
    await updateBotsDetails({ description });

    setIsDescriptionEdit(false);
  };

  const getDisplayNameComponent = () => {
    return (
      <div className="tw-mt-4 tw-w-full">
        {isDisplayNameEdit ? (
          <div className="tw-flex tw-items-center tw-gap-2">
            <input
              className="tw-form-inputs tw-form-inputs-padding tw-py-0.5 tw-w-full"
              data-testid="displayName"
              id="displayName"
              name="displayName"
              placeholder="displayName"
              type="text"
              value={displayName}
              onChange={onDisplayNameChange}
            />
            <div className="tw-flex tw-justify-end" data-testid="buttons">
              <Button
                className="tw-px-1 tw-py-1 tw-rounded tw-text-sm tw-mr-1"
                data-testid="cancel-displayName"
                size="custom"
                theme="primary"
                variant="contained"
                onMouseDown={() => setIsDisplayNameEdit(false)}>
                <FontAwesomeIcon className="tw-w-3.5 tw-h-3.5" icon="times" />
              </Button>
              <Button
                className="tw-px-1 tw-py-1 tw-rounded tw-text-sm"
                data-testid="save-displayName"
                size="custom"
                theme="primary"
                variant="contained"
                onClick={handleDisplayNameChange}>
                <FontAwesomeIcon className="tw-w-3.5 tw-h-3.5" icon="check" />
              </Button>
            </div>
          </div>
        ) : (
          <Fragment>
            {displayName ? (
              <span
                className="tw-text-base tw-font-medium tw-mr-2"
                data-testid="bot-displayName">
                {displayName}
              </span>
            ) : (
              <span className="tw-no-description tw-text-sm">
                Add display name
              </span>
            )}
            {(displayNamePermission || editAllPermission) && (
              <button
                className="tw-ml-2 focus:tw-outline-none"
                data-testid="edit-displayName"
                onClick={() => setIsDisplayNameEdit(true)}>
                <SVGIcons
                  alt="edit"
                  icon="icon-edit"
                  title="Edit"
                  width="16px"
                />
              </button>
            )}
          </Fragment>
        )}
      </div>
    );
  };

  const getDescriptionComponent = () => {
    return (
      <div>
        <Description
          description={botData.description || ''}
          entityName={getEntityName(botData)}
          hasEditAccess={descriptionPermission || editAllPermission}
          isEdit={isDescriptionEdit}
          onCancel={() => setIsDescriptionEdit(false)}
          onDescriptionEdit={() => setIsDescriptionEdit(true)}
          onDescriptionUpdate={handleDescriptionChange}
        />
      </div>
    );
  };

  const handleRolesChange = () => {
    // filter out the roles , and exclude the admin one
    const updatedRoles = isArray(selectedRoles)
      ? selectedRoles.filter((role) => role.value !== toLower(TERM_ADMIN))
      : [];

    // get the admin role and send it as boolean value `isAdmin=Boolean(isAdmin)
    const isAdmin = isArray(selectedRoles)
      ? selectedRoles.find((role) => role.value === toLower(TERM_ADMIN))
      : [];

    updateUserDetails({
      roles: updatedRoles.map((item) => {
        const roleId = item.value;
        const role = roles.find((r) => r.id === roleId);

        return { id: roleId, type: 'role', name: role?.name || '' };
      }),
      isAdmin: Boolean(isAdmin),
    });

    setIsRolesEdit(false);
  };

  const handleOnRolesChange = (options: Option | Option[]) => {
    if (isNil(options)) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(options);
    }
  };

  const RolesComponent = () => {
    const userRolesOption = isArray(roles)
      ? roles.map((role) => ({
          label: getEntityName(role as unknown as EntityReference),
          value: role.id,
        }))
      : [];

    if (!botUserData.isAdmin) {
      userRolesOption.push({
        label: TERM_ADMIN,
        value: toLower(TERM_ADMIN),
      });
    }

    const rolesElement = (
      <Fragment>
        {botUserData.isAdmin && (
          <div className="mb-2 flex items-center gap-2">
            <SVGIcons alt="icon" className="w-4" icon={Icons.USERS} />
            <span>{TERM_ADMIN}</span>
          </div>
        )}
        {botUserData?.roles?.map((role, i) => (
          <div className="mb-2 flex items-center gap-2" key={i}>
            <SVGIcons alt="icon" className="w-4" icon={Icons.USERS} />
            <Typography.Text
              className="ant-typography-ellipsis-custom w-48"
              ellipsis={{ tooltip: true }}>
              {getEntityName(role)}
            </Typography.Text>
          </div>
        ))}
        {!botUserData.isAdmin && isEmpty(botUserData.roles) && (
          <span className="tw-no-description ">
            {t('label.no-roles-assigned')}
          </span>
        )}
      </Fragment>
    );

    if (!isAdminUser && !isAuthDisabled) {
      return (
        <Card
          className="ant-card-feed relative"
          key="roles-card"
          style={{
            ...leftPanelAntCardStyle,
            marginTop: '20px',
          }}
          title={
            <div className="flex items-center justify-between">
              <h6 className="mb-0">{t('label.roles')}</h6>
            </div>
          }>
          <div className="flex items-center justify-between mb-4">
            {rolesElement}
          </div>
        </Card>
      );
    } else {
      return (
        <Card
          className="ant-card-feed relative"
          key="roles-card"
          style={{
            ...leftPanelAntCardStyle,
            marginTop: '20px',
          }}
          title={
            <div className="flex items-center justify-between">
              <h6 className="mb-0">{t('label.roles')}</h6>
              {!isRolesEdit && (
                <button
                  className="ml-2 focus:tw-outline-none tw-self-baseline"
                  data-testid="edit-roles"
                  onClick={() => setIsRolesEdit(true)}>
                  <SVGIcons
                    alt="edit"
                    className="mb-1"
                    icon="icon-edit"
                    title="Edit"
                    width="16px"
                  />
                </button>
              )}
            </div>
          }>
          <div className="mb-4">
            {isRolesEdit ? (
              <Space className="w-full" direction="vertical">
                <Select
                  aria-label="Select roles"
                  className="w-full"
                  id="select-role"
                  mode="tags"
                  options={userRolesOption}
                  placeholder="Roles..."
                  value={selectedRoles}
                  onChange={(_, options) => handleOnRolesChange(options)}
                />
                <div className="flex justify-end" data-testid="buttons">
                  <AntdButton
                    className="text-sm"
                    data-testid="cancel-roles"
                    icon={
                      <FontAwesomeIcon
                        className="tw-w-3.5 tw-h-3.5"
                        icon="times"
                      />
                    }
                    type="primary"
                    onMouseDown={() => setIsRolesEdit(false)}
                  />
                  <AntdButton
                    className="text-sm"
                    data-testid="save-roles"
                    icon={
                      <FontAwesomeIcon
                        className="tw-w-3.5 tw-h-3.5"
                        icon="check"
                      />
                    }
                    type="primary"
                    onClick={handleRolesChange}
                  />
                </div>
              </Space>
            ) : (
              rolesElement
            )}
          </div>
        </Card>
      );
    }
  };

  const InheritedRolesComponent = () => (
    <Card
      className="ant-card-feed relative"
      key="inherited-roles-card-component"
      style={{
        ...leftPanelAntCardStyle,
        marginTop: '20px',
      }}
      title={
        <div className="flex">
          <h6 className="tw-heading mb-0" data-testid="inherited-roles">
            {t('label.inherited-roles')}
          </h6>
        </div>
      }>
      <Fragment>
        {isEmpty(botUserData.inheritedRoles) ? (
          <div className="mb-4">
            <span className="tw-no-description">
              {t('label.no-inherited-found')}
            </span>
          </div>
        ) : (
          <div className="flex justify-between flex-col">
            {botUserData.inheritedRoles?.map((inheritedRole, i) => (
              <div className="mb-2 flex items-center gap-2" key={i}>
                <SVGIcons alt="icon" className="w-4" icon={Icons.USERS} />

                <Typography.Text
                  className="ant-typography-ellipsis-custom w-48"
                  ellipsis={{ tooltip: true }}>
                  {getEntityName(inheritedRole)}
                </Typography.Text>
              </div>
            ))}
          </div>
        )}
      </Fragment>
    </Card>
  );

  const fetchLeftPanel = () => {
    return (
      <>
        <Card
          className="ant-card-feed"
          style={{
            ...leftPanelAntCardStyle,
            marginTop: '16px',
          }}>
          <div data-testid="left-panel">
            <div className="flex flex-col">
              <SVGIcons
                alt="bot-profile"
                icon={Icons.BOT_PROFILE}
                width="280px"
              />

              <Space className="p-b-md" direction="vertical" size={8}>
                {getDisplayNameComponent()}

                {getDescriptionComponent()}
              </Space>
            </div>
          </div>
        </Card>
        <RolesComponent />
        <InheritedRolesComponent />
      </>
    );
  };

  const rightPanel = (
    <Card
      className="ant-card-feed"
      style={{
        ...leftPanelAntCardStyle,
        marginTop: '16px',
      }}>
      <div data-testid="right-panel">
        <div className="tw-flex tw-flex-col">
          <h6 className="tw-mb-2 tw-text-lg">Token Security</h6>
          <p className="tw-mb-2">
            Anyone who has your JWT Token will be able to send REST API requests
            to the OpenMetadata Server. Do not expose the JWT Token in your
            application code. Do not share it on GitHub or anywhere else online.
          </p>
        </div>
      </div>
    </Card>
  );

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (botUserData.id) {
      fetchAuthMechanismForBot();
    }
  }, [botUserData]);

  return (
    <PageLayout
      classes="tw-h-full tw-px-4"
      header={
        <TitleBreadcrumb
          className="tw-px-6"
          titleLinks={[
            {
              name: 'Bots',
              url: getSettingPath(
                GlobalSettingsMenuCategory.INTEGRATIONS,
                GlobalSettingOptions.BOTS
              ),
            },
            { name: botData.name || '', url: '', activeTitle: true },
          ]}
        />
      }
      leftPanel={fetchLeftPanel()}
      rightPanel={rightPanel}>
      <Card
        data-testid="center-panel"
        style={{
          ...leftPanelAntCardStyle,
          marginTop: '16px',
        }}>
        {authenticationMechanism ? (
          <>
            {isAuthMechanismEdit ? (
              <AuthMechanismForm
                authenticationMechanism={authenticationMechanism}
                botData={botData}
                botUser={botUserData}
                isUpdating={isUpdating}
                onCancel={() => setIsAuthMechanismEdit(false)}
                onEmailChange={onEmailChange}
                onSave={handleAuthMechanismUpdate}
              />
            ) : (
              <AuthMechanism
                authenticationMechanism={authenticationMechanism}
                botUser={botUserData}
                hasPermission={editAllPermission}
                onEdit={handleAuthMechanismEdit}
                onTokenRevoke={() => setIsRevokingToken(true)}
              />
            )}
          </>
        ) : (
          <AuthMechanismForm
            authenticationMechanism={{} as AuthenticationMechanism}
            botData={botData}
            botUser={botUserData}
            isUpdating={isUpdating}
            onCancel={() => setIsAuthMechanismEdit(false)}
            onEmailChange={onEmailChange}
            onSave={handleAuthMechanismUpdate}
          />
        )}
      </Card>

      {isRevokingToken ? (
        <ConfirmationModal
          bodyText="Are you sure you want to revoke access for JWT token?"
          cancelText="Cancel"
          confirmText="Confirm"
          header="Are you sure?"
          onCancel={() => setIsRevokingToken(false)}
          onConfirm={() => {
            revokeTokenHandler();
            setIsRevokingToken(false);
            handleAuthMechanismEdit();
          }}
        />
      ) : null}
    </PageLayout>
  );
};

export default BotDetails;
