"""
Guest Management Endpoints

Provides APIs for:
- Searching guests by mobile number
- Quick-creating guest accounts for walk-ins
- Listing guests for selection

Design Philosophy:
- Simple search by mobile (primary use case)
- No password required for guest accounts (staff-created)
- Minimal friction for walk-in customer tracking
"""

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from ninja import Query, Router
from slugify import slugify

from ..schemas.guest_schemas import (
    GuestListResponse,
    GuestQuickCreateRequest,
    GuestResponse,
)

Account = get_user_model()

router_guest = Router(tags=["Guest Management"])


@router_guest.get(
    "/search",
    response={200: GuestResponse, 404: dict},
    summary="Search guest by mobile number",
)
def search_guest_by_mobile(
    request, mobile: str = Query(..., min_length=11, max_length=11)
):
    """
    Search for a guest by their mobile number.

    **Use Case:**
    Staff enters a mobile number in the guest selection field.
    If found, the guest's name is displayed for confirmation.

    **Parameters:**
    - mobile: 11-digit mobile number starting with 09

    **Returns:**
    - 200: Guest information if found
    - 404: No guest with that mobile exists

    **Example:**
    ```
    GET /api/guests/search?mobile=09123456789
    ```
    """
    # Validate mobile format
    if not mobile.startswith("09") or not mobile.isdigit() or len(mobile) != 11:
        raise DjangoValidationError("Mobile must be 11 digits starting with 09")

    try:
        guest = Account.objects.get(mobile=mobile, is_active=True)
        return 200, GuestResponse(
            id=guest.id,
            mobile=guest.mobile,
            name=guest.name,
            is_active=guest.is_active,
        )
    except Account.DoesNotExist:
        return 404, {"detail": "Guest not found"}


@router_guest.get(
    "/{guest_id}",
    response={200: GuestResponse, 404: dict},
    summary="Get guest by ID",
)
def get_guest_by_id(request, guest_id: int):
    """
    Fetch a guest account by ID.

    **Use Case:**
    When editing a sale that has an associated guest, we need to fetch
    the guest details by ID to display in the guest selector.

    **Parameters:**
    - guest_id: Guest account ID

    **Returns:**
    - 200: Guest information if found
    - 404: No guest with that ID exists

    **Example:**
    ```
    GET /api/guests/123
    ```
    """
    try:
        guest = Account.objects.get(id=guest_id, is_active=True)
        return 200, GuestResponse(
            id=guest.id,
            mobile=guest.mobile,
            name=guest.name,
            is_active=guest.is_active,
        )
    except Account.DoesNotExist:
        return 404, {"detail": "Guest not found"}


@router_guest.post(
    "/quick-create",
    response={201: GuestResponse},
    summary="Quick-create a guest account",
)
def quick_create_guest(request, payload: GuestQuickCreateRequest):
    """
    Create a guest account with minimal information.

    **Use Case:**
    Staff searches for a mobile number, no account found.
    Staff enters guest name and creates account on-the-fly.

    **Features:**
    - No password required (staff-created account)
    - Automatically generates username from mobile
    - Auto-generates slug from name
    - Account is immediately active

    **Parameters:**
    - mobile: 11-digit mobile number (unique)
    - name: Guest's full name

    **Returns:**
    - 201: Guest created successfully
    - 400: Validation error (duplicate mobile, invalid format)

    **Example:**
    ```json
    POST /api/guests/quick-create
    {
        "mobile": "09123456789",
        "name": "علی محمدی"
    }
    ```

    **Security Note:**
    These accounts cannot be used for login (no password).
    They exist solely for guest tracking and sale association.
    """
    # Check if mobile already exists
    if Account.objects.filter(mobile=payload.mobile).exists():
        raise DjangoValidationError(
            f"Guest with mobile {payload.mobile} already exists. Use search instead."
        )

    # Generate slug from name
    base_slug = slugify(payload.name, allow_unicode=True)

    # Ensure unique slug
    slug = base_slug
    counter = 1
    while Account.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    try:
        # Create guest account
        guest = Account.objects.create(
            mobile=payload.mobile,
            name=payload.name,
            slug=slug,
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )

        # Note: No password set - cannot login
        # This is intentional for guest accounts

        return 201, GuestResponse(
            id=guest.id,
            mobile=guest.mobile,
            name=guest.name,
            is_active=guest.is_active,
        )

    except IntegrityError as e:
        raise DjangoValidationError(f"Failed to create guest: {str(e)}")


@router_guest.get(
    "",
    response=GuestListResponse,
    summary="List all active guests",
)
def list_guests(
    request,
    search: str = Query(None, description="Search by name or mobile"),
    limit: int = Query(50, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """
    List active guest accounts.

    **Use Case:**
    - Populate guest dropdown/autocomplete
    - Browse existing guests
    - Search guests by name or mobile

    **Parameters:**
    - search: Optional text search (name or mobile)
    - limit: Max results (default 50, max 100)
    - offset: Pagination offset (default 0)

    **Returns:**
    - List of guests matching criteria
    - Total count for pagination

    **Example:**
    ```
    GET /api/guests?search=علی&limit=10
    GET /api/guests?limit=20&offset=20
    ```
    """
    queryset = Account.objects.filter(is_active=True).order_by("-id")

    # Apply search filter
    if search:
        queryset = queryset.filter(mobile__icontains=search) | queryset.filter(
            name__icontains=search
        )

    total_count = queryset.count()

    # Pagination
    guests_data = queryset[offset : offset + limit]

    guests = [
        GuestResponse(
            id=guest.id,
            mobile=guest.mobile,
            name=guest.name,
            is_active=guest.is_active,
        )
        for guest in guests_data
    ]

    return GuestListResponse(guests=guests, total_count=total_count)
