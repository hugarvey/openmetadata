import os
import shutil
from typing import Optional, Union

from metadata.generated.schema.entity.services.connections.dashboard.lookerConnection import (
    NoGitCredentials,
)
from metadata.generated.schema.security.credentials.githubCredentials import (
    GitHubCredentials,
)
from metadata.generated.schema.security.credentials.bitbucketCredentials import (
    BitBucketCredentials,
)

from ingestion.src.metadata.utils.logger import ingestion_logger
from git import Repo

logger = ingestion_logger()


def _clone_repo(
    repo_name: str,
    path: str,
    credential: Optional[
        Union[
            NoGitCredentials,
            GitHubCredentials,
            BitBucketCredentials,
        ]
    ],
    overwrite: Optional[bool] = False,
):
    """Clone a repo to local `path`"""
    try:
        if overwrite:
            shutil.rmtree(path, ignore_errors=True)
        if os.path.isdir(path):
            logger.debug(f"_clone_repo: repo {path} already cloned.")
            return

        url = None
        if isinstance(credential, GitHubCredentials):
            url = f"https://x-oauth-basic:{credential.token.__root__.get_secret_value()}@github.com/{repo_name}.git"
        elif isinstance(credential, BitBucketCredentials):
            url = f"https://x-token-auth::{credential.token.__root__.get_secret_value()}@github.com/{repo_name}.git"

        assert url is not None

        Repo.clone_from(url, path)

        logger.info(f"repo {repo_name} cloned to {path}")
    except Exception as e:
        logger.error(f"GitHubCloneReader::_clone: ERROR {e} ")
