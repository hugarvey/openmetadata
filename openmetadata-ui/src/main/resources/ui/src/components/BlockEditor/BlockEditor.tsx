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
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { isNil } from 'lodash';
import React from 'react';
import './block-editor.less';
import BubbleMenu from './BubbleMenu';

const BlockEditor = () => {
  const editor = useEditor({
    autofocus: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        showOnlyWhenEditable: true,
        includeChildren: true,
        showOnlyCurrent: false,
        emptyEditorClass: 'is-editor-empty',
        placeholder: ({ node, editor: coreEditor }) => {
          if (coreEditor.isDestroyed) {
            return '';
          }

          const headingPlaceholders: {
            [key: number]: string;
          } = {
            1: 'Heading 1',
            2: 'Heading 2',
            3: 'Heading 3',
          };

          if (node.type.name === 'heading') {
            const level = node.attrs.level as number;

            return headingPlaceholders[level];
          }

          if (
            node.type.name === 'paragraph' &&
            coreEditor.getJSON().content?.length === 1
          ) {
            return 'Type / to get started';
          }

          if (node.type.name === 'paragraph') {
            const selectedNode = coreEditor.view.domAtPos(
              coreEditor.state.selection.from
            ).node;
            if (
              selectedNode.nodeName === 'P' &&
              selectedNode.firstChild?.parentElement?.id === node.attrs.id
            ) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const parentNode = (coreEditor.state.selection.$from as any)
                .path[3];
              if (
                parentNode?.type?.name === 'blockquote' &&
                parentNode?.content?.content?.[
                  parentNode?.content?.content?.length - 1
                ]?.attrs?.id === node.attrs?.id
              ) {
                return 'Type or hit enter to exit quote';
              }

              return 'Type / for commands';
            }
          }

          return '';
        },
      }),
    ],
  });

  const menus = !isNil(editor) && <BubbleMenu editor={editor} />;

  return (
    <div className="editor-wrapper">
      <EditorContent editor={editor} />
      {menus}
    </div>
  );
};

export default BlockEditor;
