from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.utils.translation import gettext_lazy as _

urlpatterns = [
    path("api/admin/", admin.site.urls),
    path("api/menu/", include("apps.menu.urls")),
    path("api/admin/_nested_admin/", include("nested_admin.urls")),
    path("ledger/", include("django_ledger.urls", namespace="django_ledger")),
]

admin.site.index_title = _("Chino Admin Panel")
admin.site.site_header = _("Chino Admin")
admin.site.site_title = _("Chino Admin")

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
