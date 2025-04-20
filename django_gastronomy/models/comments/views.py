from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Comment
from models.recipes.models import Recipe


@login_required  # Только авторизованные пользователи могут удалять комментарии
def delete_comment(request, comment_id):
    if request.method == 'POST':
        try:
            # Находим комментарий по ID
            comment = Comment.objects.get(id=comment_id)

            # Проверяем, что текущий пользователь является автором комментария
            if request.user != comment.user:
                return JsonResponse({'success': False, 'error': 'У вас нет прав для удаления этого комментария.'})

            # Удаляем комментарий
            comment.delete()

            return JsonResponse({'success': True})

        except Comment.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Комментарий не найден.'})
    else:
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса.'})


@login_required
def create_comment(request):
    if request.method == 'POST':
        # Получаем данные из POST-запроса
        recipe_id = request.POST.get('recipe_id')
        text = request.POST.get('text')
        image1 = request.FILES.get('image1')
        image2 = request.FILES.get('image2')

        # Проверяем обязательные поля
        if not recipe_id or not recipe_id.isdigit():
            return JsonResponse({'success': False, 'error': 'Некорректный ID рецепта.'}, status=400)

        if not text or text.strip() == '':
            return JsonResponse({'success': False, 'error': 'Текст комментария не может быть пустым.'}, status=400)

        # Находим рецепт по ID
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Рецепт не найден.'}, status=404)

        # Проверяем размеры изображений
        max_file_size = 10 * 1024 * 1024  # 10 МБ
        if image1 and image1.size > max_file_size:
            return JsonResponse({'success': False, 'error': 'Размер первого изображения превышает 10 МБ.'}, status=400)
        if image2 and image2.size > max_file_size:
            return JsonResponse({'success': False, 'error': 'Размер второго изображения превышает 10 МБ.'}, status=400)

        # Создаем комментарий
        try:
            comment = Comment.objects.create(
                user=request.user,
                recipe=recipe,
                text=text,
                image1=image1,
                image2=image2
            )
            return JsonResponse({
                'success': True,
                'message': 'Комментарий успешно добавлен.',
                'comment_id': comment.id
            }, status=201)
        except Exception as e:
            print(f"Ошибка при создании комментария: {e}")
            return JsonResponse({'success': False, 'error': f'Ошибка при добавлении комментария: {str(e)}'}, status=500)
    else:
        return JsonResponse({'success': False, 'error': 'Метод запроса не поддерживается.'}, status=405)