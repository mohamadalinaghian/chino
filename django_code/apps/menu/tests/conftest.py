import pytest
from apps.menu.models import Menu, MenuCategory
from apps.utils.models import Image
from django.core.files.uploadedfile import SimpleUploadedFile


@pytest.fixture
def menu_category():
    category = {
        "title": "Coffee",
    }
    return category


@pytest.fixture
def image_file():
    return SimpleUploadedFile(
        "image.jpg",
        b"file_content",
        content_type="image/jpeg",
    )


@pytest.fixture
def image(image_file):
    return Image.objects.create(image=image_file)


@pytest.fixture
def menu_item(
    menu_category,
):
    category = MenuCategory.objects.create(**menu_category)
    item = {
        "title": "esspresso",
        "category": category,
        "price": 45000,
        "description": "i think title has wrong spell!",
        "is_available": True,
    }
    return item
