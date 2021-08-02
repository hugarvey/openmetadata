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

import { Paging } from 'Models';
import React from 'react';
import { CursorType } from '../../../enums/pagination.enum';
import { Button } from '../../buttons/Button/Button';

type Prop = {
  paging: Paging;
  pagingHandler: (value: string) => void;
};

const NextPrevious = ({ paging, pagingHandler }: Prop) => {
  return (
    <div className="tw-my-4 tw-flex tw-justify-center tw-items-center  tw-gap-2">
      <Button
        className="tw-rounded tw-w-24  tw-px-3 tw-py-1.5 tw-text-sm"
        disabled={paging.before ? false : true}
        size="custom"
        theme="primary"
        variant="outlined"
        onClick={() => pagingHandler(CursorType.BEFORE)}>
        <i className="fas fa-arrow-left tw-text-sm tw-align-middle tw-pr-1.5" />{' '}
        <span>Previous</span>
      </Button>
      <Button
        className="tw-rounded tw-w-24 tw-px-3 tw-py-1.5 tw-text-sm"
        disabled={paging.after ? false : true}
        size="custom"
        theme="primary"
        variant="outlined"
        onClick={() => pagingHandler(CursorType.AFTER)}>
        <span> Next</span>{' '}
        <i className="fas fa-arrow-right tw-text-sm tw-align-middle tw-pl-1.5" />
      </Button>
    </div>
  );
};

export default NextPrevious;
