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

import { DataAssetWithDomains } from 'components/DataAssets/DataAssetsHeader/DataAssetsHeader.interface';
import { QueryVote } from 'components/TableQueries/TableQueries.interface';
import { Operation } from 'fast-json-patch';
import { Pipeline } from '../../generated/entity/data/pipeline';
import { Paging } from '../../generated/type/paging';

export interface PipeLineDetailsProp {
  updatePipelineDetailsState: (data: DataAssetWithDomains) => void;
  pipelineFQN: string;
  pipelineDetails: Pipeline;
  paging: Paging;
  fetchPipeline: () => void;
  followPipelineHandler: (fetchCount: () => void) => Promise<void>;
  unFollowPipelineHandler: (fetchCount: () => void) => Promise<void>;
  settingsUpdateHandler: (updatedPipeline: Pipeline) => Promise<void>;
  descriptionUpdateHandler: (updatedPipeline: Pipeline) => Promise<void>;
  taskUpdateHandler: (patch: Array<Operation>) => Promise<void>;
  versionHandler: () => void;
  onExtensionUpdate: (updatedPipeline: Pipeline) => Promise<void>;
  handleToggleDelete: () => void;
  onUpdateVote: (data: QueryVote, id: string) => Promise<void>;
}
