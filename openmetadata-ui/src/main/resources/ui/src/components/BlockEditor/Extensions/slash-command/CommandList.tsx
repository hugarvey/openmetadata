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
import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import { Button, Space, Typography } from 'antd';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

export type CommandsListState = {
  selectedIndex: number;
};

export interface SlashCommandRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const isInViewport = (ele: HTMLElement, container: HTMLElement) => {
  const eleTop = ele.offsetTop;
  const eleBottom = eleTop + ele.clientHeight;

  const containerTop = container.scrollTop;
  const containerBottom = containerTop + container.clientHeight;

  // The element is fully visible in the container
  return eleTop >= containerTop && eleBottom <= containerBottom;
};

export const SlashCommandList = forwardRef<SlashCommandRef, SuggestionProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { items, command } = props;

    const selectItem = (index: number) => {
      const item = items[index];

      if (item) {
        command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((prev) => {
        const newIndex = (prev + items.length - 1) % items.length;
        const commandListing = document.getElementById(
          `editor-command-${items[newIndex].title}`
        );
        const commandList = document.getElementById('editor-commands-viewport');
        if (
          commandList &&
          commandListing &&
          !isInViewport(commandListing, commandList)
        ) {
          commandListing.scrollIntoView();
        }

        return newIndex;
      });
    };

    const downHandler = () => {
      setSelectedIndex((prev) => {
        const newIndex = (prev + 1) % items.length;
        const commandListing = document.getElementById(
          `editor-command-${items[newIndex].title}`
        );
        const commandList = document.getElementById('editor-commands-viewport');
        if (
          commandList &&
          commandListing &&
          !isInViewport(commandListing, commandList)
        ) {
          commandListing.scrollIntoView();
        }

        return newIndex;
      });
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler();

          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();

          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();

          return true;
        }

        return false;
      },
    }));

    if (isEmpty(items)) {
      return null;
    }

    return (
      <div className="slash-menu-wrapper" id="editor-commands-viewport">
        {items.map((item, index) => (
          <div
            className="d-flex flex-column"
            id={`editor-command-${item.title}`}
            key={item.title}>
            {item.type !== items[index - 1]?.type && (
              <Typography className="m-b-xs">{item.type}</Typography>
            )}
            <Button
              className={classNames('d-flex', {
                'bg-grey-2': index === selectedIndex,
              })}
              key={item.title}
              type="text"
              onClick={() => selectItem(index)}>
              <Space align="center">
                <Typography className="font-bold">{item.title}</Typography>
                <Typography>{item.description}</Typography>
              </Space>
            </Button>
          </div>
        ))}
      </div>
    );
  }
);
