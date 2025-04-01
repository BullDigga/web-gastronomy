from django.shortcuts import render
from recipes.models import Recipe

def recipes_list_browse(request):
    published_recipes = Recipe.objects.filter(status='published').order_by('-id')[:10]
    print(f"Количество опубликованных рецептов: {published_recipes.count()}")

    context = {
        'recipes': published_recipes,
    }
    return render(request, 'recipes_list_browse.html', context)