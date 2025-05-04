import uuid
from datetime import datetime

from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from models.recipes.models import Recipe
from models.recipe_ingredients.models import RecipeIngredient
from models.instructions.models import Instruction
from models.ingredients.models import Ingredient
from models.units.models import Unit
from models.users.models import User
from models.comments.models import Comment
from models.favorites.models import Favorite
from models.ratings.models import Rate
from models.subscriptions.models import Subscription
from models.user_avatars.models import UserAvatar
from models.instruction_images.models import InstructionImage
from models.recipe_main_images.models import RecipeMainImage

from django.db.models import Subquery, OuterRef, Avg, Count, Case, When, Value, FloatField, IntegerField


from django.db.models import Avg, Count, Value, Case, When
from django.db.models.functions import Coalesce
from django.db import models

from django.contrib.auth import get_user_model
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib import messages
from django.http import JsonResponse
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import default_storage
import os
from django.conf import settings
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from django.core.files.base import ContentFile
from django.db.models.functions import Lower


from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json


from django.db.models import OuterRef, Subquery, Count, Avg, Value, FloatField, Case, When

def recipes_list_view(request, user_id=None):
    """
    View для просмотра списка рецептов.
    Поддерживает фильтрацию по автору, избранным рецептам, поисковому запросу,
    а также сортировку по различным критериям.
    """
    User = get_user_model()
    current_user = request.user  # Текущий пользователь

    # Фильтрация по автору
    if user_id:
        author = get_object_or_404(User, id=user_id)
        recipes = Recipe.objects.filter(author=author, status='published')
    else:
        author = None
        recipes = Recipe.objects.filter(status='published')

    # Фильтрация по избранным рецептам
    favorites = request.GET.get('favorites') == 'true'
    if favorites and current_user.is_authenticated:
        favorite_recipe_ids = Favorite.objects.filter(
            user=current_user
        ).values_list('recipe_id', flat=True)
        recipes = recipes.filter(id__in=favorite_recipe_ids)

    # Поиск по запросу
    query = request.GET.get('q')
    if query:
        recipes = recipes.filter(title__icontains=query)

    # Подзапросы для вычисления данных
    average_rating_subquery = Rate.objects.filter(recipe=OuterRef('pk')).values('recipe').annotate(
        avg_rating=Avg('value')
    ).values('avg_rating')

    ratings_count_subquery = Rate.objects.filter(recipe=OuterRef('pk')).values('recipe').annotate(
        count=Count('id')
    ).values('count')

    favorites_count_subquery = Favorite.objects.filter(recipe=OuterRef('pk')).values('recipe').annotate(
        count=Count('id')
    ).values('count')

    # Применяем подзапросы к основному запросу
    recipes = recipes.annotate(
        average_rating_annotation=Case(
            When(rates__isnull=False, then=Subquery(average_rating_subquery, output_field=FloatField())),
            default=Value(0.0),
            output_field=FloatField()
        ),
        ratings_count=Case(
            When(rates__isnull=False, then=Subquery(ratings_count_subquery, output_field=models.IntegerField())),
            default=Value(0),
            output_field=models.IntegerField()
        ),
        favorites_count=Case(
            When(favorited_by__isnull=False, then=Subquery(favorites_count_subquery, output_field=models.IntegerField())),
            default=Value(0),
            output_field=models.IntegerField()
        )
    ).distinct()

    # Сортировка
    sort_by = request.GET.get('sort_by', 'publish_date')  # По умолчанию дата добавления
    order = request.GET.get('order', 'desc')  # По умолчанию убывание

    # Формируем параметр сортировки
    order_prefix = '-' if order == 'desc' else ''
    if sort_by == 'rating':
        recipes = recipes.order_by(
            f'{order_prefix}average_rating_annotation',
            f'{order_prefix}ratings_count',
            '-id'
        )
    elif sort_by == 'favorites_count':
        recipes = recipes.order_by(
            f'{order_prefix}favorites_count',
            '-id'
        )
    else:
        recipes = recipes.order_by(
            f'{order_prefix}{sort_by}',
            '-id'
        )

    # Получаем ID избранных рецептов для текущего пользователя
    if current_user.is_authenticated:
        favorite_recipe_ids = Favorite.objects.filter(
            user=current_user
        ).values_list('recipe_id', flat=True)
    else:
        favorite_recipe_ids = []

    # Контекст для передачи данных в шаблон
    context = {
        'recipes': recipes,
        'author': author,
        'favorites': favorites,
        'favorite_recipe_ids': list(favorite_recipe_ids),
        'current_sort_by': sort_by,
        'current_order': order,
        'query': query,
    }

    return render(request, 'recipes_list_view.html', context)



