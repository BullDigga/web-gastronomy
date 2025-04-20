from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from models.users.models import User
from models.recipes.models import Recipe

class Rate(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rates',
        verbose_name='пользователь'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='rates',
        verbose_name='рецепт'
    )
    value = models.PositiveSmallIntegerField(
        'оценка',
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        verbose_name = 'оценка'
        verbose_name_plural = 'оценки'
        db_table = 'rates'
        unique_together = ('user', 'recipe')

    def __str__(self):
        return f"{self.value}/5 от {self.user.email} к {self.recipe.title}"