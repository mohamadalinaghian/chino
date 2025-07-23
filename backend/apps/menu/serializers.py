from apps.menu.models import Menu, MenuCategory
from apps.utils.models import Image
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
    thumbnail = serializers.SerializerMethodField()

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

    def get_thumbnail(self, obj):
        return obj.thumbnail.url if obj.thumbnail else None
