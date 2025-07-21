from django_code.apps.menu.views import MenuCategoryViewSet, MenuViewSet
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("item", MenuViewSet)
router.register("category", MenuCategoryViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
