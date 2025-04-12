from django.shortcuts import render, get_object_or_404, redirect
from recipes.models import Recipe
from comments.models import Comment
from favorites.models import Favorite
from ratings.models import Rate
from django.contrib.auth import get_user_model
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Avg, Count
from django.core.exceptions import ObjectDoesNotExist

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json


def recipes_list_browse(request, user_id=None, favorites=False):
    User = get_user_model()
    current_user = request.user  # Текущий пользователь

    if user_id:
        # Если передан user_id, фильтруем рецепты по автору
        author = get_object_or_404(User, id=user_id)
        recipes = Recipe.objects.filter(author=author, status='published').order_by('-id')
    elif favorites and current_user.is_authenticated:
        # Если запрошены избранные рецепты и пользователь аутентифицирован
        favorite_recipe_ids = Favorite.objects.filter(user=current_user).values_list('recipe_id', flat=True)
        recipes = Recipe.objects.filter(id__in=favorite_recipe_ids, status='published').order_by('-id')
        author = None  # Нет конкретного автора
    else:
        # Если ничего не передано, показываем все опубликованные рецепты
        author = None
        recipes = Recipe.objects.filter(status='published').order_by('-id')

    # Получаем ID избранных рецептов для текущего пользователя
    if current_user.is_authenticated:
        favorite_recipe_ids = Favorite.objects.filter(user=current_user).values_list('recipe_id', flat=True)
    else:
        favorite_recipe_ids = []

    print(f"Количество рецептов: {recipes.count()}")

    context = {
        'recipes': recipes,
        'author': author,  # Передаём автора в контекст
        'favorites': favorites,  # Флаг для избранных рецептов
        'favorite_recipe_ids': list(favorite_recipe_ids),  # Список ID избранных рецептов
    }
    return render(request, 'recipes_list_browse.html', context)


def registration_view(request):
    if request.method == 'POST':
        try:
            # Логируем сырое тело запроса
            print("Raw body:", request.body)

            # Пытаемся распарсить JSON
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                print("Ошибка при парсинге JSON:", e)
                return JsonResponse({'error': 'Невалидный JSON.'}, status=400)

            # Логируем распарсенные данные
            print("Parsed data:", data)

            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name')  # Новое поле
            last_name = data.get('last_name')    # Новое поле
            middle_name = data.get('middle_name')  # Новое поле

            # Проверяем обязательные поля
            if not username or not email or not password:
                return JsonResponse({'error': 'Необходимо указать все обязательные поля.'}, status=400)

            # Получаем модель пользователя
            User = get_user_model()

            # Проверяем, существует ли пользователь с таким именем
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Пользователь с данным псевдонимом уже зарегистрирован.'}, status=400)

            # Проверяем, существует ли пользователь с таким email
            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Пользователь с данным email уже зарегистрирован.'}, status=400)

            # Создаём нового пользователя
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name or '',  # Если поле пустое, передаем пустую строку
                last_name=last_name or '',    # Если поле пустое, передаем пустую строку
                middle_name=middle_name or ''  # Если поле пустое, передаем пустую строку
            )
            print("Пользователь успешно зарегистрирован:", user.username)

            # Авторизуем пользователя
            login(request, user)

            # Возвращаем успешный ответ с URL профиля
            profile_url = f'/profile/{user.id}/'  # URL страницы профиля
            return JsonResponse({'success': True, 'redirect_url': profile_url})

        except Exception as e:
            print("Неожиданная ошибка:", e)
            return JsonResponse({'error': 'Произошла ошибка на сервере.'}, status=500)

    return render(request, 'registration.html')


def authorization_view(request):
    if request.method == 'POST':
        try:
            # Логируем сырое тело запроса
            print("Raw body:", request.body)

            # Пытаемся распарсить JSON
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                print("Ошибка при парсинге JSON:", e)
                return JsonResponse({'error': 'Невалидный JSON.'}, status=400)

            # Логируем распарсенные данные
            print("Parsed data:", data)

            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'error': 'Необходимо указать email и пароль.'}, status=400)

            # Проверяем, существует ли пользователь с таким email
            User = get_user_model()
            try:
                user = User.objects.get(email=email)
                print("Пользователь найден:", user.username)
            except User.DoesNotExist:
                print("Пользователь с email", email, "не найден.")
                return JsonResponse({'error': 'Пользователь с таким email не найден.'}, status=400)

            # Аутентифицируем пользователя
            authenticated_user = authenticate(request, email=user.email, password=password)
            if authenticated_user is not None:
                print("Аутентификация успешна для пользователя:", authenticated_user.username)
                login(request, authenticated_user)

                # Формируем URL профиля
                profile_url = f'/profile/{authenticated_user.id}/'

                # Возвращаем успешный ответ с URL профиля
                return JsonResponse({'success': True, 'redirect_url': profile_url})
            else:
                print("Аутентификация не удалась для пользователя:", user.username)
                return JsonResponse({'error': 'Неверный пароль.'}, status=400)

        except Exception as e:
            print("Неожиданная ошибка:", e)
            return JsonResponse({'error': 'Произошла ошибка на сервере.'}, status=500)

    return render(request, 'authorization.html')


