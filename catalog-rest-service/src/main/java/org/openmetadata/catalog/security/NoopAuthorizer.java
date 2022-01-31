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

package org.openmetadata.catalog.security;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.jdbi.v3.core.Jdbi;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.MetadataOperation;

public class NoopAuthorizer implements Authorizer {

  @Override
  public void init(AuthorizerConfiguration config, Jdbi jdbi) {
    /* Nothing to do */
  }

  @Override
  public boolean hasPermissions(AuthenticationContext ctx, EntityReference entityOwnership) {
    return true;
  }

  @Override
  public boolean hasPermissions(
      AuthenticationContext ctx, EntityReference entityReference, MetadataOperation operation) {
    return true;
  }

  @Override
  public List<MetadataOperation> listPermissions(AuthenticationContext ctx, EntityReference entityReference) {
    // Return all operations.
    return Stream.of(MetadataOperation.values()).collect(Collectors.toList());
  }

  @Override
  public boolean isAdmin(AuthenticationContext ctx) {
    return true;
  }

  @Override
  public boolean isBot(AuthenticationContext ctx) {
    return true;
  }
}
