"""
Print Queue Model for Mobile-to-PC Print Management

This model manages a queue of print jobs that mobile devices can add to,
and cafe PCs can monitor and auto-print from.

Workflow:
1. Mobile device saves a sale and adds print data to queue (status=PENDING)
2. Cafe PC polls the queue endpoint to get pending print jobs
3. Cafe PC prints the receipt and marks the job as PRINTED
4. Old completed jobs are periodically cleaned up
"""

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class PrintQueue(models.Model):
    """
    Queue of print jobs for mobile-to-PC printing.

    Each print job contains the receipt data in JSON format,
    along with status tracking and metadata.
    """

    class PrintStatus(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        PRINTED = "PRINTED", _("Printed")
        FAILED = "FAILED", _("Failed")

    class PrintType(models.TextChoices):
        STANDARD = "STANDARD", _("Standard Receipt")
        EDIT_DIFF = "EDIT_DIFF", _("Edit Diff Receipt")

    # Related sale (optional - for tracking)
    sale = models.ForeignKey(
        "sale.Sale",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="print_jobs",
        help_text="Related sale (if applicable)",
    )

    # Print job details
    print_type = models.CharField(
        max_length=20,
        choices=PrintType.choices,
        default=PrintType.STANDARD,
        help_text="Type of receipt to print",
    )

    print_data = models.JSONField(
        help_text="Receipt data in JSON format (matches PrintSaleData or PrintEditData interface)",
    )

    # Status tracking
    status = models.CharField(
        max_length=10,
        choices=PrintStatus.choices,
        default=PrintStatus.PENDING,
        db_index=True,
        help_text="Current status of the print job",
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the print job was added to the queue",
    )

    printed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the print job was successfully printed",
    )

    # Error tracking
    error_message = models.TextField(
        null=True,
        blank=True,
        help_text="Error message if print failed",
    )

    retry_count = models.IntegerField(
        default=0,
        help_text="Number of print retry attempts",
    )

    class Meta:
        db_table = "sale_print_queue"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]
        verbose_name = _("Print Queue")
        verbose_name_plural = _("Print Queue")

    def __str__(self):
        return f"Print Job {self.id} - {self.print_type} ({self.status})"

    def mark_as_printed(self):
        """Mark this print job as successfully printed."""
        self.status = self.PrintStatus.PRINTED
        self.printed_at = timezone.now()
        self.save(update_fields=["status", "printed_at"])

    def mark_as_failed(self, error_message: str):
        """Mark this print job as failed."""
        self.status = self.PrintStatus.FAILED
        self.error_message = error_message
        self.retry_count += 1
        self.save(update_fields=["status", "error_message", "retry_count"])

    def retry(self):
        """Reset job to pending for retry."""
        self.status = self.PrintStatus.PENDING
        self.error_message = None
        self.save(update_fields=["status", "error_message"])
