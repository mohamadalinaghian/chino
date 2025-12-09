# backend/api/endpoints/menu_endpoints.py
from apps.menu.models import Menu, MenuCategory
from ninja import Router

from ..schemas.menu_schemas import MenuCategoryDisplay, MenuItemDisplay

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
