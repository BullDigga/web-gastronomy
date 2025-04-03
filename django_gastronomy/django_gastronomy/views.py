from django.shortcuts import render
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

        # Проверяем, что пользователь с таким именем или email не существует
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Имя пользователя уже занято.')
        elif User.objects.filter(email=email).exists():
            messages.error(request, 'Email уже используется.')
        else:
            # Создаем нового пользователя
            User.objects.create_user(username=username, email=email, password=password)
            messages.success(request, 'Вы успешно зарегистрировались!')
            return redirect('recipes_list_browse')  # Перенаправляем на главную страницу

    return render(request, 'registration.html')