"""
Print Queue API Schemas

Defines request/response schemas for the print queue endpoints.
"""

from datetime import datetime
from typing import Dict, Optional

from ninja import Schema


class PrintJobCreateRequest(Schema):
    """Request schema for creating a new print job."""

    sale_id: Optional[int] = None
    print_type: str  # "STANDARD" or "EDIT_DIFF"
    print_data: Dict  # JSON data matching PrintSaleData or PrintEditData interface


class PrintJobResponse(Schema):
    """Response schema for print job details."""

    id: int
    sale_id: Optional[int]
    print_type: str
    print_data: Dict
    status: str
    created_at: datetime
    printed_at: Optional[datetime]


class PrintJobUpdateResponse(Schema):
    """Response schema for print job status updates."""

    id: int
    status: str
    message: str


class ErrorResponse(Schema):
    """Generic error response."""

    detail: str
