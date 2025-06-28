import pytest
from apps.menu.models import Menu, MenuCategory
from django.utils.text import slugify


@pytest.mark.django_db
class TestMenuCategory:

    def test_create_menu_category(self, menu_category):
        category = MenuCategory.objects.create(**menu_category)

        assert category.title == menu_category["title"]
        assert category.slug == slugify(menu_category["title"])
        assert str(category) == category.title

    def test_create_menu_item(self, menu_item):
        item = Menu.objects.create(**menu_item)

        assert item.title == menu_item["title"]
        assert item.category == menu_item["category"]
        assert item.description == menu_item["description"]
        assert item.is_available == menu_item["is_available"]
        # assert item.image == menu_item["image"]
        # assert item.thumbnail == menu_item["thumbnail"]
        assert item.price == menu_item["price"]
        assert item.slug == menu_item["title"]

        assert str(item) == menu_item["title"]

    @pytest.mark.parametrize(
        "omit",
        (
            "price",
            "description",
            # "image",
            # "thumbnail",
        ),
    )
    def test_menu_nullable_fields(self, omit, menu_item):
        item_copy = menu_item.copy()
        item_copy.pop(omit)
        item = Menu.objects.create(**item_copy)

        assert item.title is not None

    def test_ordering_within_category(self):
        cat = MenuCategory.objects.create(title="Test")
        m1 = Menu.objects.create(title="A", category=cat)
        m2 = Menu.objects.create(title="B", category=cat)
        m3 = Menu.objects.create(title="C", category=cat)

        m3.up()
        m3.save()

        ordered_titles = list(
            Menu.objects.filter(category=cat)
            .order_by("order")
            .values_list("title", flat=True)
        )
        assert ordered_titles == ["A", "C", "B"]
