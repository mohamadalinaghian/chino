# api/router.py
from ninja import NinjaAPI

from .endpoints import auth_endpoints, menu_endpoints, menu_pdf_endpoints

api = NinjaAPI(
    title="Cafe API",
    version="1.0",
    description="API for cafe inventory and production system",
    urls_namespace="api_v1",
    docs_url="docs",
)

# Register auth endpoints under /auth/
api.add_router("/auth/", auth_endpoints.router)
api.add_router("/menu/", menu_endpoints.router_menu_display)
api.add_router("/menu/", menu_pdf_endpoints.router_menu_pdf)
