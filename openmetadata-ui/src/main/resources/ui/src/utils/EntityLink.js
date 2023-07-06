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
import antlr4 from 'antlr4';
import { ParseTreeWalker } from 'antlr4/src/antlr4/tree';
import EntityLinkSplitListener from '../antlr/EntityLinkSplitListener';
import EntityLinkLexer from '../generated/antlr/EntityLinkLexer';
import EntityLinkParser from '../generated/antlr/EntityLinkParser';
import { ENTITY_LINK_SEPARATOR } from './EntityUtils';

export default class EntityLink {
  /**
   *
   * @param string entityLink
   * @returns list of entity link parts
   */
  static split(entityLink) {
    const chars = new antlr4.InputStream(entityLink);
    const lexer = new EntityLinkLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new EntityLinkParser(tokens);
    const tree = parser.entitylink();
    const splitter = new EntityLinkSplitListener();
    ParseTreeWalker.DEFAULT.walk(splitter, tree);

    return splitter.split();
  }

  /**
   *
   * @param string entityLink
   * @returns entity type
   */
  static getEntityType(entityLink) {
    return EntityLink.split(entityLink)[0];
  }

  /**
   *
   * @param string entityLink
   * @returns entity fqn
   */
  static getEntityFqn(entityLink) {
    return EntityLink.split(entityLink)[1];
  }

  /**
   *
   * @param string entityLink
   * @returns entity field
   */
  static getEntityField(entityLink) {
    const entityType = EntityLink.getEntityType(entityLink);
    if (entityType === 'table') {
      return EntityLink.split(entityLink)[2];
    }

    return EntityLink.split(entityLink)[-1];
  }

  /**
   *
   * @param string entityLink
   * @returns column name for table entity
   */
  static getTableColumnName(entityLink) {
    return EntityLink.split(entityLink)[3];
  }

  /**
   *
   * @param string entityLink
   * @returns column field for table entity
   */
  static getTableColumnField(entityLink) {
    return EntityLink.split(entityLink)[4];
  }

  /**
   *
   * @param string tableFqn
   * @param string | undefined columnName
   * @returns entity link for table
   */
  static getTableEntityLink(tableFqn, columnName) {
    if (columnName) {
      return `<#E${ENTITY_LINK_SEPARATOR}table${ENTITY_LINK_SEPARATOR}${tableFqn}${ENTITY_LINK_SEPARATOR}columns${ENTITY_LINK_SEPARATOR}${columnName}>`;
    } else {
      return `<#E${ENTITY_LINK_SEPARATOR}table${ENTITY_LINK_SEPARATOR}${tableFqn}>`;
    }
  }

  /**
   *
   * @param string entityType
   * @param string entityFqn
   * @returns entityLink
   */
  static getEntityLink(entityType, entityFqn) {
    return `<#E${ENTITY_LINK_SEPARATOR}${entityType}${ENTITY_LINK_SEPARATOR}${entityFqn}>`;
  }
}
