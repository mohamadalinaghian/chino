# In apps/core_setting/tests/factories/__init__.py or apps/core_setting/tests/factories/site_settings.py
import factory
from apps.core_setting.models import SiteSettings
from django.utils import timezone


class SiteSettingsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SiteSettings
        django_get_or_create = ("singleton_key",)

    singleton_key = "default"
    profit_margin = factory.Faker(
        "pyint", min_value=0, max_value=99
    )  # Respect pct_0_to_100_exclusive
    tax_rate = factory.Faker(
        "pyint", min_value=0, max_value=99
    )  # Respect pct_0_to_100_exclusive
    overhead_bar_value = factory.Faker(
        "pydecimal", left_digits=6, right_digits=4, positive=True
    )
    overhead_food_value = factory.Faker(
        "pydecimal", left_digits=6, right_digits=4, positive=True
    )
    purchase_valid_change_ratio = factory.Faker("pyint", min_value=0, max_value=100)

    thumbnail_quality = factory.Faker("pyint", min_value=0, max_value=100)
    thumbnail_max_width = factory.Faker("pyint", min_value=0, max_value=400)
    thumbnail_max_height = factory.Faker("pyint", min_value=0, max_value=400)
    updated_at = factory.Faker("date_time", tzinfo=timezone.get_current_timezone())

    @factory.post_generation
    def set_jalali_update_date(self, create, extracted, **kwargs):
        """Set jalali_update_date if explicitly provided; otherwise, computed automatically."""
        if extracted:
            self._jalali_update_date = extracted
