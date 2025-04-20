from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from .models import Recipe

@login_required
@csrf_exempt
def delete_recipe(request, recipe_id):
    """
    Вью для удаления рецепта.
    Только автор рецепта может удалить его.
    """
    if request.method == 'POST':
        # Получаем рецепт по ID
        recipe = get_object_or_404(Recipe, id=recipe_id)

        # Проверяем, является ли текущий пользователь автором рецепта
        if recipe.author != request.user:
            return JsonResponse({'status': 'error', 'message': 'Вы не являетесь автором этого рецепта.'}, status=403)

        # Удаляем рецепт
        recipe.delete()

        # Возвращаем успешный ответ
        return JsonResponse({'status': 'success', 'message': 'Рецепт успешно удален.'})

    # Если запрос не POST, возвращаем ошибку
    return JsonResponse({'status': 'error', 'message': 'Неверный метод запроса.'}, status=400)