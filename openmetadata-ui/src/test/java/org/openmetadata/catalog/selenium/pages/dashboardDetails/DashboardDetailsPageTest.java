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

package org.openmetadata.catalog.selenium.pages.dashboardDetails;

import com.github.javafaker.Faker;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openmetadata.catalog.selenium.events.Events;
import org.openmetadata.catalog.selenium.objectRepository.Common;
import org.openmetadata.catalog.selenium.objectRepository.DashboardDetails;
import org.openmetadata.catalog.selenium.objectRepository.ExplorePage;
import org.openmetadata.catalog.selenium.properties.Property;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

@Slf4j
@Order(5)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DashboardDetailsPageTest {
  static WebDriver webDriver;
  static String url = Property.getInstance().getURL();
  static Faker faker = new Faker();
  Common common;
  DashboardDetails dashboardDetails;
  ExplorePage explorePage;
  static Actions actions;
  static WebDriverWait wait;
  String webDriverInstance = Property.getInstance().getWebDriver();
  String webDriverPath = Property.getInstance().getWebDriverPath();
  String description = "Test@1234";
  String updatedDescription = "Updated Description";
  String xpath = "//div[@data-testid='description']/div/span";

  @BeforeEach
  public void openMetadataWindow() {
    System.setProperty(webDriverInstance, webDriverPath);
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless");
    options.addArguments("--window-size=1280,800");
    webDriver = new ChromeDriver(options);
    actions = new Actions(webDriver);
    common = new Common(webDriver);
    explorePage = new ExplorePage(webDriver);
    dashboardDetails = new DashboardDetails(webDriver);
    wait = new WebDriverWait(webDriver, Duration.ofSeconds(30));
    webDriver.manage().window().maximize();
    webDriver.get(url);
  }

  @Test
  @Order(1)
  void openExplorePage() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    Events.click(webDriver, common.closeWhatsNew());
    Events.click(webDriver, explorePage.explore());
    if (Events.waitForElementToDisplay(webDriver, common.tableCount(), 10, 2).isDisplayed()) {
      LOG.info("Passed");
    } else {
      Assert.fail();
    }
  }

  @Test
  @Order(2)
  void editDescription() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTable());
    Events.click(webDriver, common.editDescriptionButton());
    Events.sendKeys(webDriver, common.focusedDescriptionBox(), Keys.COMMAND + "A");
    Events.sendKeys(webDriver, common.focusedDescriptionBox(), description);
    Events.click(webDriver, common.editDescriptionSaveButton());
    webDriver.navigate().refresh();
    Events.click(webDriver, common.editDescriptionButton());
    Events.sendKeys(webDriver, common.focusedDescriptionBox(), Keys.COMMAND + "A");
    Events.sendKeys(webDriver, common.focusedDescriptionBox(), updatedDescription);
    Events.click(webDriver, common.editDescriptionSaveButton());
    webDriver.navigate().refresh();
    Events.waitForElementToDisplay(webDriver, dashboardDetails.dashboardDescriptionBox(), 10, 2);
    String checkDescription = webDriver.findElement(dashboardDetails.dashboardDescriptionBox()).getText();
    Assert.assertEquals(checkDescription, updatedDescription);
  }

  @Test
  @Order(4)
  void addTags() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTableLink(2));
    Events.click(webDriver, common.addTag());
    for (int i = 0; i < 3; i++) {
      Events.sendKeys(webDriver, common.enterAssociatedTagName(), "P");
      Events.click(webDriver, common.tagListItem());
    }
    Events.click(webDriver, common.saveAssociatedTag());
    webDriver.navigate().refresh();
    Object tagCount = webDriver.findElements(dashboardDetails.breadCrumbTags()).size();
    Assert.assertEquals(tagCount, 3);
  }

  @Test
  @Order(5)
  void removeTags() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTable());
    Object count = webDriver.findElements(common.breadCrumbTags()).size();
    Events.click(webDriver, common.addTag());
    Events.click(webDriver, common.removeAssociatedTag());
    Events.click(webDriver, common.saveAssociatedTag());
    webDriver.navigate().refresh();
    Object updatedCount = webDriver.findElements(dashboardDetails.breadCrumbTags()).size();
    if (updatedCount.equals(count)) {
      Assert.fail("Tag not removed");
    } else {
      LOG.info("Tag removed successfully");
    }
  }

  @Test
  @Order(5)
  void editChartDescription() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    String updatedDescription = faker.address().toString();
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTableLink(1));
    actions.moveToElement(webDriver.findElement(dashboardDetails.editChartDescription()));
    Events.click(webDriver, dashboardDetails.editChartDescription());
    Events.sendKeys(webDriver, common.focusedDescriptionBox(), description);
    Events.click(webDriver, common.editDescriptionSaveButton());
    webDriver.navigate().refresh();
    actions.moveToElement(webDriver.findElement(dashboardDetails.editChartDescription()));
    Events.click(webDriver, dashboardDetails.editChartDescription());
    Events.sendKeys(webDriver, common.focusedDescriptionBox(), updatedDescription);
    Events.click(webDriver, common.editDescriptionSaveButton());
    webDriver.navigate().refresh();
    Events.waitForElementToDisplay(webDriver, dashboardDetails.descriptionBox(), 10, 2);
    String checkDescription = webDriver.findElement(dashboardDetails.descriptionBox()).getText();
    if (!checkDescription.contains(updatedDescription)) {
      Assert.fail("Description not updated");
    } else {
      LOG.info("Description Updated");
    }
  }

  @Test
  @Order(6)
  void addChartTags() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTableLink(3));
    Events.click(webDriver, dashboardDetails.addChartTag());
    for (int i = 0; i < 3; i++) {
      Events.sendKeys(webDriver, common.enterAssociatedTagName(), "P");
      Events.click(webDriver, common.tagListItem());
    }
    Events.click(webDriver, common.saveAssociatedTag());
    webDriver.navigate().refresh();
    Object tagCount = webDriver.findElements(dashboardDetails.chartTags()).size();
    Assert.assertEquals(tagCount, 3);
  }

  @Test
  @Order(7)
  void removeChartTag() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTableLink(3));
    Object count = webDriver.findElements(dashboardDetails.chartTags()).size();
    Events.click(webDriver, dashboardDetails.addChartTag());
    Events.click(webDriver, common.removeAssociatedTag());
    Events.click(webDriver, common.saveAssociatedTag());
    webDriver.navigate().refresh();
    Events.waitForElementToDisplay(webDriver, dashboardDetails.chartTags(), 10, 2);
    Object updatedCount = webDriver.findElement(dashboardDetails.chartTags()).getSize();
    if (updatedCount.equals(count)) {
      Assert.fail("Tag not removed");
    } else {
      LOG.info("Tag removed successfully");
    }
  }

  @Test
  @Order(8)
  void checkManage() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, common.selectTableLink(1));
    Events.click(webDriver, common.manage());
    Events.click(webDriver, common.ownerDropdown());
    Events.click(webDriver, common.users());
    Events.click(webDriver, common.selectUser());
    Events.click(webDriver, common.selectTier1());
    Events.click(webDriver, dashboardDetails.selectTier());
  }

  @Test
  @Order(9)
  void checkBreadCrumb() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, explorePage.selectTable());
    List<WebElement> br = common.breadCrumb();
    // Using for loop to check breadcrumb links
    // Since after navigating back we are facing StaleElementException using try catch block.
    for (int i = 0; i < br.size() - 1; i++) {
      try {
        br.get(i).click();
        webDriver.navigate().back();
      } catch (StaleElementReferenceException ex) {
        WebElement breadcrumb_link = webDriver.findElement(By.xpath(xpath));
        breadcrumb_link.click();
      }
    }
  }

  @Test
  @Order(10)
  void checkVersion() {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    int counter = 1;
    Events.click(webDriver, dashboardDetails.dashboard());
    Events.click(webDriver, explorePage.selectTable());
    Events.click(webDriver, common.version());
    List<WebElement> versionRadioButton = common.versionRadioButton();
    for (WebElement e : versionRadioButton) {
      counter = counter + 1;
      if (counter == versionRadioButton.size()) {
        break;
      }
      e.click();
      ((JavascriptExecutor) webDriver).executeScript("arguments[0].scrollIntoView(true);", e);
    }
    Events.click(webDriver, common.version());
  }

  @AfterEach
  public void closeTabs() {
    ArrayList<String> tabs = new ArrayList<>(webDriver.getWindowHandles());
    String originalHandle = webDriver.getWindowHandle();
    for (String handle : webDriver.getWindowHandles()) {
      if (!handle.equals(originalHandle)) {
        webDriver.switchTo().window(handle);
        webDriver.close();
      }
    }
    webDriver.switchTo().window(tabs.get(0)).close();
  }
}
