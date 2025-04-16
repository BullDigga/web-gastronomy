from django.shortcuts import render, get_object_or_404, redirect
from recipes.models import Recipe
from recipe_ingredients.models import RecipeIngredient
from instructions.models import Instruction
from ingredients.models import Ingredient
from units.models import Unit
from comments.models import Comment
from favorites.models import Favorite
from ratings.models import Rate
from django.contrib.auth import get_user_model
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib import messages
from django.http import JsonResponse
from django.db import transaction
from django.db.models import Avg, Count
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import default_storage
import os
from django.conf import settings
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.db.models import Q
from django.db.models.functions import Lower


from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json


def recipes_list_browse(request, user_id=None, favorites=False):
    """
    View для просмотра списка рецептов.
    Поддерживает фильтрацию по автору, избранным рецептам или показ всех опубликованных рецептов.
    """
    User = get_user_model()
    current_user = request.user  # Текущий пользователь

    # Если передан user_id, фильтруем рецепты по конкретному автору
    if user_id:
        author = get_object_or_404(User, id=user_id)  # Находим автора по ID
        recipes = Recipe.objects.filter(
            author=author,
            status='published'
        ).order_by('-id')  # Сортируем рецепты по дате создания (новые первыми)

    # Если запрошены избранные рецепты и пользователь аутентифицирован
    elif favorites and current_user.is_authenticated:
        favorite_recipe_ids = Favorite.objects.filter(
            user=current_user
        ).values_list('recipe_id', flat=True)  # Получаем ID избранных рецептов
        recipes = Recipe.objects.filter(
            id__in=favorite_recipe_ids,
            status='published'
        ).order_by('-id')  # Фильтруем рецепты по ID и сортируем
        author = None  # Нет конкретного автора

    # Если ничего не передано, показываем все опубликованные рецепты
    else:
        author = None  # Нет конкретного автора
        recipes = Recipe.objects.filter(
            status='published'
        ).order_by('-id')  # Показываем все опубликованные рецепты

    # Фильтрация по поисковому запросу
    query = request.GET.get('q', '').strip()
    if query:
        # Преобразуем запрос в нижний регистр
        normalized_query = query.lower()
        print(f"Нормализованный запрос: {normalized_query}")  # Отладочная информация

        # Аннотируем данные из базы, приводя их к нижнему регистру
        recipes = recipes.annotate(
            lower_title=Lower('title'),  # Преобразуем название в нижний регистр
            lower_description=Lower('description')  # Преобразуем описание в нижний регистр
        )

        # Выводим отладочную информацию о данных из базы
        for recipe in recipes:
            original_title = recipe.title  # Исходное название рецепта
            python_lower_title = recipe.title.lower()  # Применяем .lower() в Python
            db_lower_title = recipe.lower_title  # Название, преобразованное в базе данных через LOWER
            print(
                f"ID: {recipe.id}, "
                f"Original Title: {original_title}, "
                f"Python Lower Title: {python_lower_title}, "
                f"DB Lower Title: {db_lower_title}"
            )

        # Фильтруем рецепты
        recipes = recipes.filter(
            Q(lower_title__contains=normalized_query) |  # Поиск по названию рецепта
            Q(lower_description__contains=normalized_query) |  # Поиск по описанию
            Q(author__username__icontains=normalized_query) |  # Поиск по имени автора
            Q(ingredients__ingredient__name__icontains=normalized_query)  # Поиск по названию ингредиента
        ).distinct()  # Используем distinct(), чтобы избежать дубликатов при поиске по связанным полям

    # Получаем ID избранных рецептов для текущего пользователя
    if current_user.is_authenticated:
        favorite_recipe_ids = Favorite.objects.filter(
            user=current_user
        ).values_list('recipe_id', flat=True)
    else:
        favorite_recipe_ids = []  # Если пользователь не аутентифицирован, список пустой

    # Отладочная информация
    print(f"Поисковый запрос: {query}")
    print(f"Количество найденных рецептов: {recipes.count()}")

    # Контекст для передачи данных в шаблон
    context = {
        'recipes': recipes,  # Список рецептов
        'author': author,  # Автор рецептов (если есть)
        'favorites': favorites,  # Флаг для избранных рецептов
        'favorite_recipe_ids': list(favorite_recipe_ids),  # Список ID избранных рецептов
        'query': query,  # Поисковый запрос для отображения в шаблоне
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

            # Обязательные поля
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')

            # Необязательные поля
            first_name = data.get('first_name', '')  # Новое поле
            last_name = data.get('last_name', '')    # Новое поле
            middle_name = data.get('middle_name', '')  # Новое поле
            gender = data.get('gender', None)        # Новое поле (необязательное)
            date_of_birth = data.get('date_of_birth', None)  # Новое поле (необязательное)
            country = data.get('country', '')        # Новое поле (необязательное)

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
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                gender=gender,
                date_of_birth=date_of_birth,
                country=country
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
@csrf_exempt
def create_recipe(request):
    if request.method == 'POST':
        try:
            # Получаем данные из запроса
            title = request.POST.get('title')
            description = request.POST.get('description')
            main_photo = request.FILES.get('main_photo')
            ingredients_data = json.loads(request.POST.get('ingredients', '[]'))

            # Проверяем обязательные поля
            if not title or not description or not main_photo:
                return JsonResponse({'success': False, 'message': 'Заполните все обязательные поля.'})

            # Создаем путь для сохранения изображений
            main_image_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'main_recipe_images')
            instruction_image_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'instruction_recipe_images')
            instruction_image_compressed_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'instruction_recipe_images_compressed')

            # Создаем директории, если их нет
            os.makedirs(main_image_dir, exist_ok=True)
            os.makedirs(instruction_image_dir, exist_ok=True)
            os.makedirs(instruction_image_compressed_dir, exist_ok=True)

            # Сохраняем главное изображение
            main_photo_name = f"recipe_images/main_recipe_images/{main_photo.name}"
            main_photo_path = default_storage.save(main_photo_name, main_photo)

            # Создаем рецепт в транзакции
            with transaction.atomic():
                recipe = Recipe.objects.create(
                    title=title,
                    description=description,
                    author=request.user,
                    status='published',
                    main_picture=main_photo_path  # Относительный путь
                )

                # Добавляем ингредиенты
                for ingredient_data in ingredients_data:
                    ingredient_name = ingredient_data.get('name')
                    unit_name = ingredient_data.get('unit')
                    quantity = ingredient_data.get('quantity')

                    if not all([ingredient_name, unit_name, quantity]):
                        raise ValueError('Некорректные данные для ингредиента.')

                    ingredient, _ = Ingredient.objects.get_or_create(name=ingredient_name)
                    unit, _ = Unit.objects.get_or_create(name=unit_name)
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=ingredient,
                        unit=unit,
                        quantity=quantity
                    )

                # Добавляем шаги
                step_index = 0
                while True:
                    description = request.POST.get(f'step_{step_index}_description')
                    photo = request.FILES.get(f'step_{step_index}_photo')

                    if not description and not photo:
                        break

                    if not description or not photo:
                        raise ValueError(f'Шаг {step_index + 1} не содержит описание или изображение.')

                    # Сохраняем основное изображение шага
                    photo_name = f"recipe_images/instruction_recipe_images/{photo.name}"
                    photo_path = default_storage.save(photo_name, photo)

                    # Создаем сжатую версию изображения шага
                    img = Image.open(photo)
                    output_size = (600, 450)  # Размер миниатюры (4:3 пропорция)
                    img.thumbnail(output_size, Image.Resampling.LANCZOS)

                    thumb_io = BytesIO()
                    img.save(thumb_io, format='JPEG', quality=85)

                    compressed_filename = f'compressed_{photo.name}'
                    compressed_photo_path = default_storage.save(
                        f'recipe_images/instruction_recipe_images_compressed/{compressed_filename}',
                        ContentFile(thumb_io.getvalue())
                    )

                    # Создаем объект Instruction
                    Instruction.objects.create(
                        recipe=recipe,
                        step_number=step_index + 1,
                        instruction_text=description,
                        image=photo_path,
                        image_compressed=compressed_photo_path
                    )

                    step_index += 1

            return JsonResponse({'success': True, 'message': 'Рецепт успешно создан и опубликован.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return render(request, 'create_recipe.html')

def radio_player(request):
    return render(request, 'radio_player.html')


@login_required
def edit_profile(request):
    """
    View для редактирования профиля пользователя.
    Обрабатывает GET и POST запросы для редактирования данных.
    """
    user = request.user  # Получаем текущего пользователя

    if request.method == 'POST':
        # Получаем данные из POST-запроса
        username = request.POST.get('username')
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        middle_name = request.POST.get('middle_name', '').strip()
        gender = request.POST.get('gender', '').strip()
        date_of_birth = request.POST.get('date_of_birth', '').strip()
        country = request.POST.get('country', '').strip()

        # Проверяем обязательное поле username
        if not username or len(username) < 6:
            messages.error(request, 'Псевдоним должен содержать минимум 6 символов.')
            return redirect('edit_profile')

        # Обновляем данные пользователя
        user.username = username
        user.first_name = first_name
        user.last_name = last_name
        user.middle_name = middle_name
        user.gender = gender
        user.date_of_birth = date_of_birth if date_of_birth else None
        user.country = country

        # Сохраняем изменения
        user.save()

        # Добавляем сообщение об успехе
        messages.success(request, 'Профиль успешно обновлен!')

        # Перенаправляем на страницу просмотра профиля
        return redirect('profile', user_id=user.id)  # Используем именованный маршрут

    # Если GET-запрос, отображаем страницу с текущими данными пользователя
    context = {
        'user': user,
    }
    return render(request, 'edit_profile.html', context)