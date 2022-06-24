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

package org.openmetadata.catalog.util;

import static org.flywaydb.core.internal.info.MigrationInfoDumper.dumpToAsciiTable;
import static org.openmetadata.catalog.security.SecurityUtil.DEFAULT_PRINCIPAL_DOMAIN;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.dropwizard.configuration.EnvironmentVariableSubstitutor;
import io.dropwizard.configuration.FileConfigurationSourceProvider;
import io.dropwizard.configuration.SubstitutingSourceProvider;
import io.dropwizard.configuration.YamlConfigurationFactory;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.jackson.Jackson;
import io.dropwizard.jdbi3.JdbiFactory;
import io.dropwizard.jersey.validation.Validators;
import io.dropwizard.setup.Environment;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
import javax.validation.Validator;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Options;
import org.elasticsearch.client.RestHighLevelClient;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjects;
import org.openmetadata.catalog.CatalogApplicationConfig;
import org.openmetadata.catalog.elasticsearch.ElasticSearchConfiguration;
import org.openmetadata.catalog.elasticsearch.ElasticSearchIndexDefinition;
import org.openmetadata.catalog.entity.teams.AuthenticationMechanism;
import org.openmetadata.catalog.entity.teams.User;
import org.openmetadata.catalog.fernet.Fernet;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.UserRepository;
import org.openmetadata.catalog.jdbi3.locator.ConnectionAwareAnnotationSqlLocator;
import org.openmetadata.catalog.security.jwt.JWTTokenGenerator;
import org.openmetadata.catalog.teams.authn.GenerateTokenRequest;
import org.openmetadata.catalog.teams.authn.JWTAuthMechanism;
import org.openmetadata.catalog.teams.authn.JWTTokenExpiry;

public final class TablesInitializer {
  private static final String OPTION_SCRIPT_ROOT_PATH = "script-root";
  private static final String OPTION_CONFIG_FILE_PATH = "config";
  private static final String DISABLE_VALIDATE_ON_MIGRATE = "disable-validate-on-migrate";
  private static final Options OPTIONS;

  static {
    OPTIONS = new Options();
    OPTIONS.addOption("s", OPTION_SCRIPT_ROOT_PATH, true, "Root directory of script path");
    OPTIONS.addOption("c", OPTION_CONFIG_FILE_PATH, true, "Config file path");
    OPTIONS.addOption(null, SchemaMigrationOption.CREATE.toString(), false, "Run sql migrations from scratch");
    OPTIONS.addOption(null, SchemaMigrationOption.DROP.toString(), false, "Drop all the tables in the target database");
    OPTIONS.addOption(
        null,
        SchemaMigrationOption.CHECK_CONNECTION.toString(),
        false,
        "Check the connection for " + "configured data source");
    OPTIONS.addOption(
        null, SchemaMigrationOption.MIGRATE.toString(), false, "Execute schema migration from last " + "check point");
    OPTIONS.addOption(
        null,
        SchemaMigrationOption.INFO.toString(),
        false,
        "Show the status of the schema migration " + "compared to the target database");
    OPTIONS.addOption(
        null,
        SchemaMigrationOption.VALIDATE.toString(),
        false,
        "Validate the target database changes " + "with the migration scripts");
    OPTIONS.addOption(
        null,
        SchemaMigrationOption.REPAIR.toString(),
        false,
        "Repairs the DATABASE_CHANGE_LOG by "
            + "removing failed migrations and correcting checksum of existing migration script");
    OPTIONS.addOption(
        null, DISABLE_VALIDATE_ON_MIGRATE, false, "Disable flyway validation checks while running " + "migrate");
    OPTIONS.addOption(
        null, SchemaMigrationOption.ES_CREATE.toString(), false, "Creates all the indexes in the elastic search");
    OPTIONS.addOption(
        null, SchemaMigrationOption.ES_DROP.toString(), false, "Drop all the indexes in the elastic search");
    OPTIONS.addOption(null, SchemaMigrationOption.ES_MIGRATE.toString(), false, "Update Elastic Search index mapping");
    OPTIONS.addOption(null, SchemaMigrationOption.CREATE_INGESTION_BOT.toString(), false, "Create Ingestion Bot");
  }

  private TablesInitializer() {}

