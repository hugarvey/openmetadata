package org.openmetadata.catalog.selenium.objectRepository;

import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class explorePage {
  WebDriver webDriver;

  public explorePage(WebDriver webDriver) {
    this.webDriver = webDriver;
  }

  By explore = By.cssSelector("[data-testid='appbar-item'][id='explore']");
  By tableCount = By.xpath("(//span[@data-testid='filter-count'])[1]");
  By topicsCount = By.xpath("(//span[@data-testid='filter-count'])[2]");
  By dashboardCount = By.xpath("(//span[@data-testid='filter-count'])[3]");
  By pipelineCount = By.xpath("(//span[@data-testid='filter-count'])[4]");
  By tables = By.xpath("(//button[@data-testid='tab'])[1]");
  By topics = By.xpath("(//button[@data-testid='tab'])[2]");
  By dashboard = By.xpath("(//button[@data-testid='tab'])[3]");
  By pipeline = By.xpath("(//button[@data-testid='tab'])[4]");
  By next = By.linkText("Next");
  By pagination = By.xpath("//div[@data-testid=\"pagination-button\"]");
  By bigQueryCheckbox = By.xpath("//input[@id=\"BigQuery\"]");
  By serviceName = By.xpath("//div[@class=\"filters-title tw-w-40 tw-truncate custom-checkbox-label\"]");
  By countService =
      By.xpath(
          "//span[@class=\"tw-py-px tw-px-1 tw-ml-1 tw-border tw-rounded tw-text-xs tw-min-w-badgeCount tw-text-center tw-bg-badge tw-py-0 tw-px-0\"]");
  By errorMessage = By.xpath("//p[@data-testid=\"no-search-results\"]");
  By glueCheckbox = By.xpath("//input[@id=\"Glue\"]");
  By selectTable = By.xpath("(//button[@data-testid=\"table-link\"])[2]");
  By addTag = By.xpath("//span[@data-testid=\"tags\"]");
  By serviceText = By.xpath("//h6[contains(text(),'Service')]");
  By tierText = By.xpath("//h6[contains(text(),'Tier')]");
  By databaseText = By.xpath("//h6[contains(text(),'Database')]");
  By tagText = By.xpath("//h6[contains(text(),'Tags')]");
  By lastWeekSortDesc = By.xpath("//i[@class=\"fas fa-sort-amount-up-alt tw-text-base tw-text-primary\"]");
  By lastWeekSortAesc = By.xpath("//i[@class=\"fas fa-sort-amount-down-alt tw-text-base tw-text-primary\"]");
  By updatedDescription = By.xpath("(//div[@class=\"content-container\"])[1]");
  By shopifyCheckbox = By.id("shopify");
  By tagSpecialCategoryCheckbox = By.id("PersonalData.SpecialCategory");
  By tierTier3Checkbox = By.id("Tier.Tier3");
  By selectedCheckbox =
      By.xpath(
          "//span[@class=\"tw-py-px tw-px-1 tw-ml-1 tw-border tw-rounded tw-text-xs tw-min-w-badgeCount tw-text-center tw-bg-primary tw-text-white tw-border-none tw-py-0 tw-px-0\"]");
  By Kafka = By.id("Kafka");
  By superset = By.id("Superset");
  By airflow = By.id("Airflow");

  public By explore() {
    return explore;
  }

  public By getTableCount() {
    return tableCount;
  }

  public By getTopicCount() {
    return topicsCount;
  }

  public By getDashboardCount() {
    return dashboardCount;
  }

  public By getPipelineCount() {
    return pipelineCount;
  }

  public By dashboard() {
    return dashboard;
  }

  public By pipeline() {
    return pipeline;
  }

  public By tables() {
    return tables;
  }

  public By topics() {
    return topics;
  }

  public By pagination() {
    return pagination;
  }

  public By next() {
    return next;
  }

  public By bigQueryCheckbox() {
    return bigQueryCheckbox;
  }

  public List<WebElement> serviceName() {
    return webDriver.findElements(serviceName);
  }

  public List<WebElement> serviceCount() {
    return webDriver.findElements(countService);
  }

  public By errorMessage() {
    return errorMessage;
  }

  public By glueCheckbox() {
    return glueCheckbox;
  }

  public By selectTable() {
    return selectTable;
  }

  public By addTag() {
    return addTag;
  }

  public By serviceText() {
    return serviceText;
  }

  public By tierText() {
    return tierText;
  }

  public By databaseText() {
    return databaseText;
  }

  public By tagText() {
    return tagText;
  }

  public By lastWeekSortDesc() {
    return lastWeekSortDesc;
  }

  public By lastWeekSortAesc() {
    return lastWeekSortAesc;
  }

  public By descriptionCheck() {
    return updatedDescription;
  }

  public By shopifyCheckbox() {
    return shopifyCheckbox;
  }

  public By tagSpecialCategoryCheckbox() {
    return tagSpecialCategoryCheckbox;
  }

  public By tierTier3Checkbox() {
    return tierTier3Checkbox;
  }

  public List<WebElement> selectedCheckbox() {
    return webDriver.findElements(selectedCheckbox);
  }

  public By kafka() {
    return Kafka;
  }

  public By superset() {
    return superset;
  }

  public By airflow() {
    return airflow;
  }
}
