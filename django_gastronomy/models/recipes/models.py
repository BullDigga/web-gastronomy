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

    class Meta:
        verbose_name = 'рецепт'
        verbose_name_plural = 'рецепты'
        db_table = 'recipes'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.publish_date:
            self.publish_date = timezone.now()
        super().save(*args, **kwargs)

    def average_rating(self):
        """Средний рейтинг рецепта (UC-7)"""
        avg = self.rates.aggregate(models.Avg('value'))['value__avg']
        return float(avg) if avg is not None else 0.0

    def comments_count(self):
        """Количество комментариев (UC-6)"""
        return self.comments.count()

    def ratings_count(self):
        """Количество оценок рецепта"""
        return self.rates.count()

    def get_title_lower(self):
        """Возвращает название рецепта в нижнем регистре."""
        return self.title.lower()

    def get_description_lower(self):
        """Возвращает описание рецепта в нижнем регистре."""
        return self.description.lower()

    @property
    def main_picture(self):
        """Геттер для основного изображения"""
        if hasattr(self, 'main_image_info') and self.main_image_info.main_image:
            return self.main_image_info.main_image
        return None

    @property
    def main_picture_compressed(self):
        """Геттер для сжатого изображения"""
        if hasattr(self, 'main_image_info') and self.main_image_info.main_image_compressed:
            return self.main_image_info.main_image_compressed
        return None