  public static void main(String[] args) throws Exception {
    CommandLineParser parser = new DefaultParser();
    CommandLine commandLine = parser.parse(OPTIONS, args);
    if (!commandLine.hasOption(OPTION_CONFIG_FILE_PATH) || !commandLine.hasOption(OPTION_SCRIPT_ROOT_PATH)) {
      usage();
      System.exit(1);
    }

    boolean isSchemaMigrationOptionSpecified = false;
    SchemaMigrationOption schemaMigrationOptionSpecified = null;
    for (SchemaMigrationOption schemaMigrationOption : SchemaMigrationOption.values()) {
      if (commandLine.hasOption(schemaMigrationOption.toString())) {
        if (isSchemaMigrationOptionSpecified) {
          System.out.println(
              "Only one operation can be execute at once, please select one of 'create', ',migrate', "
                  + "'validate', 'info', 'drop', 'repair', 'check-connection'.");
          System.exit(1);
        }
        isSchemaMigrationOptionSpecified = true;
        schemaMigrationOptionSpecified = schemaMigrationOption;
      }
    }

    if (!isSchemaMigrationOptionSpecified) {
      System.out.println(
          "One of the option 'create', ',migrate', 'validate', 'info', 'drop', 'repair', "
              + "'check-connection' must be specified to execute.");
      System.exit(1);
    }

    String confFilePath = commandLine.getOptionValue(OPTION_CONFIG_FILE_PATH);
    ObjectMapper objectMapper = Jackson.newObjectMapper();
    Validator validator = Validators.newValidator();
    YamlConfigurationFactory<CatalogApplicationConfig> factory =
        new YamlConfigurationFactory<>(CatalogApplicationConfig.class, validator, objectMapper, "dw");
    CatalogApplicationConfig config =
        factory.build(
            new SubstitutingSourceProvider(
                new FileConfigurationSourceProvider(), new EnvironmentVariableSubstitutor(false)),
            confFilePath);
    Fernet.getInstance().setFernetKey(config);
    DataSourceFactory dataSourceFactory = config.getDataSourceFactory();
    ElasticSearchConfiguration esConfig = config.getElasticSearchConfiguration();
    if (dataSourceFactory == null) {
      throw new RuntimeException("No database in config file");
    }
    String jdbcUrl = dataSourceFactory.getUrl();
    String user = dataSourceFactory.getUser();
    String password = dataSourceFactory.getPassword();
    boolean disableValidateOnMigrate = commandLine.hasOption(DISABLE_VALIDATE_ON_MIGRATE);
    if (disableValidateOnMigrate) {
      System.out.println("Disabling validation on schema migrate");
    }
    String scriptRootPath = commandLine.getOptionValue(OPTION_SCRIPT_ROOT_PATH);
    Flyway flyway =
        get(
            jdbcUrl,
            user,
            password,
            scriptRootPath,
            config.getDataSourceFactory().getDriverClass(),
            !disableValidateOnMigrate);
    RestHighLevelClient client = ElasticSearchClientUtils.createElasticSearchClient(esConfig);
    try {
      execute(config, flyway, client, schemaMigrationOptionSpecified);
      System.out.printf("\"%s\" option successful%n", schemaMigrationOptionSpecified);
    } catch (Exception e) {
      System.err.printf("\"%s\" option failed : %s%n", schemaMigrationOptionSpecified, e);
      System.exit(1);
    }
    System.exit(0);
  }

  static Flyway get(
      String url, String user, String password, String scriptRootPath, String dbSubType, boolean validateOnMigrate) {
    System.out.format(
        "url %s, user %s, password %s, scriptRoot %s, validateOnMigrate %s",
        url, user, password, scriptRootPath, validateOnMigrate);
    String location = "filesystem:" + scriptRootPath + File.separator + dbSubType;
    return Flyway.configure()
        .encoding(StandardCharsets.UTF_8)
        .table("DATABASE_CHANGE_LOG")
        .sqlMigrationPrefix("v")
        .validateOnMigrate(validateOnMigrate)
        .outOfOrder(false)
        .baselineOnMigrate(true)
        .baselineVersion(MigrationVersion.fromVersion("000"))
        .cleanOnValidationError(false)
        .locations(location)
        .dataSource(url, user, password)
        .load();
  }

