document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const searchForm = document.getElementById('search-form');
    const swapBtn = document.getElementById('swap-btn');
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const resultsSection = document.getElementById('results-section');
    const ticketsContainer = document.getElementById('tickets-container');
    const resultsCount = document.getElementById('results-count');

    // Установка сегодняшней даты в календарь
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
        // Массив из 7 городов для выбора
    const availableCities = [
        "Москва",
        "Санкт-Петербург",
        "Новосибирск",
        "Екатеринбург",
        "Казань",
        "Нижний Новгород",
        "Владивосток"
    ];

    const fromList = document.getElementById('from-list');
    const toList = document.getElementById('to-list');

    // Функция обновления списка "Куда" на основе выбранного "Откуда"
    function updateToCityOptions() {
        if (!toList || !fromInput) return;
        
        const selectedFrom = fromInput.value.trim();
        toList.innerHTML = ''; // Очищаем старые варианты

        availableCities.forEach(city => {
            // Если город совпадает с выбранным в "Откуда", пропускаем его
            if (city === selectedFrom) return;

            const option = document.createElement('option');
            option.value = city;
            toList.appendChild(option);
        });
    }

    // Слушаем изменения в поле "Откуда"
    if (fromInput) {
        fromInput.addEventListener('input', updateToCityOptions);
        fromInput.addEventListener('change', updateToCityOptions);
    }

    // Дополнительно обновляем список, если города поменяли местами через кнопку
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            setTimeout(updateToCityOptions, 50); // Небольшая задержка, чтобы значения успели поменяться
        });
    }

    // Инициализируем список при первой загрузке страницы
    updateToCityOptions();


    if (swapBtn && fromInput && toInput) {
        swapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const temp = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temp;
        });
    }

    const mockTrains = [
        { number: '016А "Арктика"', departure: '00:45', arrival: '09:15', duration: '8ч 30м', price: 3450 },
        { number: '742В "Ласточка"', departure: '06:50', arrival: '11:20', duration: '4ч 30м', price: 1890 },
        { number: '154Г "Экспресс"', departure: '14:10', arrival: '20:40', duration: '6ч 30м', price: 2700 },
        { number: '032Г "Премиум"', departure: '23:30', arrival: '07:00', duration: '7ч 30м', price: 4200 }
    ];

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fromCity = fromInput.value.trim();
            const toCity = toInput.value.trim();
            const rawDate = dateInput.value;
            let formattedDate = 'Не указана';
            if (rawDate) {
                formattedDate = new Date(rawDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            }

            if (resultsSection && ticketsContainer && resultsCount) {
                resultsSection.classList.remove('hidden');
                ticketsContainer.innerHTML = '';
                resultsCount.textContent = `Найдено рейсов: ${mockTrains.length}`;
                
                mockTrains.forEach((train, index) => {
                    const ticketCard = document.createElement('div');
                    ticketCard.className = 'ticket-card';
                    ticketCard.style.animationDelay = `${index * 0.1}s`; 
                    ticketCard.innerHTML = `
                        <div class="train-info">
                            <div class="train-number">${train.number}</div>
                            <div class="train-route">${fromCity} — ${toCity}</div>
                            <div style="font-size: 13px; color: var(--primary); font-weight: 500; margin-top: 4px;">${formattedDate}</div>
                        </div>
                        <div class="route-info">
                            <div class="time-box">
                                <div class="time">${train.departure}</div>
                                <div class="station">${fromCity}</div>
                            </div>
                            <div class="duration-line">
                                <span class="time-en-route">${train.duration}</span>
                                <span class="line"></span>
                            </div>
                            <div class="time-box">
                                <div class="time">${train.arrival}</div>
                                <div class="station">${toCity}</div>
                            </div>
                        </div>
                        <div class="buy-box">
                            <div class="price" style="margin-bottom: 8px;">${train.price} ₽</div>
                        </div>
                    `;
                    const buyBtn = document.createElement('button');
                    buyBtn.className = 'buy-btn';
                    buyBtn.style.width = '100%';
                    buyBtn.type = 'button';
                    buyBtn.textContent = 'Выбрать';
                    buyBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        // Вызываем логику выбора мест вместо мгновенной покупки
                        selectSeatsFlow(train, fromCity, toCity, formattedDate, rawDate);
                    });
                    ticketCard.querySelector('.buy-box').appendChild(buyBtn);
                    ticketsContainer.appendChild(ticketCard);
                });
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

// Глобальный объект для хранения данных текущего бронирования
let currentBooking = null;

