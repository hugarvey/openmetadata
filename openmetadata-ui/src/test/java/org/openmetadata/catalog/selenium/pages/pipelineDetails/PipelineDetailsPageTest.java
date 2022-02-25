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

package org.openmetadata.catalog.selenium.pages.pipelineDetails;

import com.github.javafaker.Faker;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.hamcrest.text.IsEqualIgnoringCase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openmetadata.catalog.selenium.events.Events;
import org.openmetadata.catalog.selenium.objectRepository.Common;
import org.openmetadata.catalog.selenium.objectRepository.ExplorePage;
import org.openmetadata.catalog.selenium.objectRepository.PipelineDetails;
import org.openmetadata.catalog.selenium.properties.Property;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

@Slf4j
@Order(6)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class PipelineDetailsPageTest {
  static WebDriver webDriver;
  static String url = Property.getInstance().getURL();
  Integer waitTime = Property.getInstance().getSleepTime();
  static Faker faker = new Faker();
  String pipelineName = "dim_product etl";
  static String enterDescription = "//div[@data-testid='enterDescription']/div/div[2]/div/div/div/div/div/div";
  static Actions actions;
  static WebDriverWait wait;
  Common common;
  PipelineDetails pipelineDetails;
  ExplorePage explorePage;
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
    webDriver = new ChromeDriver();
    actions = new Actions(webDriver);
    common = new Common(webDriver);
    pipelineDetails = new PipelineDetails(webDriver);
    explorePage = new ExplorePage(webDriver);
    wait = new WebDriverWait(webDriver, Duration.ofSeconds(5));
    webDriver.manage().window().maximize();
    webDriver.get(url);
  }

  @Test
  @Order(1)
  void openExplorePage() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    Events.click(webDriver, common.closeWhatsNew());
    Events.click(webDriver, explorePage.explore());
    Thread.sleep(3000);
    if (webDriver.findElement(common.tableCount()).isDisplayed()) {
      LOG.info("Passed");
    } else {
      Assert.fail();
    }
  }

  @Test
  @Order(2)
  void editDescription() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, common.selectTable());
    Events.click(webDriver, common.editDescriptionButton());
    Events.sendKeys(webDriver, common.editDescriptionBox(), Keys.CONTROL + "A");
    Events.sendKeys(webDriver, common.editDescriptionBox(), description);
    Events.click(webDriver, common.editDescriptionSaveButton());
    Thread.sleep(waitTime);
    webDriver.navigate().refresh();
    Events.click(webDriver, common.editDescriptionButton());
    Events.sendKeys(webDriver, common.editDescriptionBox(), Keys.CONTROL + "A");
    Events.sendKeys(webDriver, common.editDescriptionBox(), updatedDescription);
    Events.click(webDriver, common.editDescriptionSaveButton());
    webDriver.navigate().refresh();
    String checkDescription = webDriver.findElement(common.descriptionContainer()).getText();
    Assert.assertEquals(checkDescription, updatedDescription);
  }

  @Test
  @Order(3)
  public void addTag() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, common.selectTable());
    Events.click(webDriver, common.addTag());
    Events.sendKeys(webDriver, common.enterAssociatedTagName(), "P");
    Thread.sleep(waitTime);
    Events.click(webDriver, common.tagListItem());
    String selectedTag = webDriver.findElement(pipelineDetails.selectedTag()).getText();
    Events.click(webDriver, common.saveAssociatedTag());
    Thread.sleep(1000);
    webDriver.navigate().refresh();
    Thread.sleep(1000);
    String breadcrumbTag = webDriver.findElement(common.breadCrumbTag()).getText();
    Assert.assertEquals(selectedTag, breadcrumbTag);
  }

  @Test
  @Order(4)
  void removeTag() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, common.selectTable());
    String tagDisplayed = webDriver.findElement(common.breadCrumbTag()).getText();
    Events.click(webDriver, common.addTag());
    Events.click(webDriver, common.removeAssociatedTag());
    Thread.sleep(waitTime);
    Events.click(webDriver, common.saveAssociatedTag());
    Thread.sleep(waitTime);
    webDriver.navigate().refresh();
    Thread.sleep(waitTime);
    WebElement updatedTags = webDriver.findElement(common.breadCrumbTag());
    if (updatedTags.getText().contains(tagDisplayed)) {
      Assert.fail("SelectedTag is not removed");
    }
  }

  @Test
  @Order(5)
  void editTaskDescription() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, explorePage.selectTable());
    actions.moveToElement(webDriver.findElement(pipelineDetails.editTaskDescription())).perform();
    Events.click(webDriver, pipelineDetails.editTaskDescription());
    Events.sendKeys(webDriver, common.editDescriptionBox(), Keys.CONTROL + "A");
    Events.sendKeys(webDriver, common.editDescriptionBox(), description);
    Events.click(webDriver, common.editDescriptionSaveButton());
    Thread.sleep(waitTime);
    webDriver.navigate().refresh();
    actions.moveToElement(webDriver.findElement(pipelineDetails.editTaskDescription())).perform();
    Events.click(webDriver, pipelineDetails.editTaskDescription());
    Events.sendKeys(webDriver, common.editDescriptionBox(), Keys.CONTROL + "A");
    Events.sendKeys(webDriver, common.editDescriptionBox(), updatedDescription);
    Events.click(webDriver, common.editDescriptionSaveButton());
    Thread.sleep(waitTime);
    webDriver.navigate().refresh();
    Thread.sleep(waitTime);
    WebElement checkDescription = pipelineDetails.getDescriptionBox();
    String chck = checkDescription.getText();
    Assert.assertEquals(chck, updatedDescription);
  }

  @Test
  @Order(9)
  void checkLineage() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, explorePage.selectTable());
    Events.click(webDriver, pipelineDetails.lineage());
    List<WebElement> nodes = pipelineDetails.lineageNodes();
    // Clicking and checking all the nodes text matches to side drawer text
    WebElement sideDrawer;
    for (WebElement e : nodes) {
      e.click();
      sideDrawer = webDriver.findElement(pipelineDetails.sideDrawerLineage());
      Assert.assertEquals(e.getText(), IsEqualIgnoringCase.equalToIgnoringCase(sideDrawer.getText()));
      actions.dragAndDropBy(e, 100, 200).perform();
    }
  }

  @Test
  @Order(7)
  public void checkManage() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, explorePage.selectTable());
    Thread.sleep(waitTime);
    Events.click(webDriver, common.manage());
    Events.click(webDriver, common.ownerDropdown());
    Events.click(webDriver, common.users());
    Events.click(webDriver, common.selectUser());
    Events.click(webDriver, common.selectTier1());
    Events.click(webDriver, common.saveManage());
  }

  @Test
  @Order(8)
  void checkBreadCrumb() throws Exception {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, explorePage.selectTable());
    List<WebElement> br = common.breadCrumb();
    // Using for loop to check breadcrumb links
    // Since after navigating back we are facing StaleElementException using try catch block.
    for (WebElement link : br) {
      try {
        link.click();
        Thread.sleep(waitTime);
        webDriver.navigate().back();
      } catch (StaleElementReferenceException ex) {
        WebElement breadcrumb_link = webDriver.findElement(By.xpath(xpath));
        breadcrumb_link.click();
      }
    }
  }

  @Test
  @Order(9)
  public void checkVersion() throws InterruptedException {
    webDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    openExplorePage();
    int counter = 1;
    Events.click(webDriver, pipelineDetails.pipelines());
    Events.click(webDriver, explorePage.selectTable());
    Events.click(webDriver, common.version());
    List<WebElement> versionRadioButton = common.versionRadioButton();
    for (WebElement e : versionRadioButton) {
      counter = counter + 1;
      if (counter == versionRadioButton.size()) {
        break;
      }
      e.click();
      Thread.sleep(waitTime);
      Assert.assertTrue(webDriver.findElement(common.difference()).isDisplayed());
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
