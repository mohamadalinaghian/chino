import pytest
from django_code.apps.menu.models import Menu, MenuCategory


@pytest.mark.django_db
class TestMenuAPI:

    def test_menu_list_api(self, api_client, menu_item, image):
        item = Menu.objects.create(**menu_item)
        item.images.add(image)

        response = api_client.get("/api/menu/item/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        menu_data = data[0]
        assert menu_data["title"] == item.title
        assert menu_data["category"]["title"] == item.category.title
        assert menu_data["thumbnail"].endswith(".jpg")
        assert len(menu_data["images"]) == 1
        assert menu_data["images"][0]["title"] == image.title

    def test_menu_category_list_api(self, api_client):
        MenuCategory.objects.create(title="قهوه")
        MenuCategory.objects.create(title="چای")

        response = api_client.get("/api/menu/category/")
        assert response.status_code == 200

        data = response.json()
        titles = {item["title"] for item in data}
        assert "قهوه" in titles
        assert "چای" in titles
