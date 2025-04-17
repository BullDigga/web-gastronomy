from django.db import models
from recipes.models import Recipe
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


class Instruction(models.Model):
    # Связь с рецептом (ForeignKey на модель Recipe)
    recipe = models.ForeignKey(
        Recipe,  # Указываем имя модели Recipe
        on_delete=models.CASCADE,
        related_name='instructions',
        verbose_name="Рецепт"
    )

    # Номер шага
    step_number = models.PositiveIntegerField(verbose_name="Номер шага")

    # Текст инструкции
    instruction_text = models.TextField(verbose_name="Текст инструкции")

    # Основное изображение
    image = models.ImageField(
        upload_to='recipe_images/instruction_recipe_images/',
        blank=True,
        null=True,
        max_length=500,  # Увеличиваем лимит до 500 символов
        verbose_name="Изображение"
    )

    # Сжатая версия изображения
    image_compressed = models.ImageField(
        upload_to='recipe_images/instruction_recipe_images_compressed/',
        blank=True,
        null=True,
        max_length=500,  # Увеличиваем лимит до 500 символов
        verbose_name="Сжатое изображение"
    )

    def __str__(self):
        return f"Шаг {self.step_number} для рецепта {self.recipe.title}"

    class Meta:
        verbose_name = "Инструкция"
        verbose_name_plural = "Инструкции"
        ordering = ['step_number']  # Сортировка по номеру шага
        db_table = 'instructions'

    def save(self, *args, **kwargs):
        """
        Автоматическая генерация сжатой версии изображения.
        """
        if self.image and not self.image_compressed:
            try:
                # Открываем оригинальное изображение
                img = Image.open(self.image)

                # Создаем сжатую версию изображения
                output_size = (300, 225)  # Размер миниатюры (4:3 пропорция)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                # Сохраняем сжатое изображение
                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)  # Качество JPEG: 85%

                # Генерируем уникальное имя файла
                compressed_filename = f'compressed_{self.image.name.split("/")[-1]}'

                # Сохраняем сжатое изображение в медиа-директорию
                file_path = default_storage.save(
                    f'recipe_images/instruction_recipe_images_compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                # Сохраняем путь к сжатому изображению
                self.image_compressed = file_path

            except Exception as e:
                # Логирование ошибок, если изображение не удалось обработать
                print(f"Ошибка при обработке изображения: {e}")

        # Сохраняем объект
        super().save(*args, **kwargs)