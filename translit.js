// Вспомогательные функции
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '\n': '<br>' // Обрабатываем переносы строк
    };
    return text.replace(/[&<>"'\n]/g, m => map[m]);
}

function getKanjiForWord(word, level) {
    if (!word || level === 0) return null;
    
    const normalizedWord = word.toLowerCase();
    
    for (const kanjiObj of kanjiData) {
        // Проверка уровня
        if (level < 6 && kanjiObj.level > level) {
            continue;
        }
        
        // Поиск в meanings
        if (kanjiObj.meanings.includes(normalizedWord)) {
            return kanjiObj;
        }
    }
    
    return null;
}

function processKanji(text, level) {
    if (level === 0) return escapeHtml(text);
    
    let result = '';
    let currentWord = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Проверяем, является ли символ русской буквой
        if (/[а-яА-ЯёЁ]/.test(char)) {
            currentWord += char;
        } else {
            // Обрабатываем накопленное слово
            if (currentWord) {
                const kanjiObj = getKanjiForWord(currentWord, level);
                
                if (kanjiObj) {
                    // Создаем HTML для кандзи
                    const onReadings = kanjiObj.readings.on || [];
                    const kunReadings = kanjiObj.readings.kun || [];
                    const meanings = kanjiObj.meanings || [];
                    
                    result += `<span class="kanji" data-kanji="${escapeHtml(kanjiObj.kanji)}" ` +
                              `data-level="${kanjiObj.level}" ` +
                              `data-on="${escapeHtml(onReadings.join(', '))}" ` +
                              `data-kun="${escapeHtml(kunReadings.join(', '))}" ` +
                              `data-meanings="${escapeHtml(meanings.join(', '))}">` +
                              `${escapeHtml(kanjiObj.kanji)}</span>`;
                } else {
                    result += escapeHtml(currentWord);
                }
                currentWord = '';
            }
            
            // Добавляем не-буквенный символ
            result += escapeHtml(char);
        }
    }
    
    // Обрабатываем последнее слово, если есть
    if (currentWord) {
        const kanjiObj = getKanjiForWord(currentWord, level);
        
        if (kanjiObj) {
            const onReadings = kanjiObj.readings.on || [];
            const kunReadings = kanjiObj.readings.kun || [];
            const meanings = kanjiObj.meanings || [];
            
            result += `<span class="kanji" data-kanji="${escapeHtml(kanjiObj.kanji)}" ` +
                      `data-level="${kanjiObj.level}" ` +
                      `data-on="${escapeHtml(onReadings.join(', '))}" ` +
                      `data-kun="${escapeHtml(kunReadings.join(', '))}" ` +
                      `data-meanings="${escapeHtml(meanings.join(', '))}">` +
                      `${escapeHtml(kanjiObj.kanji)}</span>`;
        } else {
            result += escapeHtml(currentWord);
        }
    }
    
    return result;
}

function processKana(text, selectedKana, kanaType) {
    // Если selectedKana пуст, используем только id = 1
    const kanaIds = selectedKana.size > 0 
        ? Array.from(selectedKana) 
        : [1];
    
    // Получаем объекты каны по выбранным id
    const selectedKanaObjs = polyvanovTable.filter(item => kanaIds.includes(item.id));
    
    // Сортируем по убыванию длины read
    const sortedKana = [...selectedKanaObjs].sort((a, b) => {
        const lenA = a.read ? a.read.length : 0;
        const lenB = b.read ? b.read.length : 0;
        return lenB - lenA;
    });
    
    let result = text;
    
    // Обрабатываем отсортированные каны
    for (const kanaObj of sortedKana) {
        if (!kanaObj.read) continue;
        
        // Получаем символ каны в зависимости от типа
        const kanaChar = kanaType === 'katakana' 
            ? kanaObj.katakana 
            : kanaObj.hiragana;
        
        // Функция для замены с учетом уже обработанных блоков
        let newResult = '';
        let i = 0;
        
        while (i < result.length) {
            // Проверяем, не находимся ли мы внутри тега
            if (result[i] === '<') {
                // Нашли начало тега, пропускаем весь тег
                const tagEnd = result.indexOf('>', i);
                if (tagEnd === -1) {
                    newResult += result.substring(i);
                    break;
                }
                newResult += result.substring(i, tagEnd + 1);
                i = tagEnd + 1;
                continue;
            }
            
            // Проверяем совпадение с read
            if (result.substr(i, kanaObj.read.length).toLowerCase() === kanaObj.read.toLowerCase()) {
                // Заменяем на кану с разметкой
                newResult += `<span class="kana" data-read="${escapeHtml(kanaObj.read)}">${kanaChar}</span>`;
                i += kanaObj.read.length;
            } else {
                newResult += result[i];
                i++;
            }
        }
        
        result = newResult;
    }
    
    return result;
}

// Основная функция обработки
function processText(result) {
    const { selectedKana, settingsKanaType, kanjiLevel, selectedText } = state;
    let txt = selectedText;
    if (!txt){ txt = 'Выберите текст в настройках (внизу страницы)\n для отображения результата транслитерации\nпо системе Поливанова.';};
    
    // Шаг 1: Обработка кандзи
    let processedText = processKanji(txt, kanjiLevel);
    
    // Шаг 2: Обработка каны
	result.innerHTML = processKana(processedText, selectedKana, settingsKanaType);
    
    return true;
}