document.addEventListener('DOMContentLoaded', () => {
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
        attachEnterKeyHandler(newIngredient);

        // Устанавливаем фокус на поле "Кол-во" нового ингредиента
        const quantityInput = newIngredient.querySelector('.ingredient-quantity');
        quantityInput.focus();
    }

    function attachEnterKeyHandler(ingredientElement) {
        const inputs = ingredientElement.querySelectorAll('.ingredient-quantity, .ingredient-unit, .ingredient-name');
        inputs.forEach((input) => {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Предотвращаем стандартное поведение
                    const allIngredients = document.querySelectorAll('.ingredient');
                    const lastIngredient = allIngredients[allIngredients.length - 1];
                    if (
                        input.classList.contains('ingredient-name') &&
                        input.closest('.ingredient') === lastIngredient
                    ) {
                        addNewIngredient();
                    } else {
                        input.blur(); // Снимаем фокус с текущего элемента
                    }
                }
            });

            // Добавляем обработчик для динамической проверки
            input.addEventListener('input', () => {
                validateIngredientField(input, ingredientElement);
            });
        });
    }

    function attachValidationHandlers(ingredientElement) {
        const quantityInput = ingredientElement.querySelector('.ingredient-quantity');
        const unitInput = ingredientElement.querySelector('.ingredient-unit');

        [quantityInput, unitInput].forEach((input) => {
            input.addEventListener('input', () => {
                validateIngredientField(input, ingredientElement);
            });
        });
    }

    function validateIngredientField(input, ingredientElement) {
        clearErrors(ingredientElement);

        if (input.classList.contains('ingredient-quantity')) {
            const value = input.value.trim();
            if (value && isNaN(value)) {
                addError(ingredientElement, 'Количество должно быть числом.');
            }
        } else if (input.classList.contains('ingredient-unit')) {
            const value = input.value.trim();
            if (value && /\d/.test(value)) {
                addError(ingredientElement, 'Единица измерения не должна содержать цифр.');
            }
        }
    }

    function clearErrors(ingredientElement) {
        const errorContainer = ingredientElement.querySelector('.ingredient-error');
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }
    }

    function addError(ingredientElement, message) {
        const errorContainer = ingredientElement.querySelector('.ingredient-error');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
    }

    function validateIngredients() {
        let isValid = true;
        document.querySelectorAll('.ingredient').forEach((ingredientElement) => {
            const quantityInput = ingredientElement.querySelector('.ingredient-quantity');
            const unitInput = ingredientElement.querySelector('.ingredient-unit');
            const nameInput = ingredientElement.querySelector('.ingredient-name');

            validateIngredientField(quantityInput, ingredientElement);
            validateIngredientField(unitInput, ingredientElement);

            const quantityValue = quantityInput.value.trim();
            const unitValue = unitInput.value.trim();
            const nameValue = nameInput.value.trim();

            if (!quantityValue || !unitValue || !nameValue) {
                addError(ingredientElement, 'Заполните все поля ингредиента.');
                isValid = false;
            }
        });

        const ingredientsError = document.getElementById('ingredients-error');
        if (isValid && document.querySelectorAll('.ingredient').length === 0) {
            ingredientsError.style.display = 'block';
            isValid = false;
        } else {
            ingredientsError.style.display = 'none';
        }

        return isValid;
    }

    // Обработчик кнопки "Добавить ингредиент"
    addIngredientButton.addEventListener('click', () => {
        addNewIngredient();
    });

    // Инициализация обработчиков для существующих ингредиентов
    document.querySelectorAll('.ingredient').forEach((ingredient) => {
        attachValidationHandlers(ingredient);
        attachRemoveIngredientHandler(ingredient);
        attachEnterKeyHandler(ingredient);
    });

    // Главная фотография
    const mainPhotoInput = document.getElementById('main-photo');
    const mainPhotoPreview = document.getElementById('main-photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoError = document.getElementById('photo-error');
    const mainPhotoError = document.getElementById('main-photo-error');

    mainPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                photoError.style.display = 'block';
                mainPhotoError.style.display = 'none';
                return;
            }
            photoError.style.display = 'none';
            mainPhotoError.style.display = 'none'; // Убираем ошибку при выборе файла
            const reader = new FileReader();
            reader.onload = (e) => {
                mainPhotoPreview.src = e.target.result;
                mainPhotoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
                document.querySelector('.photo-label').style.border = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            mainPhotoError.style.display = 'block';
        }
    });

    // Шаги приготовления
    const stepsContainer = document.getElementById('steps-container');
    const addStepButton = document.getElementById('add-step');
    const stepsError = document.getElementById('steps-error');

    function initializeStepHandlers(stepElement) {
        attachRemoveStepHandler(stepElement);

        const stepPhotoInput = stepElement.querySelector('.step-photo');
        const stepPhotoPreview = stepElement.querySelector('.step-photo-label img');
        const stepPhotoPlaceholder = stepElement.querySelector('.step-photo-label span');
        const stepDescriptionError = stepElement.querySelector('.step-description-error');
        const stepPhotoError = stepElement.querySelector('.step-photo-error');
        const stepPhotoLabel = stepElement.querySelector('.step-photo-label');

        const descriptionInput = stepElement.querySelector('.step-description');
        descriptionInput.addEventListener('input', () => {
            stepDescriptionError.style.display = 'none'; // Убираем ошибку при вводе
        });

        stepPhotoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('Ошибка: Размер файла превышает 10 МБ.');
                    return;
                }
                stepPhotoError.style.display = 'none'; // Убираем ошибку при выборе файла
                const reader = new FileReader();
                reader.onload = (e) => {
                    stepPhotoPreview.src = e.target.result;
                    stepPhotoPreview.style.display = 'block';
                    stepPhotoPlaceholder.style.display = 'none';
                    stepPhotoLabel.classList.add('no-border');
                };
                reader.readAsDataURL(file);
            } else {
                stepPhotoError.style.display = 'block'; // Показываем ошибку, если файл не выбран
                stepPhotoPreview.style.display = 'none';
                stepPhotoPlaceholder.style.display = 'block';
                stepPhotoLabel.classList.remove('no-border');
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
        const stepIndex = document.querySelectorAll('.step').length + 1; // Номер нового шага
        newStep.innerHTML = `
            <div class="step-header">
                <span>Шаг ${stepIndex}</span>
                <button class="remove-step" title="Удалить шаг">➖</button>
            </div>
            <div class="step-content">
                <div class="step-description-container">
                    <textarea class="step-description" rows="3" placeholder="Описание шага"></textarea>
                    <div class="step-description-error" style="color: red; font-size: 12px; display: none;">Добавьте описание шага.</div>
                </div>
                <div class="step-photo-container">
                    <label for="step-photo-${stepIndex}" class="step-photo-label">
                        <img id="step-photo-preview-${stepIndex}" src="#" alt="Фото шага" style="display: none;" />
                        <span id="step-photo-placeholder-${stepIndex}">+</span>
                    </label>
                    <input type="file" id="step-photo-${stepIndex}" accept="image/*" class="step-photo" style="display: none;" />
                    <div class="step-photo-error" style="color: red; font-size: 12px; display: none;">Добавьте изображение для шага.</div>
                </div>
            </div>
        `;
        stepsContainer.appendChild(newStep);
        initializeStepHandlers(newStep);

        // Убираем ошибку "Добавьте хотя бы один шаг с описанием и изображением"
        stepsError.style.display = 'none';
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

    // Публикация рецепта
    const publishButton = document.getElementById('publish-recipe');
    const titleInput = document.getElementById('recipe-title');
    const descriptionInput = document.getElementById('recipe-description');
    const titleError = document.getElementById('title-error');
    const descriptionError = document.getElementById('description-error');

    titleInput.addEventListener('input', () => {
        titleError.style.display = 'none'; // Убираем ошибку при вводе
    });

    descriptionInput.addEventListener('input', () => {
        descriptionError.style.display = 'none'; // Убираем ошибку при вводе
    });

    publishButton.addEventListener('click', async () => {
        let isValid = true;

        // Сброс всех ошибок
        clearAllErrors();

        // Валидация названия рецепта
        const title = titleInput.value.trim();
        if (!title) {
            titleError.style.display = 'block';
            isValid = false;
        }

        // Валидация описания рецепта
        const description = descriptionInput.value.trim();
        if (!description) {
            descriptionError.style.display = 'block';
            isValid = false;
        }

        // Валидация ингредиентов
        if (!validateIngredients()) {
            isValid = false;
        }

        // Валидация главной фотографии
        if (!mainPhotoInput.files.length) {
            mainPhotoError.style.display = 'block';
            isValid = false;
        }

        // Валидация шагов
        const steps = [];
        document.querySelectorAll('.step').forEach((stepElement) => {
            const descriptionInput = stepElement.querySelector('.step-description');
            const photoInput = stepElement.querySelector('.step-photo');
            const stepDescriptionError = stepElement.querySelector('.step-description-error');
            const stepPhotoError = stepElement.querySelector('.step-photo-error');
            const descriptionValue = descriptionInput.value.trim();
            if (!descriptionValue) {
                stepDescriptionError.style.display = 'block';
                isValid = false;
            }
            if (!photoInput.files.length) {
                stepPhotoError.style.display = 'block';
                isValid = false;
            }
            if (descriptionValue && photoInput.files.length > 0) {
                steps.push({ description: descriptionValue, photo: photoInput.files[0] });
            }
        });

        if (steps.length === 0) {
            stepsError.style.display = 'block';
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Отправка данных на сервер
        try {
            const formData = new FormData();
            formData.append('main_photo', mainPhotoInput.files[0]);
            formData.append('title', title);
            formData.append('description', description);

            const ingredients = [];
            document.querySelectorAll('.ingredient').forEach((ingredientElement) => {
                const quantity = ingredientElement.querySelector('.ingredient-quantity').value.trim();
                const unit = ingredientElement.querySelector('.ingredient-unit').value.trim();
                const name = ingredientElement.querySelector('.ingredient-name').value.trim();
                ingredients.push({ quantity, unit, name });
            });
            formData.append('ingredients', JSON.stringify(ingredients));

            steps.forEach((step, index) => {
                formData.append(`step_${index}_description`, step.description);
                formData.append(`step_${index}_photo`, step.photo);
            });

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

    function clearAllErrors() {
        document.querySelectorAll('.ingredient-error, #ingredients-error, #title-error, #description-error, #main-photo-error, .step-description-error, .step-photo-error, #steps-error').forEach((error) => {
            error.style.display = 'none';
        });
    }

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