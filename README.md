# Park Relax

Fullstack-приложение для сайта **Park Relax**.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + Alembic + MySQL/SQLite
- **Админка**: встроенная HTML-панель (`fastapi-admin-panel`) + отдельный React-админ-интерфейс

---

## 📋 Требования

- **Python** `>= 3.11`
- **Node.js** `>= 18`
- **MySQL** `8.0+` *(опционально — по умолчанию используется SQLite)*

---

## 🚀 Быстрый старт

### 1. Клонирование

```bash
git clone <repo-url>
cd parkrelax
```

### 2. Переменные окружения

Скопируй пример и заполни нужные значения:

```bash
cp .env.example .env
```

Минимально необходимые переменные для локальной разработки:

```env
# Секрет для JWT (можно любую случайную строку)
APP_SECRET=your-super-secret-key

# База данных (если не указана — будет SQLite local.db в корне)
# DATABASE_URL=mysql://user:password@localhost:3306/parkrelax
```

Полный список переменных см. в разделе [Переменные окружения](#-переменные-окружения).

### 3. Backend

```bash
cd backend

# Создать виртуальное окружение
python3 -m venv venv

# Активировать (Linux / macOS)
source venv/bin/activate
# Активировать (Windows)
# venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
./venv/bin/alembic upgrade head
```

### 4. Frontend

```bash
cd frontend
npm install
```

### 5. Запуск

Запускай **backend** и **frontend** в отдельных терминалах:

```bash
# Терминал 1 — Backend
cd backend
source venv/bin/activate
PYTHONPATH=./app:./ uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Терминал 2 — Frontend
cd frontend
npm run dev
```

- **Backend API** → http://127.0.0.1:8000
- **Frontend** → http://localhost:5173 (или тот порт, что выдал Vite)
- **API Docs (Swagger)** → http://127.0.0.1:8000/docs
- **ReDoc** → http://127.0.0.1:8000/redoc

---

## ⚡ Альтернативный запуск из корня

В корне проекта есть `package.json` с удобными скриптами:

```bash
# Установить concurrently (один раз)
npm install

# Запустить backend + frontend одной командой
npm run dev

# Только frontend
npm run dev:frontend

# Только backend
npm run dev:backend
```

> **Важно**: скрипты `npm run dev:backend` и `npm run start` ожидают venv по пути `backend/venv`.

---

## 🛠 PyCharm / IntelliJ IDEA

В проекте уже созданы Run Configurations (`.idea/runConfigurations/`):

| Конфигурация | Описание |
|--------------|----------|
| **Backend** | Запускает `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` из папки `backend/` |
| **Frontend** | Запускает `npm run dev` из папки `frontend/` |
| **Fullstack** | Запускает Backend и Frontend одновременно |

Просто выбери нужную конфигурацию и нажми **Run** (`Shift+F10`).

---

## 🗄 Миграции базы данных

Проект использует **Alembic**. Все миграции лежат в `backend/alembic/versions/`.

```bash
cd backend
source venv/bin/activate

# Сгенерировать новую миграцию на основе изменений в models.py
alembic revision --autogenerate -m "описание изменений"

# Применить все миграции
alembic upgrade head

# Откатить последнюю миграцию
alembic downgrade -1

# Посмотреть текущую версию
alembic current

# История миграций
alembic history
```

> Если `DATABASE_URL` не задан, миграции применяются к SQLite (`local.db` в корне проекта).

---

## 👤 Создание администратора

После применения миграций создай первого админа:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=./app:./ python scripts/create_admin.py \
  --username admin \
  --password admin123 \
  --name "Super Admin"
```

- Админ-панель API: `POST /admin-auth/login` → `GET /admin-auth/me`
- HTML-админка: http://127.0.0.1:8000/admin-panel/

---

## 📁 Структура проекта

```
parkrelax/
├── .env                    # Переменные окружения (не коммитится)
├── .env.example            # Пример переменных
├── backend/
│   ├── venv/               # Python виртуальное окружение
│   ├── alembic/            # Миграции Alembic
│   │   └── versions/
│   ├── app/
│   │   ├── main.py         # Точка входа FastAPI
│   │   ├── config.py       # Настройки (Pydantic Settings)
│   │   ├── database.py     # AsyncEngine + async_session + Base
│   │   ├── models.py       # SQLAlchemy модели
│   │   ├── schemas.py      # Pydantic схемы
│   │   ├── auth.py         # Kimi OAuth
│   │   ├── dependencies.py # Зависимости (get_db, get_current_user, ...)
│   │   ├── admin.py        # fastapi-admin-panel конфигурация
│   │   └── routers/        # API роутеры
│   │       ├── auth.py
│       │   ├── admin_auth.py
│       │   ├── contact.py
│       │   ├── review.py
│       │   ├── gallery.py
│       │   ├── booking.py
│       │   ├── rule.py
│       │   ├── translation.py
│       │   ├── accommodation.py
│       │   ├── site_settings.py
│       │   ├── upload.py
│       │   └── legal_page.py
│   ├── scripts/
│   │   └── create_admin.py # Скрипт создания администратора
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── components/     # UI-компоненты (shadcn/ui)
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # React-хуки
│   │   ├── lib/            # Утилиты
│   │   ├── types/          # TypeScript типы
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/             # Статические файлы
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── docs/                   # Макеты и документация
```

---

## 🔐 Переменные окружения

Все переменные читаются из `.env` в корне проекта.

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `APP_SECRET` | ✅ Да | Секретный ключ для подписи JWT токенов |
| `DATABASE_URL` | ❌ Нет | MySQL: `mysql://user:pass@host:port/db`. Если не указан — используется SQLite |
| `APP_ID` | ❌ Нет | Application ID для Kimi OAuth |
| `KIMI_AUTH_URL` | ❌ Нет | URL сервера авторизации Kimi |
| `KIMI_OPEN_URL` | ❌ Нет | URL Kimi Open Platform |
| `OWNER_UNION_ID` | ❌ Нет | Union ID владельца приложения (автоматически получает роль `admin`) |
| `VITE_KIMI_AUTH_URL` | ❌ Нет | URL авторизации Kimi для фронтенда (Vite) |
| `VITE_APP_ID` | ❌ Нет | OAuth App ID для фронтенда (Vite) |

---

## 📝 Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск backend + frontend одновременно (из корня) |
| `npm run dev:frontend` | Только frontend dev-server |
| `npm run dev:backend` | Только backend с reload |
| `npm run build` | Сборка frontend для production |
| `npm run start` | Запуск backend в production режиме |
| `npm run db:generate` | Сгенерировать миграцию Alembic |
| `npm run db:migrate` | Применить миграции |
| `npm run create:admin` | Создать администратора |
| `cd backend && alembic revision --autogenerate -m "msg"` | Ручная генерация миграции |
| `cd backend && alembic upgrade head` | Ручное применение миграций |

---

## 📡 API Endpoints

| Ресурс | Публичные эндпоинты | Админ (CRUD) |
|--------|---------------------|--------------|
| Контакты | `GET /contact` | `/admin/contact` |
| Отзывы | `GET /review` | `/admin/review` |
| Галерея | `GET /gallery`, `GET /gallery/category/{cat}` | `/admin/gallery` |
| Бронирования | `POST /booking` | `/admin/booking` |
| Правила | `GET /rule`, `GET /rule/{id}` | `/admin/rule` |
| Переводы | `GET /translation`, `GET /translation/{key}` | `/admin/translation` |
| Размещение | `GET /accommodation` | `/admin/accommodation` |
| Настройки сайта | `GET /site-settings` | `PUT /site-settings/admin/hero-background` |
| Загрузки | — | `POST /admin/upload-hero`, `POST /admin/upload/{category}` |
| Kimi OAuth | `GET /auth/me`, `POST /auth/logout`, `GET /api/oauth/callback` | — |
| Admin Auth | `POST /admin-auth/login`, `GET /admin-auth/me`, `POST /admin-auth/logout` | — |

---

## 📄 Лицензия

Приватный проект.
