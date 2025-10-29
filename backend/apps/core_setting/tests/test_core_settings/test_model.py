from decimal import Decimal

import pytest
from apps.core_setting.models import SiteSettings
from apps.core_setting.tests.factories import SiteSettingsFactory
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test.utils import override_settings  # Added for locale override
from persiantools.jdatetime import JalaliDate


@pytest.mark.django_db
class TestSiteSettingsModel:
    def test_happy_path_creation(self):
        """Test happy path: Create a SiteSettings instance and verify fields."""
        settings = SiteSettingsFactory(
            profit_margin=50,
            tax_rate=20,
            overhead_bar_value=Decimal("5.0000"),
            overhead_food_value=Decimal("3.0000"),
            purchase_valid_change_ratio=10,
        )

        assert settings.id is not None
        assert settings.singleton_key == "default"
        assert settings.profit_margin == 50
        assert settings.tax_rate == 20
        assert settings.overhead_bar_value == Decimal("5.0000")
        assert settings.overhead_food_value == Decimal("3.0000")
        assert settings.purchase_valid_change_ratio == 10
        assert settings.updated_at is not None
        assert settings.jalali_update_date == JalaliDate(settings.updated_at).strftime(
            "%c", locale="fa"
        )
        assert str(settings) == "default"

    def test_get_method(self):
        """Test get() retrieves or creates singleton."""
        settings = SiteSettingsFactory()
        retrieved = SiteSettings.get()
        assert retrieved == settings
        assert retrieved.singleton_key == "default"

    def test_get_for_update_method(self):
        """Test get_for_update() retrieves or creates with transaction."""
        settings = SiteSettingsFactory()
        with transaction.atomic():
            retrieved = SiteSettings.get_for_update()
            assert retrieved == settings
            assert retrieved.singleton_key == "default"

    def test_edge_case_zero_values(self):
        """Test edge case: Zero values for fields."""
        settings = SiteSettingsFactory(
            profit_margin=0,
            tax_rate=0,
            overhead_bar_value=Decimal("0.0000"),
            overhead_food_value=Decimal("0.0000"),
            purchase_valid_change_ratio=0,
        )
        assert settings.profit_margin == 0
        assert settings.tax_rate == 0
        assert settings.overhead_bar_value == Decimal("0.0000")
        assert settings.overhead_food_value == Decimal("0.0000")
        assert settings.purchase_valid_change_ratio == 0

    def test_edge_case_max_profit_margin(self):
        """Test edge case: Maximum allowed profit_margin (99)."""
        settings = SiteSettingsFactory(profit_margin=99)
        assert settings.profit_margin == 99

    def test_edge_case_max_tax_rate(self):
        """Test edge case: Maximum allowed tax_rate (99)."""
        settings = SiteSettingsFactory(tax_rate=99)
        assert settings.tax_rate == 99

    def test_error_profit_margin_too_high(self):
        """Test error: profit_margin >= 100 raises ValidationError."""
        settings = SiteSettingsFactory.build(profit_margin=100)
        with pytest.raises(ValidationError) as exc:
            settings.full_clean()
        assert "Must be in [0, 100)." in str(exc.value)

    def test_error_tax_rate_too_high(self):
        """Test error: tax_rate >= 100 raises ValidationError."""
        settings = SiteSettingsFactory.build(tax_rate=100)
        with pytest.raises(ValidationError) as exc:
            settings.full_clean()
        assert "Must be in [0, 100)." in str(exc.value)

    def test_error_negative_profit_margin(self):
        """Test error: Negative profit_margin raises ValidationError."""
        settings = SiteSettingsFactory.build(profit_margin=-1)
        with pytest.raises(ValidationError) as exc:
            settings.full_clean()
        assert "Must be in [0, 100)." in str(exc.value)

    def test_error_negative_tax_rate(self):
        """Test error: Negative tax_rate raises ValidationError."""
        settings = SiteSettingsFactory.build(tax_rate=-1)
        with pytest.raises(ValidationError) as exc:
            settings.full_clean()
        assert "Must be in [0, 100)." in str(exc.value)

    def test_error_negative_overhead_values(self):
        """Test error: Negative overhead values raise ValidationError."""
        with override_settings(
            LANGUAGE_CODE="en"
        ):  # Force English locale for error message
            settings = SiteSettingsFactory.build(overhead_bar_value=Decimal("-1.0000"))
            with pytest.raises(ValidationError) as exc:
                settings.full_clean()
            assert "Ensure this value is greater than or equal to 0." in str(exc.value)

    def test_error_duplicate_singleton_key(self):
        """Test error: Duplicate singleton_key raises IntegrityError."""
        SiteSettingsFactory(singleton_key="default")
        settings = SiteSettingsFactory.build(singleton_key="default")
        with pytest.raises(IntegrityError):
            settings.save()

    def test_jalali_update_date_unsaved_instance(self):
        """Test jalali_update_date is None for unsaved instance."""
        settings = SiteSettingsFactory.build(updated_at=None)
        assert settings.jalali_update_date is None

    def test_updated_at_auto_update(self):
        """Test updated_at updates on save."""
        settings = SiteSettingsFactory()
        original_updated_at = settings.updated_at
        settings.profit_margin = 40
        settings.save()
        settings.refresh_from_db()
        assert settings.updated_at > original_updated_at
