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

Секция аренды: заголовок «Выбирай активность…» → «Участвуй в активности…» (`Rental.tsx`).

Прокат на главной: до 10 панелей (`MAX_RENTAL_PANELS`), `data-panel-count`, CSS сужение свёрнутых полос при 6–10 на desktop.

Favicon: растеризация `public/images/logo.svg` → `public/favicon.png` (32×32), `apple-touch-icon.png` (180×180), ссылки в `index.html`.

Блок проката: CTA «Забронировать» → ссылка «Выбрать жильё» на `/booking` (`Rental.tsx`).

Футер: якоря Инфо → плавный скролл к `#about` / `#contacts` / `#gallery` (с любой страницы через `navigate` + эффект в `Home`); Размещение → `/booking?cabin=…` (как в Hero). Попутно Hero: `formatGuestsLabel`, убран неиспользуемый `Baby`.

Favicon: вместо полного логотипа — отдельный читаемый василёк `public/favicon.svg`; PNG fallback `favicon.png` 32×32 и `apple-touch-icon.png` 180×180 пересобраны из той же композиции; `index.html` подключает SVG favicon первым.

Hero: селектор типа жилья — `GET /api/accommodation/types` (как карточки размещения), переход на бронирование с `?typeId=…` вместо жёсткого `cabin`. Футер по-прежнему `?cabin=` для обратной совместимости.

Футер: иконки оплаты — `public/images/payments/` (Visa, Mastercard, Мир, Белкарт), в разметке `<img>` в светлых чипах; копирайт «Парк Relax © 2026» + строка ООО. `npm run build` — ок; `npm run lint` — прежние ошибки в других файлах.

Футер: убрана строка ООО. Шапка: `max-w-[1400px]`, горизонтальные отступы `px-4`…`lg:px-8`, колонки `minmax(0,1fr) / auto / minmax(0,1fr)`, справа `min-w-max`, навигация и телефон компактнее (`text-xs` → `xl:text-sm`), телефон с `truncate`.

`index.html`: `lang="ru"` (раньше `en` — из‑за этого браузер предлагал перевод русского текста).

Карта маршрутов: обновлён `frontend/public/park-relax-map-light.html` (park-relax-map-custom-3): Минск через Телеханы→Пинск→Стытычево, Гомель через Пинск→Стытычево, Брест прямой; промежуточные маркеры; `?embed=1` без сайдбара. iframe в `About.tsx` без изменений.

Футер: платёжные знаки — ассеты с Wikimedia Commons (Visa, Mastercard с wordmark, Мир, UnionPay SVG; Белкарт PNG `Logotip-belkart.png`, ужат до ~280px), порядок как в п. 1 руководства БАПБ; чипы `bg-white`, `gap-4`, `h-10` / `h-7`. Удалён самодельный `belkart.svg`. `npm run build` — ок; полный `npm run lint` — прежние ошибки в других файлах.

Заглушка публичного бронирования: `BOOKING_PUBLIC_ENABLED = false` в `config/features.ts`; маршруты `/booking`, `/booking/form`, `/payment` → `BookingComingSoonPage`; Hero и `AccommodationTypePage` — `BookingStubButton` «Скоро появится». Включить: `BOOKING_PUBLIC_ENABLED = true`. `npm run build` — ок.

Занятость дат: `booking_availability.py` — блокирует все статусы кроме отменённых. Карточки занятых показываются с «Забронировано», без кнопки брони (не скрываем из списка).

Бронирование: `/booking` и `/accommodation/:id` всегда грузят `/availability` (флаг `isBookedForDates` даже на дефолтных датах). `BookingFormPage` блокирует форму при занятости + прямой URL. `npm run build` — ок.

Админка Lucide: `lucide_icons.html` — рендер через `lucide.createElement` (v1.16), вместо устаревшего `icon.body`; CDN закреплён на 1.16.0; в списке `Stop` → `Square`.

Редактирование брони в админ-панели: форма грузила несуществующий `GET /admin/bookings/{id}` (viewset не смонтирован). Добавлен `GET /admin/dashboard/bookings/{id}`, фронт переключён на тот же префикс, что PATCH; индикатор загрузки. `npm run build` — ок.

EmailTemplate edit 500: `previewUrl` — read-only property; в `EmailTemplateView`/`EmailLogView` поле с `exclude_from_edit` и `exclude_from_create`.

Админка пользователей: row action «Сбросить пароль» в `UserAdminView` — `user_password_service.reset_user_password_and_email`, письмо `temp_password`; `hash_password` вынесен из `user_auth` (booking/admin_dashboard импортируют сервис).

Личный кабинет — брони: `GET /profile/bookings` — `selectinload(images)` (без 500 MissingGreenlet); фильтр email через `func.lower`; при создании брони `customerEmail` в lowercase. `ProfilePage` — статусы `pending_confirmation`/`pending`/…, `loadError`, кнопка «Оплатить» для `pending`. `BookingFormPage` — prefill из `useAuth`, без лишнего `status` в POST.

DONE
