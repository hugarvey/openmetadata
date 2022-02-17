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

import PropTypes from 'prop-types';
import React, { ComponentType, PropsWithChildren } from 'react';
import Loader from '../components/Loader/Loader';

export interface ComponentProps<T> {
  [key: string]: T;
}

export function withLoader<T>(Component: ComponentType<T>) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const WithLoader = (props: T & PropsWithChildren<ComponentProps<any>>) => {
    return props.isLoading ? (
      <Loader size={props.size} />
    ) : (
      <Component {...(props as T)} />
    );
  };

  WithLoader.displayName =
    Component.displayName || Component.name || 'Component';

  WithLoader.propTypes = {
    isLoading: PropTypes.bool,
  };

  return WithLoader;
}
