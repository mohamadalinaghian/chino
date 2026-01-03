from typing import List, Optional

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


class MenuItemOut(Schema):
    """
    Lightweight schema for menu items in the new sale page.
    Contains only essential fields for order creation.
    Optimized for performance with minimal data transfer.
    """

    id: int  # Menu ID for creating sale items
    name: str  # Product name for display
    price: int  # Current price for display


class MenuCategoryOut(Schema):
    """
    Groups menu items by category for the new sale page.
    Provides organized structure for category-based UI rendering.
    """

    id: int
    title: str
    items: List[MenuItemOut]


class MenuGroupOut(Schema):
    """
    Top-level grouping by parent_group (BAR / FOOD).
    """

    parent_group: str
    categories: List[MenuCategoryOut]


class ProductExtraSchema(Schema):
    """
    Schema for extra products (syrups, toppings, etc.).
    Loaded on-demand when user requests extras.
    Lightweight to minimize unnecessary data transfer.
    """

    id: int  # Product ID for creating extra sale items
    name: str  # Product name for display
    price: int  # Last purchased price for reference