def registration_view(request):
    if request.method == 'POST':
        try:
            # Логируем данные запроса
            print("Request POST:", request.POST)
            print("Request FILES:", request.FILES)

            # Обязательные поля
            username = request.POST.get('username')
            email = request.POST.get('email')
            password = request.POST.get('password')

            # Необязательные поля
            first_name = request.POST.get('first_name', '').strip()
            last_name = request.POST.get('last_name', '').strip()
            middle_name = request.POST.get('middle_name', '').strip()
            gender = request.POST.get('gender', '').strip() or None
            date_of_birth = request.POST.get('date_of_birth', '').strip() or None
            country = request.POST.get('country', '').strip()
            about = request.POST.get('about', '').strip()

            # Проверяем обязательные поля
            if not username or not email or not password:
                return JsonResponse({'error': 'Необходимо указать все обязательные поля.'}, status=400)

            # Получаем модель пользователя
            User = get_user_model()

            # Проверяем уникальность псевдонима
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Пользователь с данным псевдонимом уже зарегистрирован.'}, status=400)

            # Проверяем уникальность email
            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Пользователь с данным email уже зарегистрирован.'}, status=400)

            # Создаем нового пользователя
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                gender=gender,
                date_of_birth=date_of_birth,
                country=country,
                about=about
            )

            # Обработка аватара
            avatar = request.FILES.get('avatar')
            if avatar and avatar.size > 0:
                if avatar.size > 10 * 1024 * 1024:
                    messages.error(request, 'Размер файла аватара не должен превышать 10 МБ.')
                    return redirect('edit_profile')

                try:
                    img = Image.open(avatar)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')

                    user_avatar, created = UserAvatar.objects.get_or_create(user=user)

                    # Сжатый аватар (300x300)
                    img_compressed = img.copy()
                    img_compressed.thumbnail((300, 300), Image.Resampling.LANCZOS)
                    thumb_io_compressed = BytesIO()
                    img_compressed.save(thumb_io_compressed, format='JPEG', quality=85)
                    compressed_filename = f'compressed_{uuid.uuid4()}.jpg'
                    user_avatar.avatar_compressed.save(compressed_filename, ContentFile(thumb_io_compressed.getvalue()),
                                                       save=False)

                    # Миниатюра (100x100)
                    img_thumbnail = img.copy()
                    img_thumbnail.thumbnail((100, 100), Image.Resampling.LANCZOS)
                    thumb_io_thumbnail = BytesIO()
                    img_thumbnail.save(thumb_io_thumbnail, format='JPEG', quality=90)
                    thumbnail_filename = f'thumbnail_{uuid.uuid4()}.jpg'
                    user_avatar.thumbnail.save(thumbnail_filename, ContentFile(thumb_io_thumbnail.getvalue()),
                                               save=False)

                    # Сохраняем оригинальный аватар
                    user_avatar.avatar = avatar
                    user_avatar.save()

                except (UnidentifiedImageError, IOError) as e:
                    messages.error(request, f'Ошибка при обработке аватара: {e}')
                    return redirect('edit_profile')

            # Сохраняем пользователя
            user.save()

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


