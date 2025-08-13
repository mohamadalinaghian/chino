import nested_admin
from ..models import RecipeComponent
from django.contrib import admin


class RecipeComponentInline(nested_admin.NestedTabularInline):
    model = RecipeComponent
    extra = 0
    fields = ("component", "quantity", "note")
