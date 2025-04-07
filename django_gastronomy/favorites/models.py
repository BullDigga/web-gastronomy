from django.db import models
from users.models import User
from recipes.models import Recipe

class Favorite(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name='пользователь'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='рецепт'
    )

    class Meta:
        verbose_name = 'избранный рецепт'
        verbose_name_plural = 'избранные рецепты'
        db_table = 'favorites'
        unique_together = ('user', 'recipe')

    def __str__(self):
        return f"{self.recipe.title} в избранном у {self.user.email}"