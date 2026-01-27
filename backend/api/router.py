# api/router.py
from ninja import NinjaAPI

from .endpoints import (
    auth_endpoints,
    card_transfer_endpoints,
    core_setting_endpoints,
    guest_endpoints,
    menu_endpoints,
    menu_pdf_endpoints,
    print_queue_endpoints,
    report_endpoints,
    sale_endpoints,
    table_endpoints,
    user_endpoints,
)

api = NinjaAPI(
    title="Cafe API",
    version="1.0",
    description="API for cafe inventory and production system",
    urls_namespace="api_v1",
    docs_url="docs",
)

# Register auth endpoints under /auth/
api.add_router("/auth/", auth_endpoints.router)
api.add_router("/guests/", guest_endpoints.router_guest)
api.add_router("/menu/", menu_endpoints.router_menu_display)
api.add_router("/menu/", menu_pdf_endpoints.router_menu_pdf)
api.add_router("/print-queue/", print_queue_endpoints.router)
api.add_router("/sale/", sale_endpoints.router)
api.add_router("/settings/", core_setting_endpoints.router)
api.add_router("/user/", user_endpoints.router)
api.add_router("/table/", table_endpoints.router_table)
api.add_router("/report/", report_endpoints.router)
api.add_router("/card-transfers/", card_transfer_endpoints.router)
