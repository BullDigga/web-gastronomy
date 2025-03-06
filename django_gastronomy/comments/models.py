from django.db import models
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
    text = models.TextField('текст комментария')

    class Meta:
        verbose_name = 'комментарий'
        verbose_name_plural = 'комментарии'
        db_table = 'comments'

    def __str__(self):
        return f"Комментарий от {self.user.email} к {self.recipe.title}"