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

import java.security.Principal;
import lombok.Getter;

public class CatalogPrincipal implements Principal {
  @Getter private final String name;

  public CatalogPrincipal(String name) {
    this.name = name;
  }

  @Override
  public String toString() {
    return "CatalogPrincipal{" + "name='" + name + '\'' + '}';
  }
}
