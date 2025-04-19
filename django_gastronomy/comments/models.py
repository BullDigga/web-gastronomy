from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from users.models import User
from recipes.models import Recipe


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

    # Основные изображения
    image1 = models.ImageField(
        max_length=500,
        upload_to='comment_images/',
        blank=True,
        null=True,
        verbose_name='изображение 1'
    )
    image2 = models.ImageField(
        max_length=500,
        upload_to='comment_images/',
        blank=True,
        null=True,
        verbose_name='изображение 2'
    )

    # Сжатые версии изображений
    image1_compressed = models.ImageField(
        max_length=500,
        upload_to='comment_images/compressed/',
        blank=True,
        null=True,
        verbose_name='сжатое изображение 1'
    )
    image2_compressed = models.ImageField(
        max_length=500,
        upload_to='comment_images/compressed/',
        blank=True,
        null=True,
        verbose_name='сжатое изображение 2'
    )

    class Meta:
        verbose_name = 'комментарий'
        verbose_name_plural = 'комментарии'
        db_table = 'comments'

    def __str__(self):
        return f"Комментарий от {self.user.email} к {self.recipe.title}"

    def save(self, *args, **kwargs):
        """
        Переопределенный метод save для обработки и сжатия изображений.
        """
        needs_save = False  # Флаг для определения необходимости сохранения объекта

        # Обработка первого изображения
        if self.image1 and not self.image1_compressed:
            try:
                img = Image.open(self.image1)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Создаем сжатую версию изображения
                output_size = (600, 450)  # Размер миниатюры (4:3 пропорция)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                # Сохраняем сжатое изображение
                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                # Генерируем уникальное имя файла
                compressed_filename = f'compressed_{self.image1.name.split("/")[-1]}'

                # Сохраняем сжатое изображение в медиа-директорию
                file_path = default_storage.save(
                    f'comment_images/compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                # Сохраняем путь к сжатому изображению
                self.image1_compressed = file_path

                # Устанавливаем флаг, чтобы сохранить объект после обработки изображения
                needs_save = True

            except Exception as e:
                # Логирование ошибок, если изображение не удалось обработать
                print(f"Ошибка при обработке изображения 1: {e}")

        # Обработка второго изображения
        if self.image2 and not self.image2_compressed:
            try:
                img = Image.open(self.image2)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Создаем сжатую версию изображения
                output_size = (600, 450)  # Размер миниатюры (4:3 пропорция)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                # Сохраняем сжатое изображение
                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                # Генерируем уникальное имя файла
                compressed_filename = f'compressed_{self.image2.name.split("/")[-1]}'

                # Сохраняем сжатое изображение в медиа-директорию
                file_path = default_storage.save(
                    f'comment_images/compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                # Сохраняем путь к сжатому изображению
                self.image2_compressed = file_path

                # Устанавливаем флаг, чтобы сохранить объект после обработки изображения
                needs_save = True

            except Exception as e:
                # Логирование ошибок, если изображение не удалось обработать
                print(f"Ошибка при обработке изображения 2: {e}")


        # Всегда вызываем родительский метод save
        super().save(*args, **kwargs)