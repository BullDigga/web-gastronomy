from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from models.recipes.models import Recipe
from models.favorites.models import Favorite



@login_required
def favorites_view(request):
    """
    View для просмотра списка избранных рецептов пользователя.
    """
    # Получаем текущего пользователя
    user = request.user

    # Проверяем, авторизован ли пользователь
    if not user.is_authenticated:
        return redirect('login')  # Перенаправляем на страницу входа

    # Получаем список ID избранных рецептов пользователя
    favorite_recipe_ids = Favorite.objects.filter(
        user=user
    ).values_list('recipe_id', flat=True)

    # Преобразуем все ID в строки для совместимости с шаблоном
    favorite_recipe_ids = [recipe_id for recipe_id in favorite_recipe_ids]

    # Получаем список избранных рецептов пользователя
    favorite_recipes = Recipe.objects.filter(
        id__in=favorite_recipe_ids,
        status='published'
    ).order_by('-id')  # Сортируем рецепты по дате создания (новые первыми)

    # Контекст для передачи данных в шаблон
    context = {
        'recipes': favorite_recipes,  # Список избранных рецептов
        'favorites': True,           # Флаг для отображения заголовка "Ваши избранные рецепты"
        'favorite_recipe_ids': favorite_recipe_ids,  # Список ID избранных рецептов
    }

    print('context: ', context)

    return render(request, 'recipes_list_view.html', context)


@login_required
@csrf_exempt
def toggle_favorite(request, recipe_id):
    User = get_user_model()

    try:
        # Получаем объект пользователя
        user = request.user._wrapped if hasattr(request.user, '_wrapped') else request.user

        # Проверяем, что user является экземпляром модели User
        if not isinstance(user, User):
            return JsonResponse({'success': False, 'error': 'Неверный тип пользователя.'})

        # Получаем рецепт
        recipe = get_object_or_404(Recipe, id=recipe_id)

        # Отладочный вывод
        print(f"User перед get_or_create: {user}, Type: {type(user)}")
        print(f"Recipe перед get_or_create: {recipe}, Type: {type(recipe)}")

        # Проверяем, есть ли рецепт в избранном у пользователя
        favorite, created = Favorite.objects.get_or_create(user=user, recipe=recipe)

        if not created:
            # Если рецепт уже в избранном, удаляем его
            favorite.delete()
            action = 'removed'
        else:
            # Если рецепт добавлен в избранное
            action = 'added'

        # Подсчитываем количество добавлений в избранное
        favorites_count = recipe.favorited_by.count()

        return JsonResponse({
            'success': True,
            'action': action,
            'favorites_count': favorites_count,  # Добавляем количество добавлений в избранное
        })

    except Exception as e:
        # Логируем ошибку
        print(f"Ошибка в toggle_favorite: {e}")
        return JsonResponse({'success': False, 'error': str(e)})