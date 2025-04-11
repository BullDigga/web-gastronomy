# Generated by Django 5.1.6 on 2025-04-11 13:48

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('recipes', '0002_remove_recipe_instruction_recipe_main_picture_url_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Instruction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('step_number', models.PositiveIntegerField(verbose_name='Номер шага')),
                ('instruction_text', models.TextField(verbose_name='Текст инструкции')),
                ('image_url', models.URLField(blank=True, max_length=500, null=True, verbose_name='Ссылка на изображение')),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='instructions', to='recipes.recipe', verbose_name='Рецепт')),
            ],
            options={
                'verbose_name': 'Инструкция',
                'verbose_name_plural': 'Инструкции',
                'ordering': ['step_number'],
            },
        ),
    ]
