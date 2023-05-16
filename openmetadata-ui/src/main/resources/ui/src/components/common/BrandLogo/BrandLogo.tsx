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
import MonoGram from 'assets/svg/logo-monogram.svg';
import Logo from 'assets/svg/logo.svg';
import { useApplicationConfigProvider } from 'components/ApplicationConfigProvider/ApplicationConfigProvider';
import React, { FC } from 'react';

interface BrandLogoProps {
  dataTestId?: string;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  isMonoGram?: boolean;
}

const BrandLogo: FC<BrandLogoProps> = ({
  dataTestId,
  alt,
  width,
  height,
  className,
  isMonoGram = false,
}) => {
  const { customLogoUrlPath = '', customMonogramUrlPath = '' } =
    useApplicationConfigProvider();

  const logoSource = isMonoGram
    ? customMonogramUrlPath || MonoGram
    : customLogoUrlPath || Logo;

  return (
    <img
      alt={alt ?? 'OpenMetadata Logo'}
      className={className}
      data-testid={dataTestId ?? 'brand-logo-image'}
      height={height ?? 'auto'}
      id="brand-image"
      src={logoSource}
      width={width ?? 152}
    />
  );
};

export default BrandLogo;
