# api/router.py
from ninja import NinjaAPI

from .endpoints import auth_endpoints  # ← Fixed: removed 'as auth_endpoints'

api = NinjaAPI(
    title="Cafe API",
    version="1.0",
    description="API for cafe inventory and production system",
    urls_namespace="api_v1",
    docs_url="docs",
)

# Register auth endpoints under /auth/
api.add_router("/auth/", auth_endpoints.router)
