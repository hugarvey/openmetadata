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

package org.openmetadata.catalog.selenium.pages.tags;

import com.github.javafaker.Faker;
import java.time.Duration;
import java.util.ArrayList;
import java.util.logging.Logger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openmetadata.catalog.selenium.events.Events;
import org.openmetadata.catalog.selenium.objectRepository.TagsPage;
import org.openmetadata.catalog.selenium.pages.myData.MyDataPageTest;
import org.openmetadata.catalog.selenium.properties.Property;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

@Order(3)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TagsPageTest {

  private static final Logger LOG = Logger.getLogger(MyDataPageTest.class.getName());

  static WebDriver webDriver;
  static TagsPage tagsPage;
  static String url = Property.getInstance().getURL();
  static Faker faker = new Faker();
  static String tagCategoryDisplayName = faker.name().firstName();
  static String tagDisplayName = faker.name().firstName();
  static String enterDescription = "//div[@data-testid='enterDescription']/div/div[2]/div/div/div/div/div/div";
  static Actions actions;
  static WebDriverWait wait;
  Integer waitTime = Property.getInstance().getSleepTime();

  @BeforeEach
  public void openMetadataWindow() {
    System.setProperty("webdriver.chrome.driver", "src/test/resources/drivers/linux/chromedriver");
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless");
    options.addArguments("--window-size=1280,800");
    webDriver = new ChromeDriver(options);
    tagsPage = new TagsPage(webDriver);
    actions = new Actions(webDriver);
    wait = new WebDriverWait(webDriver, Duration.ofSeconds(30));
    webDriver.manage().window().maximize();
    webDriver.get(url);
  }

  @Test
  @Order(1)
  public void openTagsPage() throws InterruptedException {
    Events.click(webDriver, tagsPage.closeWhatsNew());
    Events.click(webDriver, tagsPage.headerSettings());
    Events.click(webDriver, tagsPage.headerSettingsTags());
    Thread.sleep(waitTime);
  }

  @Test
  @Order(2)
  public void addTagCategory() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.addTagCategory());
    Events.sendKeys(webDriver, tagsPage.displayName(), tagCategoryDisplayName);
    Events.click(webDriver, tagsPage.descriptionBoldButton());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.addDescriptionString());
    Events.sendEnter(webDriver, tagsPage.addDescriptionString());
    Events.click(webDriver, tagsPage.descriptionItalicButton());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.addDescriptionString());
    Events.sendEnter(webDriver, tagsPage.addDescriptionString());
    Events.click(webDriver, tagsPage.descriptionLinkButton());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.descriptionSaveButton());
  }

  @Test
  @Order(3)
  public void editTagCategoryDescription() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    Events.click(webDriver, tagsPage.editTagCategoryDescription());
    Events.click(webDriver, tagsPage.addDescriptionString());
    Events.click(webDriver, tagsPage.editDescriptionSaveButton());
  }

  @Test
  @Order(4)
  public void addTag() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    Events.click(webDriver, tagsPage.addTagButton());
    Events.sendKeys(webDriver, tagsPage.displayName(), tagDisplayName);
    Events.click(webDriver, tagsPage.descriptionBoldButton());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.addDescriptionString());
    Events.sendEnter(webDriver, tagsPage.addDescriptionString());
    Events.click(webDriver, tagsPage.descriptionItalicButton());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.addDescriptionString());
    Events.sendEnter(webDriver, tagsPage.addDescriptionString());
    Events.click(webDriver, tagsPage.descriptionLinkButton());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.descriptionSaveButton());
  }

  @Test
  @Order(5)
  public void changeTagDescription() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    actions.moveToElement(webDriver.findElement(tagsPage.editTagDescription())).perform();
    Events.click(webDriver, tagsPage.editTagDescription());
    Events.sendKeys(webDriver, tagsPage.addDescriptionString(), faker.address().toString());
    Events.click(webDriver, tagsPage.editDescriptionSaveButton());
  }

  @Test
  @Order(6)
  public void addAssociatedTag() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    actions.moveToElement(webDriver.findElement(tagsPage.addAssociatedTagButton())).perform();
    Events.click(webDriver, tagsPage.addAssociatedTagButton());
    Events.click(webDriver, tagsPage.enterAssociatedTagName());
    for (int i = 0; i <= 1; i++) {
      Events.sendKeys(webDriver, tagsPage.enterAssociatedTagName(), "P");
      Events.click(webDriver, tagsPage.tagListItem());
    }
    Events.click(webDriver, tagsPage.saveAssociatedTag());
  }

  @Test
  @Order(7)
  public void removeAssociatedTag() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    actions.moveToElement(webDriver.findElement(tagsPage.addAssociatedTagButton())).perform();
    Events.click(webDriver, tagsPage.addAssociatedTagButton());
    for (int i = 0; i <= 1; i++) {
      Events.click(webDriver, tagsPage.removeAssociatedTag());
    }
    Events.click(webDriver, tagsPage.saveAssociatedTag());
  }

  @Test
  @Order(8)
  public void addTagToTableColumn() throws InterruptedException {
    Events.click(webDriver, tagsPage.closeWhatsNew());
    Events.click(webDriver, tagsPage.headerExplore());
    Events.click(webDriver, tagsPage.sortBy());
    Events.click(webDriver, tagsPage.tagListItem());
    Events.click(webDriver, tagsPage.lastTableLink());
    Thread.sleep(waitTime);
    actions.moveToElement(webDriver.findElement(tagsPage.addAssociatedTagButton())).perform();
    Thread.sleep(waitTime);
    Events.click(webDriver, tagsPage.addAssociatedTagButton());
    Events.click(webDriver, tagsPage.enterAssociatedTagName());
    Events.sendKeys(webDriver, tagsPage.enterAssociatedTagName(), tagCategoryDisplayName + "." + tagDisplayName);
    Events.click(webDriver, tagsPage.tagListItem());
    Events.click(webDriver, tagsPage.saveAssociatedTag());
    Events.click(webDriver, tagsPage.headerSettings());
    Events.click(webDriver, tagsPage.headerSettingsTags());
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    Events.click(webDriver, tagsPage.tagUsageCount());
  }

  @Test
  @Order(9)
  public void checkAddedTagToTableColumn() {
    Events.click(webDriver, tagsPage.closeWhatsNew());
    Events.click(webDriver, tagsPage.tables());
    Events.click(webDriver, tagsPage.tagFilter(tagCategoryDisplayName, tagDisplayName));
    Events.click(webDriver, tagsPage.tableLink());
  }

  @Test
  @Order(10)
  public void removeTagFromTableColumn() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText(tagCategoryDisplayName));
    Events.click(webDriver, tagsPage.tagUsageCount());
    Events.click(webDriver, tagsPage.tableLink());
    //    actions.moveToElement(webDriver.findElement(tagsPage.editAssociatedTagButton())).perform();
    Events.click(webDriver, tagsPage.editAssociatedTagButton());
    Events.click(webDriver, tagsPage.removeAssociatedTag());
    Events.click(webDriver, tagsPage.saveAssociatedTag());
  }

  @Test
  @Order(10)
  public void addTagWithExistingName() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText("PersonalData"));
    Events.click(webDriver, tagsPage.addTagButton());
    Events.sendKeys(webDriver, tagsPage.displayName(), "Personals");
    Events.click(webDriver, tagsPage.descriptionSaveButton());
    Events.click(webDriver, tagsPage.headerExplore());
    Events.click(webDriver, tagsPage.tableLink());
    Events.click(webDriver, tagsPage.editAssociatedTagButton());
    Events.click(webDriver, tagsPage.enterAssociatedTagName());
    Events.sendKeys(webDriver, tagsPage.enterAssociatedTagName(), "Personals");
    Events.click(webDriver, tagsPage.tagListItem());
    Events.click(webDriver, tagsPage.saveAssociatedTag());
    Events.click(webDriver, tagsPage.headerSettings());
    Events.click(webDriver, tagsPage.headerSettingsTags());
    Events.click(webDriver, tagsPage.containsText("PersonalData"));
    Thread.sleep(2000);
    String usageCount = webDriver.findElement(tagsPage.aTagUsageCountElementIndex(1)).getAttribute("innerHTML");
    Assert.assertEquals(usageCount, "0");
  }

  @Test
  @Order(11)
  public void TagUsageCheck() throws InterruptedException {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText("PersonalData"));
    Events.click(webDriver, tagsPage.usageCountElementIndex(2));
    Thread.sleep(2000);
    String beforeFilterCount = webDriver.findElement(tagsPage.tagFilterCount(1)).getAttribute("innerHTML");
    Events.click(webDriver, tagsPage.entityTabIndex(2));
    Events.click(webDriver, tagsPage.entityTabIndex(1));
    String afterFilterCount = webDriver.findElement(tagsPage.tagFilterCount(1)).getAttribute("innerHTML");
    Assert.assertEquals(afterFilterCount, beforeFilterCount);
  }

  @Test
  @Order(12)
  public void removeTagWithExistingName() throws InterruptedException {
    openTagsPage();

    Events.click(webDriver, tagsPage.containsText("PersonalData"));
    Events.click(webDriver, tagsPage.usageCountElementIndex(2));
    Events.click(webDriver, tagsPage.tableLink());
    Events.click(webDriver, tagsPage.editAssociatedTagButton());
    Events.click(webDriver, tagsPage.removeAssociatedTag());
    Events.click(webDriver, tagsPage.saveAssociatedTag());
    Events.click(webDriver, tagsPage.headerSettings());
    Events.click(webDriver, tagsPage.headerSettingsTags());
    Events.click(webDriver, tagsPage.containsText("PersonalData"));
    Thread.sleep(2000);
    String usageCount = webDriver.findElement(tagsPage.spanTagUsageCountElementIndex(2)).getAttribute("innerHTML");
    Assert.assertEquals(usageCount, "Not used");
  }

  @Test
  @Order(13)
  public void addSelfAssociatedTag() throws Exception {
    openTagsPage();
    Events.click(webDriver, tagsPage.containsText("PersonalData"));
    actions.moveToElement(webDriver.findElement(tagsPage.addAssociatedTagButton())).perform();
    Events.click(webDriver, tagsPage.addAssociatedTagButton());
    Events.click(webDriver, tagsPage.enterAssociatedTagName());
    try {
      Events.sendKeys(webDriver, tagsPage.enterAssociatedTagName(), "PersonalData.Personal");
      WebElement sameTag = webDriver.findElement(tagsPage.tagListItem());
      if (sameTag.isDisplayed()) {
        Assert.fail();
      }
    } catch (TimeoutException exception) {
      LOG.info("Success");
    }
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
