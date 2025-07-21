from django_code.apps.user.models import Account, Profile
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from jalali_date.admin import ModelAdminJalaliMixin
from jalali_date.widgets import AdminJalaliDateWidget


class AccountCreationForm(forms.ModelForm):
    password1 = forms.CharField(label=_("Password"), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_("Confirm password"), widget=forms.PasswordInput)

    class Meta:
        model = Account
        fields = ("mobile", "name")

    def clean_password2(self):
        if self.cleaned_data["password1"] != self.cleaned_data["password2"]:
            raise forms.ValidationError("Passwords don't match")
        return self.cleaned_data["password2"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class AccountChangeForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ("mobile", "name", "is_active", "is_staff", "is_superuser")


class ProfileAdminForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = "__all__"
        widgets = {
            "birth_date": AdminJalaliDateWidget,  # ⬅️ استفاده از ویجت شمسی
        }


class ProfileInline(admin.StackedInline):
    model = Profile
    form = ProfileAdminForm
    can_delete = False
    verbose_name_plural = "Profile"
    fk_name = "user"


@admin.register(Account)
class AccountAdmin(BaseUserAdmin):
    form = AccountChangeForm
    add_form = AccountCreationForm
    inlines = (ProfileInline,)

    list_display = ("mobile", "name", "is_staff", "is_superuser", "created_at")
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("mobile", "name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("mobile", "password")}),
        (_("Personal info"), {"fields": ("name",)}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "mobile",
                    "name",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
    )

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)


@admin.register(Profile)
class ProfileAdmin(ModelAdminJalaliMixin, admin.ModelAdmin):
    form = ProfileAdminForm
    list_display = ("user", "email", "birth_date", "sex", "is_email_verified")
    search_fields = ("user__mobile", "user__name", "email", "address")
    list_filter = ("sex", "is_email_verified")
