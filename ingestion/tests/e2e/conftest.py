"""Module fixture for data quality e2e tests"""


import pytest
from playwright.sync_api import Browser
from ingestion.tests.e2e.configs.common import create_user

from ingestion.tests.e2e.configs.users.admin import Admin
from ingestion.tests.e2e.configs.connectors.redshift import RedshiftConnector

BASE_URL = "http://localhost:8585"

@pytest.fixture(scope="session")
def create_data_consumer_user(browser: Browser):
    """Create a data consumer user"""
    context = browser.new_context()
    page =  context.new_page()
    page.goto(f"{BASE_URL}/signin")
    Admin().login(page)
    data_consumer = create_user(page, "data-consumer@example.com", "Data Consumer User", "Data Consumer")
    yield data_consumer
    data_consumer.delete(page)
    context.close()
