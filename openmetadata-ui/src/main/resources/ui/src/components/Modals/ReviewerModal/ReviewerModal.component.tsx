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

import { Button, Col, Row, Typography } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { AxiosResponse } from 'axios';
import { t } from 'i18next';
import { isUndefined, uniqueId } from 'lodash';
import { FormattedUsersData, SearchResponse } from 'Models';
import React, { useEffect, useState } from 'react';
import { getSuggestions, searchData } from '../../../axiosAPIs/miscAPI';
import { WILD_CARD_CHAR } from '../../../constants/char.constants';
import { SearchIndex } from '../../../enums/search.enum';
import CheckboxUserCard from '../../../pages/teams/CheckboxUserCard';
import { formatUsersResponse } from '../../../utils/APIUtils';
import Searchbar from '../../common/searchbar/Searchbar';
import Loader from '../../Loader/Loader';
import { ReviewerModalProp } from './ReviewerModal.interface';

const ReviewerModal = ({
  reviewer,
  onCancel,
  onSave,
  header,
  visible,
}: ReviewerModalProp) => {
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState<FormattedUsersData[]>([]);
  const [selectedOption, setSelectedOption] = useState<FormattedUsersData[]>(
    reviewer ?? []
  );

  const getSearchedReviewers = (searchedData: FormattedUsersData[]) => {
    const currOptions = selectedOption.map((item) => item.name);
    const data = searchedData.filter((item: FormattedUsersData) => {
      return !currOptions.includes(item.name);
    });

    return [...selectedOption, ...data];
  };

  const querySearch = () => {
    setIsLoading(true);
    searchData(WILD_CARD_CHAR, 1, 10, '', '', '', SearchIndex.USER)
      .then((res: SearchResponse) => {
        const data = getSearchedReviewers(
          formatUsersResponse(res.data.hits.hits)
        );
        setOptions(data);
      })
      .catch(() => {
        setOptions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const suggestionSearch = (searchText = '') => {
    setIsLoading(true);
    getSuggestions(searchText, SearchIndex.USER)
      // TODO: fix types for below suggest api
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: AxiosResponse<any>) => {
        const data = formatUsersResponse(
          res.data.suggest['metadata-suggest'][0].options
        );
        setOptions(data);
      })
      .catch(() => {
        setOptions(selectedOption);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSearchAction = (text: string) => {
    setSearchText(text);
    if (text) {
      suggestionSearch(text);
    } else {
      querySearch();
    }
  };

  const isIncludeInOptions = (id: string): boolean => {
    return selectedOption.some((d) => d.id === id);
  };

  const selectionHandler = (id: string, isChecked: boolean) => {
    if (!isChecked) {
      setSelectedOption((pre) => pre.filter((option) => option.id !== id));
    } else {
      const newOption: FormattedUsersData =
        options.find((d) => d.id === id) || ({} as FormattedUsersData);
      setSelectedOption([...selectedOption, newOption]);
    }
  };

  useEffect(() => {
    if (!isUndefined(reviewer) && reviewer.length) {
      setOptions(reviewer);
    }
    querySearch();
  }, []);

  return (
    <Modal
      centered
      destroyOnClose
      closable={false}
      data-testid="confirmation-modal"
      footer={
        <div data-testid="cta-container">
          <Button
            data-testid="cancel"
            key="remove-edge-btn"
            type="text"
            onClick={onCancel}>
            {t('label.cancel')}
          </Button>
          <Button
            data-testid="save-button"
            key="save-btn"
            type="primary"
            onClick={() => onSave(selectedOption)}>
            {t('label.save')}
          </Button>
        </div>
      }
      title={
        <Typography.Text strong data-testid="header">
          {header}
        </Typography.Text>
      }
      visible={visible}
      width={800}>
      <>
        <Searchbar
          placeholder={`${t('label.search-for-user')}...`}
          searchValue={searchText}
          typingInterval={500}
          onSearch={handleSearchAction}
        />
        {isLoading ? (
          <Loader />
        ) : options.length > 0 ? (
          <Row gutter={[16, 16]}>
            {options.map((d) => (
              <Col key={uniqueId()} span={8}>
                <CheckboxUserCard
                  isActionVisible
                  isCheckBoxes
                  isIconVisible
                  item={{
                    name: d.name,
                    displayName: d.displayName || d.name,
                    email: d.email,
                    id: d.id,
                    isChecked: isIncludeInOptions(d.id),
                    type: d.type,
                  }}
                  key={d.id}
                  onSelect={selectionHandler}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Typography.Text className="flex justify-center mt-10 text-grey-muted text-base">
            {t('label.no-user-available')}
          </Typography.Text>
        )}
      </>
    </Modal>
  );
};

export default ReviewerModal;
