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

package org.openmetadata.catalog.airflow;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.openmetadata.catalog.airflow.models.AirflowAuthRequest;
import org.openmetadata.catalog.airflow.models.AirflowAuthResponse;
import org.openmetadata.catalog.entity.services.ingestionPipelines.IngestionPipeline;
import org.openmetadata.catalog.exception.AirflowException;
import org.openmetadata.catalog.exception.IngestionPipelineDeploymentException;
import org.openmetadata.catalog.security.client.Auth0SSOClientConfig;
import org.openmetadata.catalog.security.client.AzureSSOClientConfig;
import org.openmetadata.catalog.security.client.CustomOIDCSSOClientConfig;
import org.openmetadata.catalog.security.client.GoogleSSOClientConfig;
import org.openmetadata.catalog.security.client.OKtaSSOClientConfig;
import org.openmetadata.catalog.services.connections.metadata.OpenMetadataServerConnection;
import org.openmetadata.catalog.services.connections.metadata.OpenMetadataServerConnection.AuthProvider;
import org.openmetadata.catalog.util.JsonUtils;

@Slf4j
public class AirflowRESTClient {
  private final URL airflowURL;
  private final URL openMetadataURL;
  private final String username;
  private final String password;
  private final HttpClient client;
  private final AuthProvider authProvider;
  private final Map<String, String> authConfig;
  private static final String AUTH_HEADER = "Authorization";
  private static final String AUTH_TOKEN = "Bearer %s";
  private static final String CONTENT_HEADER = "Content-Type";
  private static final String CONTENT_TYPE = "application/json";

