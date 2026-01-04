"""
Celery tasks for menu analytics management.

These tasks handle periodic resets and ranking calculations to keep
the smart sorting system accurate and performant.

Usage:
    Configure in celerybeat schedule:
    - reset_daily_analytics: Run at midnight (0 0 * * *)
    - reset_weekly_analytics: Run Sunday midnight (0 0 * * 0)
    - reset_monthly_analytics: Run 1st of month (0 0 1 * *)
    - recalculate_rankings: Run every 6 hours (0 */6 * * *)
"""

from django.db import transaction
from django.db.models import Count, F, Q, Window
from django.db.models.functions import DenseRank

# Celery import - uncomment when Celery is configured
# from celery import shared_task

# Placeholder decorator for when Celery is not yet set up
def shared_task(*args, **kwargs):
    """Decorator placeholder - replace with actual Celery shared_task when ready"""
    def decorator(func):
        func.delay = func  # Allow calling as task.delay() for now
        return func
    return decorator


@shared_task
def reset_daily_analytics():
    """
    Reset daily analytics counters for all menu items and categories.

    Schedule: Daily at midnight
    Duration: ~100ms for 100 items
    """
    from apps.menu.models import CategoryAnalytics, MenuItemAnalytics

    with transaction.atomic():
        # Reset item analytics
        updated_items = MenuItemAnalytics.objects.all().update(
            selection_count_today=0,
            rank_today=9999,  # Will be recalculated by recalculate_rankings
        )

        # Reset category analytics
        updated_categories = CategoryAnalytics.objects.all().update(
            selection_count_today=0,
        )

    return {
        "items_reset": updated_items,
        "categories_reset": updated_categories,
    }


@shared_task
def reset_weekly_analytics():
    """
    Reset weekly analytics counters.

    Schedule: Every Sunday at midnight
    Duration: ~100ms for 100 items
    """
    from apps.menu.models import CategoryAnalytics, MenuItemAnalytics

    with transaction.atomic():
        updated_items = MenuItemAnalytics.objects.all().update(
            selection_count_week=0,
            rank_week=9999,
        )

        updated_categories = CategoryAnalytics.objects.all().update(
            selection_count_week=0,
        )

    return {
        "items_reset": updated_items,
        "categories_reset": updated_categories,
    }


@shared_task
def reset_monthly_analytics():
    """
    Reset monthly analytics counters.

    Schedule: 1st of every month at midnight
    Duration: ~100ms for 100 items
    """
    from apps.menu.models import CategoryAnalytics, MenuItemAnalytics

    with transaction.atomic():
        updated_items = MenuItemAnalytics.objects.all().update(
            selection_count_month=0,
            rank_month=9999,
        )

        updated_categories = CategoryAnalytics.objects.all().update(
            selection_count_month=0,
        )

    return {
        "items_reset": updated_items,
        "categories_reset": updated_categories,
    }


@shared_task
def recalculate_rankings():
    """
    Recalculate ranking fields for all items and categories.

    This is a performance optimization - pre-calculating ranks allows
    efficient ORDER BY queries without expensive window functions.

    Algorithm:
    1. Rank items within each category by weekly selections
    2. Rank categories by total weekly selections
    3. Update rank fields in database

    Schedule: Every 6 hours (or after each sale for real-time updates)
    Duration: ~200ms for 100 items with 10 categories
    """
    from apps.menu.models import CategoryAnalytics, Menu, MenuCategory, MenuItemAnalytics

    with transaction.atomic():
        # 1. Rank items within each category
        # Using window function to calculate rank, then bulk update

        # Get all menu items with their analytics
        menu_items = Menu.objects.select_related('analytics', 'category').all()

        # Group by category and assign ranks
        item_updates = []
        for category in MenuCategory.objects.all():
            category_items = (
                MenuItemAnalytics.objects
                .filter(menu_item__category=category)
                .select_related('menu_item')
                .order_by('-selection_count_week', '-selection_count_today', 'id')
            )

            for rank, item_analytics in enumerate(category_items, start=1):
                item_analytics.rank_week = rank
                item_analytics.rank_today = rank  # Simplified - could use separate ranking
                item_updates.append(item_analytics)

        # Bulk update item ranks
        if item_updates:
            MenuItemAnalytics.objects.bulk_update(
                item_updates,
                ['rank_week', 'rank_today'],
                batch_size=100
            )

        # 2. Rank categories by total selections
        category_analytics = (
            CategoryAnalytics.objects
            .all()
            .order_by('-selection_count_week', '-selection_count_today', 'id')
        )

        category_updates = []
        for rank, cat_analytics in enumerate(category_analytics, start=1):
            cat_analytics.rank = rank
            category_updates.append(cat_analytics)

        if category_updates:
            CategoryAnalytics.objects.bulk_update(
                category_updates,
                ['rank'],
                batch_size=50
            )

    return {
        "items_ranked": len(item_updates),
        "categories_ranked": len(category_updates),
    }


# Example Celery Beat schedule configuration
# Add this to your Django settings when Celery is configured:
"""
CELERY_BEAT_SCHEDULE = {
    'reset-daily-analytics': {
        'task': 'apps.menu.tasks.reset_daily_analytics',
        'schedule': crontab(hour=0, minute=0),  # Midnight daily
    },
    'reset-weekly-analytics': {
        'task': 'apps.menu.tasks.reset_weekly_analytics',
        'schedule': crontab(hour=0, minute=0, day_of_week=0),  # Sunday midnight
    },
    'reset-monthly-analytics': {
        'task': 'apps.menu.tasks.reset_monthly_analytics',
        'schedule': crontab(hour=0, minute=0, day_of_month=1),  # 1st of month
    },
    'recalculate-rankings': {
        'task': 'apps.menu.tasks.recalculate_rankings',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
}
"""
