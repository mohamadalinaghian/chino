import pytest
from apps.menu.models import Menu
from apps.utils.models import Image


@pytest.mark.django_db
def test_image_upload_path(image):
    assert "images/" in image.image.name


@pytest.mark.django_db
def test_attach_extra_image_to_menu(menu_item, image):
    menu_item.extra_images.add(image)
    menu_item.save()
    assert image in menu_item.extra_images.all()
