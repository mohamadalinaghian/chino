from apps.user.models import Profile
from django import forms
from django.contrib import admin
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget


class ProfileAdminForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = "__all__"
        widgets = {
            "birth_date": AdminJalaliDateWidget,
        }


class ProfileInline(admin.StackedInline):
    model = Profile
    form = ProfileAdminForm
    can_delete = False
    verbose_name_plural = "Profile"
    fk_name = "user"


@admin.register(Profile)
class ProfileAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = ProfileAdminForm
    list_display = ("user", "email", "birth_date", "sex", "is_email_verified")
    search_fields = ("user__mobile", "user__name", "email", "address")
    list_filter = ("sex", "is_email_verified")
