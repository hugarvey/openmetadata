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

import '@github/g-emoji-element';
import { Button, Popover } from 'antd';
import { ReactComponent as AddReactionIcon } from 'assets/svg/add-reaction-emoji.svg';
import { groupBy, uniqueId } from 'lodash';
import { observer } from 'mobx-react';
import React, { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppState from '../../AppState';
import {
  REACTION_LIST,
  REACTION_TYPE_LIST,
} from '../../constants/reactions.constant';
import { ReactionOperation } from '../../enums/reactions.enum';
import {
  Reaction as ReactionProp,
  ReactionType,
} from '../../generated/type/reaction';
import Emoji from './Emoji';
import Reaction from './Reaction';
import './reactions.less';

interface ReactionsProps {
  reactions: ReactionProp[];
  onReactionSelect: (
    reaction: ReactionType,
    operation: ReactionOperation
  ) => void;
}

const Reactions: FC<ReactionsProps> = ({ reactions, onReactionSelect }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const hide = () => {
    setVisible(false);
  };

  const handleVisibleChange = (newVisible: boolean) => {
    setVisible(newVisible);
  };

  // get current user details
  const currentUser = useMemo(
    () => AppState.getCurrentUserDetails(),
    [AppState.userDetails, AppState.nonSecureUserDetails]
  );

  /**
   *
   * @param reactionType
   * @returns true if current user has reacted with {reactionType}
   */
  const isReacted = (reactionType: ReactionType) => {
    return reactions.some(
      (reactionItem) =>
        reactionItem.user.id === currentUser?.id &&
        reactionType === reactionItem.reactionType
    );
  };

  // prepare reaction list for reaction popover
  const reactionList = REACTION_LIST.map((reaction) => {
    return (
      <Reaction
        isReacted={isReacted(reaction.reaction)}
        key={uniqueId()}
        reaction={reaction}
        onHide={hide}
        onReactionSelect={onReactionSelect}
      />
    );
  });

  // prepare dictionary for each emojis and corresponding users list
  const modifiedReactionObject = groupBy(reactions, 'reactionType');

  // prepare reacted emoji list
  const emojis = REACTION_TYPE_LIST.map((reaction) => {
    const reactionListValue = modifiedReactionObject[reaction];

    return (
      reactionListValue && (
        <Emoji
          key={uniqueId()}
          reaction={reaction}
          reactionList={reactionListValue}
          onReactionSelect={onReactionSelect}
        />
      )
    );
  });

  return (
    <div className="d-flex items-center" data-testid="feed-reaction-container">
      {emojis}
      <Popover
        align={{ targetOffset: [0, -10] }}
        content={reactionList}
        open={visible}
        overlayClassName="ant-popover-feed-reactions"
        placement="topLeft"
        trigger="click"
        zIndex={9999}
        onOpenChange={handleVisibleChange}>
        <Button
          className="flex-center"
          data-testid="add-reactions"
          icon={<AddReactionIcon width={18} />}
          shape="circle"
          size="small"
          title={t('label.add-entity', {
            entity: t('label.reaction-lowercase-plural'),
          })}
          onClick={(e) => e.stopPropagation()}
        />
      </Popover>
    </div>
  );
};

export default observer(Reactions);
