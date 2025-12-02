from ninja import Schema


class MenuItemSchema(Schema):
    """
    Public-facing representation of a single menu item.
    Does NOT expose internal model structure.
    """

    id: int
    name: str
    price: int | None


class MenuCategoryGroupSchema(Schema):
    """
    Represents a category and its associated items.
    """

    category: str
    items: list[MenuItemSchema]
