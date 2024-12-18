# Валидатор локализации

Приложение для проверки наличия ключей и переводов для них в JSON файлах (для проектных целей).

## Установка и запуск

### Требования
- Node.js (версия 14 или выше)
- npm (устанавливается вместе с Node.js)
- Git

### Первый запуск 
1. Клонирование репозитория
```bash
git clone https://github.com/yzinkevich/sc-lang-validator
cd sc-lang-validator
```

2. Установка зависимостей
```bash
npm install
```

3. Сборка приложения
```bash
npm run build
``` 

4. Запуск приложения
```bash
npm start
``` 

### Последующие запуски
```bash
npm start
```
    
## Использование

### 1. Выбор директории
- Нажмите кнопку "Выбрать директорию"
- Укажите папку с файлами локализации (lang_*.json)
- Или выберите одну из недавних директорий (сохраняются последние 5 директорий)

### 2. Ввод ключей
Приложение поддерживает следующие форматы ввода:

#### Простой формат
```
#KEY_NAME
#ANOTHER_KEY
```

#### JSON формат
```json
"#KEY_NAME": "Some text",
"#ANOTHER_KEY": "Another text"
```

#### Табличный формат
```
buttonDescKey    #BUILD_3370_1    кнопка в окне квеста    Поговорить
```

#### Смешанный формат
```
#EXPEDITION_2024_GOOD_DEEDS_DESC	Каролина	Мэр, мы соревнуемся...
#2YEARS_SCHREENSHOT_DESC3	Thanks for your story...
```

### 3. Валидация
1. Выберите директорию с файлами локализации
2. Введите или вставьте текст с ключами
3. Нажмите кнопку "Провалидировать"

## Особенности

### Обработка файлов
- Поддерживаются файлы формата lang_*.json
- Автоматически игнорируются файлы:
  - lang_longlish.json
  - lang_comment.json
- Файлы должны быть в кодировке UTF-8

### Обработка ключей
- Ключи должны начинаться с символа #
- Поддерживается извлечение ключей из любой части строки
- Доступно копирование ключей через иконку копирования

### Результаты валидации
- Для каждого файла отображается:
  - Общее количество проверенных ключей
  - Количество корректных ключей
  - Список отсутствующих ключей
  - Список пустых переводов

### Дополнительные функции
- Переключение темной/светлой темы
- История последних 5 директорий
- Сворачивание/разворачивание списка ключей при большом количестве
- DevTools для отладки:
  - macOS: `Cmd + Option + I`
  - Windows/Linux: `Ctrl + Shift + I`

## Устранение проблем

### Приложение не запускается
```bash
# Полная переустановка
rm -rf dist node_modules .cache package-lock.json
npm install
npm run build
```

### Не видны файлы локализации
- Проверьте формат имени файлов (должны начинаться с lang_)
- Проверьте права доступа к файлам
- Убедитесь в корректной кодировке файлов (UTF-8)

### Не определяются ключи
- Убедитесь, что ключи начинаются с #
- Проверьте отсутствие невидимых символов
- Проверьте корректность JSON формата

## Разработка

+ ### Скрипты
```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка приложения
npm run clean        # Очистка сборки
npm run rebuild      # Полная пересборка
npm start           # Запуск приложения
npm run start:debug # Запуск с отладкой
```