"""
URL Configuration for Sale App

All sale-related endpoints are protected by:
    1. DeviceSessionMiddleware (validates device + session)
    2. Permission classes (checks user permissions)

"""

from apps.sale.views import MenuItemSaleListViewSet
from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Create router for ViewSets
router = DefaultRouter()

# Register viewsets
router.register(r"menu-items", MenuItemSaleListViewSet, basename="sale-menu-items")

app_name = "sale"

urlpatterns = [
    # ViewSet routes
    path("", include(router.urls)),
    # Future manual routes will go here:
    # path('invoices/create/', InvoiceCreateView.as_view(), name='invoice-create'),
    # path('payments/process/', PaymentProcessView.as_view(), name='payment-process'),
]

"""
Available Endpoints:

Menu Items (Read-only):
    GET  /sale/menu-items/              - List all available items
    GET  /sale/menu-items/{id}/         - Get single item
    GET  /sale/menu-items/by-category/  - Items grouped by category
    GET  /sale/menu-items/available-count/  - Count items per category

Filters & Search:
    GET  /sale/menu-items/?category=1           - Filter by category
    GET  /sale/menu-items/?search=coffee        - Search by name
    GET  /sale/menu-items/?is_available=true    - Available only
    GET  /sale/menu-items/?ordering=price       - Order by price
    GET  /sale/menu-items/?ordering=-price      - Order by price desc

All endpoints require:
    - Header: Session-Token (from device login)
    - Permission: sale.view_sale_items
"""
