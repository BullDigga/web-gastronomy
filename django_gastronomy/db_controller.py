import os
import django

# Настройка окружения Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_gastronomy.settings')
django.setup()

from django.contrib.auth import get_user_model
from recipes.models import Recipe


def create_recipe(
        title,
        description,
        author_email,  # Используем email вместо username
        status='moderating',
        main_picture=None  # Добавляем опциональное поле для изображения
):
    """
    Создает новый рецепт в базе данных.

    :param title: Название рецепта (str)
    :param description: Описание рецепта (str)
    :param author_email: Email автора (str)
    :param status: Статус рецепта (по умолчанию 'moderating')
    :param main_picture_url: Ссылка на основное изображение (опционально)
    """
    # Получаем модель пользователя
    User = get_user_model()

    # Получаем или создаем автора
    author, created = User.objects.get_or_create(
        email=author_email,  # Используем email вместо username
        defaults={'username': author_email.split('@')[0]}  # Генерируем username из email
    )

    # Проверяем допустимость статуса
    valid_statuses = [choice[0] for choice in Recipe.STATUS_CHOICES]
    if status not in valid_statuses:
        raise ValueError(f"Недопустимый статус: {status}. Допустимые значения: {valid_statuses}")

    # Создаем новый рецепт
    recipe = Recipe.objects.create(
        title=title,
        description=description,
        author=author,
        status=status,
        main_picture=main_picture  # Добавляем изображение, если оно передано
    )

    print(f"Рецепт добавлен: {recipe.title}, статус: {recipe.status}")


if __name__ == '__main__':
    create_recipe(
        title="4Тыквенный суп-пюре с имбирём и кокосовым молоком",
        description="Ароматный и согревающий суп с нежной текстурой, сладковатым вкусом тыквы и острой ноткой имбиря.",
        author_email="kolya.spiridonov.2003@gmail.com",
        status="published",
        main_picture="D:/web-gastronomy/django_gastronomy/media/ryba-eda-blyudo.jpg"
    )