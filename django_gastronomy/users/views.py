import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, logout, get_user_model



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