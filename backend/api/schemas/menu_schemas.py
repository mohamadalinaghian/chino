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
