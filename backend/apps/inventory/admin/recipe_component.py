from django.contrib import admin

from ..models import RecipeComponent


class RecipeComponentInline(admin.TabularInline):
    model = RecipeComponent
    extra = 0
