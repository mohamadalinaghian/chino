# backend/api/endpoints/menu_endpoints.py

from typing import List

from apps.inventory.models import Product
from apps.menu.models import Menu, MenuCategory
from apps.menu.services.get_sale_menu_grouped import get_sale_menu_grouped
from apps.menu.services.menu import MenuItemService
from ninja import Router

from ..schemas.menu_schemas import (
    MenuCategoryDisplay,
    MenuGroupOut,
    MenuItemDisplay,
    ProductExtraSchema,
)

router_menu_display = Router(tags=["menu"])


@router_menu_display.get(
    "/categories/",
    response=list[MenuCategoryDisplay],
    summary="Display list of menu categories",
)
def category_display(request):
    """
    Public menu category list.
    Uses OrderedModel default ordering via `order` field.
    """
    categories = MenuCategory.objects.order_by("order")

    # Ninja handles schema serialization directly from model instances.
    return categories


@router_menu_display.get(
    "/items/",
    response=list[MenuItemDisplay],
    summary="Display list of menu items",
)
def items_display(request):
    """
    Public list of menu items.
    Manual serialization is required because Product is nested
    inside Menu.name (FK), and schema expects flat primitive fields.
    """
    qs = (
        Menu.objects.filter(is_available=True, show_in_menu=True)
        .select_related("name", "category")
        .prefetch_related("images")
        .order_by("order")
    )

    results = []

    for item in qs:
        results.append(
            {
                "name": item.name.name,  # Product.name (real text)
                "price": item.price if item.price_is_visible else None,
                "thumbnail": item.thumbnail.url if item.thumbnail else None,
                "images": (
                    [img.file.url for img in item.images.all()]
                    if item.images.exists()
                    else None
                ),
                "description": item.description,
                "category": {
                    "title": item.category.title,
                    "description": item.category.description,
                },
            }
        )

    return results  # MUST return results, not qs


# ============================================================================
# NEW SALE PAGE ENDPOINTS
# ============================================================================


@router_menu_display.get(
    "/sale/menu",
    response=List[MenuGroupOut],
    summary="Get menu items grouped by category for new sale page",
)
def get_sale_menu(request):
    """
    Sale page optimized endpoint.

    - Grouped by parent_group
    - Categories ordered
    - Items ordered
    - Read-only, stateless
    """
    return get_sale_menu_grouped()


@router_menu_display.get(
    "/sale/extras",
    response=list[ProductExtraSchema],
    summary="Get available extra products (RAW/PROCESSED ingredients)",
)
def get_extra_products(request):
    """
    Fetches RAW and PROCESSED products for use as extras.

    IMPORTANT: Extras are ingredients/add-ons like:
    - RAW: Milk, syrup, sugar, coffee beans
    - PROCESSED: Whipped cream, chocolate sauce, etc.

    NOT sellable menu items - those are already in the menu.

    Loaded on-demand when user clicks "Add Extra" button.

    Performance:
    - Lazy-loaded: Only fetched when needed
    - Lightweight: Only id, name, price fields
    - Filtered: Only active RAW/PROCESSED products

    Returns:
        list[ProductExtraSchema]: Available extra products
    """
    extras = (
        Product.objects.filter(
            type__in=[Product.ProductType.RAW, Product.ProductType.PROCESSED],
            is_active=True,
        )
        .order_by("name")
        .values("id", "name", "last_purchased_price")
    )

    return [
        ProductExtraSchema(
            id=extra["id"],
            name=extra["name"],
            price=MenuItemService.extra_req_price(extra["id"])[0],
        )
        for extra in extras
    ]
