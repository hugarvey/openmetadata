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

import Icon from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  FormProps,
  Row,
  Space,
  Typography,
} from 'antd';
import { Theme } from 'antd/lib/config-provider/context';
import { AxiosError } from 'axios';
import { startCase } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ReactComponent as DomainIcon } from '../../assets/svg/ic-domain.svg';
import { ReactComponent as ShareIcon } from '../../assets/svg/ic-share.svg';
import BrandImage from '../../components/common/BrandImage/BrandImage';
import TitleBreadcrumb from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.component';
import { TitleBreadcrumbProps } from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.interface';
import PageHeader from '../../components/PageHeader/PageHeader.component';
import PageLayoutV1 from '../../components/PageLayoutV1/PageLayoutV1';
import { GlobalSettingsMenuCategory } from '../../constants/GlobalSettings.constants';
import { HEX_COLOR_CODE_REGEX } from '../../constants/regex.constants';
import { LogoConfiguration } from '../../generated/configuration/logoConfiguration';
import { Settings, SettingType } from '../../generated/settings/settings';
import { useApplicationStore } from '../../hooks/useApplicationStore';
import { FieldProp, FieldTypes } from '../../interface/FormUtils.interface';
import { updateSettingsConfig } from '../../rest/settingConfigAPI';
import { getField } from '../../utils/formUtils';
import { getSettingPageEntityBreadCrumb } from '../../utils/GlobalSettingsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import './appearance-config-settings-page.less';

