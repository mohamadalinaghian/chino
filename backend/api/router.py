from ninja import NinjaAPI

from .menu.controllers import menu_router

api = NinjaAPI(title="Chino API", version="1.0.0")

# Mount menu endpoints
api.add_router("/menu", menu_router)
