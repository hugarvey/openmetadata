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

import {
  fireEvent,
  getByTestId,
  queryByText,
  render,
} from '@testing-library/react';
import React from 'react';
import Toast from './Toast';

describe('Test Toast Component', () => {
  it('Component should render', () => {
    const { container } = render(
      <Toast
        autoDelete
        body="string"
        dismissTime={1000}
        position="top"
        variant="success"
      />
    );

    expect(getByTestId(container, 'toast')).toBeInTheDocument();
  });

  it('Toast will be dismissed after given time', async () => {
    const { container } = render(
      <Toast
        autoDelete
        body="string"
        dismissTime={1000}
        position="top"
        variant="success"
      />
    );
    await new Promise((r) => setTimeout(r, 1000));

    expect(queryByText(container, /string/i)).not.toBeInTheDocument();
  });

  it('onClick of X toast will be dismissed', () => {
    const { container } = render(
      <Toast
        autoDelete
        body="string"
        dismissTime={1000}
        position="top"
        variant="success"
      />
    );

    const dismiss = getByTestId(container, 'dismiss');
    fireEvent.click(
      dismiss,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(queryByText(container, /string/i)).not.toBeInTheDocument();
  });
});
