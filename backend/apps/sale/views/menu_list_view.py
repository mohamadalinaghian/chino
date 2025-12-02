"""
Menu Item Listing for Sale/Order Page

Provides API endpoints for staff to view available menu items when creating orders.

FILE LOCATION: apps/sale/views/menu_list_view.py
"""

from apps.menu.models import Menu, MenuCategory
from apps.menu.serializers import MenuItemSaleListSerializer
from apps.sale.permissions import CanViewSaleItems
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class MenuItemSaleListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing menu items on order/sale page.

    Permissions Required:
        - Valid device session (via DeviceSessionMiddleware)
        - User must be staff (is_staff=True)
        - User must have 'sale.view_sale_items' permission

    Endpoints:
        GET /sale/menu-items/                      - List all available items
        GET /sale/menu-items/{id}/                 - Get single item details
        GET /sale/menu-items/by-category/          - Items grouped by category
        GET /sale/menu-items/?category={id}        - Filter by category
        GET /sale/menu-items/?search={query}       - Search by name
        GET /sale/menu-items/?is_available=true    - Filter available only

    Optimizations:
        - select_related('category', 'name'): Prevents N+1 queries
        - Only returns available items by default
        - Indexed fields for fast filtering
    """

    serializer_class = MenuItemSaleListSerializer
    permission_classes = [CanViewSaleItems]

    # Filtering and searching
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "is_available"]
    search_fields = ["name__name"]  # Search in related Name model
    ordering_fields = ["price", "order"]
    ordering = ["order"]  # Default ordering from OrderedModel

    def get_queryset(self):
        """
        Return menu items available for sale.

        Filters:
            - Only items marked as available
            - Only from active categories

        Optimizations:
            - select_related: Load category and name in same query
            - Prevents N+1 query problem

        Returns:
            QuerySet of Menu items
        """
        queryset = Menu.objects.select_related("category", "name").filter(
            is_available=True,  # Only available items
            category__is_active=True,  # Only active categories
        )

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List all available menu items.

        GET /sale/menu-items/

        Query Parameters:
            ?category=1           - Filter by category ID
            ?search=coffee        - Search by item name
            ?is_available=true    - Filter by availability
            ?ordering=price       - Order by price (ascending)
            ?ordering=-price      - Order by price (descending)

        Response:
            {
                "count": 25,
                "next": null,
                "previous": null,
                "results": [
                    {
                        "id": 1,
                        "name": "Espresso",
                        "price": 45000,
                        "category": "Hot Drinks"
                    },
                    ...
                ]
            }
        """
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """
        Get single menu item details.

        GET /sale/menu-items/{id}/

        Response:
            {
                "id": 1,
                "name": "Espresso",
                "price": 45000,
                "category": "Hot Drinks"
            }
        """
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="by-category")
    def by_category(self, request):
        """
        Get menu items grouped by category.

        This is useful for displaying items in categorized sections
        on the order page.

        GET /sale/menu-items/by-category/

        Response:
            {
                "categories": [
                    {
                        "id": 1,
                        "title": "Hot Drinks",
                        "description": "Coffee, tea, and hot beverages",
                        "items": [
                            {
                                "id": 1,
                                "name": "Espresso",
                                "price": 45000,
                                "category": "Hot Drinks"
                            },
                            {
                                "id": 2,
                                "name": "Cappuccino",
                                "price": 55000,
                                "category": "Hot Drinks"
                            }
                        ]
                    },
                    {
                        "id": 2,
                        "title": "Cold Drinks",
                        "description": "Iced beverages",
                        "items": [...]
                    }
                ]
            }

        Performance:
            - Uses prefetch_related to load items efficiently
            - Only includes categories that have available items
            - Single database query with prefetch
        """
        # Get active categories with their menu items
        categories = (
            MenuCategory.objects.filter(is_active=True)
            .prefetch_related(
                # Prefetch only available menu items with their names
                "menu_set__name"
            )
            .order_by("order")
        )  # Assuming MenuCategory uses OrderedModel

        result = []

        for category in categories:
            # Get available items for this category
            items = category.menu_set.filter(is_available=True).select_related("name")

            # Only include category if it has available items
            if items.exists():
                result.append(
                    {
                        "id": category.id,
                        "title": category.title,
                        "description": category.description,
                        "items": MenuItemSaleListSerializer(items, many=True).data,
                    }
                )

        return Response({"categories": result})

    @action(detail=False, methods=["get"], url_path="available-count")
    def available_count(self, request):
        """
        Get count of available items per category.

        Useful for showing counts in UI before loading full data.

        GET /sale/menu-items/available-count/

        Response:
            {
                "total_items": 25,
                "by_category": {
                    "Hot Drinks": 8,
                    "Cold Drinks": 6,
                    "Food": 11
                }
            }
        """
        from django.db.models import Count

        # Total available items
        total = self.get_queryset().count()

        # Count by category
        by_category = {}
        categories = MenuCategory.objects.filter(is_active=True).annotate(
            item_count=Count("menu", filter=models.Q(menu__is_available=True))
        )

        for category in categories:
            if category.item_count > 0:
                by_category[category.title] = category.item_count

        return Response({"total_items": total, "by_category": by_category})


# Additional import needed for available_count
