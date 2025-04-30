# models/comment_images.py или comments/models.py

from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from models.comments.models import Comment


class CommentImages(models.Model):
    comment = models.OneToOneField(
        Comment,
        on_delete=models.CASCADE,
        related_name='images_info',
        verbose_name='комментарий',
        primary_key=True
    )
    image1 = models.ImageField(
        'изображение 1',
        max_length=500,
        upload_to='comment_images/',
        blank=True,
        null=True,
    )
    image2 = models.ImageField(
        'изображение 2',
        max_length=500,
        upload_to='comment_images/',
        blank=True,
        null=True,
    )
    image1_compressed = models.ImageField(
        'сжатое изображение 1',
        max_length=500,
        upload_to='comment_images/compressed/',
        blank=True,
        null=True,
    )
    image2_compressed = models.ImageField(
        'сжатое изображение 2',
        max_length=500,
        upload_to='comment_images/compressed/',
        blank=True,
        null=True,
    )



    class Meta:
        verbose_name = 'изображения комментария'
        verbose_name_plural = 'изображения комментариев'
        db_table = 'comment_images'

    def __str__(self):
        return f"Изображения для комментария {self.comment.id}"

    def save(self, *args, **kwargs):
        # Флаг для проверки необходимости сохранить объект после обработки
        needs_save = False

        # Обработка image1
        if self.image1 and not self.image1_compressed:
            try:
                img = Image.open(self.image1)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                output_size = (600, 450)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                compressed_filename = f'compressed_{self.image1.name.split("/")[-1]}'
                file_path = default_storage.save(
                    f'comment_images/compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )
                self.image1_compressed = file_path
                needs_save = True

            except Exception as e:
                print(f"Ошибка при обработке image1: {e}")

        # Обработка image2
        if self.image2 and not self.image2_compressed:
            try:
                img = Image.open(self.image2)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                output_size = (600, 450)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                compressed_filename = f'compressed_{self.image2.name.split("/")[-1]}'
                file_path = default_storage.save(
                    f'comment_images/compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )
                self.image2_compressed = file_path
                needs_save = True

            except Exception as e:
                print(f"Ошибка при обработке image2: {e}")

        super().save(*args, **kwargs)