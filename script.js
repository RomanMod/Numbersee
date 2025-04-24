document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово

    // --- Переменные состояния игры ---
    let secretCode = [];
    let attemptsLeft = 100;
    const maxAttempts = 100;
    let gameOver = false;
    const codeLength = 4; // Длина кода (на случай, если захотим изменить)

    // --- Получение элементов DOM ---
    const welcomeMessage = document.getElementById('welcome-message');
    const digitInputs = [
        document.getElementById('digit1'),
        document.getElementById('digit2'),
        document.getElementById('digit3'),
        document.getElementById('digit4')
    ];
    const submitButton = document.getElementById('submit-guess');
    const attemptsLeftSpan = document.getElementById('attempts-left');
    const feedbackDiv = document.getElementById('feedback');
    const gameOverMessageDiv = document.getElementById('game-over-message');
    const newGameButton = document.getElementById('new-game-button');
    // const secretCodeDebugSpan = document.getElementById('secret-code-debug'); // Для отладки

    // --- Функции игры ---

    // Генерация секретного кода
    function generateSecretCode() {
        secretCode = [];
        for (let i = 0; i < codeLength; i++) {
            secretCode.push(Math.floor(Math.random() * 10)); // Цифры от 0 до 9
        }
        // console.log("Секретный код:", secretCode.join('')); // Вывод в консоль для отладки
        // secretCodeDebugSpan.textContent = secretCode.join(''); // Показать код в интерфейсе для отладки
    }

    // Начало новой игры
    function startGame() {
        gameOver = false;
        attemptsLeft = maxAttempts;
        generateSecretCode();

        // Сброс интерфейса
        attemptsLeftSpan.textContent = attemptsLeft;
        feedbackDiv.innerHTML = '';
        gameOverMessageDiv.style.display = 'none';
        gameOverMessageDiv.className = 'message'; // Сброс классов сообщения
        newGameButton.style.display = 'none';
        submitButton.disabled = false;
        digitInputs.forEach(input => {
            input.value = '';
            input.disabled = false;
            input.classList.remove('correct-position', 'correct-digit', 'incorrect'); // Сброс стилей инпутов
        });
        digitInputs[0].focus(); // Фокус на первом поле
    }

    // Обработка попытки угадать
    function handleGuess() {
        if (gameOver) return;

        const guess = [];
        let isValid = true;

        // Собираем и проверяем ввод
        digitInputs.forEach(input => {
            const value = input.value.trim();
            if (value === '' || isNaN(value) || value < 0 || value > 9) {
                isValid = false;
            }
            guess.push(parseInt(value, 10)); // Сохраняем как число
        });

        if (!isValid) {
            displayFeedback([{ text: "Пожалуйста, введите 4 цифры от 0 до 9.", type: 'incorrect' }]);
            return;
        }

        attemptsLeft--;
        attemptsLeftSpan.textContent = attemptsLeft;

        // Сравнение догадки с секретным кодом
        const result = checkGuess(guess);
        displayFeedback(result.feedbackText); // Отображаем детальную обратную связь

        // Применяем стили к инпутам на основе результата
        applyInputStyles(result.inputStyles);

        // Проверка на победу
        if (result.correctPosition === codeLength) {
            winGame();
            return; // Выход, чтобы не проверять на проигрыш
        }

        // Проверка на проигрыш (попытки кончились)
        if (attemptsLeft <= 0) {
            loseGameAndRestart();
        }
    }

    // Сравнение догадки и секретного кода
    function checkGuess(guess) {
        let correctPosition = 0;
        let correctDigit = 0;
        const feedbackText = [];
        const inputStyles = []; // Массив для стилей инпутов ('correct-position', 'correct-digit', 'incorrect')

        const secretCodeCopy = [...secretCode]; // Копия для безопасного изменения
        const guessCopy = [...guess];         // Копия для безопасного изменения

        // 1. Проверка на точное совпадение (цифра и позиция)
        for (let i = 0; i < codeLength; i++) {
            if (guessCopy[i] === secretCodeCopy[i]) {
                correctPosition++;
                inputStyles[i] = 'correct-position'; // Стиль для инпута
                // "Удаляем" совпавшие цифры, чтобы не учитывать их во втором проходе
                secretCodeCopy[i] = null;
                guessCopy[i] = null;
            }
        }

        // 2. Проверка на совпадение цифры (но не позиции)
        for (let i = 0; i < codeLength; i++) {
            // Проверяем только те цифры, которые не совпали по позиции
            if (guessCopy[i] !== null) {
                const indexInSecret = secretCodeCopy.indexOf(guessCopy[i]);
                if (indexInSecret !== -1) {
                    correctDigit++;
                    // Если стиль еще не назначен (т.е. не 'correct-position'), ставим 'correct-digit'
                    if (!inputStyles[i]) {
                        inputStyles[i] = 'correct-digit';
                    }
                    // "Удаляем" найденную цифру из секретного кода, чтобы избежать двойного счета
                    secretCodeCopy[indexInSecret] = null;
                } else {
                     // Если стиль еще не назначен, ставим 'incorrect'
                    if (!inputStyles[i]) {
                        inputStyles[i] = 'incorrect';
                    }
                }
            }
        }

        // Формируем текстовую обратную связь
        if (correctPosition > 0) {
            feedbackText.push({ text: `Цифр на своих местах: ${correctPosition}`, type: 'correct-position' });
        }
        if (correctDigit > 0) {
            feedbackText.push({ text: `Правильных цифр не на своих местах: ${correctDigit}`, type: 'correct-digit' });
        }
        if (correctPosition === 0 && correctDigit === 0) {
             feedbackText.push({ text: "Нет совпадений.", type: 'incorrect' });
        }


        return { correctPosition, correctDigit, feedbackText, inputStyles };
    }

    // Отображение обратной связи
    function displayFeedback(feedbackItems) {
        feedbackDiv.innerHTML = ''; // Очищаем предыдущую обратную связь
        feedbackItems.forEach(item => {
            const p = document.createElement('p');
            p.textContent = item.text;
            p.classList.add('feedback-item', item.type); // Добавляем классы для стилизации
            feedbackDiv.appendChild(p);
        });
    }

     // Применение стилей к полям ввода
    function applyInputStyles(styles) {
        digitInputs.forEach((input, index) => {
            // Сначала удаляем все предыдущие классы стилей
            input.classList.remove('correct-position', 'correct-digit', 'incorrect');
            // Добавляем новый класс стиля, если он есть для этого инпута
            if (styles[index]) {
                input.classList.add(styles[index]);
            }
        });
    }


    // Функция при победе
    function winGame() {
        gameOver = true;
        gameOverMessageDiv.textContent = `Поздравляем! Вы угадали код ${secretCode.join('')} за ${maxAttempts - attemptsLeft} попыток!`;
        gameOverMessageDiv.className = 'message win-message'; // Класс для стиля победы
        gameOverMessageDiv.style.display = 'block';
        submitButton.disabled = true;
        digitInputs.forEach(input => input.disabled = true);
        newGameButton.style.display = 'inline-block'; // Показываем кнопку "Новая игра"
        // Опционально: вибрация при победе
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    // Функция при проигрыше и автоматическом рестарте
    function loseGameAndRestart() {
        gameOver = true; // Устанавливаем флаг, но игра сразу начнется заново
        displayFeedback([{ text: `Попытки закончились! Правильный код был: ${secretCode.join('')}. Генерирую новый код...`, type: 'incorrect' }]);

        // Опционально: вибрация при проигрыше
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
        }

        // Небольшая задержка перед рестартом, чтобы игрок успел увидеть сообщение
        setTimeout(() => {
            startGame(); // Автоматически генерируем новый код и сбрасываем игру
        }, 2500); // Задержка в 2.5 секунды
    }

    // --- Настройка обработчиков событий ---

    // Обработка клика по кнопке "Проверить"
    submitButton.addEventListener('click', handleGuess);

    // Обработка нажатия Enter в полях ввода (для удобства)
    digitInputs.forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleGuess();
            }
            // Ограничиваем ввод одной цифрой
            if (input.value.length >= 1 && event.key.length === 1 && !isNaN(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
               // Если в поле уже есть цифра и нажата новая цифра,
               // предотвращаем ввод второй цифры и переходим к следующему полю (если есть)
                const currentIndex = digitInputs.indexOf(input);
                if (currentIndex < digitInputs.length - 1) {
                   event.preventDefault(); // Отменяем ввод второй цифры
                   digitInputs[currentIndex + 1].focus(); // Переход фокуса
                   digitInputs[currentIndex + 1].value = event.key; // Вставляем нажатую цифру в следующее поле
                } else {
                    event.preventDefault(); // Если это последнее поле, просто предотвращаем ввод
                }
            }
        });

        // Автопереход к следующему полю при вводе цифры
        input.addEventListener('input', () => {
            const value = input.value;
            // Удаляем все нецифровые символы
            input.value = value.replace(/[^0-9]/g, '');

             // Ограничиваем длину одной цифрой
            if (input.value.length > 1) {
                input.value = input.value.slice(0, 1);
            }


            if (input.value.length === 1) {
                 // Убираем стили при вводе новой цифры
                input.classList.remove('correct-position', 'correct-digit', 'incorrect');

                const currentIndex = digitInputs.indexOf(input);
                if (currentIndex < digitInputs.length - 1) {
                    digitInputs[currentIndex + 1].focus();
                } else {
                    // Если это последнее поле, можно перевести фокус на кнопку
                    submitButton.focus();
                }
            }
        });

        // Обработка Backspace для перехода к предыдущему полю
         input.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace' && input.value.length === 0) {
                const currentIndex = digitInputs.indexOf(input);
                if (currentIndex > 0) {
                    digitInputs[currentIndex - 1].focus();
                }
            }
        });
    });

    // Обработка клика по кнопке "Новая игра"
    newGameButton.addEventListener('click', startGame);

    // --- Инициализация при загрузке ---

    // Получаем данные пользователя Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) {
        welcomeMessage.textContent = `Привет, ${tg.initDataUnsafe.user.first_name}!`;
    } else {
        welcomeMessage.textContent = 'Привет, Игрок!'; // Запасной вариант
    }

    // Запуск первой игры
    startGame();
});
