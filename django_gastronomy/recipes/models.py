from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.utils import timezone


class Recipe(models.Model):
    STATUS_CHOICES = [
        ('moderating', 'На модерации'),
        ('published', 'Опубликован'),
        ('rejected', 'Отклонен'),
    ]

    title = models.CharField('название', max_length=256)
    description = models.TextField('описание')

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recipes',
        verbose_name='автор'
    )

    status = models.CharField(
        'статус модерации',
        max_length=16,
        choices=STATUS_CHOICES,
        default='moderating'
    )

    publish_date = models.DateTimeField(
        'дата публикации',
        blank=True,
        null=True,
        help_text="Дата публикации рецепта (заполняется автоматически при статусе 'published')"
    )

    main_picture = models.ImageField(
        'основное изображение',
        upload_to='recipe_images/main_recipe_images/',
        blank=True,
        null=True,
        help_text="Основное изображение рецепта"
    )

    main_picture_compressed = models.ImageField(
        'сжатое основное изображение',
        upload_to='recipe_images/main_recipe_images_compressed/',
        blank=True,
        null=True,
        help_text="Сжатая версия основного изображения рецепта"
    )

    class Meta:
        verbose_name = 'рецепт'
        verbose_name_plural = 'рецепты'
        db_table = 'recipes'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """
        Автоматическая генерация сжатой версии основного изображения.
        """
        # Флаг для отслеживания, нужно ли сохранять объект после обработки изображения
        needs_save = False

        if self.status == 'published' and not self.publish_date:
            self.publish_date = timezone.now()

        if self.main_picture and not self.main_picture_compressed:
            try:
                # Открываем оригинальное изображение напрямую из медиа-файла
                img = Image.open(self.main_picture)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Создаем сжатую версию изображения
                output_size = (300, 225)  # Размер миниатюры (4:3 пропорция)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                # Сохраняем сжатое изображение
                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)  # Качество JPEG: 85%

                # Генерируем уникальное имя файла
                compressed_filename = f'compressed_{self.main_picture.name.split("/")[-1]}'

                # Сохраняем сжатое изображение в медиа-директорию
                file_path = default_storage.save(
                    f'recipe_images/main_recipe_images_compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                # Сохраняем путь к сжатому изображению
                self.main_picture_compressed = file_path

                # Устанавливаем флаг, чтобы сохранить объект после обработки изображения
                needs_save = True

            except Exception as e:
                # Логирование ошибок, если изображение не удалось обработать
                print(f"Ошибка при обработке изображения: {e}")

        # Сначала сохраняем объект (или обновляем его, если изображение было обработано)
        super().save(*args, **kwargs)

    def average_rating(self):
        """Средний рейтинг рецепта (UC-7)"""
        return self.rates.aggregate(models.Avg('value'))['value__avg'] or 0

    def comments_count(self):
        """Количество комментариев (UC-6)"""
        return self.comments.count()