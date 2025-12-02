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
        fields = ("title", "description")


class MenuSerializer(serializers.ModelSerializer):
    category = MenuCategorySerializer()
    images = ImageSerializer(many=True)
    thumbnail = serializers.ImageField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = (
            "name",
            "price",
            "description",
            "is_available",
            "thumbnail",
            "images",
            "category",
        )

    def get_name(self, obj):
        return obj.name.name


#####
# For SALE operations.serializers
#####


class MenuItemSaleListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for sale operations.
    Returns only essential fields for item selection.
    """

    name = serializers.CharField(source="name.name", read_only=True)
    category = serializers.CharField(source="category.title", read_only=True)

    class Meta:
        model = Menu
        fields = ("id", "name", "price", "category")
        read_only_fields = (
            "id",
            "name",
            "price",
            "category",
        )
