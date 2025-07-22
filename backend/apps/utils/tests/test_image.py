import pytest
from apps.menu.models import Menu, MenuCategory
from apps.utils.models import Image


@pytest.mark.django_db
def test_image_upload_path(image):
    assert "images/" in image.image.name


@pytest.mark.django_db
def test_attach_extra_image_to_menu(menu_item, image):
    menu_item.images.add(image)
    menu_item.save()
    assert image in menu_item.images.all()


@pytest.fixture
def image_file():
    from django.core.files.uploadedfile import SimpleUploadedFile
    from PIL import Image as PILImage
    import io

    img = PILImage.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    return SimpleUploadedFile("test.jpg", buf.read(), content_type="image/jpeg")


@pytest.fixture
def image(image_file):
    return Image.objects.create(title="Test Image", image=image_file)


@pytest.fixture
def category():
    return MenuCategory.objects.create(title="Test Category", slug="test-category")


@pytest.fixture
def menu_item(category):
    return Menu.objects.create(
        title="Test Menu",
        price=1000,
        description="Test description",
        slug="test-menu",
        category=category,
    )
