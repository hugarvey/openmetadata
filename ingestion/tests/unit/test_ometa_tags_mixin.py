"""
Tests for the OMeta tag MixIn
"""

import random
import unittest
from unittest import TestCase

from metadata.generated.schema.entity.tags.tagCategory import Tag, TagCategory
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.ometa.openmetadata_rest import MetadataServerConfig

CATEGORY_NAME = "TestTag"
PRIMARY_TAG_NAME = "TestPrimaryTag"
SECONDARY_TAG_NAME = "TestSecondaryTag"


class OMetaTagMixinPost(TestCase):
    """Class to test the Mixin implementation of the OMeta Tag"""

    unittest.TestLoader.sortTestMethodsUsing = None

    def setUp(self) -> None:
        server_config = MetadataServerConfig(api_endpoint="http://localhost:8585/api")
        self.metadata = OpenMetadata(server_config)

    def test_a_post_create_tag_categories(self):
        """Test POST category Mixin method"""

        tag_category = TagCategory(
            categoryType="Descriptive", description="test tag", name=CATEGORY_NAME
        )

        self.metadata.post_create_tag_category(tag_category)
        assert True

    def test_b_post_create_primary_tag(self):
        """Test POST primary tag Mixin method"""

        primary_tag_category = Tag(
            name=PRIMARY_TAG_NAME,
            description="test tag",
        )

        self.metadata.post_create_primary_tag(CATEGORY_NAME, primary_tag_category)
        assert True

    def test_c_post_create_primary_tag(self):
        """Test POST secondary tag Mixin method"""

        secondary_tag_category = Tag(
            name=SECONDARY_TAG_NAME,
            description="test tag",
        )

        self.metadata.post_create_secondary_tag(
            CATEGORY_NAME, PRIMARY_TAG_NAME, secondary_tag_category
        )
        assert True


class OMetaTagMixinGet(TestCase):
    """test GET methods"""

    def setUp(self) -> None:
        server_config = MetadataServerConfig(api_endpoint="http://localhost:8585/api")
        self.metadata = OpenMetadata(server_config)

    def test_get_tag_category(self):
        """Test GET primary tag"""

        tag_category = self.metadata.get_tag_category(
            entity=TagCategory, category_name=CATEGORY_NAME
        )

        self.assertEqual(tag_category.name.__root__, CATEGORY_NAME)

    def test_get_primary_tag(self):
        """Test GET tag by category"""

        primary_tag = self.metadata.get_primary_tag(
            entity=Tag,
            category_name=CATEGORY_NAME,
            primary_tag_fqn=PRIMARY_TAG_NAME,
        )

        self.assertEqual(primary_tag.name.__root__, PRIMARY_TAG_NAME)

    def test_get_secondary_tag(self):
        """Test GET secondary"""

        secondary_tag = self.metadata.get_secondary_tag(
            entity=Tag,
            category_name=CATEGORY_NAME,
            primary_tag_fqn=PRIMARY_TAG_NAME,
            secondary_tag_fqn=SECONDARY_TAG_NAME,
        )

        self.assertEqual(secondary_tag.name.__root__, SECONDARY_TAG_NAME)

    def test_get_list_tag_categories(self):
        """Test GET list categories Mixin method"""

        tag_categories = self.metadata.get_list_tag_categories(entity=TagCategory)

        self.assertIsNotNone(tag_categories)


class OMetaTagMixinPut(TestCase):
    """Test OMeta Tag PUT methods"""

    def setUp(self) -> None:
        server_config = MetadataServerConfig(api_endpoint="http://localhost:8585/api")
        self.metadata = OpenMetadata(server_config)

    def test_c_put_update_tag_category(self):
        """Test put tag category"""

        rand_name = random.getrandbits(64)
        updated_tag_category = TagCategory(
            categoryType="Descriptive", description="test tag", name=f"{rand_name}"
        )

        self.metadata.put_update_tag_category(CATEGORY_NAME, updated_tag_category)

        assert True

    def test_b_put_update_primary_tag(self):
        """Test put tag category"""

        rand_name = random.getrandbits(64)
        updated_primary_tag = Tag(description="test tag", name=f"{rand_name}")

        self.metadata.put_update_primary_tag(
            CATEGORY_NAME, PRIMARY_TAG_NAME, updated_primary_tag
        )

        assert True

    def test_a_put_update_secondary_tag(self):
        """Test put tag category"""

        rand_name = random.getrandbits(64)
        updated_secondary_tag = Tag(description="test tag", name=f"{rand_name}")

        self.metadata.put_update_secondary_tag(
            CATEGORY_NAME, PRIMARY_TAG_NAME, SECONDARY_TAG_NAME, updated_secondary_tag
        )

        assert True