const AppearanceConfigSettingsPage = () => {
  const history = useHistory();
  const { theme, setTheme, resetTheme, applicationConfig } =
    useApplicationStore();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  const [formState, setFormState] = useState<
    Partial<LogoConfiguration & Theme>
  >({
    ...theme,
    ...applicationConfig,
  });

  const breadcrumbs: TitleBreadcrumbProps['titleLinks'] = useMemo(
    () =>
      getSettingPageEntityBreadCrumb(
        GlobalSettingsMenuCategory.PREFERENCES,
        'Appearance'
      ),
    []
  );

  const handleSave: FormProps['onFinish'] = async (
    values: Theme & LogoConfiguration
  ) => {
    setLoading(true);
    try {
      const {
        primaryColor,
        errorColor,
        successColor,
        warningColor,
        infoColor,
        ...configValues
      } = values;
      setTheme({
        primaryColor,
        errorColor,
        successColor,
        warningColor,
        infoColor,
      });

      const configData = {
        config_type: SettingType.CustomLogoConfiguration,
        config_value: configValues,
      };
      await updateSettingsConfig(configData as Settings);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setLoading(false);
    }
  };

  const themeFormFields: FieldProp[] = [
    {
      name: 'primaryColor',
      id: 'root/color',
      label: 'Primary Color',
      required: false,
      type: FieldTypes.COLOR_PICKER,
      rules: [
        {
          pattern: HEX_COLOR_CODE_REGEX,
          message: t('message.hex-color-validation'),
        },
      ],
    },
    {
      name: 'errorColor',
      id: 'root/color',
      label: 'Error Color',
      required: false,
      type: FieldTypes.COLOR_PICKER,
      rules: [
        {
          pattern: HEX_COLOR_CODE_REGEX,
          message: t('message.hex-color-validation'),
        },
      ],
    },
    {
      name: 'successColor',
      id: 'root/color',
      label: 'Success Color',
      required: false,
      type: FieldTypes.COLOR_PICKER,
      rules: [
        {
          pattern: HEX_COLOR_CODE_REGEX,
          message: t('message.hex-color-validation'),
        },
      ],
    },
    {
      name: 'warningColor',
      id: 'root/color',
      label: 'Warning Color',
      required: false,
      type: FieldTypes.COLOR_PICKER,
      rules: [
        {
          pattern: HEX_COLOR_CODE_REGEX,
          message: t('message.hex-color-validation'),
        },
      ],
    },
    {
      name: 'infoColor',
      id: 'root/color',
      label: 'Info Color',
      required: false,
      type: FieldTypes.COLOR_PICKER,
      rules: [
        {
          pattern: HEX_COLOR_CODE_REGEX,
          message: t('message.hex-color-validation'),
        },
      ],
    },
  ];

  const customLogoFormFields: FieldProp[] = [
    {
      name: 'customLogoUrlPath',
      label: t('label.logo-url'),
      type: FieldTypes.TEXT,
      required: false,
      id: 'root/customLogoUrlPath',
      placeholder: 'URL path for the login page logo',
      props: {
        'data-testid': 'customLogoUrlPath',
        autoFocus: true,
      },
      rules: [
        {
          type: 'url',
          message: t('message.entity-is-not-valid-url', {
            entity: t('label.logo-url'),
          }),
        },
      ],
    },
    {
      name: 'customMonogramUrlPath',
      label: t('label.monogram-url'),
      type: FieldTypes.TEXT,
      required: false,
      id: 'root/customMonogramUrlPath',
      placeholder: 'URL path for the navbar logo',
      props: {
        'data-testid': 'customMonogramUrlPath',
      },
      rules: [
        {
          type: 'url',
          message: t('message.entity-is-not-valid-url', {
            entity: t('label.monogram-url'),
          }),
        },
      ],
    },
    {
      name: 'customFaviconUrlPath',
      label: t('label.favicon-url'),
      type: FieldTypes.TEXT,
      required: false,
      id: 'root/customFaviconUrlPath',
      placeholder: 'URL path for the favicon',
      props: {
        'data-testid': 'customFaviconUrlPath',
      },
      rules: [
        {
          type: 'url',
          message: t('message.entity-is-not-valid-url', {
            entity: t('label.favicon-url'),
          }),
        },
      ],
    },
  ];

  useEffect(() => {
    setFormState({
      ...theme,
      ...applicationConfig,
    });
    form.setFieldsValue({
      ...theme,
      ...applicationConfig,
    });
  }, [theme, applicationConfig]);

  return (
    <PageLayoutV1 pageTitle={t('label.custom-logo')}>
      <Row align="middle" className="page-container" gutter={[0, 16]}>
        <Col span={24}>
          <TitleBreadcrumb titleLinks={breadcrumbs} />
        </Col>
        <Col span={24}>
          <Row align="middle" justify="space-between">
            <Col span={24}>
              <Space className="w-full justify-between">
                <PageHeader
                  data={{
                    header: 'Appearance',
                    subHeader:
                      'Customize OpenMetadata with your company logo, monogram, favicon and brand color.',
                  }}
                />
                <Button type="primary" onClick={resetTheme}>
                  {t('label.reset')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Col>
        <Col offset={2} span={20}>
          <Form
            form={form}
            initialValues={{
              ...theme,
              ...applicationConfig,
            }}
            layout="vertical"
            onFinish={handleSave}
            onValuesChange={(_, allValues) => setFormState({ ...allValues })}>
            <div className="white-label-card-wrapper m-b-md">
              <Card
                className="white-label-config-card"
                title={t('label.custom-logo')}>
                <Row className="w-full" gutter={[16, 16]}>
                  {customLogoFormFields.map((field) => {
                    return (
                      <Col className="w-full" key={field.name} span={24}>
                        <Row gutter={[48, 16]}>
                          <Col span={12}>{getField(field)}</Col>
                          <Col style={{ placeSelf: 'center' }}>
                            <BrandImage
                              className="preview-image"
                              height="auto"
                              isMonoGram={field.name !== 'customLogoUrlPath'}
                              src={
                                formState[field.name as keyof LogoConfiguration]
                              }
                              width={100}
                            />
                          </Col>
                        </Row>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
              <Card
                className="white-label-config-card"
                title={
                  <div className="d-flex items-center">
                    <Typography.Text>{t('label.custom-theme')}</Typography.Text>

                    <Badge
                      className="custom-theme-beta-tag"
                      count={t('label.beta')}
                      offset={[10, 0]}
                      size="small"
                    />
                  </div>
                }>
                <Row className="w-full" gutter={[16, 16]}>
                  {themeFormFields.map((field) => {
                    const currentColor = formState[field.name as keyof Theme];

                    return (
                      <Col className="w-full" key={field.name} span={24}>
                        <Row gutter={[48, 16]}>
                          <Col span={12}>{getField(field)}</Col>
                          <Col style={{ placeSelf: 'center' }}>
                            <Card className="theme-preview">
                              <Button
                                style={{
                                  background: currentColor,
                                  color: 'white',
                                  width: '86px',
                                }}>
                                {startCase(field.name.replace('Color', ''))}
                              </Button>

                              <Button
                                icon={<Icon component={ShareIcon} />}
                                style={{
                                  width: '56px',
                                  color: currentColor,
                                  borderColor: currentColor,
                                }}
                              />
                              <Button
                                style={{
                                  color: currentColor,
                                  borderColor: currentColor,
                                  width: '86px',
                                }}
                                type="default">
                                {startCase(field.name.replace('Color', ''))}
                              </Button>
                              <DomainIcon
                                style={{
                                  color: currentColor,
                                }}
                                width={32}
                              />
                              <Button
                                style={{
                                  color: currentColor,
                                  padding: 0,
                                }}
                                type="link">
                                {t('label.link')}
                              </Button>
                            </Card>
                          </Col>
                        </Row>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
            </div>

            <Space
              className="w-full justify-end"
              data-testid="cta-buttons"
              size={16}>
              <Button
                data-testid="cancel"
                type="link"
                onClick={() => history.goBack()}>
                {t('label.cancel')}
              </Button>
              <Button
                data-testid="save"
                htmlType="submit"
                loading={loading}
                type="primary">
                {t('label.save')}
              </Button>
            </Space>
          </Form>
        </Col>
      </Row>
    </PageLayoutV1>
  );
};

export default AppearanceConfigSettingsPage;
