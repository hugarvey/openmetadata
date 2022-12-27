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

import { render } from '@testing-library/react';
import React from 'react';
import { RightPanel } from './RightPanel';

describe('Test Add custom field right panel component', () => {
  it('Should render right panel component', async () => {
    const { findByTestId } = render(<RightPanel />);

    const panelHeader = await findByTestId('header');

    const panelBody = await findByTestId('body');

    expect(panelHeader).toBeInTheDocument();

    expect(panelBody).toBeInTheDocument();
  });
});