@login_required(login_url='/login/')  # Защищаем view от анонимов (если нужно)
def profile_view(request, user_id):
    User = get_user_model()
    profile_user = get_object_or_404(User, id=user_id)

    recipe_count = Recipe.objects.filter(author=profile_user).count()

    # Подзапросы для аннотаций
    average_rating_subquery = Rate.objects.filter(recipe=OuterRef('pk')).values('recipe').annotate(
        avg_rating=Avg('value')
    ).values('avg_rating')

    ratings_count_subquery = Rate.objects.filter(recipe=OuterRef('pk')).values('recipe').annotate(
        count=Count('id')
    ).values('count')

    favorites_count_subquery = Favorite.objects.filter(recipe=OuterRef('pk')).values('recipe').annotate(
        count=Count('id')
    ).values('count')

    # Получаем последние 3 рецепта с аннотациями
    recent_recipes = Recipe.objects.filter(author=profile_user).annotate(
        average_rating_annotation=Case(
            When(rates__isnull=False, then=Subquery(average_rating_subquery, output_field=FloatField())),
            default=Value(0.0),
            output_field=FloatField()
        ),
        ratings_count=Case(
            When(rates__isnull=False, then=Subquery(ratings_count_subquery, output_field=IntegerField())),
            default=Value(0),
            output_field=IntegerField()
        ),
        favorites_count=Case(
            When(favorited_by__isnull=False, then=Subquery(favorites_count_subquery, output_field=IntegerField())),
            default=Value(0),
            output_field=IntegerField()
        )
    ).order_by('-publish_date')[:3]

    # Проверяем подписку
    is_subscribed = False
    if request.user.is_authenticated and request.user != profile_user:
        is_subscribed = request.user.subscriptions.filter(user_author=profile_user).exists()

    # Получаем список ID рецептов, добавленных в избранное текущим пользователем
    favorite_recipe_ids = []
    if request.user.is_authenticated:
        favorite_recipe_ids = list(
            Favorite.objects.filter(user=request.user)
                            .values_list('recipe_id', flat=True)
        )

    context = {
        'profile_user': profile_user,
        'recipe_count': recipe_count,
        'recent_recipes': recent_recipes,
        'current_user': request.user,
        'is_subscribed': is_subscribed,

        # 🔁 Передаём список ID избранных рецептов
        'favorite_recipe_ids': favorite_recipe_ids,
    }

    # Обработка POST-запроса (подписка/отписка)
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Требуется авторизация'}, status=401)

        if request.user == profile_user:
            return JsonResponse({'error': 'Нельзя подписаться на самого себя'}, status=400)

        action = request.POST.get('action')
        if action == 'toggle_subscription':
            if is_subscribed:
                Subscription.objects.filter(
                    user_subscriber=request.user,
                    user_author=profile_user
                ).delete()
                is_subscribed = False
            else:
                Subscription.objects.create(
                    user_subscriber=request.user,
                    user_author=profile_user
                )
                is_subscribed = True

            return JsonResponse({'is_subscribed': is_subscribed})

    return render(request, 'profile_view.html', context)


