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
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views  # Импортируем модуль views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.recipes_list_browse, name='recipes_list_browse'),
    path('register/', views.registration_view, name='registration'),
    path('authorization/', views.authorization_view, name='authorization'),
    path('profile/<int:user_id>/', views.profile_view, name='profile'),
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),
    path('recipes/<int:recipe_id>/', views.recipe_view, name='recipe_view'),
    path('user/<int:user_id>/recipes/', views.recipes_list_browse, name='user_recipes'),
    path('favorites/', views.recipes_list_browse, {'favorites': True}, name='favorites'),
    path('favorites/<int:recipe_id>/', views.toggle_favorite, name='toggle_favorite'),
    path('confirm_delete_account/', views.confirm_delete_account, name='confirm_delete_account'),
    path('delete_account/', views.delete_account, name='delete_account'),
    path('rate_recipe/<int:recipe_id>/', views.rate_recipe, name='rate_recipe'),
    path('delete_rating/<int:recipe_id>/', views.delete_rating, name='delete_rating'),
    path('create_recipe/', views.create_recipe, name='create_recipe'),
    path('radio_player/', views.radio_player, name='radio_player'),
    path('recipes/', views.recipes_list_browse, name='recipes_list_browse'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
