from django.db import models
from models.recipes.models import Recipe
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

    def __str__(self):
        return f"Шаг {self.step_number} для рецепта {self.recipe.title}"

    class Meta:
        verbose_name = "Инструкция"
        verbose_name_plural = "Инструкции"
        ordering = ['step_number']  # Сортировка по номеру шага
        db_table = 'instructions'
        constraints = [
            models.UniqueConstraint(fields=['recipe', 'step_number'], name='unique_recipe_step')
        ]



    def get_image_obj(self):
        """
        Возвращает первый связанный объект InstructionImage или None.
        Предполагается, что у инструкции должно быть 0 или 1 изображение.
        """
        print("get_image_obj")
        return self.images.first()  # related_name='images'

    def get_image_url(self):
        """
        Возвращает URL оригинального изображения или None.
        """
        image_obj = self.get_image_obj()
        return image_obj.image.url if image_obj and image_obj.image else None

    def get_compressed_image_url(self):
        """
        Возвращает URL сжатого изображения или None.
        """
        image_obj = self.get_image_obj()
        return image_obj.image_compressed.url if image_obj and image_obj.image_compressed else None