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
    first_name = models.CharField(_('first name'), max_length=150, blank=True, null=True)  # Добавлено null=True
    last_name = models.CharField(_('last name'), max_length=150, blank=True, null=True)    # Добавлено null=True
    middle_name = models.CharField(_('middle name'), max_length=150, blank=True, null=True)  # Добавлено null=True

    # Поле для даты регистрации
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    # Добавляем новые поля
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
        null=True,  # Добавлено null=True
        help_text=_('The country where the user resides.')
    )

    # Поля для аватара
    avatar = models.ImageField(
        _('avatar'),
        upload_to='user_avatars/',
        max_length=500,
        blank=True,
        null=True,
        help_text=_('User avatar image.')
    )

    avatar_compressed = models.ImageField(
        _('compressed avatar'),
        upload_to='user_avatars/compressed/',
        max_length=500,
        blank=True,
        null=True,
        help_text=_('Compressed version of the user avatar.')
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

    def save(self, *args, **kwargs):
        """
        Автоматическая генерация сжатой версии аватара.
        """
        # Флаг для отслеживания, нужно ли сохранять объект после обработки изображения
        needs_save = False

        if self.avatar and not self.avatar_compressed:
            try:
                img = Image.open(self.avatar)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Создаем сжатую версию изображения
                output_size = (300, 300)  # Размер миниатюры (квадратное изображение)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                # Сохраняем сжатое изображение
                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                # Генерируем уникальное имя файла
                compressed_filename = f'compressed_{self.avatar.name.split("/")[-1]}'

                # Сохраняем сжатое изображение в медиа-директорию
                file_path = default_storage.save(
                    f'user_avatars/compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                # Сохраняем путь к сжатому изображению
                self.avatar_compressed = file_path

                # Устанавливаем флаг, чтобы сохранить объект после обработки изображения
                needs_save = True

            except Exception as e:
                # Логирование ошибок, если изображение не удалось обработать
                print(f"Ошибка при обработке аватара: {e}")

        # Сначала сохраняем объект (или обновляем его, если изображение было обработано)
        super().save(*args, **kwargs)

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

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        age = today.year - self.date_of_birth.year
        # Корректировка, если день рождения ещё не наступил в этом году
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            age -= 1
        return age