def recipe_view(request, recipe_id):
    # Получаем рецепт из БД по ID, но только если его статус "published"
    try:
        recipe = Recipe.objects.select_related('author').prefetch_related(
            'comments',  # Подгружаем все комментарии
            'comments__user',  # Подгружаем связанных пользователей
            'comments__replies'  # Подгружаем вложенные комментарии
        ).get(id=recipe_id, status='published')
    except Recipe.DoesNotExist:
        # Если рецепт не найден или его статус не "published"
        return render(request, 'error.html', {'message': 'Рецепт не найден или недоступен.'}, status=404)

    # Удаление комментария (обработка POST-запроса)
    if request.method == 'POST' and request.POST.get('action') == 'delete_comment':
        comment_id = request.POST.get('comment_id')
        if request.user.is_authenticated:
            comment = get_object_or_404(Comment, id=comment_id, user=request.user)
            comment.delete()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Необходимо войти в аккаунт.'})

    # Функция для получения комментариев в порядке DFS
    def get_comments_in_dfs_order(comments, parent=None):
        """
        Рекурсивно собирает комментарии в порядке глубокого обхода (DFS).
        """
        result = []
        for comment in comments.filter(parent_comment=parent).order_by('created_at'):
            result.append(comment)
            result.extend(get_comments_in_dfs_order(comments, parent=comment))
        return result

    # Получаем все комментарии рецепта
    all_comments = recipe.comments.all()

    # Получаем количество комментариев
    comments_count = all_comments.count()

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

    user_rating_subquery = Rate.objects.filter(
        recipe=recipe,
        user=OuterRef('user')  # Связываем с пользователем комментария
    ).values('value')[:1]  # Берем только одну оценку (последнюю)

    all_comments = recipe.comments.annotate(
        rating=Subquery(user_rating_subquery)  # Добавляем рейтинг к комментариям
    )

    for comment in all_comments:
        comment.rating = 5

    comments_in_dfs_order = get_comments_in_dfs_order(all_comments)



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
        'comments_in_dfs_order': comments_in_dfs_order,  # Комментарии в порядке DFS
    }

    return render(request, 'recipe_view.html', context)


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
def create_recipe(request):
    if request.method == 'POST':
        try:
            # Получаем данные
            title = request.POST.get('title')
            description = request.POST.get('description')
            main_photo = request.FILES.get('main_photo')
            ingredients_data = json.loads(request.POST.get('ingredients', '[]'))

            # Проверяем обязательные поля
            if not title or not description or not main_photo:
                return JsonResponse({'success': False, 'message': 'Заполните все обязательные поля.'})

            # Директории для изображений
            main_image_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'main_recipe_images')
            main_compressed_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'main_recipe_images_compressed')
            instruction_image_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'instruction_recipe_images')
            instruction_compressed_dir = os.path.join(settings.MEDIA_ROOT, 'recipe_images', 'instruction_recipe_images_compressed')

            os.makedirs(main_image_dir, exist_ok=True)
            os.makedirs(main_compressed_dir, exist_ok=True)
            os.makedirs(instruction_image_dir, exist_ok=True)
            os.makedirs(instruction_compressed_dir, exist_ok=True)

            # Сохраняем главное изображение
            main_photo_name = f"recipe_images/main_recipe_images/{main_photo.name}"
            main_photo_path = default_storage.save(main_photo_name, main_photo)

            # Создаём рецепт
            with transaction.atomic():
                recipe = Recipe.objects.create(
                    title=title,
                    description=description,
                    author=request.user,
                    status='published'
                )

                # Создаём запись с главным изображением
                # Компрессия
                img = Image.open(main_photo)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                output_size = (900, 675)  # 4:3
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

                thumb_io = BytesIO()
                img.save(thumb_io, format='JPEG', quality=85)

                compressed_filename = f'compressed_{main_photo.name}'
                compressed_photo_path = default_storage.save(
                    f'recipe_images/main_recipe_images_compressed/{compressed_filename}',
                    ContentFile(thumb_io.getvalue())
                )

                # Сохраняем изображения в RecipeMainImage
                RecipeMainImage.objects.create(
                    recipe=recipe,
                    main_image=main_photo_path,
                    main_image_compressed=compressed_photo_path
                )

                # Ингредиенты
                for ingredient_data in ingredients_data:
                    name = ingredient_data.get('name')
                    unit = ingredient_data.get('unit')
                    quantity = ingredient_data.get('quantity')

                    if not all([name, unit, quantity]):
                        raise ValueError('Некорректные данные ингредиента.')

                    db_ingredient, _ = Ingredient.objects.get_or_create(name=name)
                    db_unit, _ = Unit.objects.get_or_create(name=unit)
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=db_ingredient,
                        unit=db_unit,
                        quantity=quantity
                    )

                # Шаги
                step_index = 0
                while True:
                    desc_key = f'step_{step_index}_description'
                    photo_key = f'step_{step_index}_photo'

                    description = request.POST.get(desc_key)
                    photo = request.FILES.get(photo_key)

                    if not description and not photo:
                        break

                    if not description or not photo:
                        raise ValueError(f'Шаг {step_index + 1} содержит ошибки.')

                    # Сохраняем изображение шага
                    photo_name = f"recipe_images/instruction_recipe_images/{photo.name}"
                    photo_path = default_storage.save(photo_name, photo)

                    # Компрессия для шага
                    img = Image.open(photo)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    output_size = (600, 450)  # 4:3
                    img.thumbnail(output_size, Image.Resampling.LANCZOS)

                    thumb_io = BytesIO()
                    img.save(thumb_io, format='JPEG', quality=85)

                    compressed_filename = f'compressed_{photo.name}'
                    compressed_photo_path = default_storage.save(
                        f'recipe_images/instruction_recipe_images_compressed/{compressed_filename}',
                        ContentFile(thumb_io.getvalue())
                    )

                    # Создаём шаг и изображение
                    instruction = Instruction.objects.create(
                        recipe=recipe,
                        step_number=step_index + 1,
                        instruction_text=description
                    )

                    InstructionImage.objects.create(
                        instruction=instruction,
                        image=photo_path,
                        image_compressed=compressed_photo_path
                    )

                    step_index += 1

            return JsonResponse({'success': True, 'message': 'Рецепт успешно опубликован!'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return render(request, 'create_recipe.html')

def radio_player(request):
    return render(request, 'radio_player.html')


@login_required
@transaction.atomic
def edit_profile(request):
    """
    View для редактирования профиля пользователя.
    Обрабатывает GET и POST запросы для редактирования данных.
    """
    user = request.user

    if request.method == 'POST':
        username = request.POST.get('username')
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        middle_name = request.POST.get('middle_name', '').strip()
        gender = request.POST.get('gender', '').strip()
        date_of_birth = request.POST.get('date_of_birth', '').strip()
        country = request.POST.get('country', '').strip()
        about = request.POST.get('about', '').strip()

        # Проверяем обязательное поле username
        if not username or len(username) < 6:
            messages.error(request, 'Псевдоним должен содержать минимум 6 символов.')
            return redirect('edit_profile')

        # Проверяем уникальность псевдонима
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            messages.error(request, 'Этот псевдоним уже занят.')
            return redirect('edit_profile')

        # Валидация даты рождения
        try:
            date_of_birth = datetime.strptime(date_of_birth, '%Y-%m-%d').date() if date_of_birth else None
        except ValueError:
            return redirect('edit_profile')

        # Обработка загрузки аватара
        avatar = request.FILES.get('avatar')
        print("Загружен аватар:", avatar.name if avatar else None)

        if avatar and avatar.size > 0:
            if avatar.size > 10 * 1024 * 1024:
                messages.error(request, 'Размер файла аватара не должен превышать 10 МБ.')
                return redirect('edit_profile')

            try:
                img = Image.open(avatar)
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Получаем или создаём запись UserAvatar
                user_avatar, created = UserAvatar.objects.get_or_create(user=user)

                # --- Сжатый аватар ---
                img_compressed = img.copy()
                img_compressed.thumbnail((300, 300), Image.Resampling.LANCZOS)
                thumb_io_compressed = BytesIO()
                img_compressed.save(thumb_io_compressed, format='JPEG', quality=85)
                compressed_filename = f'compressed_{uuid.uuid4()}.jpg'
                user_avatar.avatar_compressed.save(compressed_filename, ContentFile(thumb_io_compressed.getvalue()), save=False)

                # --- Миниатюра ---
                img_thumbnail = img.copy()
                img_thumbnail.thumbnail((100, 100), Image.Resampling.LANCZOS)
                thumb_io_thumbnail = BytesIO()
                img_thumbnail.save(thumb_io_thumbnail, format='JPEG', quality=90)
                thumbnail_filename = f'thumbnail_{uuid.uuid4()}.jpg'
                user_avatar.thumbnail.save(thumbnail_filename, ContentFile(thumb_io_thumbnail.getvalue()), save=False)

                # --- Оригинальный аватар ---
                user_avatar.avatar = avatar  # ← Сохраняем оригинал

                # --- Сохраняем объект ---
                user_avatar.save()

            except (UnidentifiedImageError, IOError) as e:
                messages.error(request, f'Ошибка при обработке аватара: {e}')
                return redirect('edit_profile')

        # Обновляем данные пользователя
        user.username = username
        user.first_name = first_name
        user.last_name = last_name
        user.middle_name = middle_name
        user.gender = gender
        user.date_of_birth = date_of_birth
        user.country = country
        user.about = about
        user.save()

        # Перенаправление
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': reverse('profile', args=[user.id])})
        else:
            return redirect('profile', user_id=user.id)

    context = {
        'user': user,
    }
    return render(request, 'edit_profile.html', context)