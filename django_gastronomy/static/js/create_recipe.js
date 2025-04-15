document.addEventListener('DOMContentLoaded', () => {
    // Главная фотография
    const mainPhotoInput = document.getElementById('main-photo');
    const mainPhotoPreview = document.getElementById('main-photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoError = document.getElementById('photo-error');

    mainPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                photoError.style.display = 'block';
                return;
            }
            photoError.style.display = 'none';
            const reader = new FileReader();
            reader.onload = (e) => {
                mainPhotoPreview.src = e.target.result;
                mainPhotoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
                document.querySelector('.photo-label').style.border = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Шаги приготовления
    const stepsContainer = document.getElementById('steps-container');
    const addStepButton = document.getElementById('add-step');

    function initializeStepHandlers(stepElement) {
        attachRemoveStepHandler(stepElement);

        const stepPhotoInput = stepElement.querySelector('.step-photo');
        const stepPhotoPreview = stepElement.querySelector('.step-photo-label img');
        const stepPhotoPlaceholder = stepElement.querySelector('.step-photo-label span');

        stepPhotoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('Ошибка: Размер файла превышает 10 МБ.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    stepPhotoPreview.src = e.target.result;
                    stepPhotoPreview.style.display = 'block';
                    stepPhotoPlaceholder.style.display = 'none';
                    stepElement.querySelector('.step-photo-label').style.border = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function attachRemoveStepHandler(stepElement) {
        const removeButton = stepElement.querySelector('.remove-step');
        removeButton.addEventListener('click', () => {
            const currentStep = stepElement;
            const steps = Array.from(document.querySelectorAll('.step'));
            if (steps.length > 1) {
                stepsContainer.removeChild(currentStep);
                renumberSteps();
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
                <label class="step-photo-label">
                    <img src="#" alt="Фото шага" style="display: none;" />
                    <span>+</span>
                </label>
                <input type="file" accept="image/*" class="step-photo" style="display: none;" />
            </div>
        `;
        stepsContainer.appendChild(newStep);
        initializeStepHandlers(newStep);
    }

    function renumberSteps() {
        document.querySelectorAll('.step').forEach((step, index) => {
            step.querySelector('.step-header span').textContent = `Шаг ${index + 1}`;
        });
    }

    addStepButton.addEventListener('click', () => {
        addNewStep();
        renumberSteps();
    });

    document.querySelectorAll('.step').forEach((step) => {
        initializeStepHandlers(step);
    });
    renumberSteps();

    // Ингредиенты
    const ingredientsList = document.getElementById('ingredients-list');
    const addIngredientButton = document.getElementById('add-ingredient');

    function attachRemoveIngredientHandler(ingredientElement) {
        const removeButton = ingredientElement.querySelector('.remove-ingredient');
        removeButton.addEventListener('click', () => {
            ingredientsList.removeChild(ingredientElement);
            validateIngredients();
        });
    }

    function addNewIngredient() {
        const newIngredient = document.createElement('div');
        newIngredient.classList.add('ingredient');
        newIngredient.innerHTML = `
            <div class="ingredient-fields">
                <input type="text" class="ingredient-quantity" placeholder="Кол-во" />
                <input type="text" class="ingredient-unit" placeholder="Ед. изм." />
                <input type="text" class="ingredient-name" placeholder="Ингредиент" />
                <button class="remove-ingredient">➖</button>
            </div>
            <div class="ingredient-error" style="color: red; font-size: 12px; display: none;"></div>
        `;
        ingredientsList.appendChild(newIngredient);

        // Назначаем обработчики для нового ингредиента
        attachValidationHandlers(newIngredient);
        attachRemoveIngredientHandler(newIngredient);
    }

    function attachValidationHandlers(ingredientElement) {
        const quantityInput = ingredientElement.querySelector('.ingredient-quantity');
        const unitInput = ingredientElement.querySelector('.ingredient-unit');

        quantityInput.addEventListener('input', validateIngredients);
        unitInput.addEventListener('input', validateIngredients);
    }

    function clearErrors(ingredientElement) {
        const errorContainer = ingredientElement.querySelector('.ingredient-error');
        if (errorContainer) {
            errorContainer.innerHTML = ''; // Очищаем все сообщения об ошибках
            errorContainer.style.display = 'none'; // Скрываем контейнер
        }
    }

    function addError(ingredientElement, message) {
        const errorContainer = ingredientElement.querySelector('.ingredient-error');
        if (errorContainer) {
            const errorElement = document.createElement('div'); // Создаем новый элемент для ошибки
            errorElement.textContent = message;
            errorElement.style.fontSize = '12px'; // Меньший шрифт
            errorContainer.appendChild(errorElement); // Добавляем ошибку в контейнер
            errorContainer.style.display = 'block'; // Показываем контейнер
        }
    }

    function validateIngredients() {
        let isValid = true;

        document.querySelectorAll('.ingredient').forEach((ingredientElement) => {
            clearErrors(ingredientElement);

            const quantityInput = ingredientElement.querySelector('.ingredient-quantity');
            const unitInput = ingredientElement.querySelector('.ingredient-unit');

            const quantityValue = quantityInput.value.trim();
            const unitValue = unitInput.value.trim();

            if (quantityValue && isNaN(quantityValue)) {
                addError(ingredientElement, 'Количество должно быть числом.');
                isValid = false;
            }

            if (unitValue && /\d/.test(unitValue)) {
                addError(ingredientElement, 'Единица измерения не должна содержать цифр.');
                isValid = false;
            }
        });

        return isValid;
    }

    addIngredientButton.addEventListener('click', () => {
        addNewIngredient();
    });

    document.querySelectorAll('.ingredient').forEach((ingredient) => {
        attachValidationHandlers(ingredient);
        attachRemoveIngredientHandler(ingredient);
    });

    // Публикация рецепта
    const publishButton = document.getElementById('publish-recipe');
    publishButton.addEventListener('click', async () => {
        if (!validateIngredients()) {
            alert('Пожалуйста, исправьте ошибки в форме.');
            return;
        }

        try {
            const formData = new FormData();

            // Главное изображение
            if (!mainPhotoInput.files.length) {
                alert('Пожалуйста, загрузите главное изображение.');
                return;
            }
            formData.append('main_photo', mainPhotoInput.files[0]);

            // Название и описание
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

            // Шаги
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

            // Отправка данных на сервер
            const response = await fetch('/create_recipe/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            const result = await response.json();
            if (result.success) {
                alert('Рецепт успешно опубликован!');
                window.location.href = '/';
            } else {
                alert('Ошибка при публикации рецепта: ' + result.message);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при отправке данных.');
        }
    });

    // Получение CSRF-токена
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