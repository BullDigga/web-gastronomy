document.addEventListener('DOMContentLoaded', () => {
    const mainPhotoInput = document.getElementById('main-photo');
    const mainPhotoPreview = document.getElementById('main-photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoError = document.getElementById('photo-error');

    // Обработка загрузки главной фотографии
    mainPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (file) {
            // Проверка размера файла
            if (file.size > 10 * 1024 * 1024) {
                photoError.style.display = 'block';
                return;
            }

            photoError.style.display = 'none';

            const reader = new FileReader();
            reader.onload = (e) => {
                mainPhotoPreview.src = e.target.result; // Устанавливаем изображение
                mainPhotoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';

                // Убираем рамку .photo-label
                const photoLabel = document.querySelector('.photo-label');
                photoLabel.style.border = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Обработка добавления новых шагов
    const stepsContainer = document.getElementById('steps-container');
    const addStepButton = document.getElementById('add-step');

    // Функция для инициализации обработчиков для шага
    function initializeStepHandlers(stepElement) {
        // Назначаем обработчик удаления шага
        attachRemoveStepHandler(stepElement);

        // Назначаем обработчик загрузки изображений для шага
        const stepPhotoInput = stepElement.querySelector('.step-photo');
        const stepPhotoPreview = stepElement.querySelector('.step-photo-label img');
        const stepPhotoPlaceholder = stepElement.querySelector('.step-photo-label span');

        stepPhotoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // Проверка размера файла
                if (file.size > 10 * 1024 * 1024) {
                    alert('Ошибка: Размер файла превышает 10 МБ.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    stepPhotoPreview.src = e.target.result;
                    stepPhotoPreview.style.display = 'block';
                    stepPhotoPlaceholder.style.display = 'none';

                    // Убираем рамку .step-photo-label
                    const stepPhotoLabel = stepElement.querySelector('.step-photo-label');
                    stepPhotoLabel.style.border = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Функция для назначения обработчика удаления шага
    function attachRemoveStepHandler(stepElement) {
        const removeButton = stepElement.querySelector('.remove-step');
        removeButton.addEventListener('click', (event) => {
            const currentStep = event.currentTarget.closest('.step'); // Находим текущий шаг
            const steps = Array.from(document.querySelectorAll('.step')); // Получаем все шаги как массив
            const stepIndex = steps.indexOf(currentStep); // Определяем индекс текущего шага
            console.log(`Кнопка "Удалить шаг" была нажата для шага №${stepIndex + 1}`); // Логгирование
            if (steps.length > 1) {
                stepsContainer.removeChild(currentStep); // Удаляем текущий шаг
                renumberSteps(); // Переименовываем оставшиеся шаги
            }
        });
    }

    function addNewStep() {
        const newStep = document.createElement('div');
        newStep.classList.add('step');
        newStep.innerHTML = `
            <div class="step-header">
                <span>Шаг</span>
                <button class="remove-step" title="Удалить шаг">➖</button>
            </div>
            <div class="step-content">
                <textarea class="step-description" rows="3" placeholder="Описание шага"></textarea>
                <label for="step-photo-${Date.now()}" class="step-photo-label">
                    <img id="step-photo-preview-${Date.now()}" src="#" alt="Фото шага" style="display: none;" />
                    <span id="step-photo-placeholder-${Date.now()}">+</span>
                </label>
                <input type="file" id="step-photo-${Date.now()}" accept="image/*" class="step-photo" style="display: none;" />
            </div>
        `;
        stepsContainer.appendChild(newStep);

        // Инициализируем обработчики для нового шага
        initializeStepHandlers(newStep);
    }

    // Функция для переименования шагов
    function renumberSteps() {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            const stepHeader = step.querySelector('.step-header span');
            stepHeader.textContent = `Шаг ${index + 1}`;
        });
    }

    // Добавление нового шага по нажатию кнопки
    addStepButton.addEventListener('click', () => {
        addNewStep();
        renumberSteps();
    });

    // Инициализация первого шага
    const initialSteps = document.querySelectorAll('.step');
    initialSteps.forEach((step) => {
        initializeStepHandlers(step);
    });

    // Переименование шагов после инициализации
    renumberSteps();

    // Обработка добавления новых ингредиентов
    const ingredientsList = document.getElementById('ingredients-list');
    const addIngredientButton = document.getElementById('add-ingredient');

    // Функция для назначения обработчика удаления ингредиента
    function attachRemoveIngredientHandler(ingredientElement) {
        const removeButton = ingredientElement.querySelector('.remove-ingredient');
        removeButton.addEventListener('click', () => {
            ingredientsList.removeChild(ingredientElement);
        });
    }

    // Функция для добавления нового ингредиента
    function addNewIngredient() {
        const newIngredient = document.createElement('div');
        newIngredient.classList.add('ingredient');
        newIngredient.innerHTML = `
            <input type="text" class="ingredient-quantity" placeholder="Количество" />
            <input type="text" class="ingredient-unit" placeholder="Ед. измерения" />
            <input type="text" class="ingredient-name" placeholder="Ингредиент" />
            <button class="remove-ingredient">➖</button>
        `;
        ingredientsList.appendChild(newIngredient);

        // Назначаем обработчик для нового ингредиента
        attachRemoveIngredientHandler(newIngredient);
    }

    // Добавление нового ингредиента по нажатию кнопки
    addIngredientButton.addEventListener('click', () => {
        addNewIngredient();
    });

    // Инициализация первого ингредиента
    document.querySelectorAll('.ingredient').forEach((ingredient) => {
        attachRemoveIngredientHandler(ingredient);
    });

    // Обработка кнопки "Опубликовать рецепт"
    const publishButton = document.getElementById('publish-recipe');
    publishButton.addEventListener('click', async () => {
        try {
            // Собираем данные формы
            const formData = new FormData();

            // Главное изображение
            const mainPhotoInput = document.getElementById('main-photo');
            if (!mainPhotoInput.files.length) {
                alert('Пожалуйста, загрузите главное изображение.');
                return;
            }
            formData.append('main_photo', mainPhotoInput.files[0]);

            // Название и описание рецепта
            const title = document.getElementById('recipe-title').value.trim();
            const description = document.getElementById('recipe-description').value.trim();
            if (!title || !description) {
                alert('Пожалуйста, заполните название и описание рецепта.');
                return;
            }
            formData.append('title', title);
            formData.append('description', description);

            // Ингредиенты
            const ingredients = [];
            document.querySelectorAll('.ingredient').forEach((ingredientElement) => {
                const quantity = ingredientElement.querySelector('.ingredient-quantity').value.trim();
                const unit = ingredientElement.querySelector('.ingredient-unit').value.trim();
                const name = ingredientElement.querySelector('.ingredient-name').value.trim();

                if (quantity && unit && name) {
                    ingredients.push({ quantity, unit, name });
                }
            });

            if (ingredients.length === 0) {
                alert('Пожалуйста, добавьте хотя бы один ингредиент.');
                return;
            }
            formData.append('ingredients', JSON.stringify(ingredients));

            // Шаги приготовления
            const steps = [];
            document.querySelectorAll('.step').forEach((stepElement, index) => {
                const description = stepElement.querySelector('.step-description').value.trim();
                const photoInput = stepElement.querySelector('.step-photo');

                if (description && photoInput.files.length > 0) {
                    steps.push({ description, photo: photoInput.files[0] });
                }
            });

            if (steps.length === 0) {
                alert('Пожалуйста, добавьте хотя бы один шаг с описанием и изображением.');
                return;
            }

            steps.forEach((step, index) => {
                formData.append(`step_${index}_description`, step.description);
                formData.append(`step_${index}_photo`, step.photo);
            });

            // Отправляем данные на сервер
            const response = await fetch('/create_recipe/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') // Добавляем CSRF-токен
                }
            });

            const result = await response.json();
            if (result.success) {
                alert('Рецепт успешно опубликован!');
                window.location.href = '/'; // Перенаправляем пользователя на главную страницу
            } else {
                alert('Ошибка при публикации рецепта: ' + result.message);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при отправке данных.');
        }
    });

    // Функция для получения CSRF-токена из куки
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});