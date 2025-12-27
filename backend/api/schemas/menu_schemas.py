from typing import Optional

from ninja import Schema


class MenuCategoryDisplay(Schema):
    """
    Public-facing schema for displaying menu categories on the site.
    Contains only the minimal fields required for rendering category sections.
    """

    title: str
    description: Optional[str] = None


class MenuItemDisplay(Schema):
    """
    Public-facing schema for displaying individual menu items.
    All fields reflect nullable model fields to prevent runtime
    serialization errors.
    """

    name: str
    price: Optional[int] = None
    description: Optional[str] = None

    # Thumbnail can be missing.
    thumbnail: Optional[str] = None

    # Images list can be missing or empty.
    images: Optional[list[str]] = None

    # Nested category object for clean UI grouping.
    category: MenuCategoryDisplay


# ============================================================================
# NEW SALE PAGE SCHEMAS
# ============================================================================


class MenuItemSaleSchema(Schema):
    """
    Lightweight schema for menu items in the new sale page.
    Contains only essential fields for order creation.
    Optimized for performance with minimal data transfer.
    """

    id: int  # Menu ID for creating sale items
    name: str  # Product name for display
    price: int  # Current price for display


class MenuCategoryGroupSchema(Schema):
    """
    Groups menu items by category for the new sale page.
    Provides organized structure for category-based UI rendering.
    """

    category: str  # Category title
    items: list[MenuItemSaleSchema]  # Items in this category


class MenuSaleResponse(Schema):
    """
    Complete response for new sale page menu.
    Groups all available menu items by their parent group (BAR/FOOD).
    """

    bar_items: list[MenuCategoryGroupSchema]  # All bar category groups
    food_items: list[MenuCategoryGroupSchema]  # All food category groups


class ProductExtraSchema(Schema):
    """
    Schema for extra products (syrups, toppings, etc.).
    Loaded on-demand when user requests extras.
    Lightweight to minimize unnecessary data transfer.
    """

    id: int  # Product ID for creating extra sale items
    name: str  # Product name for display
    price: int  # Last purchased price for reference
