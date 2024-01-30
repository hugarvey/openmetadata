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

import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Space, Tooltip, Typography } from 'antd';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThreadType } from '../../../../generated/api/feed/createThread';
import { getEntityFeedLink } from '../../../../utils/EntityUtils';
import ActivityThreadPanelBody from '../../../ActivityFeed/ActivityThreadPanel/ActivityThreadPanelBody';
import AddAnnouncementModal from '../../../Modals/AnnouncementModal/AddAnnouncementModal';

interface Props {
  open: boolean;
  entityType: string;
  entityFQN: string;
  entityName: string;
  onClose: () => void;
  createPermission?: boolean;
}

const AnnouncementDrawer: FC<Props> = ({
  open,
  onClose,
  entityFQN,
  entityType,
  entityName,
  createPermission,
}) => {
  const { t } = useTranslation();
  const [isAnnouncement, setIsAnnouncement] = useState<boolean>(false);

  const title = (
    <Space
      align="start"
      className="justify-between"
      data-testid="title"
      style={{ width: '100%' }}>
      <Typography.Text className="font-medium break-all">
        {t('label.announcement-on-entity', { entity: entityName })}
      </Typography.Text>
      <CloseOutlined onClick={onClose} />
    </Space>
  );

  return (
    <>
      <div data-testid="announcement-drawer">
        <Drawer
          closable={false}
          open={open}
          placement="right"
          title={title}
          width={576}
          onClose={onClose}>
          <div className="d-flex justify-end m-b-md">
            <Tooltip
              title={!createPermission && t('message.no-permission-to-view')}>
              <Button
                data-testid="add-announcement"
                disabled={!createPermission}
                type="primary"
                onClick={() => setIsAnnouncement(true)}>
                {t('label.add-entity', { entity: t('label.announcement') })}
              </Button>
            </Tooltip>
          </div>

          <ActivityThreadPanelBody
            className="p-0"
            showHeader={false}
            threadLink={getEntityFeedLink(entityType, entityFQN)}
            threadType={ThreadType.Announcement}
          />
        </Drawer>
      </div>

      {isAnnouncement && (
        <AddAnnouncementModal
          entityFQN={entityFQN || ''}
          entityType={entityType || ''}
          open={isAnnouncement}
          onCancel={() => setIsAnnouncement(false)}
        />
      )}
    </>
  );
};

export default AnnouncementDrawer;
