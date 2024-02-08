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

import Icon from '@ant-design/icons/lib/components/Icon';
import { Button } from 'antd';
import { t } from 'i18next';
import React from 'react';
import './login-button.style.less';

interface LoginButtonProps {
  ssoBrandName: string;
  ssoBrandLogo?: SvgComponent;
  onClick?: () => void;
}

const LoginButton = ({
  ssoBrandName,
  ssoBrandLogo,
  onClick,
}: LoginButtonProps) => {
  const svgIcon = ssoBrandLogo ? (
    <Icon
      alt={`${ssoBrandName} Logo`}
      className="align-middle"
      component={ssoBrandLogo}
      style={{ fontSize: '30px' }}
    />
  ) : null;

  return (
    <Button className="signin-button m-x-auto" icon={svgIcon} onClick={onClick}>
      <span className="font-medium text-grey-muted text-xl">
        {t('label.sign-in-with-sso', { sso: ssoBrandName })}
      </span>
    </Button>
  );
};

export default LoginButton;
