/*
  * Licensed to the Apache Software Foundation (ASF) under one or more
  * contributor license agreements. See the NOTICE file distributed with
  * this work for additional information regarding copyright ownership.
  * The ASF licenses this file to You under the Apache License, Version 2.0
  * (the "License"); you may not use this file except in compliance with
  * the License. You may obtain a copy of the License at

  * http://www.apache.org/licenses/LICENSE-2.0

  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
*/

import { EditorState, Modifier, SelectionState } from 'draft-js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import PopOver from '../popover/PopOver';

const getSelectedText = (editorState) => {
  const selection = editorState.getSelection();
  const anchorKey = selection.getAnchorKey();
  const currentContent = editorState.getCurrentContent();
  const currentBlock = currentContent.getBlockForKey(anchorKey);

  const start = selection.getStartOffset();
  const end = selection.getEndOffset();
  const selectedText = currentBlock.getText().slice(start, end);

  return selectedText;
};

const updateEditorSelection = (eState, offsetDiff) => {
  const selection = eState.getSelection();
  const newFocusOffset = selection.focusOffset + offsetDiff;

  const newSelection = new SelectionState({
    anchorKey: selection.anchorKey,
    anchorOffset: newFocusOffset,
    focusKey: selection.focusKey,
    focusOffset: newFocusOffset,
  });
  const newEditorState = EditorState.forceSelection(eState, newSelection);

  return EditorState.push(newEditorState, newEditorState.getCurrentContent());
};

export class Bold extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  makeBold = () => {
    const { editorState, onChange } = this.props;
    const selectedText = getSelectedText(editorState);

    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      `${
        selectedText.startsWith('**') && selectedText.endsWith('**')
          ? selectedText.replaceAll('**', '')
          : `**${selectedText}**`
      }`,
      editorState.getCurrentInlineStyle()
    );

    const eState = EditorState.push(
      editorState,
      contentState,
      'insert-characters'
    );

    onChange(updateEditorSelection(eState, -2));
  };

  render() {
    return (
      <div className="rdw-option-wrapper tw-font-bold" onClick={this.makeBold}>
        <PopOver
          position="bottom"
          size="small"
          title="Add bold text"
          trigger="mouseenter">
          <p>B</p>
        </PopOver>
      </div>
    );
  }
}

export class Link extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  makeLink = () => {
    const { editorState, onChange } = this.props;

    const selectedText = getSelectedText(editorState);

    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      `${
        selectedText.startsWith('[') && selectedText.endsWith(')')
          ? selectedText.replace(/ *\([^)]*\) */g, '').replace(/[\])}[{(]/g, '')
          : `[${selectedText}](url)`
      }`,
      editorState.getCurrentInlineStyle()
    );
    const eState = EditorState.push(
      editorState,
      contentState,
      'insert-characters'
    );
    onChange(updateEditorSelection(eState, -6));
  };

  render() {
    return (
      <div className="rdw-option-wrapper " onClick={this.makeLink}>
        <PopOver
          position="bottom"
          size="small"
          title="Add link"
          trigger="mouseenter">
          <i className="fas fa-link" />
        </PopOver>
      </div>
    );
  }
}

export class Italic extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  makeItalic = () => {
    const { editorState, onChange } = this.props;
    const selectedText = getSelectedText(editorState);

    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      `${
        selectedText.startsWith('_') && selectedText.endsWith('_')
          ? selectedText.replaceAll('_', '')
          : `_${selectedText}_`
      }`,
      editorState.getCurrentInlineStyle()
    );
    onChange(EditorState.push(editorState, contentState, 'insert-characters'));
  };

  render() {
    return (
      <div className="rdw-option-wrapper " onClick={this.makeItalic}>
        <PopOver
          position="bottom"
          size="small"
          title="Add link"
          trigger="mouseenter">
          <i className="fas fa-italic" />
        </PopOver>
      </div>
    );
  }
}
export class Heading extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  makeHeading = () => {
    const { editorState, onChange } = this.props;
    const selectedText = getSelectedText(editorState);

    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      `${
        selectedText.startsWith('### ')
          ? selectedText.replaceAll('### ', '')
          : `### ${selectedText}`
      }`,
      editorState.getCurrentInlineStyle()
    );
    const eState = EditorState.push(
      editorState,
      contentState,
      'insert-characters'
    );
    onChange(updateEditorSelection(eState, 0));
  };

  render() {
    return (
      <div className="rdw-option-wrapper" onClick={this.makeHeading}>
        <PopOver
          position="bottom"
          size="small"
          title="Add header text"
          trigger="mouseenter">
          <p>H</p>
        </PopOver>
      </div>
    );
  }
}
export class Mention extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  makeMention = () => {
    const { editorState, onChange } = this.props;
    const selectedText = getSelectedText(editorState);
    const selection = editorState.getSelection();
    const contentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      `${
        selectedText.length > 0
          ? `@${selectedText}`
          : `${selection.anchorOffset > 0 ? ` @` : '@'}`
      }`,
      editorState.getCurrentInlineStyle()
    );
    onChange(EditorState.push(editorState, contentState, 'insert-characters'));
  };

  render() {
    return (
      <div className="rdw-option-wrapper " onClick={this.makeMention}>
        <PopOver
          position="bottom"
          size="small"
          title="Mention user or team"
          trigger="mouseenter">
          <p>@</p>
        </PopOver>
      </div>
    );
  }
}

// export class ULLIST extends Component {
//   static propTypes = {
//     onChange: PropTypes.func,
//     editorState: PropTypes.object,
//   };

//   makeLIST = () => {
//     const { editorState, onChange } = this.props;
//     // const selectedText = getSelectedText(editorState);

//     const contentState = Modifier.replaceText(
//       editorState.getCurrentContent(),
//       editorState.getSelection(),
//       `\n -`,
//       editorState.getCurrentInlineStyle()
//     );
//     onChange(EditorState.push(editorState, contentState, 'insert-characters'));
//   };

//   render() {
//     return (
//       <div className="rdw-option-wrapper " onClick={this.makeLIST}>
//         <PopOver
//           position="bottom"
//           size="small"
//           title="Add unordered list"
//           trigger="mouseenter">
//           <i className="fas fa-list-ul" />
//         </PopOver>
//       </div>
//     );
//   }
// }
