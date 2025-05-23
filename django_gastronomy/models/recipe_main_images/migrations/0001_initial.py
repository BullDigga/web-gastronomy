# Generated by Django 5.1.6 on 2025-04-30 12:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('recipes', '0003_remove_recipe_main_picture_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='RecipeMainImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('main_image', models.ImageField(blank=True, max_length=500, null=True, upload_to='recipe_images/main_recipe_images/', verbose_name='основное изображение')),
                ('main_image_compressed', models.ImageField(blank=True, max_length=500, null=True, upload_to='recipe_images/main_recipe_images_compressed/', verbose_name='сжатое основное изображение')),
                ('recipe', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='main_image_info', to='recipes.recipe', verbose_name='рецепт')),
            ],
            options={
                'verbose_name': 'основное изображение рецепта',
                'verbose_name_plural': 'основные изображения рецептов',
                'db_table': 'recipe_main_images',
            },
        ),
    ]
