from django.db import models
from recipes.models import Recipe

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

    # Ссылка на изображение (опционально)
    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Ссылка на изображение"
    )

    def __str__(self):
        return f"Шаг {self.step_number} для рецепта {self.recipe.name}"

    class Meta:
        verbose_name = "Инструкция"
        verbose_name_plural = "Инструкции"
        ordering = ['step_number']  # Сортировка по номеру шага
        db_table = 'instructions'