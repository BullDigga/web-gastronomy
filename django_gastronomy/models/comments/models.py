from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from models.users.models import User
from models.recipes.models import Recipe


class Comment(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='пользователь'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='рецепт'
    )
    text = models.TextField(
        'текст комментария',
        max_length=5000  # Увеличиваем максимальную длину до 500 символов
    )

    # Поле для времени публикации
    created_at = models.DateTimeField(
        auto_now_add=True,  # Автоматически устанавливается при создании объекта
        verbose_name='время публикации'
    )

    # Поле для связи с родительским комментарием (ответ на комментарий)
    parent_comment = models.ForeignKey(
        'self',  # Рекурсивная связь: ссылка на ту же модель
        on_delete=models.SET_NULL,  # Если родительский комментарий удален, поле становится NULL
        null=True,
        blank=True,
        related_name='replies',  # Используется для доступа к ответам через родительский комментарий
        verbose_name='родительский комментарий'
    )

    class Meta:
        verbose_name = 'комментарий'
        verbose_name_plural = 'комментарии'
        db_table = 'comments'

    def __str__(self):
        return f"Комментарий от {self.user.email} к {self.recipe.title}"

    def get_level(self):
        level = 0
        current = self
        while current.parent_comment:
            level += 1
            current = current.parent_comment
        return level

    @property
    def image1(self):
        if hasattr(self, 'images_info') and self.images_info.image1:
            return self.images_info.image1.url
        return None

    @property
    def image2(self):
        if hasattr(self, 'images_info') and self.images_info.image2:
            return self.images_info.image2.url
        return None

    @property
    def image1_compressed(self):
        if hasattr(self, 'images_info') and self.images_info.image1_compressed:
            return self.images_info.image1_compressed.url
        return None

    @property
    def image2_compressed(self):
        if hasattr(self, 'images_info') and self.images_info.image2_compressed:
            return self.images_info.image2_compressed.url
        return None