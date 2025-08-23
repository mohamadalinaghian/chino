from apps.utils.models import TimeStampedModel
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class AccountManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, mobile, name, password, **extra_fields):
        if not mobile:
            raise ValueError(_("The given mobile must be set"))
        user = self.model(mobile=mobile, name=name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def clean(self):
        if self.is_superuser and not self.is_staff:
            raise ValidationError(_("A superuser must also be staff."))

    def create_user(self, mobile, name, password=None, **extra_fields):
        extra_fields.setdefault("is_active", True)
        return self._create_user(mobile, name, password, **extra_fields)

    def create_superuser(self, mobile, name, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True")
        return self._create_user(mobile, name, password, **extra_fields)


class Account(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    This is base model for user that has crusial fields.
    """

    mobile_validate = RegexValidator(
        regex=r"^09\d{9}$",
        message=_("Mobile number must be in the format 09XXXXXXXXX"),
        code="invalid_mobile",
    )

    mobile = models.CharField(
        verbose_name=_("Mobile"),
        unique=True,
        db_index=True,
        validators=[mobile_validate],
        max_length=11,
    )
    name = models.CharField(max_length=50, verbose_name=_("Name"), db_index=True)
    slug = models.SlugField(
        max_length=50,
        unique=True,
        verbose_name=_("Slug"),
        db_index=True,
        editable=False,
    )

    is_active = models.BooleanField(default=True, verbose_name=_("Is Active?"))
    is_superuser = models.BooleanField(default=False, verbose_name=_("Is Superuser?"))
    is_staff = models.BooleanField(default=False, verbose_name=_("Is Staff?"))

    def save(self, *args, **kwargs):
        """
        Override save method to set slug.
        """
        if not self.slug:
            self.slug = slugify(self.mobile)
        super().save(*args, **kwargs)

    objects = AccountManager()

    USERNAME_FIELD = "mobile"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = _("User Account")
        verbose_name_plural = _("User Accounts")
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name}: {self.mobile}"

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name.split(" ")[0] if " " in self.name else self.name


class Profile(TimeStampedModel):
    """
    Extra info about user.
    """

    class Meta:
        verbose_name = _("Profile")
        verbose_name_plural = _("Profiles")

    SEX_CHOICES = ((True, _("Male")), (False, _("Female")))

    user = models.OneToOneField(
        to=Account,
        verbose_name=_("User"),
        on_delete=models.CASCADE,
        related_name="profile",
    )
    email = models.EmailField(
        verbose_name=_("Email"), blank=True, null=True, unique=True
    )
    is_email_verified = models.BooleanField(
        verbose_name=_("Is Email Verified?"), default=False
    )
    address = models.CharField(
        verbose_name=_("Address"), max_length=120, blank=True, null=True
    )
    birth_date = models.DateField(
        verbose_name=_("Birth Day"), blank=True, null=True, db_index=True
    )
    sex = models.BooleanField(
        verbose_name=_("Sex"),
        choices=SEX_CHOICES,
        default=True,
    )

    def __str__(self):
        return f"{self.user.name}: ({self.user.mobile})"
