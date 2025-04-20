from django.urls import path
from . import views

urlpatterns = [
    path('<int:recipe_id>/delete/', views.delete_recipe, name='delete_recipe'),
]