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

import { AxiosError } from 'axios';
import classNames from 'classnames';
import { cloneDeep, includes, isEqual } from 'lodash';
import { EntityTags, FormattedUsersData } from 'Models';
import React, { Fragment, useEffect, useState } from 'react';
import {
  TITLE_FOR_NON_ADMIN_ACTION,
  TITLE_FOR_NON_OWNER_ACTION,
} from '../../constants/constants';
import { Glossary } from '../../generated/entity/data/glossary';
import { Operation } from '../../generated/entity/policies/policy';
import { LabelType, Source, State } from '../../generated/type/tagLabel';
import jsonData from '../../jsons/en';
import { getEntityName } from '../../utils/CommonUtils';
import {
  getTagCategories,
  getTaglist,
  getTagOptionsFromFQN,
} from '../../utils/TagsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import { Button } from '../buttons/Button/Button';
import Card from '../common/Card/Card';
import DescriptionV1 from '../common/description/DescriptionV1';
import NonAdminAction from '../common/non-admin-action/NonAdminAction';
import ProfilePicture from '../common/ProfilePicture/ProfilePicture';
import ReviewerModal from '../Modals/ReviewerModal/ReviewerModal.component';
import TagsContainer from '../tags-container/tags-container';

type props = {
  isHasAccess: boolean;
  glossary: Glossary;
  updateGlossary: (value: Glossary) => void;
  afterDeleteAction?: () => void;
  handleUserRedirection?: (name: string) => void;
};

