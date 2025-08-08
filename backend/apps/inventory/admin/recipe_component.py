from django.contrib import admin
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory
from apps.inventory.models import RecipeComponent


@admin.register(RecipeComponent)
class RecipeComponentAdmin(TreeAdmin):
    form = movenodeform_factory(RecipeComponent)