function selectSeatsFlow(train, fromCity, toCity, ticketDate, rawDate) {
    if (localStorage.getItem('user_session_active') !== 'true') {
        alert('Для выбора мест и покупки билета необходимо авторизоваться в личном кабинете.');
        window.location.href = 'auth.html';
        return;
    }

    currentBooking = {
        trainNumber: train.number,
        price: train.price,
        fromCity: fromCity,
        toCity: toCity,
        depTime: train.departure,
        arrTime: train.arrival,
        durationTime: train.duration,
        ticketDate: ticketDate,
        rawDate: rawDate,
        selectedWagon: null,
        selectedSeat: null
    };

    // Скрываем главный контент поиска и показываем экран выбора мест
    document.querySelector('.hero').classList.add('hidden');
    document.querySelector('.search-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    
    let seatSection = document.getElementById('seat-selection-section');
    if (!seatSection) {
        seatSection = document.createElement('section');
        seatSection.id = 'seat-selection-section';
        seatSection.className = 'search-section'; // используем существующий класс для карточного стиля
        document.querySelector('.main').appendChild(seatSection);
    }
    seatSection.classList.remove('hidden');

    renderSeatSelection();
}

function renderSeatSelection() {
    const seatSection = document.getElementById('seat-selection-section');
    
    seatSection.innerHTML = `
        <button id="back-to-search-btn" class="buy-btn" style="background-color: var(--border-color); color: var(--text-main); margin-bottom: 20px;">← Назад к поиску</button>
        
        <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="font-size: 22px; color: var(--primary);">${currentBooking.trainNumber}</h2>
            <p style="font-weight: 600; margin-top: 5px;">Маршрут: ${currentBooking.fromCity} — ${currentBooking.toCity}</p>
            <p style="color: var(--text-muted); font-size: 14px;">Дата отправления: ${currentBooking.ticketDate} в ${currentBooking.depTime}</p>
        </div>

        <div style="margin-bottom: 20px;">
            <label style="font-weight: 600; display: block; margin-bottom: 8px;">Выберите вагон:</label>
            <select id="wagon-select" style="height: 40px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 15px; width: 200px;">
                <option value="">-- Не выбран --</option>
                <option value="02">Вагон 02 (Купе)</option>
                <option value="05">Вагон 05 (Плацкарт)</option>
                <option value="06">Вагон 06 (Плацкарт)</option>
            </select>
        </div>

        <div id="seats-map-container" class="hidden" style="margin-bottom: 30px;">
            <label style="font-weight: 600; display: block; margin-bottom: 12px;">Выберите место на схеме вагона:</label>
            <div style="display: flex; gap: 15px; margin-bottom: 15px; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:20px; height:20px; background:#e8f0fe; border:1px solid #1a73e8; border-radius:4px;"></span> Свободно</div>
                <div style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:20px; height:20px; background:#dadce0; border:1px solid #5f6368; border-radius:4px;"></span> Занято</div>
                <div style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:20px; height:20px; background:#00c853; border:1px solid #00c853; border-radius:4px;"></span> Выбрано</div>
            </div>
            <div id="seats-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color); max-width: 500px;"></div>
        </div>

        <button id="checkout-btn" class="submit-btn" style="width: 100%;" disabled>Оформить билет</button>
    `;

    // Обработчик кнопки назад
    document.getElementById('back-to-search-btn').addEventListener('click', () => {
        seatSection.classList.add('hidden');
        document.querySelector('.hero').classList.remove('hidden');
        document.querySelector('.search-section').classList.remove('hidden');
        document.getElementById('results-section').classList.remove('hidden');
    });

    const wagonSelect = document.getElementById('wagon-select');
    const seatsMapContainer = document.getElementById('seats-map-container');
    const seatsGrid = document.getElementById('seats-grid');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Логика выбора вагона
    wagonSelect.addEventListener('change', (e) => {
        const wagon = e.target.value;
        currentBooking.selectedWagon = wagon;
        currentBooking.selectedSeat = null;
        checkoutBtn.disabled = true;

        if (!wagon) {
            seatsMapContainer.classList.add('hidden');
        return;
    }

    seatsMapContainer.classList.remove('hidden');
    seatsGrid.innerHTML = '';

    // Генерируем 32 места (интерактивные кнопки-кресла)
    for (let i = 1; i <= 32; i++) {
        const seatBtn = document.createElement('button');
        seatBtn.type = 'button';
        seatBtn.textContent = i;
        seatBtn.style.cssText = 'height: 40px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;';

        // Имитация занятости: каждое третье место случайно занято
        const isOccupied = (i * 7) % 3 === 0;

        if (isOccupied) {
            seatBtn.style.background = '#dadce0';
            seatBtn.style.color = '#5f6368';
            seatBtn.style.border = '1px solid #5f6368';
            seatBtn.disabled = true;
            seatBtn.title = "Место занято";
        } else {
            seatBtn.style.background = '#e8f0fe';
            seatBtn.style.color = '#1a73e8';
            seatBtn.style.border = '1px solid #1a73e8';

            seatBtn.addEventListener('click', () => {
                // Снимаем выделение с предыдущего выбранного места
                const prevSelected = seatsGrid.querySelector('.selected-seat');
                if (prevSelected) {
                    prevSelected.classList.remove('selected-seat');
                    prevSelected.style.background = '#e8f0fe';
                    prevSelected.style.color = '#1a73e8';
                }

                // Выделяем текущее место
                seatBtn.classList.add('selected-seat');
                seatBtn.style.background = '#00c853';
                seatBtn.style.color = '#fff';

                currentBooking.selectedSeat = i;
                checkoutBtn.disabled = false; // Кнопка становится активной
            });
        }
        seatsGrid.appendChild(seatBtn);
    }
});

// Переход к форме ввода данных пассажира
checkoutBtn.addEventListener('click', () => {
    renderPassengerForm();
});
}

function renderPassengerForm() {
    const seatSection = document.getElementById('seat-selection-section');
    seatSection.innerHTML = `
        <button id="back-to-seats-btn" class="buy-btn" style="background-color: var(--border-color); color: var(--text-main); margin-bottom: 20px;">← Назад к выбору мест</button>
        
        <h2 style="font-size: 22px; margin-bottom: 20px;">Оформление билета и оплата</h2>
        
        <form id="checkout-form" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                <h3 style="font-size: 16px; margin-bottom: 15px; color: var(--primary);">Данные пассажира</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="input-group">
                        <label>Имя <span style="color:#d93025">*</span></label>
                        <input type="text" id="pass-name" placeholder="Иван" required style="height:45px; padding:0 10px; border-radius:6px; border:1px solid var(--border-color);">
                    </div>
                    <div class="input-group">
                        <label>Фамилия <span style="color:#d93025">*</span></label>
                        <input type="text" id="pass-lastname" placeholder="Иванов" required style="height:45px; padding:0 10px; border-radius:6px; border:1px solid var(--border-color);">
                    </div>
                    <div class="input-group" style="grid-column: span 2;">
                        <label>Серия и номер паспорта <span style="color:#d93025">*</span></label>
                        <input type="text" placeholder="4500 123456" required style="height:45px; padding:0 10px; border-radius:6px; border:1px solid var(--border-color);">
                    </div>
                </div>
            </div>

            <div style="background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                <h3 style="font-size: 16px; margin-bottom: 15px; color: var(--primary);">Реквизиты карты для оплаты</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div class="input-group">
                        <label>Номер карты <span style="color:#d93025">*</span></label>
                        <input type="text" placeholder="2200 0000 0000 0000" maxlength="19" required style="height:45px; padding:0 10px; border-radius:6px; border:1px solid var(--border-color);">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="input-group">
                            <label>Срок действия <span style="color:#d93025">*</span></label>
                            <input type="text" placeholder="MM/YY" maxlength="5" required style="height:45px; padding:0 10px; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                        <div class="input-group">
                            <label>CVC/CVV <span style="color:#d93025">*</span></label>
                            <input type="password" placeholder="***" maxlength="3" required style="height:45px; padding:0 10px; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" id="pay-btn" class="submit-btn" style="width: 100%; background-color: var(--accent);">Оплатить ${currentBooking.price} ₽</button>
        </form>
    `;

    document.getElementById('back-to-seats-btn').addEventListener('click', () => {
        renderSeatSelection();
    });

    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const payBtn = document.getElementById('pay-btn');
        payBtn.disabled = true;
        payBtn.textContent = 'Обработка платежа...';

        // Имитация оплаты (тестовая заглушка 1.5 секунды)
        setTimeout(() => {
            let savedTickets = [];
            try {
                const existing = localStorage.getItem('user_tickets');
                if (existing) savedTickets = JSON.parse(existing);
            } catch (ex) {
                savedTickets = [];
            }

            // Формируем финальный билет
            const newTicket = {
                id: Date.now() + Math.random(),
                number: currentBooking.trainNumber,
                from: currentBooking.fromCity,
                to: currentBooking.toCity,
                departure: currentBooking.depTime,
                arrival: currentBooking.arrTime,
                duration: currentBooking.durationTime,
                price: currentBooking.price,
                wagon: currentBooking.selectedWagon,
                seat: currentBooking.selectedSeat,
                date: currentBooking.ticketDate,
                systemDate: currentBooking.rawDate
            };

            savedTickets.unshift(newTicket);
            localStorage.setItem('user_tickets', JSON.stringify(savedTickets));

            // Показываем обновленное уведомление с упоминанием отправки на почту
            alert(`Успешно! Билет на поезд ${currentBooking.trainNumber} (Вагон ${currentBooking.selectedWagon}, Место ${currentBooking.selectedSeat}) оформлен и оплачен.\n\nВсе необходимые данные и электронный чек были отправлены на вашу почту.\nТакже билет добавлен в ваш Личный Кабинет.`);
            
            // Перенаправляем пользователя в Личный Кабинет
            window.location.href = 'dashboard.html';
        }, 1500);
    });
}

function goToProfile(event) {
    if (event) event.preventDefault();
    if (localStorage.getItem('user_session_active') === 'true') {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'auth.html';
    }
}