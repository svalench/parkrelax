# Park Relax — FastAPI Backend

Полностью переписанный бэкенд на **FastAPI** + **SQLAlchemy 2.0 (async)** + **Alembic** + **fastapi-viewsets** + **fastapi-admin-panel**.

## Структура

```
backend/
├── venv/                   # Python виртуальное окружение
├── alembic/                # Миграции Alembic
├── app/
│   ├── main.py             # Точка входа FastAPI
│   ├── config.py           # Настройки (Pydantic Settings)
│   ├── database.py         # Async engine + session + Base
│   ├── models.py           # SQLAlchemy модели (все таблицы)
│   ├── schemas.py          # Pydantic схемы
│   ├── auth.py             # Kimi OAuth + Admin JWT
│   ├── dependencies.py     # get_db, get_current_user, get_current_admin
│   ├── admin.py            # fastapi-admin-panel
│   └── routers/
│       ├── auth.py         # Kimi OAuth callback, me, logout
│       ├── admin_auth.py   # Admin login/me/logout
│       ├── contact.py
│       ├── review.py
│       ├── gallery.py
│       ├── booking.py
│       ├── rule.py
│       ├── translation.py
│       ├── accommodation.py
│       ├── site_settings.py
│       └── upload.py
└── scripts/
    └── create_admin.py     # Создание администратора
```

## Установка

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Настройка

Переменные окружения читаются из корневого `.env`:

```env
APP_ID=                   # Application ID для Kimi OAuth
APP_SECRET=               # Секрет для JWT подписи
DATABASE_URL=             # MySQL: mysql://user:pass@host:port/db (опционально)
KIMI_AUTH_URL=            # URL Kimi OAuth сервера
KIMI_OPEN_URL=            # URL Kimi Open API
OWNER_UNION_ID=           # Union ID владельца (получает роль admin)
```

Если `DATABASE_URL` не указан, используется SQLite (`local.db` в корне проекта).

## Миграции

```bash
cd backend
# Автогенерация миграции
./venv/bin/alembic revision --autogenerate -m "описание"

# Применение миграций
./venv/bin/alembic upgrade head
```

## Создание администратора

```bash
cd backend
PYTHONPATH=./app:./ ./venv/bin/python scripts/create_admin.py \
  --username admin \
  --password admin123 \
  --name "Super Admin"
```

## Запуск

```bash
cd backend
PYTHONPATH=./app:./ ./venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Production:
```bash
cd backend
PYTHONPATH=./app:./ ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

| Ресурс | Публичные | Админ (CRUD) |
|--------|-----------|--------------|
| contacts | `GET /contact` | `GET/POST/PATCH/DELETE /admin/contact` |
| reviews | `GET /review` | `GET/POST/PATCH/DELETE /admin/review` |
| gallery | `GET /gallery`, `GET /gallery/category/{cat}` | `GET/POST/PATCH/DELETE /admin/gallery` |
| bookings | `POST /booking` | `GET/POST/PATCH/DELETE /admin/booking` |
| rules | `GET /rule`, `GET /rule/{id}` | `GET/POST/PATCH/DELETE /admin/rule` |
| translations | `GET /translation`, `GET /translation/{key}` | `GET/POST/PATCH/DELETE /admin/translation` |
| accommodation | `GET /accommodation` | `GET/POST/PATCH/DELETE /admin/accommodation` |
| site-settings | `GET /site-settings` | `PUT /site-settings/admin/hero-background` |
| uploads | — | `POST /admin/upload-hero`, `POST /admin/upload/{category}` |
| auth (Kimi) | `GET /auth/me`, `POST /auth/logout`, `GET /api/oauth/callback` | — |
| admin auth | `POST /admin-auth/login`, `GET /admin-auth/me`, `POST /admin-auth/logout` | — |

## Admin Panel

HTML-админка доступна по адресу `/admin-panel/`.

## Технологии

- **FastAPI** — веб-фреймворк
- **fastapi-viewsets** — CRUD viewsets (AsyncBaseViewset)
- **SQLAlchemy 2.0 (async)** — ORM
- **Alembic** — миграции
- **fastapi-admin-panel** — авто-админка
- **PyJWT + python-jose** — JWT токены
- **bcrypt** — хеширование паролей
- **httpx** — HTTP клиент для Kimi OAuth
