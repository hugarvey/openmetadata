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

import DashboardServiceClass from './base/DashboardServiceClass';
import DatabaseServiceClass from './base/DatabaseServiceClass';
import MessagingServiceClass from './base/MessagingServiceClass';
import MlModelServiceClass from './base/MlModelServiceClass';
import PipelineServiceClass from './base/PipelineServiceClass';
import SearchServiceClass from './base/SearchServiceClass';
import StorageServiceClass from './base/StorageServiceClass';

const entities = [
  new DatabaseServiceClass(),
  new MessagingServiceClass(),
  new DashboardServiceClass(),
  new PipelineServiceClass(),
  new MlModelServiceClass(),
  new StorageServiceClass(),
  new SearchServiceClass(),
  // TODO: add tests for metadata service tests
  //   new MetadataServiceClass(),
] as const;

const OWNER1 = 'Aaron Johnson';
const OWNER2 = 'Cynthia Meyer';

const TEAM_OWNER_1 = 'Marketplace';
const TEAM_OWNER_2 = 'DevOps';

entities.forEach((entity) => {
  describe(`${entity.getName()} page`, () => {
    before(() => {
      cy.login();

      entity.prepareForTests();
    });

    after(() => {
      cy.login();
      entity.cleanup();
    });

    beforeEach(() => {
      cy.login();
      entity.visitEntity();
    });

    it(`Assign domain`, () => {
      entity.assignDomain();
    });

    it(`Update domain`, () => {
      entity.updateDomain();
    });

    it(`Remove domain`, () => {
      entity.removeDomain();
    });

    it(`Assign user Owner`, () => {
      entity.assignOwner(OWNER1);
    });

    it(`Update user Owner`, () => {
      entity.updateOwner(OWNER2);
    });

    it(`Remove user Owner`, () => {
      entity.removeOwner(OWNER2);
    });

    it(`Assign team as Owner`, () => {
      entity.assignTeamOwner(TEAM_OWNER_1);
    });

    it(`Update team as Owner`, () => {
      entity.updateTeamOwner(TEAM_OWNER_2);
    });

    it(`Remove team as Owner`, () => {
      entity.removeTeamOwner(TEAM_OWNER_2);
    });

    it(`Assign tier`, () => {
      entity.assignTier('Tier1');
    });

    it(`Update tier`, () => {
      entity.updateTier('Tier5');
    });

    it(`Remove tier`, () => {
      entity.removeTier();
    });

    it(`Update description`, () => {
      entity.updateDescription();
    });

    it(`Assign tags`, () => {
      entity.assignTags();
    });

    it(`Update Tags`, () => {
      entity.updateTags();
    });

    it(`Remove Tags`, () => {
      entity.removeTags();
    });

    it(`Assign GlossaryTerm`, () => {
      entity.assignGlossary();
    });

    it(`Update GlossaryTerm`, () => {
      entity.updateGlossary();
    });

    it(`Remove GlossaryTerm`, () => {
      entity.removeGlossary();
    });

    it(`Update displayName`, () => {
      entity.renameEntity();
    });

    it(`Create annoucement`, () => {
      entity.createAnnouncement();
    });

    it(`Remove annoucement`, () => {
      entity.removeAnnouncement();
    });

    it(`Create inactive annoucement`, () => {
      entity.createInactiveAnnouncement();
    });

    it(`Remove inactive annoucement`, () => {
      entity.removeInactiveAnnouncement();
    });

    it(`Soft delete`, () => {
      entity.softDeleteEntity();
    });

    it(`Hard delete`, () => {
      entity.hardDeleteEntity();
    });
  });
});
