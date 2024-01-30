package org.openmetadata.service.apps;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.api.configuration.apps.AppsPrivateConfiguration;
import org.openmetadata.schema.entity.app.App;
import org.openmetadata.service.exception.UnhandledServerException;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.search.SearchRepository;

@Slf4j
public class ApplicationHandler {

  private ApplicationHandler() {
    /*Helper*/
  }

  public static void triggerApplicationOnDemand(
      App app,
      CollectionDAO daoCollection,
      SearchRepository searchRepository,
      AppsPrivateConfiguration privateConfiguration) {
    runMethodFromApplication(
        app, daoCollection, searchRepository, privateConfiguration, "triggerOnDemand");
  }

  public static void installApplication(
      App app,
      CollectionDAO daoCollection,
      SearchRepository searchRepository,
      AppsPrivateConfiguration privateConfiguration) {
    runMethodFromApplication(app, daoCollection, searchRepository, privateConfiguration, "install");
  }

  public static void configureApplication(
      App app,
      CollectionDAO daoCollection,
      SearchRepository searchRepository,
      AppsPrivateConfiguration privateConfiguration) {
    runMethodFromApplication(
        app, daoCollection, searchRepository, privateConfiguration, "configure");
  }

  /** Load an App from its className and call its methods dynamically */
  public static void runMethodFromApplication(
      App app,
      CollectionDAO daoCollection,
      SearchRepository searchRepository,
      AppsPrivateConfiguration privateConfiguration,
      String methodName) {
    // Native Application
    try {
      Class<?> clz = Class.forName(app.getClassName());
      Object resource = clz.getConstructor().newInstance();

      // Call init Method
      Method initMethod =
          resource
              .getClass()
              .getMethod(
                  "init",
                  App.class,
                  CollectionDAO.class,
                  SearchRepository.class,
                  AppsPrivateConfiguration.class);
      initMethod.invoke(resource, app, daoCollection, searchRepository, privateConfiguration);

      // Call method on demand
      Method scheduleMethod = resource.getClass().getMethod(methodName);
      scheduleMethod.invoke(resource);

    } catch (NoSuchMethodException
        | InstantiationException
        | IllegalAccessException
        | InvocationTargetException e) {
      LOG.error("Exception encountered", e);
      throw new UnhandledServerException("Exception encountered", e);
    } catch (ClassNotFoundException e) {
      throw new UnhandledServerException("Exception encountered", e);
    }
  }
}
