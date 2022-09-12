package org.openmetadata.catalog.jdbi3;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.catalog.auth.TokenInterface;
import org.openmetadata.catalog.util.JsonUtils;

@Slf4j
public class TokenRepository {
  private final CollectionDAO dao;

  public TokenRepository(CollectionDAO dao) {
    this.dao = dao;
  }

  public TokenInterface findByToken(String token) {
    return dao.getTokenDAO().findByToken(token);
  }

  public List<TokenInterface> findByUserIdAndType(String userId, String type) {
    return dao.getTokenDAO().getAllUserTokenWithType(userId, type);
  }

  public void insertToken(TokenInterface tokenInterface) throws JsonProcessingException {
    dao.getTokenDAO().insert(JsonUtils.pojoToJson(tokenInterface));
  }

  public void updateToken(TokenInterface tokenInterface) throws JsonProcessingException {
    dao.getTokenDAO().update(tokenInterface.getToken().toString(), JsonUtils.pojoToJson(tokenInterface));
  }

  public void deleteToken(String token) {
    try {
      dao.getTokenDAO().delete(token);
    } catch (Exception ex) {
      LOG.info("Token was not there for the user mayber");
    }
  }
}
