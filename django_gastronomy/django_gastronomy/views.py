from django.shortcuts import render, get_object_or_404, redirect
from recipes.models import Recipe
from comments.models import Comment
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.contrib import messages
from django.http import JsonResponse

from django.views.decorators.csrf import csrf_exempt
import json

def recipes_list_browse(request, user_id=None):
    if user_id:
        # Если передан user_id, фильтруем рецепты по автору
        author = get_object_or_404(User, id=user_id)
        recipes = Recipe.objects.filter(author=author, status='published').order_by('-id')
    else:
        # Если user_id не передан, показываем все опубликованные рецепты
        author = None
        recipes = Recipe.objects.filter(status='published').order_by('-id')

    print(f"Количество рецептов: {recipes.count()}")

    context = {
        'recipes': recipes,
        'author': author,  # Передаём автора в контекст
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

            if not username or not email or not password:
                return JsonResponse({'error': 'Необходимо указать все поля.'}, status=400)

            # Проверяем, существует ли пользователь с таким именем
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Пользователь с данным псевдонимом уже зарегистрирован.'}, status=400)

            # Проверяем, существует ли пользователь с таким email
            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Пользователь с данным email уже зарегистрирован.'}, status=400)

            # Создаём нового пользователя
            user = User.objects.create_user(username=username, email=email, password=password)
            print("Пользователь успешно зарегистрирован:", user.username)
            return JsonResponse({'success': 'Вы успешно зарегистрировались!'})

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
            try:
                user = User.objects.get(email=email)
                print("Пользователь найден:", user.username)
            except User.DoesNotExist:
                print("Пользователь с email", email, "не найден.")
                return JsonResponse({'error': 'Пользователь с таким email не найден.'}, status=400)

            # Аутентифицируем пользователя
            authenticated_user = authenticate(request, username=user.username, password=password)
            if authenticated_user is not None:
                print("Аутентификация успешна для пользователя:", authenticated_user.username)
                login(request, authenticated_user)
                return JsonResponse({'success': 'Вы успешно вошли в систему!'})
            else:
                print("Аутентификация не удалась для пользователя:", user.username)
                return JsonResponse({'error': 'Неверный пароль.'}, status=400)

        except Exception as e:
            print("Неожиданная ошибка:", e)
            return JsonResponse({'error': 'Произошла ошибка на сервере.'}, status=500)

    return render(request, 'authorization.html')


def profile_view(request, user_id):
    # Получаем пользователя по ID
    user = get_object_or_404(User, id=user_id)

    # Подсчитываем количество рецептов пользователя
    recipe_count = Recipe.objects.filter(author=user).count()

    context = {
        'user': user,
        'recipe_count': recipe_count,
    }
    return render(request, 'profile_view.html', context)


def favorites_view(request):
    # Получаем текущего пользователя
    user = request.user

    # Проверяем, авторизован ли пользователь
    if not user.is_authenticated:
        return redirect('login')  # Перенаправляем на страницу входа

    # Получаем список избранных рецептов пользователя
    favorite_recipes = Recipe.objects.filter(favorited_by=user)

    context = {
        'favorite_recipes': favorite_recipes,
    }
    return render(request, 'favorites.html', context)


def recipe_view(request, recipe_id):
    # Получаем рецепт из БД по ID, но только если его статус "published"
    recipe = get_object_or_404(Recipe, id=recipe_id, status='published')

    # Получаем количество комментариев
    comments_count = recipe.comments_count()

    # Получаем средний рейтинг
    average_rating = recipe.average_rating()

    # Передаем данные в шаблон
    return render(request, 'recipe_view.html', {
        'recipe': recipe,
        'comments_count': comments_count,
        'average_rating': average_rating,
        'is_authenticated': request.user.is_authenticated  # Передаем флаг авторизации
    })