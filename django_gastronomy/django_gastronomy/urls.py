"""
URL configuration for django_gastronomy project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth.views import LogoutView
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Администрирование
    path('admin/', admin.site.urls),

    # Главная страница и общие маршруты
    path('', views.recipes_list_view, name='recipes_list_view'),
    path('recipes_list_view/', views.recipes_list_view, name='recipes_list_view'),
    path('recipes/', views.recipes_list_view, name='recipes_list_view'),

    # Избранное
    path('favorites/', include('models.favorites.urls')),

    # Аутентификация
    path('register/', views.registration_view, name='registration'),
    path('authorization/', views.authorization_view, name='authorization'),
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),

    # Профиль пользователя
    path('profile/<int:user_id>/', views.profile_view, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('confirm_delete_account/', views.confirm_delete_account, name='confirm_delete_account'),
    path('users/', include('models.users.urls')),

    # Рецепты
    path('recipes/<int:recipe_id>/', views.recipe_view, name='recipe_view'),
    path('user/<int:user_id>/recipes/', views.recipes_list_view, name='user_recipes'),
    path('create_recipe/', views.create_recipe, name='create_recipe'),
    path('recipes/', include('models.recipes.urls')),

    # Рейтинги
    path('ratings/', include('models.ratings.urls')),

    # Комментарии
    path('comments/', include('models.comments.urls')),

    # Дополнительный функционал
    path('radio_player/', views.radio_player, name='radio_player'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
