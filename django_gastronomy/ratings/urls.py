from django.urls import path
from . import views

urlpatterns = [
    # Маршрут для оценки рецепта
    path('rate_recipe/<int:recipe_id>/', views.rate_recipe, name='rate_recipe'),

    # Маршрут для удаления оценки
    path('delete_rating/<int:recipe_id>/', views.delete_rating, name='delete_rating'),
]