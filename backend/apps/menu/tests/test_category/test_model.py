import pytest
from apps.menu.models import MenuCategory
from apps.menu.tests.factories.category import MenuCategoryFactory
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from slugify import slugify


@pytest.mark.django_db
class TestMenuCategoryModel:
    def test_happy_path_creation(self):
        category = MenuCategory.objects.create(
            title="Test Category",
            parent_group=MenuCategory.Group.BAR_ITEM,
            description="A test description",
        )
        assert category.slug == "test-category"
        assert str(category) == "Test Category"
        assert category.description == "A test description"
        assert category.parent_group == "BAR"
        assert category.order == 0  # First item, order starts at 0

    def test_happy_path_with_unicode_title(self):
        title = "دسته‌بندی تست"  # Persian with dash
        category = MenuCategory.objects.create(
            title=title,
            parent_group=MenuCategory.Group.FOOD,
        )
        expected_slug = slugify(title, separator="-", allow_unicode=True)
        assert category.slug == expected_slug
        assert str(category) == title

    def test_happy_path_update_title_updates_slug(self):
        category = MenuCategory.objects.create(title="Old Title")
        category.title = "New Title"
        category.save()
        assert category.slug == "new-title"

    def test_happy_path_no_description(self):
        category = MenuCategory.objects.create(
            title="No Desc",
            parent_group=MenuCategory.Group.BAR_ITEM,
        )
        assert category.description is None

    def test_ordering_multiple_creations(self):
        cat1 = MenuCategory.objects.create(title="Cat1")
        cat2 = MenuCategory.objects.create(title="Cat2")
        cat3 = MenuCategory.objects.create(title="Cat3")
        categories = MenuCategory.objects.all()
        assert list(categories) == [cat1, cat2, cat3]  # Ordered by 'order'
        assert cat1.order == 0
        assert cat2.order == 1
        assert cat3.order == 2

    def test_edge_max_length_title(self):
        max_title = "A" * 50
        category = MenuCategory.objects.create(title=max_title)
        assert category.title == max_title
        assert category.slug == ("a" * 50)  # slugify lowercases

    def test_edge_max_length_description(self):
        max_desc = "B" * 200
        category = MenuCategory.objects.create(title="Test", description=max_desc)
        assert category.description == max_desc

    def test_edge_min_length_title(self):
        with pytest.raises(ValidationError) as exc_info:
            category = MenuCategory(title="")
            category.full_clean()
        errors = exc_info.value.message_dict
        assert "title" in errors  # Check key instead of string
        assert "slug" in errors  # Slug also blank

    def test_edge_slug_exactly_max_length(self):
        long_title = "C" * 50
        category = MenuCategory.objects.create(title=long_title)
        assert len(category.slug) == 50

    def test_error_duplicate_title(self):
        MenuCategory.objects.create(title="Duplicate")
        with pytest.raises(IntegrityError):
            MenuCategory.objects.create(title="Duplicate")

    def test_error_duplicate_slug(self):
        MenuCategory.objects.create(title="Title One")  # slug="title-one"
        with pytest.raises(IntegrityError):
            # Create a title that generates the same slug
            MenuCategory.objects.create(title="Title-One")

    def test_error_invalid_parent_group(self):
        with pytest.raises(ValidationError) as exc_info:
            category = MenuCategory(title="Invalid Group", parent_group="INVALID")
            category.full_clean()
        errors = exc_info.value.message_dict
        assert "parent_group" in errors
        assert "slug" in errors  # Slug blank

    def test_error_title_too_long(self):
        with pytest.raises(ValidationError) as exc_info:
            category = MenuCategory(title="D" * 51)
            category.full_clean()
        errors = exc_info.value.message_dict
        assert "title" in errors
        assert "slug" in errors  # Slug blank

    def test_error_description_too_long(self):
        with pytest.raises(ValidationError) as exc_info:
            category = MenuCategory(title="Test", description="E" * 201)
            category.full_clean()
        errors = exc_info.value.message_dict
        assert "description" in errors
        assert "slug" in errors  # Slug blank

    def test_error_slug_not_updated_if_same(self):
        category = MenuCategory.objects.create(title="Same Title")
        original_slug = category.slug
        category.save()  # Save again, slug shouldn't change
        assert category.slug == original_slug

    def test_bad_way_force_invalid_slug_manual(self):
        category = MenuCategory(title="Test")
        category.slug = "invalid/slug/with/slash"  # Invalid format
        with pytest.raises(ValidationError) as exc_info:
            category.full_clean()
        errors = exc_info.value.message_dict
        assert "slug" in errors  # Check key for invalid slug

    def test_edge_no_choices_for_parent_group(self):
        # If choices are empty (hypothetical), but since hardcoded, test default
        category = MenuCategory.objects.create(title="Default")
        assert category.parent_group == MenuCategory.Group.BAR_ITEM


@pytest.mark.django_db
class TestMenuCategoryFactory:
    def test_happy_path_create(self):
        category = MenuCategoryFactory()
        assert isinstance(category, MenuCategory)
        assert category.title.startswith("Category ")
        assert category.slug == slugify(
            category.title, separator="-", allow_unicode=True
        )
        assert category.parent_group in [
            choice[0] for choice in MenuCategory.Group.choices
        ]
        assert len(category.description) == 100  # fuzzy.FuzzyText(length=100)
        assert category.order >= 0

    def test_override_fields(self):
        category = MenuCategoryFactory(
            title="Custom Title",
            parent_group=MenuCategory.Group.FOOD,
            description="Custom Desc",
        )
        assert category.title == "Custom Title"
        assert category.slug == "custom-title"
        assert category.parent_group == "FOOD"
        assert category.description == "Custom Desc"

    def test_fuzzy_parent_group_variety(self):
        categories = [MenuCategoryFactory() for _ in range(10)]
        groups = {cat.parent_group for cat in categories}
        assert len(groups) > 1  # Should have variety due to fuzzy

    def test_edge_create_with_max_title(self):
        long_title = "F" * 50
        category = MenuCategoryFactory(title=long_title)
        assert category.title == long_title
        assert len(category.slug) == 50

    def test_error_factory_with_invalid_group(self):
        invalid_category = MenuCategoryFactory.build(
            parent_group="INVALID"
        )  # Build without save
        with pytest.raises(ValidationError) as exc_info:
            invalid_category.full_clean()
        errors = exc_info.value.message_dict
        assert "parent_group" in errors
