from django.db import models

class Ingredient(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Название ингредиента")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Ингредиент"
        verbose_name_plural = "Ингредиенты"
        db_table = 'ingredients'