def profile_view(request, user_id):
    # Получаем модель пользователя
    User = get_user_model()

    # Получаем пользователя по ID
    profile_user = get_object_or_404(User, id=user_id)

    # Подсчитываем количество рецептов пользователя
    recipe_count = Recipe.objects.filter(author=profile_user).count()

    context = {
        'profile_user': profile_user,  # Просматриваемый пользователь
        'recipe_count': recipe_count,
        'current_user': request.user,  # Текущий пользователь (может быть анонимным)
    }
    return render(request, 'profile_view.html', context)


def favorites_view(request):
    # Получаем текущего пользователя
    user = request.user

    # Проверяем, авторизован ли пользователь
    if not user.is_authenticated:
        return redirect('login')  # Перенаправляем на страницу входа

    # Получаем список избранных рецептов пользователя
    favorite_recipes = Recipe.objects.filter(favorited_by__user=user)

    context = {
        'favorite_recipes': favorite_recipes,
    }
    return render(request, 'recipes_list_browse.html', context)


def recipe_view(request, recipe_id):
    # Получаем рецепт из БД по ID, но только если его статус "published"
    try:
        recipe = Recipe.objects.select_related('author').get(id=recipe_id, status='published')
    except Recipe.DoesNotExist:
        # Если рецепт не найден или его статус не "published"
        return render(request, 'error.html', {'message': 'Рецепт не найден или недоступен.'}, status=404)

    # Получаем количество комментариев
    comments_count = recipe.comments.count()

    # Получаем средний рейтинг и количество оценок
    ratings_data = recipe.rates.aggregate(
        avg_rating=Avg('value'),  # Средняя оценка
        count_ratings=Count('id')  # Количество оценок
    )
    average_rating = round(float(ratings_data['avg_rating']), 1) if ratings_data['avg_rating'] else 0
    ratings_count = ratings_data['count_ratings']

    # Получаем количество добавлений рецепта в избранное
    favorites_count = recipe.favorited_by.count()  # Используем related_name='favorited_by'

    # Определяем, авторизован ли пользователь
    is_authenticated = request.user.is_authenticated

    # Получаем ID избранных рецептов для текущего пользователя (если авторизован)
    favorite_recipe_ids = []
    if is_authenticated:
        favorite_recipe_ids = list(Favorite.objects.filter(user=request.user).values_list('recipe_id', flat=True))

    # Получаем текущую оценку пользователя (если авторизован)
    user_rating = None
    if is_authenticated:
        user_rating_obj = recipe.rates.filter(user=request.user).first()
        user_rating = user_rating_obj.value if user_rating_obj else None

    # Передаем данные в шаблон
    context = {
        'recipe': recipe,
        'comments_count': comments_count,
        'average_rating': average_rating,  # Средняя оценка
        'ratings_count': ratings_count,  # Количество оценок
        'favorites_count': favorites_count,  # Количество добавлений в избранное
        'is_authenticated': is_authenticated,  # Флаг авторизации
        'favorite_recipe_ids': favorite_recipe_ids,  # Список ID избранных рецептов
        'user_rating': user_rating,  # Текущая оценка пользователя
    }

    return render(request, 'recipe_view.html', context)


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


@login_required
def confirm_delete_account(request):
    user = request.user

    # Получаем рецепты, созданные пользователем
    user_recipes = Recipe.objects.filter(author=user)[:5]  # Ограничиваем до 5 рецептов

    # Получаем рецепты, добавленные в избранное
    favorite_recipes = Favorite.objects.filter(user=user).select_related('recipe')[:5]

    return render(request, 'confirm_delete_account.html', {
        'user_recipes': user_recipes,
        'favorite_recipes': favorite_recipes,
    })


@login_required
@csrf_exempt
def delete_account(request):
    if request.method == 'POST':
        try:
            # Логируем сырое тело запроса
            print("Raw body:", request.body)

            # Пытаемся распарсить JSON
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                print("Ошибка при парсинге JSON:", e)
                return JsonResponse({'error': 'Невалидный JSON.'}, status=400)

            # Логируем распарсенные данные
            print("Parsed data:", data)

            password = data.get('password')

            if not password:
                return JsonResponse({'error': 'Необходимо указать пароль.'}, status=400)

            # Аутентифицируем пользователя по email и паролю
            User = get_user_model()
            user = authenticate(request, email=request.user.email, password=password)

            if user is None:
                print("Аутентификация не удалась для пользователя:", request.user.email)
                return JsonResponse({'error': 'Неверный пароль.'}, status=400)

            # Удаляем пользователя
            user_email = request.user.email
            user.delete()
            logout(request)  # Выходим из системы
            print("Аккаунт успешно удалён для пользователя:", user_email)
            return JsonResponse({'success': True})

        except Exception as e:
            print("Неожиданная ошибка:", e)
            return JsonResponse({'error': 'Произошла ошибка на сервере.'}, status=500)

    return JsonResponse({'error': 'Неверный метод запроса.'}, status=400)


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

@login_required
def create_recipe(request):
    # Заглушка: просто отображаем страницу без обработки данных
    return render(request, 'create_recipe.html')