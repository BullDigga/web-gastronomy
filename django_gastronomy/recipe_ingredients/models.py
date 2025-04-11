from django.db import models
from recipes.models import Recipe
from ingredients.models import Ingredient
from units.models import Unit

class RecipeIngredient(models.Model):
    # Связь с рецептом (ForeignKey на модель Recipe)
    recipe = models.ForeignKey(
        Recipe,  # Указываем имя модели Recipe (даже если она ещё не создана)
        on_delete=models.CASCADE,
        related_name='ingredients',
        verbose_name="Рецепт"
    )

    # Связь с ингредиентом (ForeignKey на модель Ingredient)
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        verbose_name="Ингредиент"
    )

    # Связь с единицей измерения (ForeignKey на модель Unit)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,  # Если единица измерения удалена, оставляем NULL
        null=True,
        blank=True,
        verbose_name="Единица измерения"
    )

    # Количество ингредиента
    quantity = models.DecimalField(
        max_digits=10,  # Максимальное количество цифр (включая дробную часть)
        decimal_places=2,  # Количество знаков после запятой
        verbose_name="Количество"
    )

    def __str__(self):
        return f"{self.quantity} {self.unit} of {self.ingredient} for {self.recipe}"

    class Meta:
        verbose_name = "Ингредиент рецепта"
        verbose_name_plural = "Ингредиенты рецептов"
        db_table = 'recipe_ingredients'