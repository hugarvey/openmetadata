package org.openmetadata.service.apps.bundles.slack;

import com.slack.api.Slack;
import com.slack.api.bolt.App;
import com.slack.api.bolt.AppConfig;
import com.slack.api.bolt.model.builtin.DefaultBot;
import com.slack.api.bolt.service.InstallationService;
import com.slack.api.methods.SlackApiException;
import com.slack.api.methods.request.chat.ChatPostMessageRequest;
import com.slack.api.methods.request.conversations.ConversationsListRequest;
import com.slack.api.methods.response.conversations.ConversationsListResponse;
import com.slack.api.model.block.Blocks;
import com.slack.api.model.block.LayoutBlock;
import com.slack.api.model.block.composition.BlockCompositions;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.ws.rs.core.Response;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.service.configuration.slackApp.SlackAppConfiguration;
import org.openmetadata.service.apps.AbstractNativeApplication;
import org.openmetadata.service.apps.AppException;
import org.openmetadata.service.apps.bundles.slack.isteners.Listeners;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.search.SearchRepository;
import org.openmetadata.service.util.JsonUtils;

@Slf4j
public class SlackApp extends AbstractNativeApplication {
  private SlackAppConfiguration appConfig;
  private final SlackInstallationService installationService = new SlackInstallationService();

  public SlackApp(CollectionDAO collectionDAO, SearchRepository searchRepository) {
    super(collectionDAO, searchRepository);
  }

  public static App boltSlackAppRegistration(SlackAppConfiguration config) throws Exception {
    AppConfig appConfig =
        AppConfig.builder()
            .clientId(config.getClientId())
            .clientSecret(config.getClientSecret())
            .signingSecret(config.getSigningSecret())
            .scope(config.getScopes())
            .oauthInstallPath("/api/slack/install")
            .oauthRedirectUriPath("/api/slack/callback")
            .stateValidationEnabled(true)
            .build();
    App slackApp = new App(appConfig).asOAuthApp(true);

    InstallationService installationService = new SlackInstallationService();
    slackApp.service(installationService);
    Listeners.register(slackApp);
    return slackApp;
  }

  @Override
  public void init(org.openmetadata.schema.entity.app.App app) {
    super.init(app);
    appConfig =
        JsonUtils.convertValue(
            this.getApp().getPrivateConfiguration(), SlackAppConfiguration.class);
  }

  public void shareAsset(SlackMessageRequest messageRequest) throws SlackApiException, IOException {
    HashMap<String, Object> tokenMap = installationService.getSavedToken();
    if (!tokenMap.containsKey(SlackConstants.BOT_ACCESS_TOKEN)) {
      throw AppException.byMessage(
          SlackConstants.SLACK_APP,
          "sendMessage",
          "Bot access token is missing",
          Response.Status.BAD_REQUEST);
    }

    DefaultBot bot = (DefaultBot) tokenMap.get(SlackConstants.BOT_ACCESS_TOKEN);
    String entityUrl = messageRequest.getEntityUrl();

    List<LayoutBlock> blocks =
        Arrays.asList(
            Blocks.section(
                section ->
                    section.text(
                        BlockCompositions.markdownText(
                            "*"
                                + formatFqnAsLink(messageRequest.getEntityFqn(), entityUrl)
                                + "*\n"
                                + messageRequest.getMessage()))));

    Slack.getInstance()
        .methods(bot.getBotAccessToken())
        .chatPostMessage(
            ChatPostMessageRequest.builder()
                .channel(messageRequest.getChannel())
                .blocks(blocks)
                .build());
  }

  // clickable link
  private String formatFqnAsLink(String fqn, String url) {
    return "<" + url + "|" + fqn + ">";
  }

  public Map<String, Object> listChannels() throws AppException {
    try {
      HashMap<String, Object> tokenMap = installationService.getSavedToken();
      if (!tokenMap.containsKey(SlackConstants.BOT_ACCESS_TOKEN)) {
        throw AppException.byMessage(
            SlackConstants.SLACK_APP,
            "listChannels",
            "Bot access token is missing",
            Response.Status.BAD_REQUEST);
      }
      DefaultBot bot = (DefaultBot) tokenMap.get(SlackConstants.BOT_ACCESS_TOKEN);

      Slack slack = Slack.getInstance();
      ConversationsListResponse response =
          slack
              .methods(bot.getBotAccessToken())
              .conversationsList(ConversationsListRequest.builder().build());

      if (response.isOk()) {
        List<Map<String, String>> channels =
            response.getChannels().stream()
                .map(
                    channel -> {
                      Map<String, String> channelInfo = new HashMap<>();
                      channelInfo.put("id", channel.getId());
                      channelInfo.put("name", channel.getName());
                      return channelInfo;
                    })
                .collect(Collectors.toList());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("channels", channels);

        return responseData;
      } else {
        throw AppException.byMessage(
            SlackConstants.SLACK_APP,
            "listChannels",
            response.getError(),
            Response.Status.INTERNAL_SERVER_ERROR);
      }
    } catch (SlackApiException | IOException e) {
      throw AppException.byMessage(
          SlackConstants.SLACK_APP,
          "listChannels",
          "Slack API error: " + e.getMessage(),
          Response.Status.INTERNAL_SERVER_ERROR);
    } catch (Exception e) {
      throw AppException.byMessage(
          SlackConstants.SLACK_APP,
          "listChannels",
          "Unexpected error occurred: " + e.getMessage(),
          Response.Status.INTERNAL_SERVER_ERROR);
    }
  }

  public String buildOAuthUrl() {
    String baseUrl = SlackConstants.SLACK_OAUTH_URL;
    String clientId = appConfig.getClientId();
    String scopes = appConfig.getScopes();

    return String.format("%s?client_id=%s&scope=%s", baseUrl, clientId, scopes);
  }

  @Override
  public void raisePreviewMessage(org.openmetadata.schema.entity.app.App app) {
    throw AppException.byMessage(
        app.getName(), "Preview", "Contact Collate to purchase the Application");
  }
}

record SlackApiResponse<T>(int statusCode, String message, T data) {}

@Getter
class SlackConstants {
  public static final String SLACK_APP = "SlackApp";
  public static final String HOME = "home";
  public static final String ABOUT = "about";
  public static final String MESSAGES = "messages";
  public static final String HOME_EVENT_TYPE = "app_home_opened";
  public static final String EVENT_CALLBACK = "event_callback";
  public static final String BOT_ACCESS_TOKEN = "botAccessToken";
  public static final String AUTHED_USER_ACCESS_TOKEN = "installerAccessToken";
  public static final String SUCCESS_FRAGMENT = "#oauth_success";
  public static final String FAILED_FRAGMENT = "#oauth_failed";
  public static final String HOME_VIEW_TEMPLATE = "slackViewTemplates/home_view.json";
  public static final String SLACK_OAUTH_URL = "https://slack.com/oauth/v2/authorize";
}
