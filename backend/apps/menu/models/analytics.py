from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class MenuItemAnalytics(models.Model):
    """
    Tracks selection analytics for menu items to enable smart sorting.

    Purpose:
    - Track how often each menu item is selected across different time periods
    - Maintain ranking for efficient sorting queries
    - Support both real-time updates and batch recalculation

    Design:
    - OneToOne with Menu for efficient joins
    - Separate counters for different time windows
    - Pre-calculated ranks to avoid expensive ORDER BY on every query
    - All fields have sensible defaults for new items

    Usage:
    - Increment counters when items are added to sales
    - Reset daily/weekly/monthly counters via scheduled tasks
    - Recalculate ranks periodically for accurate sorting
    """

    menu_item = models.OneToOneField(
        "menu.Menu",
        on_delete=models.CASCADE,
        related_name="analytics",
        verbose_name=_("Menu Item"),
        help_text=_("The menu item being tracked"),
    )

    # Selection counters - incremented on each sale item addition
    selection_count_today = models.IntegerField(
        _("Selections Today"),
        default=0,
        db_index=True,
        help_text=_("Number of times selected today (resets daily)"),
    )
    selection_count_week = models.IntegerField(
        _("Selections This Week"),
        default=0,
        db_index=True,
        help_text=_("Number of times selected this week (resets weekly)"),
    )
    selection_count_month = models.IntegerField(
        _("Selections This Month"),
        default=0,
        help_text=_("Number of times selected this month (resets monthly)"),
    )
    selection_count_all_time = models.IntegerField(
        _("All-Time Selections"),
        default=0,
        help_text=_("Total number of times selected (never resets)"),
    )

    # Timestamp tracking
    last_selected_at = models.DateTimeField(
        _("Last Selected At"),
        null=True,
        blank=True,
        help_text=_("When this item was last added to a sale"),
    )

    # Pre-calculated rankings for efficient sorting
    # Lower rank = more popular (rank 1 is most popular)
    rank_today = models.IntegerField(
        _("Today's Rank"),
        default=9999,
        db_index=True,
        help_text=_("Ranking within category based on today's selections"),
    )
    rank_week = models.IntegerField(
        _("Week's Rank"),
        default=9999,
        db_index=True,
        help_text=_("Ranking within category based on this week's selections"),
    )
    rank_month = models.IntegerField(
        _("Month's Rank"),
        default=9999,
        help_text=_("Ranking within category based on this month's selections"),
    )

    # Metadata
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)

    class Meta:
        verbose_name = _("Menu Item Analytics")
        verbose_name_plural = _("Menu Item Analytics")
        ordering = ("rank_week", "rank_today")
        indexes = [
            models.Index(fields=["selection_count_week", "selection_count_today"]),
            models.Index(fields=["rank_week", "rank_today"]),
        ]

    def __str__(self):
        return f"{self.menu_item.name} Analytics"

    def increment_selections(self):
        """
        Increment all selection counters and update timestamp.
        Called when this menu item is added to a sale.
        """
        self.selection_count_today += 1
        self.selection_count_week += 1
        self.selection_count_month += 1
        self.selection_count_all_time += 1
        self.last_selected_at = timezone.now()
        self.save(
            update_fields=[
                "selection_count_today",
                "selection_count_week",
                "selection_count_month",
                "selection_count_all_time",
                "last_selected_at",
                "updated_at",
            ]
        )


class CategoryAnalytics(models.Model):
    """
    Tracks selection analytics for menu categories to enable smart sorting.

    Purpose:
    - Track cumulative selections across all items in a category
    - Maintain ranking for category-level sorting
    - Enable "hot categories" feature

    Design:
    - OneToOne with MenuCategory
    - Aggregated from item-level analytics
    - Separate counters for different time windows
    - Pre-calculated rank for efficient sorting

    Usage:
    - Increment when any item in the category is selected
    - Reset counters via scheduled tasks
    - Recalculate rank periodically
    """

    category = models.OneToOneField(
        "menu.MenuCategory",
        on_delete=models.CASCADE,
        related_name="analytics",
        verbose_name=_("Category"),
        help_text=_("The category being tracked"),
    )

    # Selection counters - sum of all items in this category
    selection_count_today = models.IntegerField(
        _("Selections Today"),
        default=0,
        db_index=True,
        help_text=_("Total selections of items in this category today"),
    )
    selection_count_week = models.IntegerField(
        _("Selections This Week"),
        default=0,
        db_index=True,
        help_text=_("Total selections of items in this category this week"),
    )
    selection_count_month = models.IntegerField(
        _("Selections This Month"),
        default=0,
        help_text=_("Total selections of items in this category this month"),
    )

    # Pre-calculated ranking
    # Lower rank = more popular category
    rank = models.IntegerField(
        _("Category Rank"),
        default=9999,
        db_index=True,
        help_text=_("Overall ranking based on selection frequency"),
    )

    # Metadata
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)

    class Meta:
        verbose_name = _("Category Analytics")
        verbose_name_plural = _("Category Analytics")
        ordering = ("rank",)
        indexes = [
            models.Index(fields=["selection_count_week", "selection_count_today"]),
        ]

    def __str__(self):
        return f"{self.category.title} Analytics"

    def increment_selections(self):
        """
        Increment all selection counters.
        Called when any item in this category is added to a sale.
        """
        self.selection_count_today += 1
        self.selection_count_week += 1
        self.selection_count_month += 1
        self.save(
            update_fields=[
                "selection_count_today",
                "selection_count_week",
                "selection_count_month",
                "updated_at",
            ]
        )
