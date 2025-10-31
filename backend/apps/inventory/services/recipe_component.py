from __future__ import annotations

import math

from django.core.exceptions import ValidationError
from django.db.models import F, Sum
from django.utils.translation import gettext_lazy as _

from ..models import Recipe


class RecipeComponentService:
    """Normalize component quantities so their sum equals 1 – type-safe."""

    @staticmethod
    def normalize_quantity(recipe: Recipe) -> None:
        """
        Ensure that the sum of ``quantity`` fields on all components equals 1.

        Args:
            recipe: The ``Recipe`` whose components must be normalised.
        """
        total = recipe.components.aggregate(total=Sum("quantity"))["total"] or 0
        if total <= 0:
            raise ValidationError(_("Total quantity must be greater than zero."))

        if math.isclose(total, 1, rel_tol=1e-6):
            return

        recipe.components.update(quantity=F("quantity") / total)
