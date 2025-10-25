import pytest
from apps.inventory.tests.factories import ProductFactory
from apps.menu.models import Menu
from apps.menu.tests.factories import MenuCategoryFactory
from apps.utils.tests.factories import ImageFactory
from django.core.exceptions import ValidationError
from PIL import UnidentifiedImageError


@pytest.fixture
def product():
    return ProductFactory.create(type="SELLABLE")


@pytest.fixture
def category():
    return MenuCategoryFactory.create()


@pytest.fixture
def menu(product, category):
    return Menu.objects.create(
        name=product,
        price=1000,
        description="Test menu item",
        category=category,
        is_available=True,
    )


@pytest.mark.django_db
class TestMenuModel:

    # ================================
    # Happy Path Tests (Valid Scenarios)
    # ================================

    def test_create_menu(self, menu, product, category):
        """Test creating a menu item with valid data."""
        assert menu.name == product
        assert menu.price == 1000
        assert menu.description == "Test menu item"
        assert menu.category == category
        assert menu.is_available is True

    def test_slug_generation(self, product, category):
        """Test the automatic generation of the slug field."""
        menu = Menu.objects.create(
            name=product,
            price=1000,
            description="Test menu item",
            category=category,
            is_available=True,
        )
        expected_slug = product.name.lower().replace(
            " ", "-"
        )  # Slug generated from product name
        assert menu.slug == expected_slug

    def test_thumbnail_processing(self, menu):
        """Test the image processing logic (resizing and format conversion)."""
        menu.thumbnail = ImageFactory.create()
        menu.save()
        assert menu.thumbnail.name.endswith(
            ".webp"
        )  # Ensure image is saved in WebP format

    def test_price_range(self, product, category):
        """Test that the price is within the valid range."""
        menu = Menu.objects.create(
            name=product,
            price=500,
            description="Valid price",
            category=category,
            is_available=True,
        )
        assert menu.price == 500

    def test_suggested_price(self, menu):
        """Test that the suggested price is returned correctly."""
        suggested_price = menu.suggested_price
        assert suggested_price is not None

    def test_image_processing_failure(self, menu):
        """Test the behavior when image processing fails."""
        menu.thumbnail = None  # Simulate failure when image is missing
        menu.save()
        assert menu.thumbnail is None  # Ensure thumbnail is None after save

    # ================================
    # Unhappy Path Tests (Invalid Scenarios)
    # ================================

    def test_invalid_price_too_low(self, product, category):
        """Test invalid price input (too low)."""
        menu = Menu(
            name=product,
            price=-500,
            description="Invalid price",
            category=category,
            is_available=True,
        )
        with pytest.raises(ValidationError):
            menu.clean()  # This will call the validation logic
            menu.save()

    def test_invalid_price_too_high(self, product, category):
        """Test invalid price input (too high)."""
        menu = Menu(
            name=product,
            price=10000,
            description="Invalid price",
            category=category,
            is_available=True,
        )
        with pytest.raises(ValidationError):
            menu.clean()  # This will call the validation logic
            menu.save()

    def test_invalid_price_null(self, product, category):
        """Test invalid price input (null value when not allowed)."""
        menu = Menu(
            name=product,
            price=None,
            description="Invalid price",
            category=category,
            is_available=True,
        )
        with pytest.raises(ValidationError):
            menu.clean()  # This will call the validation logic
            menu.save()

    def test_invalid_slug_empty_product_name(self, category):
        """Test invalid slug generation with empty product name."""
        product = ProductFactory.create(name="")  # Empty name for product
        menu = Menu.objects.create(
            name=product,
            price=1000,
            description="Test empty slug",
            category=category,
            is_available=True,
        )
        assert menu.slug == ""  # Should not raise error, but result in an empty slug.

    def test_no_category(self, product):
        """Test creation of a menu item without category."""
        with pytest.raises(
            ValidationError
        ):  # Expecting ValidationError if category is not provided
            Menu.objects.create(
                name=product,
                price=1000,
                description="Menu without category",
                is_available=True,
            )

    def test_no_name(self, category):
        """Test creation of a menu item without product name."""
        product = ProductFactory.create(name=None)  # No name for product
        with pytest.raises(ValidationError):
            Menu.objects.create(
                name=product,
                price=1000,
                description="Menu without product name",
                category=category,
                is_available=True,
            )

    def test_no_description(self, product, category):
        """Test creation of a menu item without description."""
        menu = Menu.objects.create(
            name=product,
            price=1000,
            description=None,  # No description
            category=category,
            is_available=True,
        )
        assert menu.description is None  # Should be allowed to be None

    def test_no_thumbnail(self, product, category):
        """Test creation of a menu item without a thumbnail."""
        menu = Menu.objects.create(
            name=product,
            price=1000,
            description="Menu without thumbnail",
            category=category,
            is_available=True,
            thumbnail=None,
        )
        assert menu.thumbnail is None  # Should be allowed to be None

    def test_thumbnail_invalid_format(self, product, category):
        """Test behavior when an invalid image format is provided."""
        menu = Menu.objects.create(
            name=product,
            price=1000,
            description="Menu with invalid thumbnail",
            category=category,
            is_available=True,
        )
        with pytest.raises(UnidentifiedImageError):
            menu.thumbnail = "invalid_image_format.txt"  # Simulate invalid image format
            menu.save()

    def test_thumbnail_processing_error(self, product, category):
        """Test handling of image processing failure (e.g., corrupt image)."""
        menu = Menu.objects.create(
            name=product,
            price=1000,
            description="Test menu item with corrupt image",
            category=category,
            is_available=True,
        )
        menu.thumbnail = ImageFactory.create(
            image_type="corrupt"
        )  # Simulate corrupt image
        with pytest.raises(ValueError):  # Assuming failure due to corrupt image
            menu.save()

    def test_availability_toggle(self, menu):
        """Test toggling availability of the menu item."""
        menu.is_available = False
        menu.save()
        assert menu.is_available is False

    def test_duplicate_slug(self, product, category):
        """Test duplicate slug generation handling."""
        product_2 = ProductFactory.create(name="Test Product")  # Same name as product
        menu_2 = Menu.objects.create(
            name=product_2,
            price=1000,
            description="Another menu item",
            category=category,
            is_available=True,
        )
        # Ensure slug is unique even for products with same name
        assert (
            menu_2.slug == "test-product-2"
        )  # Slug should be unique with a number appended