  public AirflowRESTClient(AirflowConfiguration airflowConfig) {
    try {
      this.airflowURL = new URL(airflowConfig.getApiEndpoint());
      this.openMetadataURL = new URL(airflowConfig.getMetadataApiEndpoint());
    } catch (MalformedURLException e) {
      throw new AirflowException(airflowConfig.getApiEndpoint() + " Malformed.");
    }
    this.username = airflowConfig.getUsername();
    this.password = airflowConfig.getPassword();
    this.authProvider = OpenMetadataServerConnection.AuthProvider.fromValue(airflowConfig.getAuthProvider());
    this.authConfig = airflowConfig.getAuthConfig();
    this.client =
        HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(airflowConfig.getTimeout()))
            .build();
  }

  private String authenticate() throws InterruptedException, IOException {
    String authEndpoint = "%s/api/v1/security/login";
    String authUrl = String.format(authEndpoint, airflowURL);
    AirflowAuthRequest authRequest =
        AirflowAuthRequest.builder().username(this.username).password(this.password).build();
    String authPayload = JsonUtils.pojoToJson(authRequest);
    HttpRequest request =
        HttpRequest.newBuilder(URI.create(authUrl))
            .header(CONTENT_HEADER, CONTENT_TYPE)
            .POST(HttpRequest.BodyPublishers.ofString(authPayload))
            .build();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() == 200) {
      AirflowAuthResponse authResponse = JsonUtils.readValue(response.body(), AirflowAuthResponse.class);
      return authResponse.getAccessToken();
    }
    throw new AirflowException("Failed to get access_token. Please check AirflowConfiguration username, password");
  }

  public String deploy(IngestionPipeline ingestionPipeline) {
    try {
      String token = authenticate();
      String authToken = String.format(AUTH_TOKEN, token);
      String pipelinePayload = JsonUtils.pojoToJson(ingestionPipeline);
      String deployEndPoint = "%s/rest_api/api?api=deploy_dag";
      String deployUrl = String.format(deployEndPoint, airflowURL);

      HttpRequest request =
          HttpRequest.newBuilder(URI.create(deployUrl))
              .header(CONTENT_HEADER, CONTENT_TYPE)
              .header(AUTH_HEADER, authToken)
              .POST(HttpRequest.BodyPublishers.ofString(pipelinePayload))
              .build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        return response.body();
      }
      throw new AirflowException(
          String.format(
              "%s Failed to deploy Ingestion Pipeline due to airflow API returned %s and response %s",
              ingestionPipeline.getName(), Response.Status.fromStatusCode(response.statusCode()), response.body()));
    } catch (Exception e) {
      throw IngestionPipelineDeploymentException.byMessage(ingestionPipeline.getName(), e.getMessage());
    }
  }

  public String deletePipeline(String pipelineName) {
    try {
      String token = authenticate();
      String authToken = String.format(AUTH_TOKEN, token);
      String triggerEndPoint = "%s/rest_api/api?api=delete_delete&dag_id=%s";
      String triggerUrl = String.format(triggerEndPoint, airflowURL, pipelineName);
      JSONObject requestPayload = new JSONObject();
      requestPayload.put("workflow_name", pipelineName);
      HttpRequest request =
          HttpRequest.newBuilder(URI.create(triggerUrl))
              .header(CONTENT_HEADER, CONTENT_TYPE)
              .header(AUTH_HEADER, authToken)
              .POST(HttpRequest.BodyPublishers.ofString(requestPayload.toString()))
              .build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      return response.body();
    } catch (Exception e) {
      throw new AirflowException(String.format("Failed to delete Airflow Pipeline %s from Airflow DAGS", pipelineName));
    }
  }

  public String runPipeline(String pipelineName) {
    try {
      String token = authenticate();
      String authToken = String.format(AUTH_TOKEN, token);
      String triggerEndPoint = "%s/rest_api/api?api=trigger_dag";
      String triggerUrl = String.format(triggerEndPoint, airflowURL);
      JSONObject requestPayload = new JSONObject();
      requestPayload.put("workflow_name", pipelineName);
      HttpRequest request =
          HttpRequest.newBuilder(URI.create(triggerUrl))
              .header(CONTENT_HEADER, CONTENT_TYPE)
              .header(AUTH_HEADER, authToken)
              .POST(HttpRequest.BodyPublishers.ofString(requestPayload.toString()))
              .build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        return response.body();
      }

      throw IngestionPipelineDeploymentException.byMessage(
          pipelineName, "Failed to trigger IngestionPipeline", Response.Status.fromStatusCode(response.statusCode()));
    } catch (Exception e) {
      throw IngestionPipelineDeploymentException.byMessage(pipelineName, e.getMessage());
    }
  }

  public OpenMetadataServerConnection buildOpenMetadataServerConfig() {
    OpenMetadataServerConnection openMetadataServerConnection = new OpenMetadataServerConnection();
    openMetadataServerConnection.setAuthProvider(authProvider);
    switch (authProvider) {
      case GOOGLE:
        GoogleSSOClientConfig googleSSOClientConfig =
            new GoogleSSOClientConfig()
                .withSecretKey(authConfig.get("secretKey"))
                .withAudience(authConfig.get("audience"));
        openMetadataServerConnection.setSecurityConfig(googleSSOClientConfig);
        break;
      case AUTH_0:
        Auth0SSOClientConfig auth0SSOClientConfig =
            new Auth0SSOClientConfig()
                .withClientId(authConfig.get("clientId"))
                .withSecretKey(authConfig.get("secretKey"))
                .withDomain(authConfig.get("domain"));
        openMetadataServerConnection.setSecurityConfig(auth0SSOClientConfig);
        break;
      case OKTA:
        OKtaSSOClientConfig oktaSSOClientConfig =
            new OKtaSSOClientConfig()
                .withClientId(authConfig.get("clientId"))
                .withEmail(authConfig.get("email"))
                .withOrgURL(authConfig.get("orgURL"))
                .withPrivateKey(authConfig.get("privateKey"));
        String scopes = authConfig.get("scopes");
        List<String> oktaScopesList = getSecurityScopes(scopes);
        if (!oktaScopesList.isEmpty()) {
          oktaSSOClientConfig.setScopes(oktaScopesList);
        }
        openMetadataServerConnection.setSecurityConfig(oktaSSOClientConfig);
        break;
      case AZURE:
        AzureSSOClientConfig azureSSOClientConfig =
            new AzureSSOClientConfig()
                .withClientId(authConfig.get("clientId"))
                .withClientSecret(authConfig.get("clientSecret"))
                .withAuthority(authConfig.get("authority"));
        List<String> scopesList = getSecurityScopes(authConfig.get("scopes"));
        if (!scopesList.isEmpty()) {
          azureSSOClientConfig.setScopes(scopesList);
        }
        openMetadataServerConnection.setSecurityConfig(azureSSOClientConfig);
        break;
      case CUSTOM_OIDC:
        CustomOIDCSSOClientConfig customOIDCSSOClientConfig =
            new CustomOIDCSSOClientConfig()
                .withClientId(authConfig.get("clientId"))
                .withSecretKey(authConfig.get("secretKey"))
                .withTokenEndpoint(authConfig.get("tokenEndpoint"));
        openMetadataServerConnection.setSecurityConfig(customOIDCSSOClientConfig);
        break;
      case NO_AUTH:
        break;
      default:
        throw new IllegalArgumentException("OpenMetadata doesn't support auth provider type " + authProvider.value());
    }
    openMetadataServerConnection.setHostPort(openMetadataURL.toString());
    return openMetadataServerConnection;
  }

  protected List<String> getSecurityScopes(String scopes) {
    if (scopes != null && !scopes.isEmpty()) {
      return Arrays.asList(scopes.split("\\s*,\\s*"));
    }
    return Collections.emptyList();
  }
}
