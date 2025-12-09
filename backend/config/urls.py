from api.router import api
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.utils.translation import gettext_lazy as _

urlpatterns = [
    path("api/admin/", admin.site.urls),
    path("api/", api.urls),
]

admin.site.index_title = _("Chino Admin Panel")
admin.site.site_header = _("Chino Admin")
admin.site.site_title = _("Chino Admin")

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