const GlossaryDetails = ({
  isHasAccess,
  glossary,
  updateGlossary,
  afterDeleteAction,
  handleUserRedirection,
}: props) => {
  const [activeTab, setActiveTab] = useState(1);
  const [isDescriptionEditable, setIsDescriptionEditable] = useState(false);
  const [isTagEditable, setIsTagEditable] = useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<string>>([]);
  const [isTagLoading, setIsTagLoading] = useState<boolean>(false);

  const [showRevieweModal, setShowRevieweModal] = useState(false);
  const [reviewer, setReviewer] = useState<Array<FormattedUsersData>>([]);

  const tabs = [
    {
      name: 'Manage',
      icon: {
        alt: 'manage',
        name: 'icon-manage',
        title: 'Manage',
        selectedName: 'icon-managecolor',
      },
      isProtected: false,
      position: 1,
    },
  ];

  const onReviewerModalCancel = () => {
    setShowRevieweModal(false);
  };

  const handleReviewerSave = (data: Array<FormattedUsersData>) => {
    if (!isEqual(data, reviewer)) {
      let updatedGlossary = cloneDeep(glossary);
      const oldReviewer = data.filter((d) => includes(reviewer, d));
      const newReviewer = data
        .filter((d) => !includes(reviewer, d))
        .map((d) => ({ id: d.id, type: d.type }));
      updatedGlossary = {
        ...updatedGlossary,
        reviewers: [...oldReviewer, ...newReviewer],
      };
      setReviewer(data);
      updateGlossary(updatedGlossary);
    }
    onReviewerModalCancel();
  };

  const onTagUpdate = (selectedTags?: Array<string>) => {
    if (selectedTags) {
      const prevTags =
        glossary?.tags?.filter((tag) =>
          selectedTags.includes(tag?.tagFQN as string)
        ) || [];
      const newTags = selectedTags
        .filter((tag) => {
          return !prevTags?.map((prevTag) => prevTag.tagFQN).includes(tag);
        })
        .map((tag) => ({
          labelType: LabelType.Manual,
          state: State.Confirmed,
          source: Source.Tag,
          tagFQN: tag,
        }));
      const updatedTags = [...prevTags, ...newTags];
      const updatedGlossary = { ...glossary, tags: updatedTags };
      updateGlossary(updatedGlossary);
    }
  };
  const handleTagSelection = (selectedTags?: Array<EntityTags>) => {
    onTagUpdate?.(selectedTags?.map((tag) => tag.tagFQN));
    setIsTagEditable(false);
  };

  const onDescriptionEdit = (): void => {
    setIsDescriptionEditable(true);
  };
  const onCancel = () => {
    setIsDescriptionEditable(false);
  };

  const getSelectedTags = () => {
    return (glossary.tags || []).map((tag) => ({
      tagFQN: tag.tagFQN,
      isRemovable: true,
    }));
  };

  const fetchTags = () => {
    setIsTagLoading(true);
    getTagCategories()
      .then((res) => {
        setTagList(getTaglist(res.data));
      })
      .catch((err: AxiosError) => {
        showErrorToast(err, jsonData['api-error-messages']['fetch-tags-error']);
      })
      .finally(() => {
        setIsTagLoading(false);
      });
  };

  const onDescriptionUpdate = (updatedHTML: string) => {
    if (glossary.description !== updatedHTML) {
      const updatedTableDetails = {
        ...glossary,
        description: updatedHTML,
      };
      updateGlossary(updatedTableDetails);
      setIsDescriptionEditable(false);
    } else {
      setIsDescriptionEditable(false);
    }
  };

  const handleRemoveReviewer = (id: string) => {
    let updatedGlossary = cloneDeep(glossary);
    const reviewer = updatedGlossary.reviewers?.filter(
      (glossary) => glossary.id !== id
    );
    updatedGlossary = {
      ...updatedGlossary,
      reviewers: reviewer,
    };

    updateGlossary(updatedGlossary);
  };

  const setActiveTabHandler = (value: number) => {
    setActiveTab(value);
  };

  const handleUpdateOwner = (owner: Glossary['owner']) => {
    const updatedData = {
      ...glossary,
      owner,
    };

    return new Promise<void>((_, reject) => {
      updateGlossary(updatedData);
      setTimeout(() => {
        reject();
      }, 500);
    });
  };

  useEffect(() => {
    if (glossary.reviewers && glossary.reviewers.length) {
      setReviewer(
        glossary.reviewers.map((d) => ({
          ...(d as FormattedUsersData),
          type: 'user',
        }))
      );
    } else {
      setReviewer([]);
    }
  }, [glossary.reviewers]);

  const AddReviewerButton = () => {
    return (
      <NonAdminAction position="bottom" title={TITLE_FOR_NON_ADMIN_ACTION}>
        <Button
          className="tw-mr-1"
          data-testid="add-new-reviewer"
          disabled={isHasAccess}
          size="small"
          theme="primary"
          variant="text"
          onClick={() => setShowRevieweModal(true)}>
          + Add
        </Button>
      </NonAdminAction>
    );
  };

  const getReviewerTabData = () => {
    return (
      <div className="tw--mx-5">
        {glossary.reviewers && glossary.reviewers.length > 0 ? (
          <div className="tw-flex tw-flex-col tw-gap-4">
            {glossary.reviewers.map((term, i) => (
              <div
                className={classNames('tw-flex tw-items-center tw-px-5', {
                  'tw-border-b tw-pb-2':
                    i !== (glossary.reviewers || []).length - 1,
                })}
                key={i}>
                <div className="tw-inline-block tw-mr-2">
                  <ProfilePicture
                    displayName={getEntityName(term)}
                    id={term.id}
                    name={term?.name || ''}
                    textClass="tw-text-xs"
                    width="25"
                  />
                </div>

                <span>{getEntityName(term)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="tw-text-grey-muted tw-mx-5 tw-text-center">
            No reviewer
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="tw-w-full tw-h-full tw-flex tw-flex-col"
      data-testid="glossary-details">
      <div className="tw-flex tw-gap-4">
        <div className="tw-w-9/12">
          <div data-testid="description-container">
            <DescriptionV1
              removeBlur
              description={glossary?.description}
              entityName={glossary?.displayName ?? glossary?.name}
              isEdit={isDescriptionEditable}
              onCancel={onCancel}
              onDescriptionEdit={onDescriptionEdit}
              onDescriptionUpdate={onDescriptionUpdate}
            />
          </div>

          <Card heading="Related Terms">
            <Fragment>
              <p className="tw-text-grey-muted tw-mb-2">Tags</p>
              <div className="tw-flex tw-flex-wrap tw-group" data-testid="tags">
                <NonAdminAction
                  isOwner={Boolean(glossary.owner)}
                  permission={Operation.UpdateTags}
                  position="bottom"
                  title={TITLE_FOR_NON_OWNER_ACTION}
                  trigger="click">
                  <div
                    className="tw-inline-block"
                    onClick={() => {
                      fetchTags();
                      setIsTagEditable(true);
                    }}>
                    <TagsContainer
                      showAddTagButton
                      dropDownHorzPosRight={false}
                      editable={isTagEditable}
                      isLoading={isTagLoading}
                      selectedTags={getSelectedTags()}
                      size="small"
                      tagList={getTagOptionsFromFQN(tagList)}
                      type="label"
                      onCancel={() => {
                        handleTagSelection();
                      }}
                      onSelectionChange={(tags) => {
                        handleTagSelection(tags);
                      }}
                    />
                  </div>
                </NonAdminAction>
              </div>
            </Fragment>
          </Card>
        </div>
        <div className="tw-w-3/12">
          <Card heading="Owner">
            <div className="tw-flex tw-items-center">
              {glossary.owner && getEntityName(glossary.owner) && (
                <div className="tw-inline-block tw-mr-2">
                  <ProfilePicture
                    displayName={getEntityName(glossary.owner)}
                    id={glossary.owner?.id || ''}
                    name={glossary.owner?.name || ''}
                    textClass="tw-text-xs"
                    width="25"
                  />
                </div>
              )}
              {glossary.owner && getEntityName(glossary.owner) ? (
                <span>{getEntityName(glossary.owner)}</span>
              ) : (
                <span className="tw-text-grey-muted">No owner</span>
              )}
            </div>
          </Card>
          <Card
            action={AddReviewerButton()}
            className="tw-mt-4"
            heading="Reviewer">
            <div>{getReviewerTabData()}</div>
          </Card>
        </div>
      </div>
      {/* <div className="tw-flex tw-flex-col tw-flex-grow">
        <TabsPane
          activeTab={activeTab}
          className="tw-flex-initial"
          setActiveTab={setActiveTabHandler}
          tabs={tabs}
        />

        <div className="tw-flex-grow tw--mx-6 tw-px-7 tw-py-4">
          {activeTab === 1 && (
            <div
              className="tw-bg-white tw-shadow-md tw-py-6 tw-flex-grow"
              data-testid="manage-glossary">
              <div className="tw-max-w-3xl tw-mx-auto">
                {getReviewerTabData()}
              </div>
              <div className="tw-mt-7">
                <ManageTabComponent
                  allowDelete
                  hideTier
                  isRecursiveDelete
                  afterDeleteAction={afterDeleteAction}
                  currentUser={glossary?.owner}
                  entityId={glossary.id}
                  entityName={glossary?.name}
                  entityType={EntityType.GLOSSARY}
                  hasEditAccess={hasEditAccess(
                    glossary?.owner?.type || '',
                    glossary?.owner?.id || ''
                  )}
                  onSave={handleUpdateOwner}
                />
              </div>
            </div>
          )}
        </div>
      </div> */}

      {showRevieweModal && (
        <ReviewerModal
          header="Add Reviewer"
          reviewer={reviewer}
          onCancel={onReviewerModalCancel}
          onSave={handleReviewerSave}
        />
      )}
    </div>
  );
};

export default GlossaryDetails;
