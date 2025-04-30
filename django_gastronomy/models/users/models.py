from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import date
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

from models.user_avatars.models import UserAvatar


class UserManager(BaseUserManager):
    '''
    Отвечает за создание пользователей и суперпользователей.
    '''
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError(_('The email must be set'))
        elif not password:
            raise ValueError(_('The password must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)  # Убираем password из model()
        user.set_password(password)  # Хэшируем пароль
        user.save(using=self._db)  # Сохраняем пользователя
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    GENDER_CHOICES = (
        ('M', _('Male')),
        ('F', _('Female')),
    )

    # Основные поля
    email = models.EmailField(
        _('email address'),
        unique=True,
        error_messages={
            'unique': _('A user with that email already exists.'),
        },
    )
    username = models.CharField(_('username'), max_length=256, blank=True)
    is_blocked = models.BooleanField(_('blocked'), default=False)
    is_admin = models.BooleanField(_('admin status'), default=False)

    # Новые поля для ФИО
    first_name = models.CharField(_('first name'), max_length=150, blank=True, null=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True, null=True)
    middle_name = models.CharField(_('middle name'), max_length=150, blank=True, null=True)

    # Поле для даты регистрации
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    # Другие поля
    gender = models.CharField(
        _('gender'),
        max_length=1,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        help_text=_('Gender of the user (Male or Female).')
    )
    date_of_birth = models.DateField(
        _('date of birth'),
        blank=True,
        null=True,
        help_text=_('The user\'s date of birth.')
    )
    country = models.CharField(
        _('country'),
        max_length=100,
        blank=True,
        null=True,
        help_text=_('The country where the user resides.')
    )

    about = models.TextField(
        _('about'),
        blank=True,
        null=True,
        help_text=_('Brief information about the user.')
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        db_table = 'users'

    def __str__(self):
        return self.email

    def block(self):
        """Блокировка пользователя с удалением контента"""
        self.is_blocked = True
        self.recipes.all().delete()  # Удаляем рецепты
        self.comments.all().delete()  # Удаляем комментарии
        self.favorites.all().delete()  # Удаляем избранное
        self.rates.all().delete()  # Удаляем оценки
        self.save()

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        age = today.year - self.date_of_birth.year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            age -= 1
        return age

    def get_avatar_url(self):
        try:
            return self.user_avatar.avatar.url if self.user_avatar.avatar else None
        except UserAvatar.DoesNotExist:
            return None

    def get_compressed_avatar_url(self):
        try:
            return self.user_avatar.avatar_compressed.url if self.user_avatar.avatar_compressed else None
        except UserAvatar.DoesNotExist:
            return None

    def get_thumbnail_url(self):
        try:
            return self.user_avatar.thumbnail.url if self.user_avatar.thumbnail else None
        except UserAvatar.DoesNotExist:
            return None