from django.urls import path
from . import views

urlpatterns = [
    # Страница избранных рецептов
    path('favorites/', views.favorites_view, name='favorites'),

    # Добавление/удаление рецепта в избранное
    path('toggle_favorite/<int:recipe_id>/', views.toggle_favorite, name='toggle_favorite'),
]