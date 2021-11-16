import classNames from 'classnames';
import cronstrue from 'cronstrue';
import React, { Fragment, useEffect, useState } from 'react';
import { CronError } from 'react-js-cron';
import { IngestionType } from '../../enums/service.enum';
// import { serviceTypes } from '../../constants/services.const';
import { getIngestionTypeList } from '../../utils/ServiceUtils';
import { Button } from '../buttons/Button/Button';
import CronEditor from '../common/CronEditor/CronEditor.component';
import IngestionStepper from '../IngestionStepper/IngestionStepper.component';
import { Steps } from '../IngestionStepper/IngestionStepper.interface';
import './IngestionModal.css';
import {
  IngestionModalProps,
  ServiceData,
  ValidationErrorMsg,
} from './IngestionModal.interface';

const errorMsg = (value: string) => {
  return (
    <div className="tw-mt-1">
      <strong className="tw-text-red-500 tw-text-xs tw-italic">{value}</strong>
    </div>
  );
};

const STEPS: Array<Steps> = [
  { name: 'Ingestion details', step: 1 },
  { name: 'Connector config', step: 2 },
  { name: 'Scheduling', step: 3 },
  { name: 'Review and Deploy', step: 4 },
];

const requiredField = (label: string) => (
  <>
    {label} <span className="tw-text-red-500">&nbsp;*</span>
  </>
);

const Field = ({ children }: { children: React.ReactNode }) => {
  return <div className="tw-mt-6">{children}</div>;
};

