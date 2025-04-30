# models/recipe_main_image.py или recipes/models.py

from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
from django.core.files.storage import default_storage


class RecipeMainImage(models.Model):
    recipe = models.OneToOneField(
        'recipes.Recipe',
        on_delete=models.CASCADE,
        related_name='main_image_info',
        verbose_name='рецепт',
        primary_key=True
    )
    main_image = models.ImageField(
        'основное изображение',
        upload_to='recipe_images/main_recipe_images/',
        max_length=500,
        blank=True,
        null=True,
    )
    main_image_compressed = models.ImageField(
        'сжатое основное изображение',
        upload_to='recipe_images/main_recipe_images_compressed/',
        max_length=500,
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = 'основное изображение рецепта'
        verbose_name_plural = 'основные изображения рецептов'
        db_table = 'recipe_main_images'

    def __str__(self):
        return f"Изображения для {self.recipe.title}"

    def save(self, *args, **kwargs):
        """
        При сохранении оригинального изображения автоматически создаёт сжатую версию.
        """
        if self.main_image and not self.main_image_compressed:
            try:
                img = Image.open(self.main_image)

                if img.mode != 'RGB':
                    img = img.convert('RGB')

                output_size = (900, 675)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=100)

                compressed_filename = f'compressed_{self.main_image.name.split("/")[-1]}'

                file_path = default_storage.save(
                    f'recipe_images/main_recipe_images_compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                self.main_image_compressed = file_path

            except Exception as e:
                print(f"Ошибка при обработке изображения: {e}")

        super().save(*args, **kwargs)