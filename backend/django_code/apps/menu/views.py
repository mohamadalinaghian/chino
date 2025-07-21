from django_code.apps.menu.models import Menu, MenuCategory
from django_code.apps.menu.serializers import MenuCategorySerializer, MenuSerializer
from rest_framework import viewsets


class MenuViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Menu.objects.filter(is_available=True)
        .select_related("category")
        .prefetch_related("images")
    )
    serializer_class = MenuSerializer


class MenuCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
