# Generated by Django 5.1.6 on 2025-04-11 13:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='recipe',
            name='instruction',
        ),
        migrations.AddField(
            model_name='recipe',
            name='main_picture_url',
            field=models.URLField(blank=True, help_text='Ссылка на основное изображение рецепта', max_length=500, null=True, verbose_name='основное изображение'),
        ),
        migrations.AddField(
            model_name='recipe',
            name='publish_date',
            field=models.DateTimeField(blank=True, help_text="Дата публикации рецепта (заполняется автоматически при статусе 'published')", null=True, verbose_name='дата публикации'),
        ),
        migrations.AlterField(
            model_name='recipe',
            name='status',
            field=models.CharField(choices=[('moderating', 'На модерации'), ('published', 'Опубликован'), ('rejected', 'Отклонен')], default='moderating', max_length=16, verbose_name='статус модерации'),
        ),
    ]
