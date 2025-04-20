from django.db import models

class Unit(models.Model):
    # Поле id создается автоматически.
    name = models.CharField(max_length=100, unique=True, verbose_name="Единица измерения")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Единица измерения"
        verbose_name_plural = "Единицы измерения"
        db_table = 'units'