"""
Guest Management Schemas

Handles guest (customer) operations:
- Search guests by mobile number
- Quick-create guests for walk-ins
- List guests for selection
"""

from ninja import Schema
from pydantic import Field, validator


class GuestSearchRequest(Schema):
    """
    Search for guest by mobile number

    Used when staff enters a mobile number to find existing guest.
    """

    mobile: str = Field(
        ...,
        min_length=11,
        max_length=11,
        description="Mobile number in format 09XXXXXXXXX",
    )

    @validator("mobile")
    def validate_mobile_format(cls, v):
        """Validate mobile number format"""
        if not v.startswith("09") or not v.isdigit():
            raise ValueError("Mobile must start with 09 and contain only digits")
        if len(v) != 11:
            raise ValueError("Mobile must be exactly 11 digits")
        return v


class GuestQuickCreateRequest(Schema):
    """
    Quick-create a guest with minimal information

    Used for walk-in customers who don't have an account yet.
    No password required - this is for staff to track guest info only.
    """

    mobile: str = Field(
        ...,
        min_length=11,
        max_length=11,
        description="Mobile number in format 09XXXXXXXXX",
    )
    name: str = Field(
        ..., min_length=2, max_length=50, description="Guest's full name"
    )

    @validator("mobile")
    def validate_mobile_format(cls, v):
        """Validate mobile number format"""
        if not v.startswith("09") or not v.isdigit():
            raise ValueError("Mobile must start with 09 and contain only digits")
        if len(v) != 11:
            raise ValueError("Mobile must be exactly 11 digits")
        return v

    @validator("name")
    def validate_name(cls, v):
        """Validate name is not empty or whitespace only"""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class GuestResponse(Schema):
    """
    Guest information response

    Returned when searching or creating a guest.
    """

    id: int = Field(..., description="Guest account ID")
    mobile: str = Field(..., description="Mobile number")
    name: str = Field(..., description="Guest full name")
    is_active: bool = Field(..., description="Whether account is active")


class GuestListResponse(Schema):
    """
    List of guests response

    Used for dropdown/autocomplete in guest selection.
    """

    guests: list[GuestResponse]
    total_count: int = Field(..., description="Total number of guests")
