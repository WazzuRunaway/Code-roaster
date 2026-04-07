# 🔥 CodeRoast

> Submit your worst code. Get roasted. Learn from mistakes.

**Live site:** http://10.93.24.228

## Что это?

CodeRoast — сайт, где разработчики кидают свой худший код и получают от ИИ:
- 🔥 **Роаст** — смешной разбор ошибок
- ✅ **Решение** — исправленный код с пояснениями
- 🍝 **Spaghetti Score** — оценка «запутанности» от 0 до 100
- 🌶️ **Выбор тона** — нежный, средний или жёсткий

## Как пользоваться

1. Зайди на **http://10.93.24.228**
2. Выбери язык программирования
3. Вставь свой код
4. Выбери остроту: 🌶️ Baby Spice / 🌶️🌶️ Code Salsa / 🌶️🌶️🌶️ Inferno
5. Нажми **🔥 Roast My Code!**
6. Получи роаст + решение
7. (Необязательно) Введи своё имя и нажми **Share** — код попадёт в **Hall of Shame**

## Разделы сайта

| Страница | Описание |
|----------|----------|
| 🏠 **Home** | Форма для отправки кода |
| 🔥 **Recently Roasted** | Все опубликованные роасты (навсегда) |
| 🏆 **Hall of Shame** | Топ роастов **за сегодня** — сбрасывается в полночь |

## Для разработчиков

### Локальная разработка

```bash
# 1. Запустить базу данных
docker-compose up -d

# 2. Бэкенд
cd backend
cp .env.example .env   # вставь LLM_API_KEY
npm install
npx prisma migrate dev
npm run dev

# 3. Фронтенд
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Открой http://localhost:5173

### Деплой на VM (10.93.24.228)

```bash
ssh user@10.93.24.228

git clone <repo-url> /opt/coderoast
cd /opt/coderoast

# Создать .env файлы
cat > backend/.env << 'EOF'
LLM_API_KEY=sk-or-v1-xxxxx
DATABASE_URL=postgresql://coderoast:CHANGE_ME@postgres:5432/coderoast?schema=public
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://10.93.24.228
EOF

cat > .env.prod << EOF
DB_USER=coderoast
DB_PASSWORD=CHANGE_ME
EOF

# Запустить всё
docker-compose -f docker-compose.prod.yml up -d --build

# Применить миграции
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

Сайт будет доступен на http://10.93.24.228

## Технологии

- **Frontend:** React 18 + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI:** OpenRouter (OpenAI-совместимый API, бесплатные модели)

## Ограничения

- Максимум **5,000 символов** кода за один запрос
- **10 запросов** за 15 минут с одного IP
- **1 лайк** на одну запись с одного IP (сброс через 24 часа)

## License

MIT
