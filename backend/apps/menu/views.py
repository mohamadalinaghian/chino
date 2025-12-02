from apps.menu.models import Menu, MenuCategory
from apps.menu.serializers import (
    MenuCategorySerializer,
    MenuItemSaleListSerializer,
    MenuSerializer,
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter


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


class MenuItemSaleListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing available menu items in sale operations.

    Features:
    - Only shows available items (is_available=True)
    - Optimized queries with select_related
    - Search by item name or category
    - Filter by category
    - Ordered by category and item order
    """

    serializer_class = MenuItemSaleListSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ["name__name", "category__title"]
    filterset_fields = ["category"]
    ordering_fields = ["price", "order"]

    def get_queryset(self):
        return (
            Menu.objects.filter(is_available=True)
            .select_related("name", "category")
            .order_by("category__order", "order")
        )


REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}
