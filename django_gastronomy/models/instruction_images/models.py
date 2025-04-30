# models/instruction_image.py

from django.db import models
from models.instructions.models import Instruction
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


class InstructionImage(models.Model):
    instruction = models.ForeignKey(
        Instruction,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="Инструкция",
        primary_key = True
    )

    image = models.ImageField(
        upload_to='recipe_images/instruction_recipe_images/',
        blank=True,
        null=True,
        max_length=500,
        verbose_name="Изображение"
    )

    image_compressed = models.ImageField(
        upload_to='recipe_images/instruction_recipe_images_compressed/',
        blank=True,
        null=True,
        max_length=500,
        verbose_name="Сжатое изображение"
    )

    def __str__(self):
        return f"Изображение для шага {self.instruction.step_number}"

    class Meta:
        verbose_name = "Изображение инструкции"
        verbose_name_plural = "Изображения инструкций"
        db_table = 'instruction_images'

    def save(self, *args, **kwargs):
        """
        Автоматическая генерация сжатой версии изображения.
        """
        if self.image and not self.image_compressed:
            try:
                img = Image.open(self.image)
                output_size = (300, 225)  # Размер миниатюры (4:3 пропорция)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                compressed_filename = f'compressed_{self.image.name.split("/")[-1]}'

                file_path = default_storage.save(
                    f'recipe_images/instruction_recipe_images_compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                self.image_compressed = file_path

            except Exception as e:
                print(f"Ошибка при обработке изображения: {e}")

        super().save(*args, **kwargs)