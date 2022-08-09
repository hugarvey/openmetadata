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

package org.openmetadata.catalog.security.policyevaluator;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.util.concurrent.UncheckedExecutionException;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import javax.annotation.CheckForNull;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.entity.teams.Team;
import org.openmetadata.catalog.entity.teams.User;
import org.openmetadata.catalog.exception.EntityNotFoundException;
import org.openmetadata.catalog.jdbi3.EntityRepository;
import org.openmetadata.catalog.util.EntityUtil.Fields;

/** Subject context used for Access Control Policies */
@Slf4j
public class SubjectCache {
  private static final SubjectCache INSTANCE = new SubjectCache();
  private static volatile boolean INITIALIZED = false;

  protected static LoadingCache<String, SubjectContext> USER_CACHE;
  protected static LoadingCache<UUID, Team> TEAM_CACHE;

  protected static EntityRepository<User> USER_REPOSITORY;
  protected static Fields USER_FIELDS;
  protected static EntityRepository<Team> TEAM_REPOSITORY;
  protected static Fields TEAM_FIELDS;

  // Expected to be called only once from the DefaultAuthorizer
  public static void initialize() {
    if (!INITIALIZED) {
      USER_CACHE =
          CacheBuilder.newBuilder().maximumSize(1000).expireAfterAccess(1, TimeUnit.MINUTES).build(new UserLoader());
      TEAM_CACHE =
          CacheBuilder.newBuilder().maximumSize(1000).expireAfterAccess(1, TimeUnit.MINUTES).build(new TeamLoader());
      USER_REPOSITORY = Entity.getEntityRepository(Entity.USER);
      USER_FIELDS = USER_REPOSITORY.getFields("roles, teams");
      TEAM_REPOSITORY = Entity.getEntityRepository(Entity.TEAM);
      TEAM_FIELDS = TEAM_REPOSITORY.getFields("defaultRoles, policies, parents");
      INITIALIZED = true;
    }
  }

  public static SubjectCache getInstance() {
    return INSTANCE;
  }

  public SubjectContext getSubjectContext(String userName) throws EntityNotFoundException {
    try {
      return USER_CACHE.get(userName);
    } catch (ExecutionException | UncheckedExecutionException ex) {
      throw new EntityNotFoundException(ex.getMessage());
    }
  }

  public Team getTeam(UUID teamId) throws EntityNotFoundException {
    try {
      return TEAM_CACHE.get(teamId);
    } catch (ExecutionException | UncheckedExecutionException ex) {
      throw new EntityNotFoundException(ex.getMessage());
    }
  }

  public static void cleanUp() {
    USER_CACHE.invalidateAll();
    TEAM_CACHE.invalidateAll();
    INITIALIZED = false;
  }

  public void invalidateUser(String userName) {
    try {
      USER_CACHE.invalidate(userName);
    } catch (Exception ex) {
      LOG.error("Failed to invalidate cache for user {}", userName, ex);
    }
  }

  static class UserLoader extends CacheLoader<String, SubjectContext> {
    @Override
    public SubjectContext load(@CheckForNull String userName) throws IOException {
      User user = USER_REPOSITORY.getByName(null, userName, USER_FIELDS);
      LOG.info("Loaded user {}:{}", user.getName(), user.getId());
      return new SubjectContext(user);
    }
  }

  static class TeamLoader extends CacheLoader<UUID, Team> {
    @Override
    public Team load(@NonNull UUID teamId) throws IOException {
      Team team = TEAM_REPOSITORY.get(null, teamId, TEAM_FIELDS);
      LOG.info("Loaded team {}:{}", team.getName(), team.getId());
      return team;
    }
  }
}
