let books = [
{name: "Колобок", src: "./books/kolobok.txt", content: ""},
{name: "Антошка, Антошка", src: "./books/antoshka.txt", content: ""},
{name: "Мойдодыр", src: "./books/moidodyr.txt", content: ""}
];

(async function() {
    for (let i = 0; i < books.length; i++) {
        try {
            const response = await fetch(books[i].src);
            if (response.ok) {
                books[i].content = await response.text();
            } else {
                books[i].content = "Файл не найден";
            }
        } catch (error) {
            books[i].content = "Ошибка загрузки";
            console.error(`Ошибка загрузки ${books[i].src}:`, error);
        }
    }
    
    console.log("Книги загружены:", books);
    // Здесь можно вызвать функции для работы с загруженными данными
})();

// Состояние приложения
const state = {
	selectedKana: new Set(),
	settingsKanaType: 'hiragana', // Тип каны в настройках
	displayKanaType: 'hiragana',  // Тип каны на главной вкладке "Каны"
	kanjiLevel: 0,
	selectedText: '',
	isAllKanaSelected: false
};

// Инициализация DOM элементов
document.addEventListener('DOMContentLoaded', () => {
	initializeTabs();
	initializeSettingsTabs();
	initializeTextSelection();
	initializeKanaSettings();
	initializeKanaDisplay();
	initializeKanjiDisplay();
	initializeFileUpload();
	initializeSettingsPanel();
	initializeKanjiSettings();
});

// Основные вкладки
function initializeTabs() {
	document.querySelectorAll('.tab-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const tabId = btn.dataset.tab;
			
			// Обновление активной вкладки
			document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
			document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
			
			btn.classList.add('active');
			document.getElementById(`${tabId}-tab`).classList.add('active');
			
			// При переключении на вкладку "Каны" обновляем отображение
			if (tabId === 'kana') {
				updateKanaDisplay();
			}
		});
	});
}

// Вкладки настроек - ИСПРАВЛЕННАЯ ФУНКЦИЯ
function initializeSettingsTabs() {
	document.querySelectorAll('.settings-tab-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const tabId = btn.dataset.settingsTab;
			
			// Обновление активной вкладки настроек
			document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
			document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
			
			btn.classList.add('active');
			
			// Находим правильный элемент для активации
			const targetElement = document.getElementById(`${tabId}-tab`);
			if (targetElement) {
				targetElement.classList.add('active');
			}
		});
	});
}

// Панель настроек
function initializeSettingsPanel() {
	const toggleBtn = document.getElementById('settings-toggle');
	const panel = document.getElementById('settings-panel');
	const result = document.getElementById('result');
	toggleBtn.addEventListener('click', () => {
		panel.classList.toggle('expanded');
		toggleBtn.textContent = panel.classList.contains('expanded') ? 'Применить настройки' : 'Настройки';
		
		if(!panel.classList.contains('expanded')){
			result.innerHTML = '<div style="background: #c7b39b url(loading.png)"></div>'
			processText(result);
		}
	});
}

// Выбор текста (вкладка "Текст" настроек)
function initializeTextSelection() {
	const select = document.getElementById('text-select');
	const textArea = document.getElementById('text-area');
	
	// Заполнение списка текстов
	books.forEach((book, index) => {
		const option = document.createElement('option');
		option.value = index;
		option.textContent = book.name;
		select.appendChild(option);
	});
	
	// Обработка выбора текста
	select.addEventListener('change', () => {
		const selectedIndex = parseInt(select.value);
		if (!isNaN(selectedIndex) && selectedIndex >= 0) {
			textArea.value = books[selectedIndex].content;
			state.selectedText = books[selectedIndex].content;
		} else {
			textArea.value = '';
			state.selectedText = '';
		}
	});
}

// Загрузка файлов (вкладка "Текст" настроек)
function initializeFileUpload() {
	const fileBtn = document.getElementById('file-upload-btn');
	const fileInput = document.getElementById('file-input');
	const textArea = document.getElementById('text-area');
	
	fileBtn.addEventListener('click', () => {
		fileInput.click();
	});
	
	fileInput.addEventListener('change', (e) => {
		const file = e.target.files[0];
		if (file && file.type === 'text/plain') {
			const reader = new FileReader();
			reader.onload = (event) => {
				textArea.value = event.target.result;
				state.selectedText = event.target.result;
				
				// Сброс выбора в select
				document.getElementById('text-select').value = '';
			};
			reader.readAsText(file);
		}
	});
}

// Настройки каны (вкладка "Каны" настроек)
function initializeKanaSettings() {
	const kanaTypeSelect = document.getElementById('kana-type-select');
	const selectAllBtn = document.getElementById('select-all-kana');
	const grid = document.getElementById('kana-settings-grid');
	
	// Инициализация типа каны
	kanaTypeSelect.value = state.settingsKanaType;
	kanaTypeSelect.addEventListener('change', () => {
		state.settingsKanaType = kanaTypeSelect.value;
		renderKanaGrid(grid, true, state.settingsKanaType);
	});
	
	// Кнопка "Выбрать все"
	selectAllBtn.addEventListener('click', () => {
		if (state.isAllKanaSelected) {
			state.selectedKana.clear();
			selectAllBtn.textContent = 'Выбрать все';
		} else {
			polyvanovTable.forEach(kana => {
				state.selectedKana.add(kana.id); // Теперь используем числовой id
			});
			selectAllBtn.textContent = 'Снять все';
		}
		state.isAllKanaSelected = !state.isAllKanaSelected;
		renderKanaGrid(grid, true, state.settingsKanaType);
	});
	
	// Первоначальная отрисовка
	renderKanaGrid(grid, true, state.settingsKanaType);
}

