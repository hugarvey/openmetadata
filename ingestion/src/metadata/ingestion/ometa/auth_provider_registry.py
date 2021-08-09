#  Licensed to the Apache Software Foundation (ASF) under one or more
#  contributor license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright ownership.
#  The ASF licenses this file to You under the Apache License, Version 2.0
#  (the "License"); you may not use this file except in compliance with
#  the License. You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from metadata.ingestion.api.registry import Registry
from metadata.ingestion.ometa.auth_provider import AuthenticationProvider
auth_provider_registry = Registry[AuthenticationProvider]()
#auth_provider_registry.register("google", GoogleAuthenticationProvider.__class__)
#auth_provider_registry.register("no-auth", NoOpAuthenticationProvider.__class__)

# This source is always enabled
