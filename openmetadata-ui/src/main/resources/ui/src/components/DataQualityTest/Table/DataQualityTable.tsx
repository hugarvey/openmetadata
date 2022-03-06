import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { useState } from 'react';
import { TITLE_FOR_NON_ADMIN_ACTION } from '../../../constants/constants';
import { ColumnTestType } from '../../../enums/columnTest.enum';
import {
  TableTestType,
  TestCaseStatus,
} from '../../../generated/tests/tableTest';
import {
  DatabaseTestModeType,
  TestTableDataType,
} from '../../../interface/dataQuality.interface';
import { isEven } from '../../../utils/CommonUtils';
import NonAdminAction from '../../common/non-admin-action/NonAdminAction';
import Loader from '../../Loader/Loader';
import ConfirmationModal from '../../Modals/ConfirmationModal/ConfirmationModal';

type Props = {
  testCase: TestTableDataType[];
  isTableTest: boolean;
  handleEditTest: (mode: DatabaseTestModeType, obj: TestTableDataType) => void;
  handleRemoveTableTest?: (testType: TableTestType) => void;
  handleRemoveColumnTest?: (
    columnName: string,
    testType: ColumnTestType
  ) => void;
};

const DataQualityTable = ({
  testCase,
  isTableTest,
  handleEditTest,
  handleRemoveTableTest,
  handleRemoveColumnTest,
}: Props) => {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState<{
    data?: TestTableDataType;
    state: string;
  }>({
    data: undefined,
    state: '',
  });

  const handleCancelConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setDeleteSelection({ data: undefined, state: '' });
  };

  const confirmDelete = (data: TestTableDataType) => {
    setDeleteSelection({ data, state: '' });
    setIsConfirmationModalOpen(true);
  };

  const handleDelete = (data: TestTableDataType) => {
    if (isTableTest) {
      handleRemoveTableTest &&
        handleRemoveTableTest(data.testCase.tableTestType as TableTestType);
    } else {
      handleRemoveColumnTest &&
        handleRemoveColumnTest(
          data?.columnName || '',
          data.testCase?.columnTestType as ColumnTestType
        );
    }
    handleCancelConfirmationModal();
  };

  return (
    <div className="tw-table-responsive">
      <table className="tw-w-full">
        <thead>
          <tr className="tableHead-row">
            <th className="tableHead-cell">Test Case</th>
            <th className="tableHead-cell">Config</th>
            <th className="tableHead-cell">Last Run</th>
            <th className="tableHead-cell">Value</th>
            <th className="tableHead-cell">Action</th>
          </tr>
        </thead>
        <tbody className="tableBody">
          {testCase.map((column, index) => {
            return (
              <tr
                className={classNames(
                  'tableBody-row',
                  !isEven(index + 1) ? 'odd-row' : null
                )}
                data-testid="column"
                id={column.name}
                key={index}>
                <td className="tableBody-cell tw-w-3/12">
                  <span>
                    {isTableTest
                      ? column.testCase.tableTestType
                      : column.testCase.columnTestType}
                  </span>
                </td>
                <td className="tableBody-cell tw-w-2/12">
                  {!isEmpty(column.testCase?.config) && column.testCase?.config
                    ? Object.entries(column.testCase?.config).map((d, i) => (
                        <p key={i}>{`${d[0]}: ${
                          !isEmpty(d[1]) ? d[1] : '--'
                        }`}</p>
                      ))
                    : '--'}
                </td>
                <td className="tableBody-cell tw-w-1/12">
                  {column.results && column.results.length > 0 ? (
                    <span
                      className={classNames(
                        'tw-block tw-w-full tw-h-full tw-text-white tw-text-center tw-py-1',
                        {
                          'tw-bg-success':
                            column.results[0].testCaseStatus ===
                            TestCaseStatus.Success,
                          'tw-bg-failed':
                            column.results[0].testCaseStatus ===
                            TestCaseStatus.Failed,
                          'tw-bg-status-queued':
                            column.results[0].testCaseStatus ===
                            TestCaseStatus.Aborted,
                        }
                      )}>
                      {column.results[0].testCaseStatus}
                    </span>
                  ) : (
                    '--'
                  )}
                </td>
                <td className="tableBody-cell tw-w-4/12">
                  <span>
                    {column.results && column.results.length > 0
                      ? column.results[0].result || '--'
                      : '--'}
                  </span>
                </td>
                <td className="tableBody-cell tw-w-2/12">
                  <div className="tw-flex tw-items-center">
                    <NonAdminAction
                      position="left"
                      title={TITLE_FOR_NON_ADMIN_ACTION}>
                      <button
                        className="link-text tw-mr-2"
                        data-testid="edit"
                        onClick={() =>
                          handleEditTest(
                            isTableTest ? 'table' : 'column',
                            column
                          )
                        }>
                        Edit
                      </button>
                    </NonAdminAction>
                    <NonAdminAction
                      position="left"
                      title={TITLE_FOR_NON_ADMIN_ACTION}>
                      <button
                        className="link-text tw-mr-2"
                        data-testid="delete"
                        onClick={() => confirmDelete(column)}>
                        {deleteSelection.data?.id === column.id ? (
                          deleteSelection.state === 'success' ? (
                            <i aria-hidden="true" className="fa fa-check" />
                          ) : (
                            <Loader size="small" type="default" />
                          )
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </NonAdminAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isConfirmationModalOpen && (
        <ConfirmationModal
          bodyText={`You want to delete test ${
            deleteSelection.data?.testCase?.columnTestType ||
            deleteSelection.data?.testCase?.tableTestType
          } permanently? This action cannot be reverted.`}
          cancelText="Discard"
          confirmButtonCss="tw-bg-error hover:tw-bg-error focus:tw-bg-error"
          confirmText={
            deleteSelection.state === 'waiting' ? (
              <Loader size="small" type="white" />
            ) : deleteSelection.state === 'success' ? (
              <i aria-hidden="true" className="fa fa-check" />
            ) : (
              'Delete'
            )
          }
          header="Are you sure?"
          onCancel={handleCancelConfirmationModal}
          onConfirm={() =>
            handleDelete(deleteSelection.data as TestTableDataType)
          }
        />
      )}
    </div>
  );
};

export default DataQualityTable;
