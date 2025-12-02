from apps.menu.views import MenuCategoryViewSet, MenuItemSaleListViewSet, MenuViewSet
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("item", MenuViewSet)
router.register("category", MenuCategoryViewSet)
router.register("sale/items", MenuItemSaleListViewSet, basename="sale-items")

urlpatterns = [
    path("", include(router.urls)),
]
