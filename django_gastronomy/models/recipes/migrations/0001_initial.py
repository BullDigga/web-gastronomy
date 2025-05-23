# Generated by Django 5.1.6 on 2025-04-14 14:43

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Recipe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=256, verbose_name='название')),
                ('description', models.TextField(verbose_name='описание')),
                ('status', models.CharField(choices=[('moderating', 'На модерации'), ('published', 'Опубликован'), ('rejected', 'Отклонен')], default='moderating', max_length=16, verbose_name='статус модерации')),
                ('publish_date', models.DateTimeField(blank=True, help_text="Дата публикации рецепта (заполняется автоматически при статусе 'published')", null=True, verbose_name='дата публикации')),
                ('main_picture', models.ImageField(blank=True, help_text='Основное изображение рецепта', null=True, upload_to='recipe_images/main_recipe_images/', verbose_name='основное изображение')),
                ('main_picture_compressed', models.ImageField(blank=True, help_text='Сжатая версия основного изображения рецепта', null=True, upload_to='recipe_images/main_recipe_images_compressed/', verbose_name='сжатое основное изображение')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipes', to=settings.AUTH_USER_MODEL, verbose_name='автор')),
            ],
            options={
                'verbose_name': 'рецепт',
                'verbose_name_plural': 'рецепты',
                'db_table': 'recipes',
            },
        ),
    ]
