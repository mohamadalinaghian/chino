"""

Custom authentication backend for mobile-based login.



This backend allows authentication using mobile number instead of username,

which is required because the Account model uses 'mobile' as USERNAME_FIELD.

"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class MobileBackend(ModelBackend):
    """

    Authenticate using mobile number instead of username.



    This maintains compatibility with Django's authenticate() function signature

    while allowing mobile-based authentication.

    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """

        Authenticate by mobile number.

        Args:

            request: HttpRequest object (can be None)

            username: Actually contains the mobile number (for signature compatibility)

            password: User's password

            **kwargs: Additional keyword arguments
        Returns:

            User instance if authentication succeeds, None otherwise.
        """

        if username is None or password is None:
            return None

        try:
            # Lookup user by mobile number

            user = User.objects.get(mobile=username)

        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing attacks

            # This prevents attackers from determining if a mobile exists

            User().set_password(password)

            return None

        # Verify password and check if user can authenticate

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def get_user(self, user_id):
        """
         Get a user by their ID.
        This method is required by Django's authentication system.
        """

        try:
            user = User.objects.get(pk=user_id)

        except User.DoesNotExist:
            return None

        return user if self.user_can_authenticate(user) else None
