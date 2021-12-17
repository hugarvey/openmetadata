///*
// *  Copyright 2021 Collate
// *  Licensed under the Apache License, Version 2.0 (the "License");
// *  you may not use this file except in compliance with the License.
// *  You may obtain a copy of the License at
// *  http://www.apache.org/licenses/LICENSE-2.0
// *  Unless required by applicable law or agreed to in writing, software
// *  distributed under the License is distributed on an "AS IS" BASIS,
// *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// *  See the License for the specific language governing permissions and
// *  limitations under the License.
// */
//
//package org.openmetadata.catalog.selenium.pages.dbtModelDetails;
//
//import com.github.javafaker.Faker;
////import org.junit.jupiter.api.AfterEach;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.MethodOrderer;
//import org.junit.jupiter.api.Order;
//import org.junit.jupiter.api.TestMethodOrder;
//import org.openmetadata.catalog.selenium.events.Events;
//import org.openmetadata.catalog.selenium.properties.Property;
//import org.openqa.selenium.By;
//import org.openqa.selenium.WebDriver;
//import org.openqa.selenium.chrome.ChromeDriver;
//import org.openqa.selenium.chrome.ChromeOptions;
//import org.openqa.selenium.interactions.Actions;
//import org.openqa.selenium.support.ui.WebDriverWait;
//
//import java.time.Duration;
//import java.util.ArrayList;
//
//@Order(13)
//@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
//public class DbtModelDetailsPageTest {
//
//  static WebDriver webDriver;
//  static String url = Property.getInstance().getURL();
//  static Faker faker = new Faker();
//  static String enterDescription = "//div[@data-testid='enterDescription']/div/div[2]/div/div/div/div/div/div";
//  static Actions actions;
//  static WebDriverWait wait;
//  Integer waitTime = Property.getInstance().getSleepTime();
//
//  @BeforeEach
//  public void openMetadataWindow() {
//    System.setProperty("webdriver.chrome.driver", "src/test/resources/drivers/linux/chromedriver");
//    ChromeOptions options = new ChromeOptions();
//    options.addArguments("--headless");
//    options.addArguments("--window-size=1280,800");
//    webDriver = new ChromeDriver(options);
//    actions = new Actions(webDriver);
//    wait = new WebDriverWait(webDriver, Duration.ofSeconds(30));
//    webDriver.manage().window().maximize();
//    webDriver.get(url);
//  }
//
//  @Test
//  @Order(1)
//  public void openDbtModelPage() throws InterruptedException {
//    Events.click(webDriver, By.cssSelector("[data-testid='closeWhatsNew']")); // Close What's new
//    Events.click(webDriver, By.cssSelector("[data-testid='appbar-item'][id='explore']")); // Explore
//    Events.click(webDriver, By.xpath("(//button[@data-testid='tab'])[5]")); // Dashboard
//    Thread.sleep(waitTime);
//  }
//
//  @Test
//  @Order(2)
//  public void editDescription() throws InterruptedException {
//    openDbtModelPage();
//    Events.click(webDriver, By.cssSelector("[data-testid='sortBy']")); // Sort By
//    Events.click(webDriver, By.cssSelector("[data-testid='list-item']")); // Last Updated
//    Events.click(webDriver, By.xpath("(//a[@data-testid='table-link'])[last()]"));
//    Events.click(webDriver, By.cssSelector("[data-testid='edit-description']"));
//    Events.sendKeys(webDriver, By.xpath(enterDescription), faker.address().toString());
//    Events.click(webDriver, By.cssSelector("[data-testid='save']"));
//  }
//
//  @Test
//  @Order(3)
//  public void editColumnDescription() throws InterruptedException {
//    openDbtModelPage();
//    Events.click(webDriver, By.cssSelector("[data-testid='sortBy']")); // Sort By
//    Events.click(webDriver, By.cssSelector("[data-testid='list-item']")); // Last Updated
//    Events.click(webDriver, By.xpath("(//a[@data-testid='table-link'])[1]"));
//    Thread.sleep(waitTime);
//    actions.moveToElement(webDriver.findElement(By.xpath("//div[@data-testid='description']/button"))).perform();
//    Events.click(webDriver, By.xpath("//div[@data-testid='description']/button"));
//    Events.sendKeys(webDriver, By.xpath(enterDescription), faker.address().toString());
//    Events.click(webDriver, By.cssSelector("[data-testid='save']"));
//  }
//
//  @Test
//  @Order(4)
//  public void addColumnTag() throws InterruptedException {
//    openDbtModelPage();
//    Events.click(webDriver, By.cssSelector("[data-testid='sortBy']")); // Sort By
//    Events.click(webDriver, By.cssSelector("[data-testid='list-item']")); // Last Updated
//    Events.click(webDriver, By.xpath("(//a[@data-testid='table-link'])[1]"));
//    Thread.sleep(waitTime);
//    Events.click(webDriver, By.cssSelector("[data-testid='tags']"));
//    Events.click(webDriver, By.cssSelector("[data-testid='associatedTagName']"));
//    for (int i = 1; i <= 2; i++) {
//      Events.sendKeys(webDriver, By.cssSelector("[data-testid='associatedTagName']"), "P");
//      Events.click(webDriver, By.cssSelector("[data-testid='list-item']"));
//    }
//    Events.click(webDriver, By.cssSelector("[data-testid='saveAssociatedTag']"));
//    webDriver.navigate().back();
//    webDriver.navigate().refresh();
//  }
//
//  @Test
//  @Order(5)
//  public void removeColumnTag() throws InterruptedException {
//    openDbtModelPage();
//    Events.click(webDriver, By.cssSelector("[data-testid='sortBy']")); // Sort By
//    Events.click(webDriver, By.cssSelector("[data-testid='list-item']")); // Last Updated
//    Events.click(webDriver, By.xpath("(//a[@data-testid='table-link'])[1]"));
//    Events.click(webDriver, By.cssSelector("[data-testid='tag-conatiner']"));
//    Events.click(webDriver, By.cssSelector("[data-testid='remove']"));
//    Events.click(webDriver, By.cssSelector("[data-testid='remove']"));
//    Events.click(webDriver, By.cssSelector("[data-testid='saveAssociatedTag']"));
//  }
//
//  @Test
//  @Order(6)
//  public void checkManage() throws InterruptedException {
//    openDbtModelPage();
//    Events.click(webDriver, By.cssSelector("[data-testid='sortBy']")); // Sort By
//    Events.click(webDriver, By.cssSelector("[data-testid='list-item']")); // Last Updated
//    Events.click(webDriver, By.xpath("(//a[@data-testid='table-link'])[last()]"));
//    Events.click(webDriver, By.xpath("(//button[@data-testid='tab'])[2]"));
//    Events.click(webDriver, By.xpath("(//button[@data-testid='tab'])[3]"));
//    Events.click(webDriver, By.cssSelector("[data-testid='owner-dropdown']")); // Owner
//    Events.sendKeys(webDriver, By.cssSelector("[data-testid='searchInputText']"), "Cloud");
//    Events.click(webDriver, By.cssSelector("[data-testid='list-item']")); // Select User/Team
//    Events.click(webDriver, By.cssSelector("[data-testid='card-list']")); // Select Tier
//    Events.click(webDriver, By.cssSelector("[data-testid='saveManageTab']")); // Save
//    webDriver.navigate().back();
//    webDriver.navigate().refresh();
//  }
//
//  @AfterEach
//  public void closeTabs() {
//    ArrayList<String> tabs = new ArrayList<>(webDriver.getWindowHandles());
//    String originalHandle = webDriver.getWindowHandle();
//    for (String handle : webDriver.getWindowHandles()) {
//      if (!handle.equals(originalHandle)) {
//        webDriver.switchTo().window(handle);
//        webDriver.close();
//      }
//    }
//    webDriver.switchTo().window(tabs.get(0)).close();
//  }
//}
