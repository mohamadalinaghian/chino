# backend/api/endpoints/menu_endpoints.py
from collections import defaultdict

from apps.inventory.models import Product
from apps.menu.models import Menu, MenuCategory
from ninja import Router

from ..schemas.menu_schemas import (
    MenuCategoryDisplay,
    MenuCategoryGroupSchema,
    MenuItemDisplay,
    MenuItemSaleSchema,
    MenuSaleResponse,
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
                "price": item.price,
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
    response=MenuSaleResponse,
    summary="Get menu items grouped by category for new sale page",
)
def get_sale_menu(request):
    """
    Fetches all available menu items grouped by category and parent group.
    Optimized endpoint for the new sale page with minimal data transfer.

    Performance Optimizations:
    - Single DB query with select_related for Product names
    - In-memory grouping using defaultdict
    - Only fetches essential fields (id, name, price)

    Returns:
        MenuSaleResponse: Menu items grouped by BAR and FOOD categories
    """
    # Single optimized query
    menu_items = (
        Menu.objects.filter(is_available=True, show_in_menu=True)
        .select_related("name", "category")
        .order_by("category__order", "order")
    )

    # Group items by parent_group -> category -> items
    grouped = defaultdict(lambda: defaultdict(list))

    for item in menu_items:
        parent_group = item.category.parent_group  # BAR or FOOD
        category_title = item.category.title

        grouped[parent_group][category_title].append(
            MenuItemSaleSchema(id=item.id, name=item.name.name, price=item.price or 0)
        )

    # Build response structure
    bar_categories = [
        MenuCategoryGroupSchema(category=cat, parent_group="BAR_ITEM", items=items)
        for cat, items in grouped["BAR_ITEM"].items()
    ]

    food_categories = [
        MenuCategoryGroupSchema(category=cat, parent_group="FOOD", items=items)
        for cat, items in grouped["FOOD"].items()
    ]

    return MenuSaleResponse(bar_items=bar_categories, food_items=food_categories)


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
            price=int(extra["last_purchased_price"]),
        )
        for extra in extras
    ]
