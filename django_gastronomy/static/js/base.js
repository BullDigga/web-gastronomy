document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    if (!searchInput || !searchButton) {
        console.error('Элементы поиска не найдены.');
        return;
    }

    // Отображение/скрытие кнопки "Найти"
    searchInput.addEventListener('input', function () {
        if (searchInput.value.trim().length > 0) {
            searchButton.classList.remove('hidden');
        } else {
            searchButton.classList.add('hidden');
        }
    });

    // Обработка нажатия на кнопку "Найти"
    searchButton.addEventListener('click', function () {
        const query = searchInput.value.trim();
        if (query.length > 0) {
            window.location.href = `/recipes/?q=${encodeURIComponent(query)}`;
        }
    });

    // Обработка нажатия клавиши Enter
    searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                window.location.href = `/recipes/?q=${encodeURIComponent(query)}`;
            }
        }
    });
});