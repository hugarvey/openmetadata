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

import { Typography } from 'antd';
import React from 'react';
import AddPlaceHolder from '../../../assets/img/add-placeholder.svg';
import NoDataFoundPlaceHolder from '../../../assets/img/no-data-placeholder.svg';

type Props = {
  children?: React.ReactNode;
  type?: string;
  buttonLabel?: string;
  buttonListener?: () => void;
  heading?: string;
  doc?: string;
  buttons?: React.ReactNode;
  buttonId?: string;
};

const ErrorPlaceHolder = ({ doc, type, children, heading, buttons }: Props) => {
  const { Paragraph, Link } = Typography;

  return type === 'ADD_DATA' ? (
    <>
      <div className="flex-center flex-col tw-mt-24 " data-testid="error">
        {' '}
        <img data-testid="no-data-image" src={AddPlaceHolder} width="100" />
      </div>
      <div className="tw-flex tw-flex-col tw-items-center tw-mt-9 tw-text-base tw-font-medium">
        <Paragraph style={{ marginBottom: '4px' }}>
          {' '}
          Adding a new {heading} is easy, just give it a spin!
        </Paragraph>
        <Paragraph>
          {' '}
          Still need help? Refer to our{' '}
          <Link href={doc} target="_blank">
            docs
          </Link>{' '}
          for more information.
        </Paragraph>

        <div className="tw-text-lg tw-text-center">{buttons}</div>
      </div>
    </>
  ) : (
    <div className="flex-center flex-col tw-mt-24 w-full">
      <div data-testid="error">
        <img
          data-testid="no-data-image"
          src={NoDataFoundPlaceHolder}
          width="100"
        />
      </div>
      {children && (
        <div className="tw-flex tw-flex-col tw-items-center tw-mt-8 tw-text-base tw-font-medium">
          {children}
        </div>
      )}
    </div>
  );
};

export default ErrorPlaceHolder;
