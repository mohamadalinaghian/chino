# Generated manually for payment item quantity tracking

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        # Create the SalePaymentItem through model
        migrations.CreateModel(
            name="SalePaymentItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "quantity_paid",
                    models.PositiveIntegerField(
                        help_text="Number of units paid for in this payment",
                        verbose_name="Quantity paid",
                    ),
                ),
                (
                    "payment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_items",
                        to="sale.salepayment",
                        verbose_name="Payment",
                    ),
                ),
                (
                    "sale_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_records",
                        to="sale.saleitem",
                        verbose_name="Sale Item",
                    ),
                ),
            ],
            options={
                "verbose_name": "Sale payment item",
                "verbose_name_plural": "Sale payment items",
                "unique_together": {("payment", "sale_item")},
            },
        ),
    ]
