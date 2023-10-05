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
import { Row, Tabs } from 'antd';
import Col from 'antd/es/grid/col';
import { compare } from 'fast-json-patch';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DescriptionV1 from '../../../components/common/description/DescriptionV1';
import ManageButton from '../../../components/common/entityPageInfo/ManageButton/ManageButton';
import PageLayoutV1 from '../../../components/containers/PageLayoutV1';
import PageHeader from '../../../components/header/PageHeader.component';
import Loader from '../../../components/Loader/Loader';
import { EntityName } from '../../../components/Modals/EntityNameModal/EntityNameModal.interface';
import { UserTab } from '../../../components/Team/TeamDetails/UserTab/UserTab.component';
import { EntityType } from '../../../enums/entity.enum';
import { Persona } from '../../../generated/entity/teams/persona';
import { getPersonaByName, updatePersona } from '../../../rest/PersonaAPI';
import { getEncodedFqn } from '../../../utils/StringsUtils';
import { showErrorToast } from '../../../utils/ToastUtils';

export const PersonaDetailsPage = () => {
  const { fqn } = useParams<{ fqn: string }>();

  const [personaDetails, setPersonaDetails] = useState<Persona>();
  const [isLoading, setIsLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);

  const fetchPersonaDetails = async () => {
    try {
      setIsLoading(true);
      const persona = await getPersonaByName(getEncodedFqn(fqn));
      setPersonaDetails(persona);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fqn) {
      fetchPersonaDetails();
    }
  }, [fqn]);

  const handleDescriptionUpdate = async (description: string) => {
    if (!personaDetails) {
      return;
    }
    const updatedData = { ...personaDetails, description };
    const diff = compare(personaDetails, updatedData);

    try {
      const response = await updatePersona(personaDetails?.id, diff);
      setPersonaDetails(response);
    } catch (error) {
      // Error
    } finally {
      setIsEdit(false);
    }
  };

  const handleDisplayNameUpdate = async (data: EntityName) => {
    if (!personaDetails) {
      return;
    }
    const updatedData = { ...personaDetails, ...data };
    const diff = compare(personaDetails, updatedData);

    try {
      const response = await updatePersona(personaDetails?.id, diff);
      setPersonaDetails(response);
    } catch (error) {
      // Error
    } finally {
      setIsEdit(false);
    }
  };

  const handleRestorePersona = async () => {
    if (!personaDetails) {
      return;
    }
    const updatedData = { ...personaDetails };
    const diff = compare(personaDetails, updatedData);

    try {
      const response = await updatePersona(personaDetails?.id, diff);
      setPersonaDetails(response);
    } catch (error) {
      // Error
    } finally {
      setIsEdit(false);
    }
  };

  if (isLoading || !personaDetails) {
    return <Loader />;
  }

  return (
    <PageLayoutV1 pageTitle={personaDetails.name}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <PageHeader
            data={{
              header: personaDetails.displayName,
              subHeader: personaDetails.name,
            }}
          />
          <ManageButton
            canDelete
            editDisplayNamePermission
            allowSoftDelete={false}
            deleted={false}
            displayName={personaDetails.displayName}
            entityFQN={personaDetails.fullyQualifiedName}
            entityId={personaDetails.id}
            entityName={personaDetails.name}
            entityType={EntityType.PERSONA}
            onEditDisplayName={handleDisplayNameUpdate}
            onRestoreEntity={handleRestorePersona}
          />
        </Col>
        <Col span={24}>
          <DescriptionV1
            hasEditAccess
            description={personaDetails.description}
            entityType={EntityType.PERSONA}
            isEdit={isEdit}
            onCancel={() => setIsEdit(false)}
            onDescriptionEdit={() => setIsEdit(true)}
            onDescriptionUpdate={handleDescriptionUpdate}
          />
        </Col>
        <Col span={24}>
          <Tabs
            defaultActiveKey="users"
            items={[
              {
                label: 'Users',
                key: 'users',
                children: (
                  <UserTab users={personaDetails.users ?? []} />
                  //   <Table
                  //     columns={
                  //       commonUserDetailColumns() as ColumnsType<EntityReference>
                  //     }
                  //     dataSource={personaDetails.users}
                  //     pagination={false}
                  //     rowKey="fullyQualifiedName"
                  //     size="small"
                  //   />
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </PageLayoutV1>
  );
};
