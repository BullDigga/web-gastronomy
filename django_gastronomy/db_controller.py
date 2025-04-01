import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_gastronomy.settings')
django.setup()

from django.contrib.auth.models import User
from recipes.models import Recipe


def create_recipe(
        title,
        description,
        instruction,
        author_username,
        email,
        status='moderating'
):
    """
    Создает новый рецепт в базе данных.

    :param title: Название рецепта (str)
    :param description: Описание рецепта (str)
    :param instruction: Инструкция по приготовлению (str)
    :param author_username: Имя пользователя-автора (str)
    :param email: Email автора (str, опционально)
    :param status: Статус рецепта (по умолчанию 'moderating')
    """

    # Получаем или создаем автора
    author, created = User.objects.get_or_create(
        username=author_username,
        defaults={'email': email}
    )

    # Создаем новый рецепт
    recipe = Recipe.objects.create(
        title=title,
        description=description,
        instruction=instruction,
        author=author,
        status=status
    )

    print(f"Рецепт добавлен: {recipe.title}, статус: {recipe.status}")