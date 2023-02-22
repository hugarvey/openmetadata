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

import { Button, Card, Col, Form, Row, Space, Typography } from 'antd';
import { AxiosError } from 'axios';
import TitleBreadcrumb from 'components/common/title-breadcrumb/title-breadcrumb.component';
import Loader from 'components/Loader/Loader';
import { compare } from 'fast-json-patch';
import { trim } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { getPolicyByName, patchPolicy } from 'rest/rolesAPIV1';
import { GlobalSettingOptions } from '../../../constants/GlobalSettings.constants';
import { Effect, Rule } from '../../../generated/api/policies/createPolicy';
import { Policy } from '../../../generated/entity/policies/policy';
import { getEntityName } from '../../../utils/CommonUtils';
import {
  getPath,
  getPolicyWithFqnPath,
  getSettingPath,
} from '../../../utils/RouterUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import RuleForm from '../RuleForm/RuleForm';

const policiesPath = getPath(GlobalSettingOptions.POLICIES);

const AddRulePage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { fqn } = useParams<{ fqn: string }>();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [policy, setPolicy] = useState<Policy>({} as Policy);
  const [ruleData, setRuleData] = useState<Rule>({
    name: '',
    description: '',
    resources: [],
    operations: [],
    condition: '',
    effect: Effect.Allow,
  });

  const breadcrumb = useMemo(
    () => [
      {
        name: t('label.setting-plural'),
        url: getSettingPath(),
      },
      {
        name: t('label.policy-plural'),
        url: policiesPath,
      },
      {
        name: getEntityName(policy),
        url: getPolicyWithFqnPath(fqn),
      },

      {
        name: t('label.add-new-entity', {
          entity: t('label.rule'),
        }),
        url: '',
      },
    ],
    [fqn, policy]
  );

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const data = await getPolicyByName(fqn, 'owner,location,teams,roles');
      setPolicy(data ?? ({} as Policy));
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    history.push(getPolicyWithFqnPath(fqn));
  };

  const handleSubmit = async () => {
    const { condition, ...rest } = { ...ruleData, name: trim(ruleData.name) };
    const patch = compare(policy, {
      ...policy,
      rules: [...policy.rules, condition ? { ...rest, condition } : rest],
    });
    try {
      const data = await patchPolicy(patch, policy.id);
      if (data) {
        handleBack();
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, [fqn]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Row className="bg-body-main h-auto p-y-lg" gutter={[16, 16]}>
      <Col offset={5} span={14}>
        <TitleBreadcrumb className="m-b-md" titleLinks={breadcrumb} />
        <Card>
          <Typography.Paragraph
            className="text-base"
            data-testid="add-rule-title">
            {t('label.add-new-entity', { entity: t('label.rule') })}
          </Typography.Paragraph>
          <Form
            data-testid="rule-form"
            id="rule-form"
            initialValues={{
              ruleEffect: ruleData.effect,
            }}
            layout="vertical"
            onFinish={handleSubmit}>
            <RuleForm ruleData={ruleData} setRuleData={setRuleData} />
            <Space align="center" className="w-full justify-end">
              <Button data-testid="cancel-btn" type="link" onClick={handleBack}>
                {t('label.cancel')}
              </Button>
              <Button
                data-testid="submit-btn"
                form="rule-form"
                htmlType="submit"
                type="primary">
                {t('label.submit')}
              </Button>
            </Space>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default AddRulePage;
