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

import { AxiosResponse } from 'axios';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  Elements,
  FlowElement,
  OnLoadParams,
  ReactFlowProvider,
  removeElements,
} from 'react-flow-renderer';
import { getTableDetails } from '../../axiosAPIs/tableAPI';
import { Column } from '../../generated/entity/data/table';
import { EntityReference } from '../../generated/type/entityReference';
import useToastContext from '../../hooks/useToastContext';
import {
  dragHandle,
  getDataLabel,
  getLayoutedElements,
  getLineageData,
  getNoLineageDataPlaceholder,
  onLoad,
  onNodeContextMenu,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onNodeMouseMove,
} from '../../utils/EntityLineageUtils';
import SVGIcons from '../../utils/SvgUtils';
import { getEntityIcon } from '../../utils/TableUtils';
import EntityInfoDrawer from '../EntityInfoDrawer/EntityInfoDrawer.component';
import CustomControls, { ControlButton } from './CustomControls.component';
import CustomNode from './CustomNode.component';
import { EntityLineageProp, SelectedNode } from './EntityLineage.interface';
import EntityLineageSidebar from './EntityLineageSidebar.component';

const Entitylineage: FunctionComponent<EntityLineageProp> = ({
  entityLineage,
  loadNodeHandler,
  lineageLeafNodes,
  isNodeLoading,
}: EntityLineageProp) => {
  const showToast = useToastContext();
  const [, setReactFlowInstance] = useState<OnLoadParams>();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(
    {} as SelectedNode
  );
  const expandButton = useRef<HTMLButtonElement | null>(null);
  const [expandNode, setExpandNode] = useState<EntityReference | undefined>(
    undefined
  );
  const [isEditMode, setEditMode] = useState<boolean>(false);

  const [tableColumns, setTableColumns] = useState<Column[]>([] as Column[]);

  const selectNodeHandler = (state: boolean, value: SelectedNode) => {
    setIsDrawerOpen(state);
    setSelectedNode(value);
  };

  const getNodeLable = (node: EntityReference) => {
    return (
      <>
        {node.type === 'table' && !isEditMode ? (
          <button
            className="tw-absolute tw--top-4 tw--left-5 tw-cursor-pointer tw-z-9999"
            onClick={(e) => {
              expandButton.current = expandButton.current
                ? null
                : e.currentTarget;
              setExpandNode(expandNode ? undefined : node);
              setIsDrawerOpen(false);
            }}>
            <SVGIcons
              alt="plus"
              icon={expandNode?.id === node.id ? 'icon-minus' : 'icon-plus'}
              width="16px"
            />
          </button>
        ) : null}
        <p className="tw-flex">
          <span className="tw-mr-2">{getEntityIcon(node.type)}</span>
          {getDataLabel(node.name as string)}
        </p>
      </>
    );
  };

  const setElementsHandle = () => {
    return getLineageData(
      entityLineage,
      selectNodeHandler,
      loadNodeHandler,
      lineageLeafNodes,
      isNodeLoading,
      getNodeLable
    ) as Elements;
  };

  const [elements, setElements] = useState<Elements>(
    getLayoutedElements(setElementsHandle())
  );
  const closeDrawer = (value: boolean) => {
    setIsDrawerOpen(value);
    setElements((prevElements) => {
      return prevElements.map((el) => {
        if (el.id === selectedNode.id) {
          return { ...el, className: 'leaf-node' };
        } else {
          return el;
        }
      });
    });
    setSelectedNode({} as SelectedNode);
  };
  const onElementsRemove = (elementsToRemove: Elements) =>
    setElements((els) => removeElements(elementsToRemove, els));
  const onConnect = (params: Edge | Connection) =>
    setElements((els) => addEdge(params, els));

  const onElementClick = (el: FlowElement) => {
    const node = [
      ...(entityLineage.nodes as Array<EntityReference>),
      entityLineage.entity,
    ].find((n) => el.id.includes(n.id));
    if (!expandButton.current) {
      selectNodeHandler(true, {
        name: node?.name as string,
        id: el.id,
        type: node?.type as string,
        entityId: node?.id as string,
      });
      setElements((prevElements) => {
        return prevElements.map((preEl) => {
          if (preEl.id === el.id) {
            return { ...preEl, className: `${preEl.className} selected-node` };
          } else {
            return { ...preEl, className: 'leaf-node' };
          }
        });
      });
    } else {
      expandButton.current = null;
    }
  };

  const onNodeExpand = (tableColumns?: Column[]) => {
    const elements = getLayoutedElements(setElementsHandle());
    setElements(
      elements.map((preEl) => {
        if (preEl.id.includes(expandNode?.id as string)) {
          return {
            ...preEl,
            className: `${preEl.className} selected-node`,
            data: { ...preEl.data, columns: tableColumns },
          };
        } else {
          return { ...preEl, className: 'leaf-node' };
        }
      })
    );
  };

  const getTableColumns = (expandNode?: EntityReference) => {
    if (expandNode) {
      getTableDetails(expandNode.id, ['columns'])
        .then((res: AxiosResponse) => {
          const { columns } = res.data;
          setTableColumns(columns);
        })
        .catch(() => {
          showToast({
            variant: 'error',
            body: `Error while fetching ${getDataLabel(
              expandNode.name,
              '.',
              true
            )} columns`,
          });
        });
    }
  };

  useEffect(() => {
    setElements(getLayoutedElements(setElementsHandle()));
    setExpandNode(undefined);
    setTableColumns([]);
  }, [entityLineage, isNodeLoading, isEditMode]);

  useEffect(() => {
    onNodeExpand();
    getTableColumns(expandNode);
  }, [expandNode]);

  useEffect(() => {
    if (!isEmpty(selectedNode)) {
      setExpandNode(undefined);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (tableColumns.length) {
      onNodeExpand(tableColumns);
    }
  }, [tableColumns]);

  return (
    <div className="tw-relative tw-h-full tw--mx-4 tw--mt-4">
      <div className="tw-w-full tw-h-full">
        {(entityLineage?.downstreamEdges ?? []).length > 0 ||
        (entityLineage?.upstreamEdges ?? []).length > 0 ? (
          <ReactFlowProvider>
            <ReactFlow
              elements={elements as Elements}
              maxZoom={2}
              minZoom={0.5}
              nodeTypes={{
                output: CustomNode,
                input: CustomNode,
                default: CustomNode,
              }}
              nodesConnectable={false}
              onConnect={onConnect}
              onElementClick={(_e, el) => onElementClick(el)}
              onElementsRemove={onElementsRemove}
              onLoad={(reactFlowInstance: OnLoadParams) => {
                onLoad(reactFlowInstance);
                setReactFlowInstance(reactFlowInstance);
              }}
              onNodeContextMenu={onNodeContextMenu}
              onNodeDrag={dragHandle}
              onNodeDragStart={dragHandle}
              onNodeDragStop={dragHandle}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onNodeMouseMove={onNodeMouseMove}>
              <CustomControls
                className="tw-absolute tw-top-1 tw-right-1 tw-bottom-full tw-ml-4 tw-mt-4"
                fitViewParams={{ minZoom: 0.5, maxZoom: 2.5 }}>
                <ControlButton
                  className={classNames(
                    'tw-h-9 tw-w-9 tw-rounded-full tw-px-1 tw-shadow-lg tw-cursor-pointer',
                    {
                      'tw-bg-primary': isEditMode,
                      'tw-bg-primary-hover-lite': !isEditMode,
                    }
                  )}
                  onClick={() => setEditMode((pre) => !pre)}>
                  <SVGIcons
                    alt="icon-edit-lineag"
                    className="tw--mt-0.5"
                    icon={
                      !isEditMode
                        ? 'icon-edit-lineage-color'
                        : 'icon-edit-lineage'
                    }
                    width="14"
                  />
                </ControlButton>
              </CustomControls>
              {isEditMode ? (
                <Background
                  className="tw-text-grey-muted-lite tw-bg-body-main"
                  color="#ffffff"
                  gap={12}
                  size={1}
                  variant={BackgroundVariant.Lines}
                />
              ) : null}
            </ReactFlow>
          </ReactFlowProvider>
        ) : (
          getNoLineageDataPlaceholder()
        )}
      </div>
      <EntityInfoDrawer
        isMainNode={selectedNode.name === entityLineage.entity.name}
        selectedNode={selectedNode}
        show={isDrawerOpen && !isEditMode}
        onCancel={closeDrawer}
      />
      <EntityLineageSidebar show={isEditMode} />
    </div>
  );
};

export default Entitylineage;
