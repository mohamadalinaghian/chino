from apps.menu.models import Menu, MenuCategory
from django.db.models import Prefetch
from ninja import Router

from .schemas import MenuCategoryGroupSchema, MenuItemSchema

menu_router = Router()


@menu_router.get(
    "/items",
    response=list[MenuCategoryGroupSchema],
    summary="List menu items grouped by category",
)
def list_menu_items(request):
    """
    Returns available menu items grouped by category.

    Query rules:
        - Only items where is_available=True
        - Categories ordered by OrderedModel.order
        - Menu items ordered by OrderedModel.order

    Query optimization:
        - select_related("name", "category") to avoid N+1 on related fields
        - Prefetch filtered menu items into categories
    """

    # Prefetch only available menu items, ordered correctly
    menu_prefetch = Prefetch(
        "menus",  # related_name = menus
        queryset=Menu.objects.filter(is_available=True)
        .select_related("name")
        .order_by("order"),  # OrderedModel order
        to_attr="prefetched_menus",
    )

    categories = (
        MenuCategory.objects.all()
        .order_by("order")  # OrderedModel order
        .prefetch_related(menu_prefetch)
    )

    result = []

    for category in categories:
        items = [
            MenuItemSchema(
                id=item.id,
                name=item.name.name,  # Menu.name → Product.name
                price=item.price,
            )
            for item in category.prefetched_menus
        ]

        if not items:
            continue  # Skip empty categories

        result.append(
            MenuCategoryGroupSchema(
                category=category.title,
                items=items,
            )
        )

    return result
