from collections import defaultdict

from django.db.models import Prefetch

from ..models import Menu, MenuCategory


def get_sale_menu_grouped():
    """
    Returns menu items grouped by:
        Parent Group -> Category -> Items

    Guarantees:
    - Only available items
    - price IS NOT NULL
    - Categories with no items are excluded
    - Ordering respected (OrderedModel)
    - 2 DB queries total
    """

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
        .order_by("order")
    )

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
        .order_by("order")
    )

    grouped = defaultdict(list)

    for category in categories:
        items = category.available_items
        if not items:
            continue  # exclude empty categories

        grouped[category.parent_group].append(
            {
                "id": category.pk,
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
