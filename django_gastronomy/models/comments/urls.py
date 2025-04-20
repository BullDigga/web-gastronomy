from django.urls import path
from . import views

urlpatterns = [
    path('delete/<int:comment_id>/', views.delete_comment, name='delete_comment'),
    path('comments/create/', views.create_comment, name='create_comment'),
]