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
        title="Тыквенный суп-пюре с имбирём и кокосовым молоком",
        description="Ароматный и согревающий суп с нежной текстурой, сладковатым вкусом тыквы и острой ноткой имбиря.",
        instruction=(
            "1. Очистите тыкву от кожуры и семян, нарежьте её на небольшие кубики.\n"
            "2. Разогрейте оливковое масло на сковороде и обжарьте измельчённый лук и чеснок до мягкости (2–3 минуты).\n"
            "3. Добавьте тыкву и тёртый имбирь, перемешайте и готовьте ещё 5 минут.\n"
            "4. Влейте кокосовое молоко и бульон, доведите до кипения, затем уменьшите огонь и варите 20–25 минут до мягкости тыквы.\n"
            "5. С помощью блендера измельчите всё в однородное пюре.\n"
            "6. Приправьте солью, перцем и щепоткой мускатного ореха по вкусу.\n"
            "7. Подавайте горячим, украсив жареными тыквенными семечками или каплей кокосового молока."
        ),
        author_email="2@2.2",  # Автор
        status="published"
    )