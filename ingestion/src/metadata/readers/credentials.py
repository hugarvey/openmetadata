#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

"""
Helper to manage readers' credentials functionalities
"""
from metadata.generated.schema.security.credentials.gitCredentials import RepositoryName
from metadata.readers.base import ReadersCredentials
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


def update_repository_name(
    original: ReadersCredentials, name: str
) -> ReadersCredentials:
    """
    Given an original set of credentials and a new repository name,
    return the updated credentials
    """
    updated = original.copy(deep=True)
    updated.repositoryName = RepositoryName(__root__=name)

    return updated


def get_credentials_from_url(
    original: ReadersCredentials, url: str
) -> ReadersCredentials:
    """
    Given a default set of credentials and a git URL, check if the
    owner of the original credentials is part of the new URL.

    If it is, return updated credentials with the new repository name.

    If not, return the original credentials.

    This is just a quick sanity check. Worst case scenario, we won't be able to pick
    up information, which would still not happen since we work with a single
    token which cannot have permissions on different owners.
    """
    if original.repositoryOwner.__root__ not in url:
        logger.warning(
            f"Default repository owner [{original.repositoryOwner.__root__}] not found in [{url}]."
            " We'll use the default reader credentials."
        )
        return original

    # Your typical URL is git@bitbucket.org:owner/repo.git
    # or git@github.com:owner/repo.git
    url_repository = url.split(original.repositoryOwner.__root__ + "/")[-1]
    repo_name = url_repository.replace(".git", "")

    return update_repository_name(original=original, name=repo_name)
