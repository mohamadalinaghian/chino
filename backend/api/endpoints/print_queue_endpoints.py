"""
Print Queue API Endpoints

Provides endpoints for managing the print queue:
- POST /print-queue/ - Add a print job to the queue
- GET /print-queue/pending/ - Get pending print jobs (for cafe PC monitoring)
- PUT /print-queue/{id}/printed/ - Mark a print job as printed
- PUT /print-queue/{id}/failed/ - Mark a print job as failed
- DELETE /print-queue/{id}/ - Delete a print job
"""

from typing import List

from api.schemas.print_queue_schemas import (
    ErrorResponse,
    PrintJobCreateRequest,
    PrintJobResponse,
    PrintJobUpdateResponse,
)
from api.security.auth import jwt_auth
from apps.sale.models import PrintQueue, Sale
from django.shortcuts import get_object_or_404
from ninja import Router

router = Router(tags=["Print Queue"], auth=jwt_auth)


@router.post("/", response={201: PrintJobResponse, 422: ErrorResponse})
def create_print_job(request, payload: PrintJobCreateRequest):
    """
    Add a new print job to the queue.

    This endpoint is called by mobile devices after saving a sale
    to queue the receipt for printing on the cafe PC.
    """
    # Validate sale if provided
    sale = None
    if payload.sale_id:
        sale = get_object_or_404(Sale, id=payload.sale_id)

    # Create print job
    print_job = PrintQueue.objects.create(
        sale=sale,
        print_type=payload.print_type,
        print_data=payload.print_data,
    )

    return 201, {
        "id": print_job.id,
        "sale_id": print_job.sale_id,
        "print_type": print_job.print_type,
        "print_data": print_job.print_data,
        "status": print_job.status,
        "created_at": print_job.created_at,
        "printed_at": print_job.printed_at,
    }


@router.get("/pending/", response={200: List[PrintJobResponse]})
def get_pending_print_jobs(request):
    """
    Get all pending print jobs.

    This endpoint is polled by the cafe PC to check for new print jobs.
    Returns jobs in order of creation (oldest first).
    """
    pending_jobs = PrintQueue.objects.filter(status=PrintQueue.PrintStatus.PENDING).order_by(
        "created_at"
    )

    return 200, [
        {
            "id": job.id,
            "sale_id": job.sale_id,
            "print_type": job.print_type,
            "print_data": job.print_data,
            "status": job.status,
            "created_at": job.created_at,
            "printed_at": job.printed_at,
        }
        for job in pending_jobs
    ]


@router.put("/{job_id}/printed/", response={200: PrintJobUpdateResponse, 404: ErrorResponse})
def mark_as_printed(request, job_id: int):
    """
    Mark a print job as successfully printed.

    This endpoint is called by the cafe PC after successfully printing a receipt.
    """
    print_job = get_object_or_404(PrintQueue, id=job_id)
    print_job.mark_as_printed()

    return 200, {
        "id": print_job.id,
        "status": print_job.status,
        "message": "Print job marked as printed",
    }


@router.put("/{job_id}/failed/", response={200: PrintJobUpdateResponse, 404: ErrorResponse})
def mark_as_failed(request, job_id: int, error_message: str = ""):
    """
    Mark a print job as failed.

    This endpoint is called by the cafe PC if printing fails.
    """
    print_job = get_object_or_404(PrintQueue, id=job_id)
    print_job.mark_as_failed(error_message)

    return 200, {
        "id": print_job.id,
        "status": print_job.status,
        "message": f"Print job marked as failed: {error_message}",
    }


@router.delete("/{job_id}/", response={200: dict, 404: ErrorResponse})
def delete_print_job(request, job_id: int):
    """
    Delete a print job from the queue.

    This can be used to clean up old completed jobs or cancel pending jobs.
    """
    print_job = get_object_or_404(PrintQueue, id=job_id)
    print_job.delete()

    return 200, {"message": "Print job deleted successfully"}
