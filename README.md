# Парк Relax

Единый проект: **FastAPI backend** + **React frontend**.

## Структура

```
.
├── backend/          # FastAPI + SQLAlchemy + Alembic
├── frontend/         # React + Vite + Tailwind
├── docs/             # Макеты и документация
├── .env              # Переменные окружения
└── package.json      # Корневые скрипты
```

## Быстрый старт

### Установка

```bash
# Корневые зависимости (concurrently)
npm install

# Frontend зависимости
cd frontend && npm install

# Backend зависимости
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Миграции

```bash
npm run db:migrate
```

### Создание администратора

```bash
npm run create:admin -- --username admin --password admin123 --name "Admin"
```

### Разработка

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API проксируется через Vite dev server (`/api/*` → `localhost:8000`)

### Production

```bash
npm run build      # билдит frontend/dist
npm start          # запускает FastAPI на 8000 (раздаёт frontend/dist)
```

## Backend

Подробнее в [backend/README.md](backend/README.md).

## Технологии

- **Backend**: FastAPI, SQLAlchemy 2.0 (async), Alembic, fastapi-viewsets, fastapi-admin-panel
- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui
