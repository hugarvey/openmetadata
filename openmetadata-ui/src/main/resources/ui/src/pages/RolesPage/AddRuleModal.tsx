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

import classNames from 'classnames';
import { isUndefined } from 'lodash';
import { FormErrorData } from 'Models';
import React, { FC, useState } from 'react';
import { Button } from '../../components/buttons/Button/Button';
import { RuleAccess } from '../../enums/rule.enum';
import {
  Operation,
  Rule,
} from '../../generated/entity/policies/accessControl/rule';
import { errorMsg } from '../../utils/CommonUtils';

interface AddRuleProps {
  header: string;
  errorData?: FormErrorData;
  initialData: Rule;
  onCancel: () => void;
  onSave: (data: Rule) => void;
}

const AddRuleModal: FC<AddRuleProps> = ({
  onCancel,
  header,
  initialData,
  errorData,
  onSave,
}: AddRuleProps) => {
  const [data, setData] = useState<Rule>(initialData);
  const [access, setAccess] = useState<RuleAccess>(
    initialData.allow ? RuleAccess.ALLOW : RuleAccess.DENY
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(
    Boolean(initialData.enabled)
  );
  const onChangeHadler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    e.persist();
    setData((prevState) => {
      return {
        ...prevState,
        [e.target.name]: e.target.value,
      };
    });
  };

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      ...data,
      allow: access === RuleAccess.ALLOW,
      enabled: isEnabled,
    });
  };

  return (
    <dialog className="tw-modal" data-testid="modal-container">
      <div className="tw-modal-backdrop" onClick={() => onCancel()} />
      <div className="tw-modal-container tw-overflow-y-auto tw-max-h-screen tw-w-120">
        <form onSubmit={onSubmitHandler}>
          <div className="tw-modal-header">
            <p
              className="tw-modal-title tw-text-grey-body"
              data-testid="header">
              {header}
            </p>
          </div>
          <div className="tw-modal-body">
            {!isUndefined(initialData.operation) && (
              <div className="tw-mb-4">
                <label className="tw-form-label required-field">
                  Select Operation
                </label>
                <select
                  required
                  className="tw-text-sm tw-appearance-none tw-border tw-border-main
                tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-grey-body  tw-leading-tight
                focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10 tw-bg-white"
                  name="operation"
                  value={data.operation}
                  onChange={onChangeHadler}>
                  <option value="">Select Operation</option>
                  <option value={Operation.UpdateDescription}>
                    Update Description
                  </option>
                  <option value={Operation.UpdateOwner}>Update Owner</option>
                  <option value={Operation.UpdateTags}>Update Tags</option>
                </select>
                {errorData?.operation && errorMsg(errorData.operation)}
              </div>
            )}

            <div className="tw-mb-4">
              <label className="tw-form-label">Access</label>
              <select
                required
                className="tw-text-sm tw-appearance-none tw-border tw-border-main
                tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-grey-body  tw-leading-tight
                focus:tw-outline-none focus:tw-border-focus hover:tw-border-hover tw-h-10 tw-bg-white"
                name="access"
                value={access}
                onChange={(e) => setAccess(e.target.value as RuleAccess)}>
                <option value={RuleAccess.ALLOW}>ALLOW</option>
                <option value={RuleAccess.DENY}>DENY</option>
              </select>
            </div>
            <div className="tw-flex tw-items-center">
              <label>Enable</label>
              <div
                className={classNames(
                  'toggle-switch tw-ml-4',
                  isEnabled ? 'open' : null
                )}
                data-testid="rule-switch"
                onClick={() => setIsEnabled((pre) => !pre)}>
                <div className="switch" />
              </div>
            </div>
          </div>
          <div className="tw-modal-footer" data-testid="cta-container">
            <Button
              size="regular"
              theme="primary"
              variant="link"
              onClick={onCancel}>
              Cancel
            </Button>
            <Button
              data-testid="saveButton"
              size="regular"
              theme="primary"
              type="submit"
              variant="contained">
              Save
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default AddRuleModal;
