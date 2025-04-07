from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

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
        # Удаляем связанные объекты при блокировке
        self.recipes.all().delete()  # Удаляем рецепты
        self.comments.all().delete()  # Удаляем комментарии
        self.favorites.all().delete()  # Удаляем избранное
        self.rates.all().delete()  # Удаляем оценки
        self.save()

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff