from django_code.apps.menu.models import Menu, MenuCategory
from django_code.apps.utils.models import Image
from rest_framework import serializers


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ("title", "alt_text", "image")


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ("title",)


class MenuSerializer(serializers.ModelSerializer):
    category = MenuCategorySerializer()
    images = ImageSerializer(many=True)
    thumbnail = serializers.ImageField()

    class Meta:
        model = Menu
        fields = (
            "title",
            "price",
            "description",
            "is_available",
            "thumbnail",
            "images",
            "category",
        )
