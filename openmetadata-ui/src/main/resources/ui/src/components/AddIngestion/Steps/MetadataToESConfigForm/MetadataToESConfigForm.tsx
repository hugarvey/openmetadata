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

import { Button, Col, Divider, Form, Input, Row, Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigClass } from '../../../../generated/entity/services/ingestionPipelines/ingestionPipeline';
import './MetadataToESConfigForm.less';

interface Props {
  handleMetadataToESConfig: (data: ConfigClass) => void;
  handlePrev: () => void;
  handleNext: () => void;
  onFocus: (fieldId: string) => void;
}

const { Item } = Form;

const MetadataToESConfigForm = ({
  handleMetadataToESConfig,
  handlePrev,
  handleNext,
  onFocus,
}: Props) => {
  const { t } = useTranslation();

  const handleSubmit = (values: ConfigClass) => {
    handleMetadataToESConfig({
      ...values,
    });
    handleNext();
  };

  return (
    <Form
      className="metadata-to-es-config-form"
      layout="vertical"
      onFinish={handleSubmit}
      onFocus={(e) => onFocus(e.target.id)}>
      <Item label={t('label.ca-certs')} name="caCerts">
        <Input id="root/caCerts" />
      </Item>
      <Item label={t('label.region-name')} name="regionName">
        <Input id="root/regionName" />
      </Item>
      <Item label={t('label.timeout')} name="timeout">
        <Input id="root/timeout" type="number" />
      </Item>
      <Divider />
      <Item
        className="switch-item"
        label={t('label.use-aws-credential-plural')}
        name="useAwsCredentials">
        <Switch id="root/useAwsCredentials" />
      </Item>
      <Divider />
      <Item
        className="switch-item"
        label={t('label.use-ssl-uppercase')}
        name="useSSL">
        <Switch id="root/useSSL" />
      </Item>
      <Divider />
      <Item
        className="switch-item"
        label={t('label.verify-cert-plural')}
        name="verifyCerts">
        <Switch id="root/verifyCerts" />
      </Item>
      <Divider />
      <Row justify="end">
        <Col>
          <Button type="link" onClick={handlePrev}>
            {t('label.back')}
          </Button>
        </Col>
        <Col>
          <Button htmlType="submit" type="primary">
            {t('label.next')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default MetadataToESConfigForm;
