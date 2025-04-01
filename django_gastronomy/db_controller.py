import os
import django

# Настройка окружения Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE',
                      'django_gastronomy.settings')  # Замени 'django_gastronomy' на имя твоего проекта
django.setup()

from django.contrib.auth import get_user_model
from recipes.models import Recipe


def create_recipe(
        title,
        description,
        instruction,
        author_email,  # Используем email вместо username
        status='moderating'
):
    """
    Создает новый рецепт в базе данных.

    :param title: Название рецепта (str)
    :param description: Описание рецепта (str)
    :param instruction: Инструкция по приготовлению (str)
    :param author_email: Email автора (str)
    :param status: Статус рецепта (по умолчанию 'moderating')
    """
    # Получаем модель пользователя
    User = get_user_model()

    # Получаем или создаем автора
    author, created = User.objects.get_or_create(
        email=author_email,  # Используем email вместо username
        defaults={'username': author_email.split('@')[0]}  # Генерируем username из email
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


if __name__ == '__main__':
    create_recipe(
        title="Шоколадный торт",
        description="Нежный и ароматный торт с шоколадной глазурью.",
        instruction=(
            "1. Разогрейте духовку до 180°C.\n"
            "2. В миске смешайте муку, какао, сахар, разрыхлитель и соль.\n"
            "3. Добавьте яйца, молоко и растительное масло. Тщательно перемешайте.\n"
            "4. Вылейте тесто в форму и выпекайте 30–35 минут.\n"
            "5. Приготовьте шоколадную глазурь: растопите шоколад с сливками.\n"
            "6. Полейте остывший торт глазурью и дайте застыть."
        ),
        author_email="jane.doe@example.com",  # Автор
        status="published"
    )