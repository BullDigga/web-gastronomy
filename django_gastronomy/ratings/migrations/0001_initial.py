# Generated by Django 5.1.6 on 2025-03-06 21:00

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('recipes', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Rate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)], verbose_name='оценка')),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rates', to='recipes.recipe', verbose_name='рецепт')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rates', to='users.user', verbose_name='пользователь')),
            ],
            options={
                'verbose_name': 'оценка',
                'verbose_name_plural': 'оценки',
                'db_table': 'rates',
                'unique_together': {('user', 'recipe')},
            },
        ),
    ]
