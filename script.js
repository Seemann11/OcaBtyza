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

    // Переносим функции синхронизации с localStorage в общий скрипт
    const defaultTrains = [
        { number: '016А "Арктика"', departure: '00:45', arrival: '09:15', duration: '8ч 30м', price: 3450 }, 
        { number: '742В "Ласточка"', departure: '06:50', arrival: '11:20', duration: '4ч 30м', price: 1890 },
        { number: '154Г "Экспресс"', departure: '14:10', arrival: '20:40', duration: '6ч 30м', price: 2700 },
        { number: '032Г "Премиум"', departure: '23:30', arrival: '07:00', duration: '7ч 30м', price: 4200 }
    ];

    function getTrains() {
        let appTrains = localStorage.getItem('global_trains');
        if (!appTrains) {
            localStorage.setItem('global_trains', JSON.stringify(defaultTrains));
            return defaultTrains;
        }
        return JSON.parse(appTrains);
    }

    // Обработчик отправки формы поиска (берет данные из localStorage)
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fromCity = fromInput.value.trim();
            const toCity = toInput.value.trim();
            const rawDate = dateInput.value; 
            let formattedDate = 'Не указана'; 
            if (rawDate) {
                formattedDate = new Date(rawDate + 'T00:00:00').toLocaleDateString('ru-RU', { 
                    day: 'numeric', month: 'long' });
            }

            const currentTrains = getTrains();

            if (resultsSection && ticketsContainer && resultsCount) {
                resultsSection.classList.remove('hidden');
                ticketsContainer.innerHTML = ''; 
                resultsCount.textContent = `Найдено рейсов: ${currentTrains.length}`;

                currentTrains.forEach((train, index) => {
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
                        selectSeatsFlow(train, fromCity, toCity, formattedDate, rawDate);
                    });

                    ticketCard.querySelector('.buy-box').appendChild(buyBtn);
                    ticketsContainer.appendChild(ticketCard);
                });

                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

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

        document.querySelector('.hero').classList.add('hidden');
        document.querySelector('.search-section').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');

        let seatSection = document.getElementById('seat-selection-section');
        if (!seatSection) {
            seatSection = document.createElement('section');
            seatSection.id = 'seat-selection-section';
            seatSection.className = 'search-section'; 
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
        <div><span style="display:inline-block; width:12px; height:12px; background:#e8f0fe; border:1px solid #1a73e8; border-radius:3px;"></span> Свободно</div>
        <div><span style="display:inline-block; width:12px; height:12px; background:#dadce0; border:1px solid #5f6368; border-radius:3px;"></span> Занято</div>
        <div><span style="display:inline-block; width:12px; height:12px; background:#00c853; border-radius:3px;"></span> Выбрано</div>
      </div>
      <div id="seats-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; max-width: 400px;">
        <!-- Места сгенерируются кодом ниже -->
      </div>
    </div>
    
    <button id="checkout-btn" class="submit-btn" style="width: 100%;" disabled>Оформить билет</button>
  `;

  // Повторно привязываем события, так как innerHTML перезаписал старые элементы
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
    
    for (let i = 1; i <= 32; i++) {
      const seatBtn = document.createElement('button');
      seatBtn.type = 'button';
      seatBtn.textContent = i;
      seatBtn.style.cssText = 'height: 40px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s;';
      
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
          const prevSelected = seatsGrid.querySelector('.selected-seat');
          if (prevSelected) {
            prevSelected.classList.remove('selected-seat');
            prevSelected.style.background = '#e8f0fe';
            prevSelected.style.color = '#1a73e8';
          }
          seatBtn.classList.add('selected-seat');
          seatBtn.style.background = '#00c853';
          seatBtn.style.color = '#fff';
          currentBooking.selectedSeat = i;
          checkoutBtn.disabled = false;
        });
      }
      seatsGrid.appendChild(seatBtn);
    }
  });

  checkoutBtn.addEventListener('click', () => {
    renderPassengerForm();
  });
}

function renderPassengerForm() {
  const seatSection = document.getElementById('seat-selection-section');
  seatSection.innerHTML = `
    <button id="back-to-seats-btn" class="buy-btn" style="background-color: var(--border-color); color: var(--text-main); margin-bottom: 20px;">← Назад к выбору мест</button>
    
    <div style="background: var(--card-bg); padding: 24px; border-radius: var(--radius); border: 1px solid var(--border-color);">
      <h2 style="font-size: 20px; margin-bottom: 20px;">Оформление билета и оплата</h2>
      
      <form id="checkout-form" style="display: flex; flex-direction: column; gap: 20px;">
        <h3 style="font-size: 16px; color: var(--primary);">Данные пассажира</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="input-group">
            <label>Имя *</label>
            <input type="text" required autocomplete="off" placeholder="Иван">
          </div>
          <div class="input-group">
            <label>Фамилия *</label>
            <input type="text" required autocomplete="off" placeholder="Иванов">
          </div>
        </div>
        <div class="input-group">
          <label>Серия и номер паспорта *</label>
          <input type="text" required autocomplete="off" placeholder="4511 123456">
        </div>
        
        <h3 style="font-size: 16px; color: var(--primary); margin-top: 10px;">Реквизиты карты для оплаты</h3>
        <div class="input-group">
          <label>Номер карты *</label>
          <input type="text" required autocomplete="off" placeholder="2200 0000 0000 0000">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="input-group">
            <label>Срок действия *</label>
            <input type="text" required autocomplete="off" placeholder="12/28">
          </div>
          <div class="input-group">
            <label>CVC/CVV *</label>
            <input type="password" required autocomplete="off" placeholder="***" maxlength="3">
          </div>
        </div>
        
        <button type="submit" id="pay-btn" class="submit-btn" style="margin-top: 10px;">Оплатить ${currentBooking.price} ₽</button>
      </form>
    </div>
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
    
    setTimeout(() => {
      let savedTickets = []; 
      try {
        const existing = localStorage.getItem('user_tickets');
        if (existing) savedTickets = JSON.parse(existing);
      } catch (ex) {
        savedTickets = [];
      }
      
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
      
      alert(`Успешно! Билет на поезд ${currentBooking.trainNumber} (Вагон ${currentBooking.selectedWagon}, Место ${currentBooking.selectedSeat}) оформлен и оплачен.\n\nВсе необходимые данные и электронный чек были отправлены на вашу почту.\nТакже билет добавлен в ваш Личный Кабинет.`);
      window.location.href = 'dashboard.html';
    }, 1500);
  });
}

window.goToProfile = function(event) {
    if (event) event.preventDefault();
    
    if (localStorage.getItem('user_session_active') === 'true') {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'auth.html';
    }
};

// Закрытие родительского слушателя, например, DOMContentLoaded
}); 

