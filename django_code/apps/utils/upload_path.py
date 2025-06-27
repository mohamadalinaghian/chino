from datetime import datetime


def image_path(instance, filename):
    now = datetime.now()
    return f"images/{now.year}/{now.month:02}/{filename}"
