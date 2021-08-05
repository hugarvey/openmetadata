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

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { isValidJSONString } from '../../../utils/StringsUtils';
import RichTextEditor from '../rich-text-editor/RichTextEditor';
import { editorRef } from '../rich-text-editor/RichTextEditor.interface';
import RichTextEditorPreviewer from '../rich-text-editor/RichTextEditorPreviewer';

type EditorContentRef = {
  getEditorContent: (value: string) => string;
};

type Props = {
  value: string;
};

const MarkdownWithPreview = forwardRef<editorRef, Props>(
  ({ value }: Props, ref) => {
    const [activeTab, setActiveTab] = useState<number>(1);
    const [preview, setPreview] = useState<string>('');
    const [initValue, setInitValue] = useState<string>(value ?? '');

    const editorRef = useRef<EditorContentRef>();
    const getTabClasses = (tab: number, activeTab: number) => {
      return (
        'tw-gh-tabs tw-cursor-pointer' + (activeTab === tab ? ' active' : '')
      );
    };

    const updateInternalValue = () => {
      if (editorRef.current) {
        setInitValue(editorRef.current?.getEditorContent('markdown'));
        setPreview(editorRef.current?.getEditorContent('markdown'));
      }
    };

    const getPreview = () => {
      return <RichTextEditorPreviewer markdown={preview} />;
    };

    useImperativeHandle(ref, () => ({
      getEditorContent() {
        return activeTab === 2
          ? initValue
          : editorRef.current?.getEditorContent('markdown');
      },
    }));

    useEffect(() => {
      setInitValue(value ?? '');
    }, [value]);

    return (
      <div>
        <div className="tw-bg-transparent">
          <nav className="tw-flex tw-flex-row tw-gh-tabs-container tw-px-6">
            <p
              className={getTabClasses(1, activeTab)}
              data-testid="tab"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(1);
              }}>
              {'Write '}
            </p>
            <p
              className={getTabClasses(2, activeTab)}
              data-testid="tab"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(2);
                updateInternalValue();
              }}>
              {'View '}
            </p>
          </nav>
        </div>
        <div className="tw-py-5">
          {activeTab === 1 && (
            <RichTextEditor
              format={isValidJSONString(initValue) ? 'json' : 'markdown'}
              initvalue={initValue}
              // mentionTrigger="@"
              ref={editorRef}
              // suggestionList={[
              //   {
              //     text: 'sql_features',
              //     url: '/dataset/aws_redshift.information_schema.sql_features',
              //     value: 'sql_features',
              //   },
              //   {
              //     text: 'sql_implementation_info',
              //     url: '/dataset/aws_redshift.information_schema.sql_implementation_info',
              //     value: 'sql_implementation_info',
              //   },
              //   {
              //     text: 'sql_languages',
              //     url: '/dataset/aws_redshift.information_schema.sql_languages',
              //     value: 'sql_languages',
              //   },
              //   {
              //     text: 'sql_packages',
              //     url: '/dataset/aws_redshift.information_schema.sql_packages',
              //     value: 'sql_packages',
              //   },
              //   {
              //     text: 'sql_sizing',
              //     url: '/dataset/aws_redshift.information_schema.sql_sizing',
              //     value: 'sql_sizing',
              //   },
              //   {
              //     text: 'sql_sizing_profiles',
              //     url: '/dataset/aws_redshift.information_schema.sql_sizing_profiles',
              //     value: 'sql_sizing_profiles',
              //   },
              //   {
              //     text: 'category',
              //     url: '/dataset/aws_redshift.public.category',
              //     value: 'category',
              //   },
              //   {
              //     text: 'date',
              //     url: '/dataset/aws_redshift.public.date',
              //     value: 'date',
              //   },
              //   {
              //     text: 'event',
              //     url: '/dataset/aws_redshift.public.event',
              //     value: 'event',
              //   },
              //   {
              //     text: 'listing',
              //     url: '/dataset/aws_redshift.public.listing',
              //     value: 'listing',
              //   },
              // ]}
            />
          )}
          {activeTab === 2 && (
            <div className="editor-wrapper tw-flex tw-flex-col tw-flex-1 tw-overflow-y-auto tw-p-3 tw-min-h-32 tw-border tw-border-gray-300 tw-rounded tw-max-h-none">
              {getPreview()}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MarkdownWithPreview.displayName = 'MarkdownWithPreview';

export default MarkdownWithPreview;
