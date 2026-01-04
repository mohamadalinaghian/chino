from collections import defaultdict

from django.db.models import Prefetch

from ..models import Menu, MenuCategory


def get_sale_menu_grouped(smart_sort: bool = True):
    """
    Returns menu items grouped by:
        Parent Group -> Category -> Items

    Args:
        smart_sort: If True, sort by popularity (analytics). If False, use manual order.

    Guarantees:
    - Only available items
    - price IS NOT NULL
    - Categories with no items are excluded
    - Ordering: smart_sort ? analytics rank : manual order
    - 2-3 DB queries total (3 when smart_sort=True)

    Smart Sorting:
    - Most frequently selected items appear first
    - Most popular categories appear first
    - Based on weekly selection counts with daily tiebreaker
    - Falls back to manual order when analytics unavailable
    """

    # Build menu queryset with optional smart sorting
    menu_qs = (
        Menu.objects.filter(
            is_available=True,
            price__isnull=False,
        )
        .select_related("name")  # Product
        .only(
            "id",
            "price",
            "order",
            "category_id",
            "name__name",
        )
    )

    if smart_sort:
        # Left join with analytics (some items may not have analytics yet)
        # Sort by rank (lower = more popular), fallback to manual order
        menu_qs = (
            menu_qs
            .select_related("analytics")
            .order_by("analytics__rank_week", "analytics__rank_today", "order")
        )
    else:
        menu_qs = menu_qs.order_by("order")

    # Build category queryset with optional smart sorting
    categories = (
        MenuCategory.objects.prefetch_related(
            Prefetch(
                "menus",
                queryset=menu_qs,
                to_attr="available_items",
            )
        )
        .only(
            "id",
            "title",
            "parent_group",
            "order",
        )
    )

    if smart_sort:
        # Sort categories by analytics rank, fallback to manual order
        categories = (
            categories
            .select_related("analytics")
            .order_by("analytics__rank", "order")
        )
    else:
        categories = categories.order_by("order")

    grouped = defaultdict(list)

    for category in categories:
        items = category.available_items
        if not items:
            continue  # exclude empty categories

        grouped[category.parent_group].append(
            {
                "id": category.id,
                "title": category.title,
                "items": [
                    {
                        "id": item.id,
                        "name": item.name.name,
                        "price": item.price,
                    }
                    for item in items
                ],
            }
        )

    # convert to final ordered list
    return [
        {
            "parent_group": parent_group,
            "categories": categories,
        }
        for parent_group, categories in grouped.items()
    ]
