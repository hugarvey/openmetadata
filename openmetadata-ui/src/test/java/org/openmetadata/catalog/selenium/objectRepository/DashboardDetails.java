package org.openmetadata.catalog.selenium.objectRepository;

import javax.annotation.Nonnull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

@Getter
@RequiredArgsConstructor
public class DashboardDetails {
  @Nonnull WebDriver webDriver;

  By dashboard = By.xpath("(//button[@data-testid='tab'])[3]");
  By editChartDescription = By.xpath("(//img[@data-testid='image']/parent::button)[3]");
  By dashboardDescriptionBox = By.xpath("(//div[@data-testid='description']/div/span)[1]");
  By descriptionBox = By.xpath("(//div[@data-testid='description'])[2]");
  By addChartTag = By.xpath("(//div[@data-testid='tag-conatiner'])[2]");
  By selectedTag = By.xpath("//span[@class='tw-no-underline hover:tw-no-underline tw-py-0.5 tw-px-2 tw-pl-2 tw-pr-1']");
  By chartTags = By.xpath("(//div[@data-testid='tag-conatiner'])[2]");

  public WebElement getDescriptionBox() {
    return webDriver.findElement(descriptionBox);
  }
}