// Настройки кандзи (вкладка "Кандзи" настроек)
function initializeKanjiSettings() {
	const kanjiLevelSelect = document.getElementById('kanji-level-select');
	
	kanjiLevelSelect.value = state.kanjiLevel;
	kanjiLevelSelect.addEventListener('change', () => {
		state.kanjiLevel = parseInt(kanjiLevelSelect.value);
	});
}

// Отображение каны на главной вкладке "Каны"
function initializeKanaDisplay() {
	const kanaTypeSelect = document.getElementById('kana-display-type');
	const grid = document.getElementById('kana-display-grid');
	
	// Инициализация типа каны на главной вкладке
	kanaTypeSelect.value = state.displayKanaType;
	
	kanaTypeSelect.addEventListener('change', () => {
		state.displayKanaType = kanaTypeSelect.value;
		updateKanaDisplay();
	});
	
	// Первоначальная отрисовка
	updateKanaDisplay();
}

// Обновление отображения каны на главной вкладке
function updateKanaDisplay() {
	const grid = document.getElementById('kana-display-grid');
	renderKanaGrid(grid, false, state.displayKanaType);
}

// Рендеринг таблицы каны
function renderKanaGrid(container, interactive, kanaType) {
	container.innerHTML = '';
	const groups = {};
	
	// Группировка каны по блокам
	polyvanovTable.forEach(kana => {
		if (!groups[kana.num]) {
			groups[kana.num] = {
				name: kana.nam,
				items: []
			};
		}
		groups[kana.num].items.push(kana);
	});
	
	// Отрисовка групп
	Object.keys(groups).sort((a, b) => a - b).forEach(groupNum => {
		const group = groups[groupNum];
		
		// Заголовок группы
		const groupHeader = document.createElement('div');
		groupHeader.className = 'kana-group';
		groupHeader.textContent = group.name;
		container.appendChild(groupHeader);
		
		// Элементы группы
		group.items.forEach(kana => {
			const item = document.createElement('div');
			item.className = 'kana-item';
			
			if (interactive && state.selectedKana.has(kana.id)) {
				item.classList.add('selected');
			}
			
			const kanaChar = document.createElement('div');
			kanaChar.className = 'kana-char';
			// Используем переданный тип каны для отображения
			kanaChar.textContent = kanaType === 'hiragana' ? kana.hiragana : kana.katakana;
			
			const kanaId = document.createElement('div');
			kanaId.className = 'kana-id';
			kanaId.textContent = kana.read; // Теперь берем русское чтение из атрибута read
			
			item.appendChild(kanaChar);
			item.appendChild(kanaId);
			
			if (interactive) {
				item.addEventListener('click', () => {
					if (state.selectedKana.has(kana.id)) {
						state.selectedKana.delete(kana.id);
					} else {
						state.selectedKana.add(kana.id);
					}
					item.classList.toggle('selected');
					
					// Обновление состояния кнопки "Выбрать все"
					const allSelected = polyvanovTable.every(k => state.selectedKana.has(k.id));
					state.isAllKanaSelected = allSelected;
					document.getElementById('select-all-kana').textContent = 
						allSelected ? 'Снять все' : 'Выбрать все';
				});
			}
			
			container.appendChild(item);
		});
	});
}

// Отображение кандзи
function initializeKanjiDisplay() {
	const levelSelect = document.getElementById('kanji-display-level');
	const searchInput = document.getElementById('kanji-search');
	const list = document.getElementById('kanji-display-list');
	
	// Обработчики событий
	levelSelect.addEventListener('change', () => {
		renderKanjiList();
	});
	
	searchInput.addEventListener('input', () => {
		renderKanjiList();
	});
	
	// Первоначальная отрисовка
	renderKanjiList();
	
	function renderKanjiList() {
		const level = parseInt(levelSelect.value);
		const searchTerm = searchInput.value.toLowerCase().trim();
		
		// Фильтрация кандзи
		let filteredKanji = kanjiData;
		
		if (searchTerm) {
			// При наличии строки поиска - поиск без учёта года обучения
			filteredKanji = filteredKanji.filter(k => 
				k.meanings.some(meaning => 
					meaning.toLowerCase().includes(searchTerm)
				)
			);
		} else {
			// При очистке строки - возврат к фильтрации по году
			if (level > 0) {
				filteredKanji = filteredKanji.filter(k => k.level === level);
			}
		}
		
		// Отрисовка списка
		list.innerHTML = '';
		
		filteredKanji.forEach(kanji => {
			const item = document.createElement('div');
			item.className = 'kanji-item';
			
			const kanjiChar = document.createElement('div');
			kanjiChar.className = 'kanji-char';
			kanjiChar.textContent = kanji.kanji;
			
			const readings = document.createElement('div');
			readings.className = 'kanji-readings';
			readings.innerHTML = `
				<div>он: ${kanji.readings.on.join(', ')}</div>
				<div>кун: ${kanji.readings.kun.join(', ')}</div>
			`;
			
			const meanings = document.createElement('div');
			meanings.className = 'kanji-meanings';
			meanings.textContent = kanji.meanings.join(', ');
			
			const level = document.createElement('div');
			level.className = 'kanji-level';
			level.textContent = `Год обучения: ${kanji.level}`;
			
			item.appendChild(kanjiChar);
			item.appendChild(readings);
			item.appendChild(meanings);
			item.appendChild(level);
			
			list.appendChild(item);
		});
	}
}