const PreviewSection = ({
  header,
  data,
  className,
}: {
  header: string;
  data: Array<{ key: string; value: string }>;
  className: string;
}) => {
  return (
    <div className={className}>
      {/* <hr className="tw-border-separator" /> */}
      <p className="preview-header tw-px-1">{header}</p>
      <div className="tw-grid tw-gap-4 tw-grid-cols-3 tw-place-content-center tw-pl-6">
        {data.map((d, i) => (
          <div key={i}>
            <p className="tw-text-xs tw-font-normal tw-text-grey-muted">
              {d.key}
            </p>
            <p>{d.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const getServiceName = (service: string) => {
  return service.split('$$').splice(1).join('$$');
};

const getIngestionName = (name: string) => {
  const nameString = name.trim().replace(/\s+/g, '_');

  return nameString.toLowerCase();
};

const getCurrentDate = () => {
  return `${new Date().toLocaleDateString('en-CA')}`;
};

const setService = (
  serviceList: Array<ServiceData>,
  currentservice: string
) => {
  const service = serviceList.find((s) => s.name === currentservice);

  return service ? `${service?.serviceType}$$${service?.name}` : '';
};

const IngestionModal: React.FC<IngestionModalProps> = ({
  isUpdating,
  header,
  serviceList = [], // TODO: remove default assignment after resolving prop validation warning
  ingestionList,
  onCancel,
  addIngestion,
  updateIngestion,
  selectedIngestion,
}: IngestionModalProps) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const [startDate, setStartDate] = useState<string>(
    selectedIngestion?.startDate || getCurrentDate()
  );
  const [endDate, setEndDate] = useState<string>(
    selectedIngestion?.endDate || ''
  );

  const [ingestionName, setIngestionName] = useState<string>(
    selectedIngestion?.displayName || ''
  );
  const [ingestionType, setIngestionType] = useState<string>(
    selectedIngestion?.ingestionType || ''
  );
  const [ingestionService, setIngestionService] = useState<string>(
    setService(serviceList, selectedIngestion?.service?.name as string) || ''
  );

  const [username, setUsername] = useState<string>(
    selectedIngestion?.connectorConfig?.username || ''
  );
  const [password, setPassword] = useState<string>(
    selectedIngestion?.connectorConfig?.password || ''
  );
  const [host, setHost] = useState<string>(
    selectedIngestion?.connectorConfig?.host || ''
  );
  const [database, setDatabase] = useState<string>(
    selectedIngestion?.connectorConfig?.database || ''
  );
  const [includeFilterPattern, setIncludeFilterPattern] = useState<
    Array<string>
  >(selectedIngestion?.connectorConfig?.includeFilterPattern || []);
  const [excludeFilterPattern, setExcludeFilterPattern] = useState<
    Array<string>
  >(selectedIngestion?.connectorConfig?.excludeFilterPattern || []);
  const [includeViews, setIncludeViews] = useState<boolean>(
    selectedIngestion?.connectorConfig?.includeViews || true
  );
  const [excludeDataProfiler, setExcludeDataProfiler] = useState<boolean>(
    selectedIngestion?.connectorConfig?.excludeDataProfiler || false
  );

  const [ingestionSchedule, setIngestionSchedule] = useState<string>(
    selectedIngestion?.scheduleInterval || '*/5 * * * *'
  );
  const [cronError, setCronError] = useState<CronError>();

  const [showErrorMsg, setShowErrorMsg] = useState<ValidationErrorMsg>({
    selectService: false,
    name: false,
    username: false,
    password: false,
    ingestionType: false,
    host: false,
    database: false,
    ingestionSchedule: false,
    isPipelineExists: false,
    isPipelineNameExists: false,
  });

  const isPipelineExists = () => {
    return ingestionList.some(
      (i) =>
        i.service.name === getServiceName(ingestionService) &&
        i.ingestionType === ingestionType &&
        i.service.name !== selectedIngestion?.name &&
        i.service.displayName === selectedIngestion?.ingestionType
    );
  };

  const isPipeLineNameExists = () => {
    return ingestionList.some(
      (i) =>
        i.name === getIngestionName(ingestionName) &&
        i.name !== selectedIngestion?.name
    );
  };

  const handleValidation = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    const name = event.target.name;

    switch (name) {
      case 'name':
        setIngestionName(value);

        break;
      case 'selectService':
        setIngestionService(value);
        setIngestionType('');

        break;
      case 'ingestionType':
        setIngestionType(value);

        break;
      case 'username':
        setUsername(value);

        break;
      case 'password':
        setPassword(value);

        break;
      case 'host':
        setHost(value);

        break;
      case 'database':
        setDatabase(value);

        break;
      case 'ingestionSchedule':
        setIngestionSchedule(value);

        break;

      default:
        break;
    }
    setShowErrorMsg({
      ...showErrorMsg,
      [name]: !value,
    });
  };

  const forwardStepHandler = (activeStep: number) => {
    let isValid = false;
    switch (activeStep) {
      case 1:
        isValid = Boolean(
          ingestionName &&
            ingestionService &&
            ingestionType &&
            !isPipelineExists()
        );
        setShowErrorMsg({
          ...showErrorMsg,
          name: !ingestionName,
          ingestionType: !ingestionType,
          selectService: !ingestionService,
        });

        break;
      case 2:
        isValid = Boolean(username && password && host && database);
        setShowErrorMsg({
          ...showErrorMsg,
          username: !username,
          password: !password,
          host: !host,
          database: !database,
        });

        break;
      case 3:
        isValid = Boolean(ingestionSchedule && !cronError);
        setShowErrorMsg({
          ...showErrorMsg,
          ingestionSchedule: !ingestionSchedule,
        });

        break;

      default:
        break;
    }
    setActiveStep((pre) => (pre < STEPS.length && isValid ? pre + 1 : pre));
  };

  const getActiveStepFields = (activeStep: number) => {
    switch (activeStep) {
      case 1:
        return (
          <Fragment>
            <Field>
              <label className="tw-block" htmlFor="name">
                {requiredField('Name:')}
              </label>
              <input
                className={classNames('tw-form-inputs tw-px-3 tw-py-1', {
                  'tw-cursor-not-allowed': isUpdating,
                })}
                id="name"
                name="name"
                placeholder="Ingestion name"
                readOnly={isUpdating}
                type="text"
                value={ingestionName}
                onChange={handleValidation}
              />
              {showErrorMsg.name && errorMsg('Ingestion Name is required')}
              {showErrorMsg.isPipelineNameExists &&
                errorMsg(
                  `Ingestion with name ${getIngestionName(
                    ingestionName
                  )} already exists.`
                )}
            </Field>

            <Field>
              <label className="tw-block" htmlFor="selectService">
                {requiredField('Select Service:')}
              </label>
              <select
                className={classNames('tw-form-inputs tw-px-3 tw-py-1', {
                  'tw-cursor-not-allowed': isUpdating,
                })}
                data-testid="selectService"
                disabled={isUpdating}
                id="selectService"
                name="selectService"
                value={ingestionService}
                onChange={handleValidation}>
                <option value="">Select Service</option>
                {serviceList.map((service, index) => (
                  <option
                    key={index}
                    value={`${service.serviceType}$$${service.name}`}>
                    {service.name}
                  </option>
                ))}
              </select>
              {showErrorMsg.selectService && errorMsg('Service is required')}
            </Field>
            <Field>
              <label className="tw-block " htmlFor="ingestionType">
                {requiredField('Type of ingestion:')}
              </label>
              <select
                className={classNames('tw-form-inputs tw-px-3 tw-py-1', {
                  'tw-cursor-not-allowed': !ingestionService,
                })}
                data-testid="selectService"
                disabled={!ingestionService || isUpdating}
                id="ingestionType"
                name="ingestionType"
                value={ingestionType}
                onChange={handleValidation}>
                <option value="">Select ingestion type</option>
                {(
                  getIngestionTypeList(ingestionService?.split('$$')?.[0]) || []
                ).map((service, index) => (
                  <option key={index} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              {showErrorMsg.ingestionType &&
                errorMsg('Ingestion Type is required')}
              {showErrorMsg.isPipelineExists &&
                errorMsg(
                  `Ingestion with service ${getServiceName(
                    ingestionService
                  )} and ingestion-type ${ingestionType} already exists `
                )}
            </Field>
          </Fragment>
        );

      case 2:
        return (
          <Fragment>
            <Field>
              <label className="tw-block" htmlFor="username">
                {requiredField('Username:')}
              </label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                id="username"
                name="username"
                placeholder="User name"
                type="text"
                value={username}
                onChange={handleValidation}
              />
              {showErrorMsg.username && errorMsg('Username is required')}
            </Field>
            <Field>
              <label className="tw-block" htmlFor="password">
                {requiredField('Password:')}
              </label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                id="password"
                name="password"
                placeholder="Password"
                type="password"
                value={password}
                onChange={handleValidation}
              />
              {showErrorMsg.password && errorMsg('Password is required')}
            </Field>
            <Field>
              <label className="tw-block" htmlFor="host">
                {requiredField('Host:')}
              </label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                id="host"
                name="host"
                placeholder="Host"
                type="text"
                value={host}
                onChange={handleValidation}
              />
              {showErrorMsg.host && errorMsg('Host is required')}
            </Field>
            <Field>
              <label className="tw-block" htmlFor="database">
                {requiredField('Database:')}
              </label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                id="database"
                name="database"
                placeholder="Database"
                type="text"
                value={database}
                onChange={handleValidation}
              />
              {showErrorMsg.database && errorMsg('Database is required')}
            </Field>
            <Field>
              <label className="tw-block" htmlFor="includeFilterPattern">
                Include Filter Patterns:
              </label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                id="includeFilterPattern"
                name="includeFilterPattern"
                placeholder="Include filter patterns comma seperated"
                type="text"
                value={includeFilterPattern}
                onChange={(e) => setIncludeFilterPattern([e.target.value])}
              />
            </Field>
            <Field>
              <label className="tw-block" htmlFor="excludeFilterPattern">
                Exclude Filter Patterns:
              </label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                id="excludeFilterPattern"
                name="excludeFilterPattern"
                placeholder="Exclude filter patterns comma seperated"
                type="text"
                value={excludeFilterPattern}
                onChange={(e) => setExcludeFilterPattern([e.target.value])}
              />
            </Field>
            <Field>
              <div className="tw-flex tw-justify-between">
                <Fragment>
                  <label>Include views:</label>
                  <div
                    className={classNames(
                      'toggle-switch',
                      includeViews ? 'open' : null
                    )}
                    onClick={() => setIncludeViews(!includeViews)}>
                    <div className="switch" />
                  </div>
                </Fragment>
                <Fragment>
                  <label>Enable data profiler:</label>
                  <div
                    className={classNames(
                      'toggle-switch',
                      excludeDataProfiler ? 'open' : null
                    )}
                    onClick={() =>
                      setExcludeDataProfiler(!excludeDataProfiler)
                    }>
                    <div className="switch" />
                  </div>
                </Fragment>
              </div>
            </Field>
          </Fragment>
        );
      case 3:
        return (
          <Fragment>
            <div className="tw-mt-4">
              <label htmlFor="">{requiredField('Schedule interval:')}</label>
              <div className="tw-flex tw-justify-items-start tw-mt-2">
                <CronEditor
                  defaultValue={ingestionSchedule}
                  onChangeHandler={(v) => setIngestionSchedule(v)}
                  onError={setCronError}>
                  <p className="tw-text-grey-muted tw-text-xs tw-mt-1">
                    <span>( </span>
                    <span className="tw-font-normal">{ingestionSchedule}</span>
                    <span> in UTC Timezone ) </span>
                  </p>
                  {showErrorMsg.ingestionSchedule
                    ? errorMsg('Ingestion schedule is required')
                    : cronError && errorMsg(cronError.description)}
                </CronEditor>
              </div>
            </div>
            <Field>
              <label htmlFor="startDate">Start date:</label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                pattern="YY-MM-DD"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field>
              <label htmlFor="endDate">End date:</label>
              <input
                className="tw-form-inputs tw-px-3 tw-py-1"
                min={startDate}
                pattern="YY-MM-DD"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </Fragment>
        );
      case 4:
        return (
          <Fragment>
            <div className="tw-flex tw-flex-col tw-mt-6">
              <PreviewSection
                className="tw-mb-4 tw-mt-4"
                data={[
                  { key: 'Name', value: ingestionName },
                  {
                    key: 'Service Type',
                    value: getServiceName(ingestionService),
                  },
                  { key: 'Ingestion Type', value: ingestionType },
                ]}
                header="Ingestion Details"
              />
              <PreviewSection
                className="tw-mb-4 tw-mt-6"
                data={[
                  { key: 'Username', value: username },
                  { key: 'Password', value: password },
                  { key: 'Host', value: host },
                  { key: 'Database', value: database },
                  { key: 'Include views', value: includeViews ? 'Yes' : 'No' },
                  {
                    key: 'Enable Data Profiler',
                    value: excludeDataProfiler ? 'Yes' : 'No',
                  },
                ]}
                header="Connector Config"
              />
              <PreviewSection
                className="tw-mt-6"
                data={[]}
                header="Scheduling"
              />
              <p className="tw-pl-6">
                {cronstrue.toString(ingestionSchedule || '', {
                  use24HourTimeFormat: true,
                  verbose: true,
                })}
              </p>
            </div>
          </Fragment>
        );

      default:
        return null;
    }
  };

  const onSaveHandler = (triggerIngestion = false) => {
    const ingestionData = {
      ingestionType: ingestionType as IngestionType,
      displayName: ingestionName,
      name: getIngestionName(ingestionName),
      service: { name: getServiceName(ingestionService), id: '', type: '' },
      startDate: startDate || getCurrentDate(),
      endDate: endDate || '',
      scheduleInterval: ingestionSchedule,
      forceDeploy: true,
      connectorConfig: {
        database: database,
        enableDataProfiler: excludeDataProfiler,
        excludeFilterPattern: excludeFilterPattern,
        host: host,
        includeFilterPattern: includeFilterPattern,
        includeViews: includeViews,
        password: password,
        username: username,
      },
    };
    addIngestion?.(ingestionData, triggerIngestion);
    updateIngestion?.(ingestionData, triggerIngestion);
  };

  useEffect(() => {
    setShowErrorMsg({
      ...showErrorMsg,
      isPipelineExists: isPipelineExists(),
      isPipelineNameExists: isPipeLineNameExists(),
    });
  }, [ingestionType, ingestionService, ingestionName]);

  useEffect(() => {
    if (endDate) {
      const startDt = new Date(startDate);
      const endDt = new Date(endDate);
      if (endDt.getTime() < startDt.getTime()) {
        setEndDate('');
      }
    }
  }, [startDate]);

  return (
    <dialog className="tw-modal" data-testid="service-modal">
      <div className="tw-modal-backdrop" />
      <div className="tw-modal-container tw-max-w-2xl">
        <div className="tw-modal-header">
          <p className="tw-modal-title">{header}</p>
          <div className="tw-flex">
            <svg
              className="tw-w-6 tw-h-6 tw-ml-1 tw-cursor-pointer"
              data-testid="closeWhatsNew"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              onClick={onCancel}>
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        <div className="tw-modal-body">
          <IngestionStepper activeStep={activeStep} steps={STEPS} />

          <form className="tw-min-w-full" data-testid="form">
            <div className="tw-px-4">{getActiveStepFields(activeStep)}</div>
          </form>
        </div>
        <div className="tw-modal-footer tw-justify-between">
          <Button
            className={classNames('tw-mr-2', {
              'tw-invisible': activeStep === 1,
            })}
            data-testid="cancel"
            size="regular"
            theme="primary"
            variant="text"
            onClick={() => setActiveStep((pre) => (pre > 1 ? pre - 1 : pre))}>
            <i className="fas fa-arrow-left tw-text-sm tw-align-middle tw-pr-1.5" />{' '}
            <span>Previous</span>
          </Button>

          {activeStep === 4 ? (
            <div className="tw-flex">
              <Button
                data-testid="save-button"
                size="regular"
                theme="primary"
                type="submit"
                variant="contained"
                onClick={() => onSaveHandler()}>
                <span>Deploy</span>
              </Button>
            </div>
          ) : (
            <Button
              data-testid="next-button"
              size="regular"
              theme="primary"
              variant="contained"
              onClick={() => forwardStepHandler(activeStep)}>
              <span>Next</span>
              <i className="fas fa-arrow-right tw-text-sm tw-align-middle tw-pl-1.5" />
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default IngestionModal;
