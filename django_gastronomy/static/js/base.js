document.addEventListener('DOMContentLoaded', function () {
    const radioPlayer = document.getElementById('radioPlayer');
    const playPauseImage = document.getElementById('playPauseImage'); // Изображение кнопки Play/Pause
    const volumeControl = document.getElementById('volumeControl');

    // Получаем пути к изображениям из атрибутов data-*
    const playSrc = playPauseImage.getAttribute('data-play-src');
    const pauseSrc = playPauseImage.getAttribute('data-pause-src');

    let isPlaying = false;

    // Переключение состояния кнопки (Play/Pause)
    playPauseImage.addEventListener('click', () => {
        if (isPlaying) {
            radioPlayer.pause();
            playPauseImage.src = playSrc; // Меняем на "Play"
        } else {
            radioPlayer.play();
            playPauseImage.src = pauseSrc; // Меняем на "Pause"
        }
        isPlaying = !isPlaying;
    });

    // Регулировка громкости
    volumeControl.addEventListener('input', () => {
        radioPlayer.volume = volumeControl.value;
    });
});