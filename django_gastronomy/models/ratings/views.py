import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count
from django.core.exceptions import ObjectDoesNotExist
from models.recipes.models import Recipe  # Модель рецептов
from models.ratings.models import Rate  # Модель оценок



@login_required
@csrf_exempt
def rate_recipe(request, recipe_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            rating_value = data.get('rating')

            # Проверяем, что оценка выбрана
            if not rating_value or not (1 <= rating_value <= 5):
                return JsonResponse({'error': 'Выберите количество звёзд для оценки.'}, status=400)

            # Получаем рецепт
            recipe = Recipe.objects.get(id=recipe_id)

            # Обновляем или создаём оценку
            rate, created = Rate.objects.update_or_create(
                recipe=recipe,
                user=request.user,
                defaults={'value': rating_value}
            )

            # Рассчитываем среднюю оценку и количество оценок
            ratings_data = recipe.rates.aggregate(
                avg_rating=Avg('value'),
                count_ratings=Count('id')
            )
            average_rating = round(float(ratings_data['avg_rating']), 1) if ratings_data['avg_rating'] else 0
            ratings_count = ratings_data['count_ratings']

            # Подсчитываем количество добавлений в избранное
            favorites_count = recipe.favorited_by.count()

            return JsonResponse({
                'success': True,
                'average_rating': average_rating,
                'ratings_count': ratings_count,
                'favorites_count': favorites_count,  # Добавляем количество добавлений в избранное
                'user_rating': rating_value
            })

        except ObjectDoesNotExist:
            return JsonResponse({'error': 'Рецепт не найден.'}, status=404)
        except Exception as e:
            print("Ошибка:", e)
            return JsonResponse({'error': 'Произошла ошибка на сервере.'}, status=500)

    return JsonResponse({'error': 'Неверный метод запроса.'}, status=400)


@login_required
@csrf_exempt
def delete_rating(request, recipe_id):
    if request.method == 'POST':
        try:
            # Получаем рецепт
            recipe = Recipe.objects.get(id=recipe_id)

            # Удаляем оценку пользователя
            Rate.objects.filter(recipe=recipe, user=request.user).delete()

            # Рассчитываем новую среднюю оценку и количество оценок
            ratings_data = recipe.rates.aggregate(
                avg_rating=Avg('value'),
                count_ratings=Count('id')
            )
            average_rating = round(float(ratings_data['avg_rating']), 1) if ratings_data['avg_rating'] else 0
            ratings_count = ratings_data['count_ratings']

            # Подсчитываем количество добавлений в избранное
            favorites_count = recipe.favorited_by.count()

            return JsonResponse({
                'success': True,
                'average_rating': average_rating,
                'ratings_count': ratings_count,
                'favorites_count': favorites_count,  # Добавляем количество добавлений в избранное
            })

        except Exception as e:
            print("Ошибка:", e)
            return JsonResponse({'error': 'Произошла ошибка на сервере.'}, status=500)

    return JsonResponse({'error': 'Неверный метод запроса.'}, status=400)