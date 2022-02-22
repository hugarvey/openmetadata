package org.openmetadata.catalog.selenium.objectRepository;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class Webhooks {
  WebDriver webDriver;

  public Webhooks(WebDriver webDriver) {
    this.webDriver = webDriver;
  }

  By webhookLink = By.linkText("Webhooks");
  By addWebhook = By.xpath("//button[@data-testid='add-webhook-button']");
  By name = By.xpath("//input[@data-testid='name']");
  By descriptionBox = By.xpath("//div[@class='notranslate public-DraftEditor-content']");
  By endpoint = By.xpath("//input[@data-testid='endpoint-url']");
  By checkbox = By.xpath("//input[@data-testid='checkbox']");
  By entityCreatedMenu = By.xpath("(//button[@id='menu-button-select entities'])[1]");
  By allEntities = By.xpath("(//input[@type='checkbox'])[2]");
  By saveWebhook = By.xpath("//button[@data-testid='save-webhook']");
  By checkWebhook = By.xpath("//button[@data-testid='webhook-link']");
  By toast = By.xpath("(//div[@data-testid='toast']/div)[2]");

  public By getToast() {
    return toast;
  }

  public By checkWebhook() {
    return checkWebhook;
  }

  public By getSaveWebhook() {
    return saveWebhook;
  }

  public By allEntities() {
    return allEntities;
  }

  public By getEntityCreatedMenu() {
    return entityCreatedMenu;
  }

  public By checkbox() {
    return checkbox;
  }

  public By getEndpoint() {
    return endpoint;
  }

  public By getDescriptionBox() {
    return descriptionBox;
  }

  public By name() {
    return name;
  }

  public By webhookLink() {
    return webhookLink;
  }

  public By addWebhook() {
    return addWebhook;
  }
}
