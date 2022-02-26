package org.openmetadata.catalog.selenium.objectRepository;

import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

@Getter
@RequiredArgsConstructor
public class DatabaseServicePage {
  @NonNull WebDriver webDriver;

  By runIngestion = By.cssSelector("[data-testid='run']");
  By editIngestion = By.cssSelector("[data-testid='edit']");
  By deleteIngestion = By.cssSelector("[data-testid='delete']");
  By selectInterval = By.xpath("//select[@id='ingestionType']");

  public By ingestionInterval(String interval) {
    return By.xpath("//select[@id='ingestionType']/option[@value='" + interval + "']");
  }
}
