from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Comment
from models.recipes.models import Recipe
from django.views.decorators.http import require_POST
from django.db import transaction  # Для атомарных операций




@login_required  # Только авторизованные пользователи могут удалять комментарии
def delete_comment(request, comment_id):
    if request.method == 'POST':
        try:
            # Находим комментарий по ID
            comment = Comment.objects.get(id=comment_id)

            # Проверяем, что текущий пользователь является автором комментария
            if request.user != comment.user:
                return JsonResponse({'success': False, 'error': 'У вас нет прав для удаления этого комментария.'})

            # Удаляем комментарий и все его дочерние комментарии
            with transaction.atomic():  # Гарантируем атомарность операции
                delete_comment_and_replies(comment)

            return JsonResponse({'success': True})

        except Comment.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Комментарий не найден.'})
    else:
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса.'})


def delete_comment_and_replies(comment):
    """
    Рекурсивно удаляет комментарий и все его дочерние комментарии.
    """
    # Удаляем все дочерние комментарии
    for reply in comment.replies.all():
        delete_comment_and_replies(reply)

    # Удаляем сам комментарий
    comment.delete()


@login_required
@require_POST
def create_comment(request):
    # Получаем данные из POST-запроса
    recipe_id = request.POST.get('recipe_id')
    text = request.POST.get('text')
    image1 = request.FILES.get('image1')
    image2 = request.FILES.get('image2')
    parent_comment_id = request.POST.get('parent_comment_id')  # ID родительского комментария

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

    # Если указан родительский комментарий, проверяем его существование
    parent_comment = None
    if parent_comment_id:
        try:
            parent_comment = Comment.objects.get(id=parent_comment_id, recipe=recipe)
        except Comment.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Родительский комментарий не найден.'}, status=404)

    # Создаем комментарий
    try:
        comment = Comment.objects.create(
            user=request.user,
            recipe=recipe,
            text=text,
            image1=image1,
            image2=image2,
            parent_comment=parent_comment  # Указываем родительский комментарий, если он есть
        )
        return JsonResponse({
            'success': True,
            'message': 'Комментарий успешно добавлен.',
            'comment_id': comment.id,
            'is_reply': bool(parent_comment)  # Флаг, указывающий, является ли комментарий ответом
        }, status=201)
    except Exception as e:
        print(f"Ошибка при создании комментария: {e}")
        return JsonResponse({'success': False, 'error': f'Ошибка при добавлении комментария: {str(e)}'}, status=500)