  private static void execute(
      CatalogApplicationConfig config,
      Flyway flyway,
      RestHighLevelClient client,
      SchemaMigrationOption schemaMigrationOption)
      throws SQLException {
    ElasticSearchIndexDefinition esIndexDefinition;
    switch (schemaMigrationOption) {
      case CREATE:
        try (Connection connection = flyway.getConfiguration().getDataSource().getConnection()) {
          DatabaseMetaData databaseMetaData = connection.getMetaData();
          try (ResultSet resultSet =
              databaseMetaData.getTables(connection.getCatalog(), connection.getSchema(), "", null)) {
            // If the database has any entity like views, tables etc, resultSet.next() would return true here
            if (resultSet.next()) {
              throw new SQLException(
                  "Please use an empty database or use \"migrate\" if you are already running a "
                      + "previous version.");
            }
          } catch (SQLException e) {
            throw new SQLException("Unable the obtain the state of the target database", e);
          }
        }
        flyway.migrate();
        break;
      case MIGRATE:
        flyway.migrate();
        break;
      case INFO:
        System.out.println(dumpToAsciiTable(flyway.info().all()));
        break;
      case VALIDATE:
        flyway.validate();
        break;
      case DROP:
        flyway.clean();
        System.out.println("DONE");
        break;
      case CHECK_CONNECTION:
        try {
          flyway.getConfiguration().getDataSource().getConnection();
        } catch (Exception e) {
          throw new SQLException(e);
        }
        break;
      case REPAIR:
        flyway.repair();
        break;
      case ES_CREATE:
        esIndexDefinition = new ElasticSearchIndexDefinition(client);
        esIndexDefinition.createIndexes();
        break;
      case ES_MIGRATE:
        esIndexDefinition = new ElasticSearchIndexDefinition(client);
        esIndexDefinition.updateIndexes();
        break;
      case ES_DROP:
        esIndexDefinition = new ElasticSearchIndexDefinition(client);
        esIndexDefinition.dropIndexes();
        break;
      case CREATE_INGESTION_BOT:
        createIngestionBot(config);
        break;
      default:
        throw new SQLException("SchemaMigrationHelper unable to execute the option : " + schemaMigrationOption);
    }
  }

  private static void usage() {
    HelpFormatter formatter = new HelpFormatter();
    formatter.printHelp("TableInitializer [options]", TablesInitializer.OPTIONS);
  }

  private static void createIngestionBot(CatalogApplicationConfig config) {
    Environment environment = new Environment("bootstrap");
    final Jdbi jdbi = new JdbiFactory().build(environment, config.getDataSourceFactory(), "database");
    jdbi.getConfig(SqlObjects.class)
        .setSqlLocator(new ConnectionAwareAnnotationSqlLocator(config.getDataSourceFactory().getDriverClass()));
    String domain =
        config.getAuthorizerConfiguration().getPrincipalDomain().isEmpty()
            ? DEFAULT_PRINCIPAL_DOMAIN
            : config.getAuthorizerConfiguration().getPrincipalDomain();
    String botUser = "ingestion-bot";

    User user =
        new User()
            .withId(UUID.randomUUID())
            .withName(botUser)
            .withEmail(botUser + "@" + domain)
            .withIsBot(true)
            .withUpdatedBy(botUser)
            .withUpdatedAt(System.currentTimeMillis());
    JWTAuthMechanism jwtAuthMechanism = null;
    if (config.getJwtTokenConfiguration() != null) {
      JWTTokenGenerator.getInstance().init(config.getJwtTokenConfiguration());
      GenerateTokenRequest generateTokenRequest =
          new GenerateTokenRequest().withJWTTokenExpiry(JWTTokenExpiry.Unlimited);
      JWTTokenGenerator jwtTokenGenerator = JWTTokenGenerator.getInstance();
      jwtAuthMechanism = jwtTokenGenerator.generateJWTToken(user, generateTokenRequest.getJWTTokenExpiry());
      AuthenticationMechanism authenticationMechanism =
          new AuthenticationMechanism().withConfig(jwtAuthMechanism).withAuthType(AuthenticationMechanism.AuthType.JWT);
      user.setAuthenticationMechanism(authenticationMechanism);
    }
    try {
      addOrUpdateUser(user, jdbi);
      if (jwtAuthMechanism != null) {
        System.out.println(jwtAuthMechanism.getJWTToken());
      }
    } catch (Exception exception) {
      System.out.format("User entry:" + user.getName() + "already exists.");
      throw new RuntimeException("Failed to create ingestion-bot");
    }
  }

  private static void addOrUpdateUser(User user, Jdbi jdbi) throws Exception {
    CollectionDAO daoObject = jdbi.onDemand(CollectionDAO.class);
    UserRepository userRepository = new UserRepository(daoObject);
    User addedUser = userRepository.create(null, user);
    System.out.println("Added user entry: " + addedUser.getName());
  }

  enum SchemaMigrationOption {
    CHECK_CONNECTION("check-connection"),
    CREATE("create"),
    MIGRATE("migrate"),
    VALIDATE("validate"),
    INFO("info"),
    DROP("drop"),
    REPAIR("repair"),
    ES_DROP("es-drop"),
    ES_CREATE("es-create"),
    ES_MIGRATE("es-migrate"),
    CREATE_INGESTION_BOT("create-ingestion-bot");
    private final String value;

    SchemaMigrationOption(String schemaMigrationOption) {
      value = schemaMigrationOption;
    }

    @Override
    public String toString() {
      return value;
    }
  }
}
