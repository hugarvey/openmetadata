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
import { Col, Menu, MenuProps, Row, Space } from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import Qs from 'qs';
import React, { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTourProvider } from '../../../../context/TourProvider/TourProvider';
import { TableProfilerTab } from '../ProfilerDashboard/profilerDashboard.interface';
import profilerClassBase from './ProfilerClassBase';
import { TableProfilerProps } from './TableProfiler.interface';
import { TableProfilerProvider } from './TableProfilerProvider';

const TableProfiler = (props: TableProfilerProps) => {
  const { isTourOpen } = useTourProvider();
  const history = useHistory();
  const location = useLocation();

  const { activeTab = profilerClassBase.getDefaultTabKey(isTourOpen) } =
    useMemo(() => {
      const param = location.search;
      const searchData = Qs.parse(
        param.startsWith('?') ? param.substring(1) : param
      );

      return searchData as {
        activeTab: TableProfilerTab;
        activeColumnFqn: string;
      };
    }, [location.search, isTourOpen]);

  const { viewTest, viewProfiler } = useMemo(() => {
    const { permissions } = props;
    const viewPermission = permissions.ViewAll || permissions.ViewBasic;

    return {
      viewTest: viewPermission || permissions.ViewTests,
      viewProfiler: viewPermission || permissions.ViewDataProfile,
    };
  }, [props.permissions]);

  const tabOptions: ItemType[] = useMemo(() => {
    const profilerTabOptions = profilerClassBase.getProfilerTabOptions({
      viewProfiler,
      viewTest,
    });

    return profilerTabOptions.map((tab) => {
      const SvgIcon = tab.icon;

      return {
        ...tab,
        icon: <SvgIcon width={16} />,
      };
    });
  }, [viewTest, viewProfiler]);

  const activeTabComponent = useMemo(() => {
    const tabComponents = profilerClassBase.getProfilerTabs();
    const ActiveComponent = tabComponents[activeTab];

    return <ActiveComponent />;
  }, [activeTab]);

  const handleTabChange: MenuProps['onClick'] = (value) => {
    history.push({ search: Qs.stringify({ activeTab: value.key }) });
  };

  return (
    <TableProfilerProvider {...props}>
      <Row
        className="table-profiler-container h-full flex-grow"
        data-testid="table-profiler-container"
        gutter={[16, 16]}
        id="profilerDetails">
        <Col className="p-t-sm data-quality-left-panel" span={4}>
          <Menu
            className="h-full p-x-0 custom-menu"
            data-testid="profiler-tab-left-panel"
            items={tabOptions}
            mode="inline"
            selectedKeys={[activeTab ?? TableProfilerTab.TABLE_PROFILE]}
            onClick={handleTabChange}
          />
        </Col>
        <Col className="data-quality-content-panel" span={20}>
          <Space
            className="w-full h-min-full p-sm"
            direction="vertical"
            size={16}>
            {activeTabComponent}
          </Space>
        </Col>
      </Row>
    </TableProfilerProvider>
  );
};

export default TableProfiler;
