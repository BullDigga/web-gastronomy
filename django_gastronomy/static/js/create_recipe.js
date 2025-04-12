document.addEventListener('DOMContentLoaded', () => {
    const mainPhotoInput = document.getElementById('main-photo');
    const mainPhotoPreview = document.getElementById('main-photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const cropModal = document.getElementById('crop-modal');
    const cropCanvas = document.getElementById('crop-canvas');
    const confirmCropButton = document.getElementById('confirm-crop');
    const cancelCropButton = document.getElementById('cancel-crop');
    let originalImage = null; // Исходное изображение
    let cropData = { x: 0, y: 0, width: 0, height: 0 }; // Данные для обрезки
    let isDragging = false;
    let activeHandle = null;

    // Функция для открытия модального окна
    function openCropModal(imageSrc, callback) {
        originalImage = new Image();
        originalImage.src = imageSrc;
        originalImage.onload = () => {
            cropModal.style.display = 'flex'; // Показываем модальное окно
            const canvas = cropCanvas;
            const ctx = canvas.getContext('2d');
            // Устанавливаем размеры холста (соотношение 4:3)
            canvas.width = 800; // Ширина холста
            canvas.height = 600; // Высота холста
            // Рисуем изображение на холсте
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            // Добавляем рамку для выбора области
            addCropFrame(canvas);
        };
        // Подтверждение обрезки
        confirmCropButton.onclick = () => {
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            // Устанавливаем размеры обрезанного холста
            croppedCanvas.width = cropData.width;
            croppedCanvas.height = cropData.height;
            // Рисуем обрезанную область
            croppedCtx.drawImage(
                originalImage,
                cropData.x, cropData.y, cropData.width, cropData.height,
                0, 0, cropData.width, cropData.height
            );
            callback(croppedCanvas.toDataURL()); // Передаем результат обратно через callback
            closeCropModal();
        };
        // Отмена обрезки
        cancelCropButton.onclick = () => {
            closeCropModal();
        };
    }

    // Функция для закрытия модального окна
    function closeCropModal() {
        cropModal.style.display = 'none';
        const ctx = cropCanvas.getContext('2d');
        ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height); // Очищаем холст
    }

    // Функция для добавления рамки выбора
    function addCropFrame(canvas) {
        const ctx = canvas.getContext('2d');
        let frame = { x: 50, y: 50, width: 600, height: 450 }; // Размеры рамки (4:3)
        // Создаем элементы для ручек изменения размеров
        const handles = [
            { id: 'top-left', x: 0, y: 0 },
            { id: 'top-right', x: 0, y: 0 },
            { id: 'bottom-left', x: 0, y: 0 },
            { id: 'bottom-right', x: 0, y: 0 }
        ];
        handles.forEach(handle => {
            const handleElement = document.createElement('div');
            handleElement.style.position = 'absolute';
            handleElement.style.width = '10px';
            handleElement.style.height = '10px';
            handleElement.style.backgroundColor = 'red';
            handleElement.style.cursor = 'pointer';
            handleElement.style.borderRadius = '50%';
            canvas.parentElement.appendChild(handleElement);
        });
        // Обработчик для перетаскивания рамки
        let offsetX = 0, offsetY = 0;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            if (
                mouseX >= frame.x && mouseX <= frame.x + frame.width &&
                mouseY >= frame.y && mouseY <= frame.y + frame.height
            ) {
                isDragging = true;
                offsetX = mouseX - frame.x;
                offsetY = mouseY - frame.y;
            }
            // Проверка нажатия на ручку изменения размеров
            handles.forEach((handle, index) => {
                const handleX = frame.x + (index === 1 || index === 3 ? frame.width : 0) - 5;
                const handleY = frame.y + (index === 2 || index === 3 ? frame.height : 0) - 5;
                if (
                    mouseX >= handleX && mouseX <= handleX + 10 &&
                    mouseY >= handleY && mouseY <= handleY + 10
                ) {
                    activeHandle = index;
                }
            });
        });
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            if (isDragging) {
                frame.x = mouseX - offsetX;
                frame.y = mouseY - offsetY;
                // Ограничение движения рамки в пределах холста
                frame.x = Math.max(0, Math.min(canvas.width - frame.width, frame.x));
                frame.y = Math.max(0, Math.min(canvas.height - frame.height, frame.y));
                redrawFrame(ctx, frame, handles);
            }
            if (activeHandle !== null) {
                const handle = handles[activeHandle];
                switch (activeHandle) {
                    case 0: // Верхний левый угол
                        frame.x = Math.min(mouseX, frame.x + frame.width);
                        frame.y = Math.min(mouseY, frame.y + frame.height);
                        frame.width = Math.abs(frame.x + frame.width - mouseX);
                        frame.height = (frame.width * 3) / 4;
                        break;
                    case 1: // Верхний правый угол
                        frame.y = Math.min(mouseY, frame.y + frame.height);
                        frame.width = Math.abs(mouseX - frame.x);
                        frame.height = (frame.width * 3) / 4;
                        break;
                    case 2: // Нижний левый угол
                        frame.x = Math.min(mouseX, frame.x + frame.width);
                        frame.width = Math.abs(frame.x + frame.width - mouseX);
                        frame.height = Math.abs(mouseY - frame.y);
                        break;
                    case 3: // Нижний правый угол
                        frame.width = Math.abs(mouseX - frame.x);
                        frame.height = (frame.width * 3) / 4;
                        break;
                }
                // Ограничиваем рамку в пределах холста
                frame.x = Math.max(0, Math.min(canvas.width - frame.width, frame.x));
                frame.y = Math.max(0, Math.min(canvas.height - frame.height, frame.y));
                redrawFrame(ctx, frame, handles);
            }
        });
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            activeHandle = null;
        });
        // Начальная отрисовка рамки
        redrawFrame(ctx, frame, handles);
        function redrawFrame(ctx, frame, handles) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            // Рисуем рамку
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
            // Обновляем позиции ручек
            handles.forEach((handle, index) => {
                const handleX = frame.x + (index === 1 || index === 3 ? frame.width : 0) - 5;
                const handleY = frame.y + (index === 2 || index === 3 ? frame.height : 0) - 5;
                const handleElement = canvas.parentElement.children[index];
                handleElement.style.left = `${handleX}px`;
                handleElement.style.top = `${handleY}px`;
            });
            // Сохраняем данные для обрезки
            cropData = {
                x: (frame.x / canvas.width) * originalImage.width,
                y: (frame.y / canvas.height) * originalImage.height,
                width: (frame.width / canvas.width) * originalImage.width,
                height: (frame.height / canvas.height) * originalImage.height
            };
        }
    }

    // Обработка загрузки главной фотографии
    mainPhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                openCropModal(e.target.result, (croppedImage) => {
                    mainPhotoPreview.src = croppedImage; // Устанавливаем обрезанное изображение
                    mainPhotoPreview.style.display = 'block';
                    photoPlaceholder.style.display = 'none';
                    // Убираем рамку .photo-label
                    const photoLabel = document.querySelector('.photo-label');
                    photoLabel.style.border = 'none';
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Обработка добавления новых шагов
    const stepsContainer = document.getElementById('steps-container');
    const addStepButton = document.getElementById('add-step');

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
                <button class="remove-step">➖</button>
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

        // Назначаем обработчик для нового шага
        attachRemoveStepHandler(newStep);

        const stepPhotoInput = newStep.querySelector('.step-photo');
        const stepPhotoPreview = newStep.querySelector('.step-photo-label img');
        const stepPhotoPlaceholder = newStep.querySelector('.step-photo-label span');

        stepPhotoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    openCropModal(e.target.result, (croppedImage) => {
                        stepPhotoPreview.src = croppedImage;
                        stepPhotoPreview.style.display = 'block';
                        stepPhotoPlaceholder.style.display = 'none';
                        // Убираем рамку .step-photo-label
                        const stepPhotoLabel = newStep.querySelector('.step-photo-label');
                        stepPhotoLabel.style.border = 'none';
                    });
                };
                reader.readAsDataURL(file);
            }
        });
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
    addNewStep();
    renumberSteps();

    // Назначение обработчиков для существующих шагов
    document.querySelectorAll('.step').forEach((step) => {
        attachRemoveStepHandler(step);
    });
});