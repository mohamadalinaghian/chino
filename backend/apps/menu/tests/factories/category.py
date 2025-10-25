import factory
from apps.menu.models import MenuCategory
from factory import fuzzy
from factory.django import DjangoModelFactory
from slugify import slugify


class MenuCategoryFactory(DjangoModelFactory):
    class Meta:
        model = MenuCategory

    parent_group = fuzzy.FuzzyChoice(
        [choice[0] for choice in MenuCategory.Group.choices]
    )
    title = factory.Sequence(lambda n: f"Category {n}")
    description = fuzzy.FuzzyText(length=100)
    # slug is auto-set in save(), but we can explicitly set it here for consistency
    slug = factory.LazyAttribute(
        lambda obj: slugify(obj.title, separator="-", allow_unicode=True)
    )
