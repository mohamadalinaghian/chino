from decimal import Decimal

import pytest
from apps.inventory.services import ItemProductionService
from apps.inventory.tests.factories import ItemProductionFactory, RecipeFactory
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestItemProductionService:

    def test_get_production_total_cost_with_negative_quantity(self):
        recipe = RecipeFactory()
        ItemProductionFactory(
            used_recipe=recipe,
            used_quantity=Decimal("5.00"),
            produced_quantity=Decimal("10.00"),
        )

        with pytest.raises(ValidationError):
            ItemProductionService.get_production_total_cost(
                recipe, used_qt=Decimal("-5.00")
            )
