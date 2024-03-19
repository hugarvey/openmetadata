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

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { PropertyValue } from './PropertyValue';

jest.mock('../../common/RichTextEditor/RichTextEditorPreviewer', () => {
  return jest
    .fn()
    .mockReturnValue(
      <div data-testid="RichTextPreviewer">RichTextPreviewer</div>
    );
});

jest.mock(
  '../../Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor',
  () => ({
    ModalWithMarkdownEditor: jest
      .fn()
      .mockReturnValue(<div data-testid="EditorModal">EditorModal</div>),
  })
);

jest.mock('./PropertyInput', () => ({
  PropertyInput: jest
    .fn()
    .mockImplementation(({ children }) => (
      <div data-testid="PropertyInput">{children}</div>
    )),
}));

jest.mock('../../Database/SchemaEditor/SchemaEditor', () =>
  jest.fn().mockReturnValue(<div data-testid="SchemaEditor">SchemaEditor</div>)
);
jest.mock(
  '../../DataAssets/DataAssetAsyncSelectList/DataAssetAsyncSelectList',
  () =>
    jest
      .fn()
      .mockReturnValue(
        <div data-testid="entity-reference-select">
          DataAssetAsyncSelectList
        </div>
      )
);

const mockUpdate = jest.fn();

const mockData = {
  extension: { yNumber: 87 },
  property: {
    name: 'yNumber',
    propertyType: {
      id: '73f1e4a4-4c62-4399-9d6d-4a3906851483',
      type: 'type',
      name: 'integer',
      fullyQualifiedName: 'integer',
      description: '"An integer type."',
      displayName: 'integer',
      href: 'http://localhost:8585/api/v1/metadata/types/73f1e4a4-4c62-4399-9d6d-4a3906851483',
    },
    description: 'A number property.',
  },
  onExtensionUpdate: mockUpdate,
  hasEditPermissions: true,
};

describe('Test PropertyValue Component', () => {
  it('Should render value component', async () => {
    render(<PropertyValue {...mockData} />);

    const valueElement = await screen.findByTestId('value');
    const iconElement = await screen.findByTestId('edit-icon');

    expect(valueElement).toBeInTheDocument();
    expect(iconElement).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('PropertyInput')).toBeInTheDocument();
  });

  it('Should not render edit component if user has no edit permissions', async () => {
    render(<PropertyValue {...mockData} hasEditPermissions={false} />);

    const iconElement = await screen.queryByTestId('edit-icon');

    expect(iconElement).not.toBeInTheDocument();
  });

  it('Should render richtext previewer component for markdown type', async () => {
    const extension = { yNumber: 'markdown value' };
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'markdown',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const valueElement = await screen.findByTestId('RichTextPreviewer');
    const iconElement = await screen.findByTestId('edit-icon');

    expect(valueElement).toBeInTheDocument();
    expect(iconElement).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('EditorModal')).toBeInTheDocument();
  });

  it('Should render select component for enum type', async () => {
    const extension = { yNumber: 'enumValue' };
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'enum',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('enum-select')).toBeInTheDocument();
  });

  it('Should render date picker component for "date" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'date',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('date-time-picker')).toBeInTheDocument();
  });

  it('Should render date picker component for "dateTime" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'dateTime',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('date-time-picker')).toBeInTheDocument();
  });

  it('Should render time picker component for "time" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'time',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('time-picker')).toBeInTheDocument();
  });

  it('Should render email input component for "email" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'email',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('email-input')).toBeInTheDocument();
  });

  it('Should render timestamp input component for "timestamp" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'timestamp',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('timestamp-input')).toBeInTheDocument();
  });

  it('Should render start and end input component for "timeInterval" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'timeInterval',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('start-input')).toBeInTheDocument();
    expect(await screen.findByTestId('end-input')).toBeInTheDocument();
  });

  it('Should render duration input component for "duration" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'duration',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('duration-input')).toBeInTheDocument();
  });

  it('Should render sqlQuery editor component for "sqlQuery" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'sqlQuery',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(await screen.findByTestId('SchemaEditor')).toBeInTheDocument();
  });

  it('Should render entity reference select component for "entityReference" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'entityReference',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(
      await screen.findByTestId('entity-reference-select')
    ).toBeInTheDocument();
  });

  it('Should render entity reference select component for "entityReferenceList" type', async () => {
    const extension = {};
    const propertyType = {
      ...mockData.property.propertyType,
      name: 'entityReferenceList',
    };
    render(
      <PropertyValue
        {...mockData}
        extension={extension}
        property={{ ...mockData.property, propertyType: propertyType }}
      />
    );

    const iconElement = await screen.findByTestId('edit-icon');

    await act(async () => {
      fireEvent.click(iconElement);
    });

    expect(
      await screen.findByTestId('entity-reference-select')
    ).toBeInTheDocument();
  });
});
