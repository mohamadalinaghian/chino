from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.db import models
from django.db.models import ExpressionWrapper, F, Sum


class ReportManager(models.Manager):

    def generate_for_date(
        self,
        report_date: date,
        pos_device_total: Decimal = Decimal("0.0000"),
        physical_cash_total: Decimal = Decimal("0.0000"),
        card_to_card_total: Decimal = Decimal("0.0000"),
        misc_expenses: Decimal = Decimal("0.0000"),
    ):
        """
        Generate daily financial report using:
          - SaleItem for revenue
          - Menu.material_cost for COGS
          - Manual inputs for POS, cash, card-to-card
        """
        from apps.inventory.models import PurchaseInvoice
        from apps.sale.models import (
            CardToCard,
            CashTransaction,
            PosTransaction,
            SaleInvoice,
        )

        try:
            report, _ = self.get_or_create(report_date=report_date)

            # === 1. Revenue: SaleItem.quantity * sold_unit_price ===
            invoices = SaleInvoice.objects.filter(
                issue_date__date=report_date
            ).prefetch_related("items__product__menu")

            report.total_revenue = invoices.aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F("items__quantity") * F("items__sold_unit_price"),
                        output_field=models.DecimalField(
                            max_digits=12, decimal_places=4
                        ),
                    )
                )
            )["total"] or Decimal("0.0000")

            # === 2. COGS: SaleItem.quantity * Menu.material_cost ===
            report.total_cogs = invoices.aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F("items__quantity") * F("items__product__menu__material_cost"),
                        output_field=models.DecimalField(
                            max_digits=12, decimal_places=4
                        ),
                    )
                )
            )["total"] or Decimal("0.0000")

            # === 3. External Totals ===
            report.pos_device_total = pos_device_total
            report.physical_cash_total = physical_cash_total
            report.card_to_card_total = card_to_card_total

            # === 4. Discrepancies ===
            pos_sum = PosTransaction.objects.filter(pay_day=report_date).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.0000")
            cash_sum = CashTransaction.objects.filter(pay_day=report_date).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.0000")
            card_sum = CardToCard.objects.filter(pay_day=report_date).aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0.0000")

            report.pos_discrepancy = pos_device_total - pos_sum
            report.cash_discrepancy = physical_cash_total - cash_sum
            report.card_to_card_discrepancy = card_to_card_total - card_sum
            report.payment_discrepancy = report.total_revenue - (
                pos_device_total + physical_cash_total + card_to_card_total
            )

            # === 5. Purchase Expenses ===
            report.purchase_expenses = PurchaseInvoice.objects.filter(
                issue_date=report_date
            ).aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F("items__quantity") * F("items__purchased_unit_price"),
                        output_field=models.DecimalField(
                            max_digits=12, decimal_places=4
                        ),
                    )
                )
            )[
                "total"
            ] or Decimal(
                "0.0000"
            )

            # === 6. Misc Expenses (manual) ===
            report.misc_expenses = misc_expenses

            # === 7. Profit ===
            report.total_profit = (
                report.total_revenue
                - report.total_cogs
                - report.purchase_expenses
                - report.misc_expenses
            )

            # === 8. Notes ===
            notes = []
            for label, value in [
                ("Payment", report.payment_discrepancy),
                ("POS", report.pos_discrepancy),
                ("Cash", report.cash_discrepancy),
                ("Card-to-card", report.card_to_card_discrepancy),
            ]:
                if value != 0:
                    notes.append(f"{label} mismatch: {value:+.4f}")

            card_transactions = CardToCard.objects.filter(pay_day=report_date)
            if card_sum != card_to_card_total:
                notes.append(
                    f"Card-to-card mismatch: {len(card_transactions)} tx, expected {card_to_card_total:.4f}"
                )

            report.notes = "; ".join(notes) if notes else None

            report.save()
            return report

        except Exception as e:
            raise ValueError(f"Failed to generate report: {str(e)}")
