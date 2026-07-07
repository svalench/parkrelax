# Progress

## Payment-hold: флоу бронирования с оплатой

- auto_payment: бронь создаётся со статусом `payment_hold` и `holdExpiresAt=now+10min`, письма отложены до оплаты.
- availability: просроченный `payment_hold` не блокирует даты; ленивая очистка в `cancelled`.
- payment: initiate проверяет холд, после оплаты отправляет `booking_confirmation` + `new_booking_admin`.
- frontend: таймер на PaymentPage, holdUntil в URL из BookingFormPage.
- Миграция `f2a3b4c5d6e7`, compile OK.

DONE

## Исправление bePaid checkout failed + логи бронирования

- Причина ошибки «bePaid checkout failed» и суммы 0 Br: в БД `notificationUrl` был относительным (`/api/payment/webhook`), bePaid требует абсолютный URL; фронт не проверял `res.ok` при initiate.
- Исправление: `normalize_notification_url()` в `payment_settings.py` — автопочинка при чтении/сохранении настроек.
- Логи: `logs/booking.log` (RotatingFileHandler 5MB × 10) через `app/booking_logging.py`; логирование в `booking.py`, `payment.py`, `bepaid_service.py`.
- Фронт: `PaymentPage` проверяет `res.ok`, показывает текст ошибки bePaid, корректный заголовок при активном bePaid.
- Проверка: normalize + DB fix OK, `initiate_payment` mock OK, compile OK.

DONE

## Исправление 500 на /api/payment/initiate

- Причина: ленивая подгрузка `Accommodation.type` в async-сессии при `_booking_amount` -> `MissingGreenlet` -> HTTP 500 (plain text).
- Исправление: eager-загрузка `Accommodation.type` в `_load_booking` и `_payment_load_options` в `backend/app/routers/payment.py`.
- Дополнительно: кэш `booking_id` до `commit`, чтобы не обращаться к истёкшему `booking.id` после commit.
- Проверка: репро `calculate_booking_total` OK (5200), прямой вызов `initiate_payment` -> mock/pending OK, `compileall` и `import app.main` OK.

DONE

## bePaid: учёт платежей и настройки через админку

- Итерация 4: добавлен шаблон `payment_available` и письмо пользователю при подтверждении заявки админом (`status` переходит в `pending`).
- Проверка итерации 4: backend compile, Alembic upgrade, frontend build, import app и `git diff --check` прошли; lint остаётся на существующем baseline.
- Итерация 1: начата схема `PaymentSettings` / `Payment` / `PaymentEvent`, флаг уведомлений по оплатам для админских email.
- Итерация 1: модели и Alembic-миграция добавлены, включая seed `PaymentSettings` и шаблон `payment_success_admin`.
- Итерация 2: payment flow переведён на таблицу `payments`, события, webhook/confirm и уведомления админам.
- Итерация 3: добавлены разделы оплат в Starlette Admin и React admin dashboard, флаг `notifyOnPayments`, auto/manual режимы на frontend.
- Проверка: `python` и глобальный `alembic` отсутствуют в shell; добавлено правило `.cursor/rules/verification-commands.mdc`, повтор через `python3`.
- Проверка: `.venv/bin/python -m compileall backend/app` прошёл успешно.
- Проверка: `../.venv/bin/alembic upgrade head` из `backend/` прошёл успешно.
- Проверка: `npm run build` прошёл успешно; `npm run lint` падает на существующих ошибках baseline вне текущих изменений.
- Проверка: `git diff --check` прошёл успешно, `TODO/FIXME` в backend/frontend коде не найдены, `import app.main` прошёл успешно.

DONE

## Приведение к требованиям БАПБ (эквайринг)

- Логотипы: Visa/MC/Белкарт + Visa Secure, MC ID Check, Белкарт ИнтернетПароль, bePaid (`PaymentLogos.tsx`, футер, страница оплаты)
- Legal: миграция `c8d9e0f1a2b3` — `payment-info`, обновлён `refund-policy` (60 раб. дней), исправлен `privacy-policy`
- Футер: ссылки «Оплата и возврат», «Правила возврата»; госрегистрация, режим работы; телефон +375 (17) 390-19-50
- BookingFormPage: согласие с офертой и правилами возврата
- Отмена брони: `POST /profile/bookings/{id}/cancel` + кнопка в ProfilePage
- bePaid: `bepaid_service.py`, redirect на checkout, webhook `/payment/webhook`, настройки в `.env.example`
- Блок платежных знаков заменён на присланный официальный PNG-набор: Visa, Visa Secure, Mastercard, ID Check, Белкарт, Белкарт ИнтернетПароль, bePaid, G Pay.

DONE

## Юридический адрес — Республика Беларусь

- Footer.tsx: добавлено «Республика Беларусь» в юридический адрес
- Миграция `d9e0f1a2b3c4`: обновление legal_pages в БД

## bePaid disclosure в футере

- `BepaidPaymentDisclosure.tsx`: обязательный текст PCI DSS / SSL/TLS, ссылка на bepaid.by/kak-oplatit
- `PaymentLogos.tsx`: проп `showDisclosure` — полный текст вместо короткой строки
- `Footer.tsx`: `<PaymentLogos showDisclosure />`
- `PaymentPage`: без изменений (compact, короткая строка)

DONE

## Выпадающее меню связи в шапке

- `frontend/src/lib/contactLinks.ts`: normalizePhone + buildContactLinks (tel, WhatsApp, Viber, Telegram)
- `frontend/src/components/PhoneContactMenu.tsx`: DropdownMenu с 4 пунктами и SVG-иконками
- `frontend/src/sections/Navbar.tsx`: desktop слева, mobile иконка, mobile menu — PhoneContactMenu
- Проверка: `npm run build` OK; `npm run lint` — baseline ошибки вне текущих изменений

DONE
