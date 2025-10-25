import factory
from apps.utils.models import Image
from django.utils import timezone
from factory.django import DjangoModelFactory, ImageField


class ImageFactory(DjangoModelFactory):
    class Meta:
        model = Image

    title = factory.Sequence(lambda n: f"Image {n}")
    alt_text = factory.Faker("sentence", nb_words=5)
    image = ImageField(
        color="green", width=800, height=600, format="JPEG"
    )  # Will be processed to WEBP in save()
    created_at = factory.LazyFunction(timezone.now)
