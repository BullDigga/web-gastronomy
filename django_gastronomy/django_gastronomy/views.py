from django.shortcuts import render, get_object_or_404, redirect
from recipes.models import Recipe
from django.contrib.auth.models import User
from django.contrib import messages

def recipes_list_browse(request):
    published_recipes = Recipe.objects.filter(status='published').order_by('-id')[:10]
    print(f"Количество опубликованных рецептов: {published_recipes.count()}")

    context = {
        'recipes': published_recipes,
    }
    return render(request, 'recipes_list_browse.html', context)


def registration_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        errors = []

        # Проверка имени пользователя
        if not username:
            errors.append('Не введён псевдоним.')
        elif len(username) < 6:
            errors.append('Псевдоним должен содержать минимум 6 символов.')
        elif User.objects.filter(username=username).exists():
            errors.append('Пользователь с данным псевдонимом уже зарегистрирован.')

        # Проверка email
        if not email:
            errors.append('Не введён Email.')
        elif User.objects.filter(email=email).exists():
            errors.append('Пользователь с данным email уже зарегистрирован.')

        # Проверка пароля
        if not password:
            errors.append('Не введён пароль.')
        elif len(password) < 6:
            errors.append('Пароль должен содержать минимум 6 символов.')

        # Если есть ошибки, показываем их
        if errors:
            for error in errors:
                messages.error(request, error)
            return render(request, 'registration.html')

        # Создаем нового пользователя
        new_user = User.objects.create_user(username=username, email=email, password=password)
        messages.success(request, 'Вы успешно зарегистрировались!')

        # Перенаправляем на страницу профиля нового пользователя
        return redirect('profile', user_id=new_user.id)

    return render(request, 'registration.html')


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