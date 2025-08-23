import pytest
from apps.inventory.models import Product

name = "product test"
type = Product.ProductType.RAW
is_expiry_traceable = False
is_stock_traceable = True
is_active = True
is_countable = False
note = "This is test note"


@pytest.fixture
def product():
    product = {
        "name": name,
        "type": type,
        "is_expiry_traceable": is_expiry_traceable,
        "is_active": is_active,
        "is_stock_traceable": is_expiry_traceable,
        "is_countable": is_countable,
        "note": note,
    }
    return product
