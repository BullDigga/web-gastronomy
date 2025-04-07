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
        title="Лимонный чизкейк с базиликом",
        description="Освежающий и нежный десерт с ярким лимонным вкусом и неожиданной ноткой базилика.",
        instruction=(
            "1. Раздробите песочное печенье в крошку и смешайте с растопленным сливочным маслом.\n"
            "2. Выложите смесь на дно формы, утрамбуйте и поставьте в холодильник на 30 минут.\n"
            "3. В большой миске смешайте творожный сыр, сметану и сахар до однородности.\n"
            "4. Добавьте яйца по одному, каждый раз тщательно перемешивая.\n"
            "5. Вмешайте лимонный сок, цедру и мелко нарезанный базилик.\n"
            "6. Вылейте начинку на подготовленную основу и выпекайте при 160°C 40–45 минут.\n"
            "7. Дайте чизкейку остыть, затем уберите в холодильник минимум на 4 часа.\n"
            "8. Украсьте листиками базилика и тонкими дольками лимона перед подачей."
        ),
        author_email="jane.doe@example.com",  # Автор
        status="published"
    )