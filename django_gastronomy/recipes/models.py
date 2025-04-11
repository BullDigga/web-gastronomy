from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Recipe(models.Model):
    STATUS_CHOICES = [
        ('moderating', 'На модерации'),
        ('published', 'Опубликован'),
        ('rejected', 'Отклонен'),
    ]

    title = models.CharField('название', max_length=256)
    description = models.TextField('описание')

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Используем AUTH_USER_MODEL
        on_delete=models.CASCADE,
        related_name='recipes',
        verbose_name='автор'
    )

    status = models.CharField(
        'статус модерации',
        max_length=16,
        choices=STATUS_CHOICES,
        default='moderating'  # Убедитесь, что значение по умолчанию соответствует списку
    )

    publish_date = models.DateTimeField(
        'дата публикации',
        blank=True,
        null=True,  # Разрешает NULL в БД
        help_text="Дата публикации рецепта (заполняется автоматически при статусе 'published')"
    )

    main_picture_url = models.URLField(
        'основное изображение',
        max_length=500,
        blank=True,
        null=True,  # Разрешает NULL в БД
        help_text="Ссылка на основное изображение рецепта"
    )

    class Meta:
        verbose_name = 'рецепт'
        verbose_name_plural = 'рецепты'
        db_table = 'recipes'

    def __str__(self):
        return self.title

    def average_rating(self):
        """Средний рейтинг рецепта (UC-7)"""
        return self.rates.aggregate(models.Avg('value'))['value__avg'] or 0

    def comments_count(self):
        """Количество комментариев (UC-6)"""
        return self.comments.count()