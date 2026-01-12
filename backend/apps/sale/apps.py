from django.apps import AppConfig


class SaleConfig(AppConfig):
    name = "apps.sale"

    # def ready(self):
    #     from apps.sale.models import PrintQueue
    #     from django.contrib.auth.models import Permission
    #     from django.contrib.contenttypes.models import ContentType
    #
    #     ct = ContentType.objects.get_for_model(PrintQueue)
    #
    #     Permission.objects.get_or_create(
    #         codename="can_print_bar",
    #         name="Can poll BAR printer jobs",
    #         content_type=ct,
    #     )
    #
    #     Permission.objects.get_or_create(
    #         codename="can_print_kitchen",
    #         name="Can poll KITCHEN printer jobs",
    #         content_type=ct,
    #     )
