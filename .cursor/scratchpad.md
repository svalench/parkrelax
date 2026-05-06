# Progress

WYSIWYG: в админке `TinyMCEEditorField` для описаний/контента (Rental, AccommodationType, Accommodation, LegalPage), русский UI, санитизация `nh3` в `html_sanitize.py` + `before_create`/`before_edit`. Фронт: `dompurify` в `lib/safeHtml.ts`, юридические страницы и аренда — рендер HTML, карточки размещения и бронирование — plain-text превью. Правка `LegalPage`/`BookingPage` fetch для eslint react-hooks.

Hero (мобильный viewport &lt; md): вместо многострочного h1 — прозрачный `public/images/logo.svg`, под ним жирный слоган (`text-xl` / `sm:text-2xl` для читаемости); нижний дубликат слогана скрыт до md. Абзац «Комфортные домики…» показывается только с `md` и выше. Для читаемости слова RELAX вместо прямоугольной подложки добавлена мягкая овальная засветка за правой частью логотипа. `npm run build` — ок; общий `npm run lint` падает на старых ui-файлах, не на Hero.

Navbar mobile: при `mobileOpen` на главной шапка как после скролла (`headerLooksSolid`) — белый фон, тёмный крестик; у кнопки меню `aria-expanded`, `aria-label`, лёгкий hover на мобильном переключателе.

Кнопка адреса в шапке: до `xl` только иконка (компактные отступы), с `xl` — полный текст; подсказка `title`/`aria-label`. Навигация `gap-4 xl:gap-6`. `npm run build` — ок.

Fix DB auth в docker-compose: синхронизирован пароль между `app.DATABASE_URL` и `db.MYSQL_PASSWORD` через `${MYSQL_PASSWORD:-parkrelax_password}`; healthcheck приведен к тому же дефолтному `MYSQL_ROOT_PASSWORD`.

Alembic `5a14d69947ad`: `INSERT OR REPLACE` заменён на `REPLACE INTO` — валидно для MySQL и SQLite.

В `backend/requirements.txt` добавлен `httpx` (импорт в `app/auth.py`, иначе Docker-образ падает при старте uvicorn).

`/admin` в проде: редирект 307 на `/admin/` (иначе Starlette Mount ` /admin/{path}` не матчит путь без слэша и отдаётся SPA). Vite dev: proxy `/admin` → бэкенд.

Миграция телефонов/карты: `bdd70b782cd4` — перенос `phone`/`mapUrl`/`email` в `phone_numbers`/`email_addresses`/`yandexMapEmbed` перед дропом колонок. Docker: `ENTRYPOINT` + `CMD` в `Dockerfile`, чтобы `alembic upgrade head` выполнялся даже при переопределении `command` в compose.

Статика starlette-admin (`/admin/statics/`): пример `deploy/nginx-snippet.conf` — проксировать `/admin` до SPA `try_files`; uvicorn с `--proxy-headers --forwarded-allow-ips=*`.

DONE
