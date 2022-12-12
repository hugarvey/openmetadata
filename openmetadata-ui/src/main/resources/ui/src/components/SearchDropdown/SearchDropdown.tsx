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

import { CloseOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Dropdown,
  Input,
  MenuItemProps,
  MenuProps,
  Space,
  Typography,
} from 'antd';
import React, { ChangeEvent, FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getSearchDropdownLabels,
  getSelectedOptionLabelString,
} from '../../utils/AdvancedSearchUtils';
import { dropdownIcon as DropDownIcon } from '../../utils/svgconstant';
import { SearchDropdownProps } from './SearchDropdown.interface';
import './SearchDropdown.less';

const SearchDropdown: FC<SearchDropdownProps> = ({
  label,
  options,
  searchKey,
  selectedKeys,
  showClear,
  onChange,
  onClearSelection,
  onRemove,
  onSearch,
}) => {
  const { t } = useTranslation();

  const [isDropDownOpen, setIsDropDownOpen] = useState<boolean>(false);

  // derive menu props from options and selected keys
  const menuOptions: MenuProps['items'] = useMemo(() => {
    // Separating selected options to show on top
    const selectedOptions = getSearchDropdownLabels(selectedKeys, true) || [];

    // Filtering out unselected options
    const unselectedOptions = options.filter(
      (option) => !selectedKeys.includes(option)
    );

    // Labels for unselected options
    const otherOptions =
      getSearchDropdownLabels(unselectedOptions, false) || [];

    return [...selectedOptions, ...otherOptions];
  }, [options, selectedKeys]);

  // handle menu item click
  const handleMenuItemClick: MenuItemProps['onClick'] = (info) => {
    const currentKey = info.key;
    const isSelected = selectedKeys.includes(currentKey);

    const updatedValues = isSelected
      ? selectedKeys.filter((v) => v !== currentKey)
      : [...selectedKeys, currentKey];

    // call on change with updated value
    onChange(updatedValues, searchKey);
  };

  // handle clear all
  const handleClear = () => {
    onSearch('', searchKey);
    onClearSelection(searchKey);
  };

  // handle search
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    onSearch(value, searchKey);
  };

  return (
    <Dropdown
      destroyPopupOnHide
      data-testid={searchKey}
      dropdownRender={(menuNode) => {
        return (
          <Card
            bodyStyle={{ padding: 0 }}
            className="custom-dropdown-render"
            data-testid="drop-down-menu">
            <Space direction="vertical" size={4}>
              <div className="p-t-sm p-x-sm">
                <Input
                  data-testid="search-input"
                  placeholder={`${t('label.search-entity', {
                    entity: label,
                  })}...`}
                  onChange={handleSearch}
                />
              </div>
              {showClear && (
                <Button
                  className="p-0 m-l-sm"
                  data-testid="clear-button"
                  type="link"
                  onClick={handleClear}>
                  {t('label.clear-all')}
                </Button>
              )}
              <Divider className="m-0" />
              {menuNode}
            </Space>
          </Card>
        );
      }}
      key={searchKey}
      menu={{ items: menuOptions, onClick: handleMenuItemClick }}
      open={isDropDownOpen}
      trigger={['click']}
      onOpenChange={(visible) => {
        visible && onSearch('', searchKey);
        setIsDropDownOpen(visible);
      }}>
      <Button className="search-dropdown-trigger-btn">
        <Space
          className="search-dropdown-btn-content"
          data-testid="search-dropdown">
          <Space size={0}>
            <DropDownIcon className="flex self-center m-r-xss" />
            <Typography.Text>{label}</Typography.Text>
            {selectedKeys.length > 0 && (
              <span>
                {' : '}
                <Typography.Text className="text-primary font-medium">
                  {getSelectedOptionLabelString(selectedKeys)}
                </Typography.Text>
              </span>
            )}
          </Space>
          <Divider className="m-0" type="vertical" />
          <CloseOutlined
            onClick={(e) => {
              e.stopPropagation();
              onRemove(searchKey);
            }}
          />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default SearchDropdown;
