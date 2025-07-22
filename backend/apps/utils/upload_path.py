from datetime import datetime
from uuid import uuid4


def image_path(instance, filename):
    now = datetime.now()
    unique_name = uuid4().hex[:12]
    return f"images/{now.year}/{now.month:02}/{now.day:02}/{unique_name}.webp"


def menu_thumbnail_path(instance, filename):
    now = datetime.now()
    unique_name = uuid4().hex[:12]
    return f"menu/thumbnails/{now.year}/{now.month:02}/{now.day:02}/{unique_name}.webp"
