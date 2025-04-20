from django.urls import path
from . import views

urlpatterns = [
    # Маршрут для удаления аккаунта
    path('delete_account/', views.delete_account, name='delete_account'),
]