from decimal import Decimal
from django.db import models


class StockEntryQuerySet(models.QuerySet):
    def available_for_product(self, product):
        """
        Return IN entries with positive remaining_quantity ordered oldest-first.
        Use remaining_quantity as source of truth.
        """
        from apps.inventory.models import StockEntry  # lazy import to avoid circularity

        allowed = [
            StockEntry.MovementType.PURCHASE_IN,
            StockEntry.MovementType.PRODUCTION_IN,
            StockEntry.MovementType.ADJUSTMENT_IN,
            StockEntry.MovementType.RETURN_IN,
        ]
        return (
            self.filter(product=product)
            .filter(remaining_quantity__gt=Decimal("0"))
            .filter(movement_type__in=allowed)
            .order_by("created_at")
        )


class StockEntryManager(models.Manager):
    def get_queryset(self):
        return StockEntryQuerySet(self.model, using=self._db)

    def available_for_product(self, product):
        return self.get_queryset().available_for_product(product)

    def consume_fifo_plan(self, product, required_qty):
        """
        Return a consumption plan: list[(entry, qty_to_take)].
        Does NOT write changes. Caller should execute plan inside transaction.
        """
        required_qty = Decimal(str(required_qty))
        if required_qty <= 0:
            return []

        remaining = required_qty
        plan = []
        qs = self.available_for_product(product)
        for entry in qs:
            if remaining <= 0:
                break
            available = Decimal(entry.remaining_quantity)
            take = min(available, remaining)
            plan.append((entry, take))
            remaining -= take

        if remaining > 0:
            raise ValueError("Not enough stock to consume required quantity")
        return plan

    def consume_fifo(self, product, required_qty):
        """
        Perform FIFO consumption atomically and update entries.
        Returns list[(entry, consumed_qty, source_entry_unit_cost)] for followup.
        """
        from django.db import transaction

        required_qty = Decimal(str(required_qty))
        if required_qty <= 0:
            return []

        with transaction.atomic():
            qs = self.available_for_product(product).select_for_update()
            remaining = required_qty
            results = []
            for entry in qs:
                if remaining <= 0:
                    break
                available = Decimal(entry.remaining_quantity)
                take = min(available, remaining)
                # update the original entry
                entry.remaining_quantity = available - take
                entry.is_depleted = entry.remaining_quantity <= 0
                entry.save(update_fields=["remaining_quantity", "is_depleted"])
                results.append((entry, take, Decimal(entry.unit_cost or 0)))
                remaining -= take

            if remaining > 0:
                # rollback will happen automatically due to atomic
                raise ValueError("Not enough stock to consume required quantity")
            return results
