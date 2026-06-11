# Progress

## Приведение к требованиям БАПБ (эквайринг)

- Логотипы: Visa/MC/Белкарт + Visa Secure, MC ID Check, Белкарт ИнтернетПароль, bePaid (`PaymentLogos.tsx`, футер, страница оплаты)
- Legal: миграция `c8d9e0f1a2b3` — `payment-info`, обновлён `refund-policy` (60 раб. дней), исправлен `privacy-policy`
- Футер: ссылки «Оплата и возврат», «Правила возврата»; госрегистрация, режим работы; телефон +375 (17) 390-19-50
- BookingFormPage: согласие с офертой и правилами возврата
- Отмена брони: `POST /profile/bookings/{id}/cancel` + кнопка в ProfilePage
- bePaid: `bepaid_service.py`, redirect на checkout, webhook `/payment/webhook`, настройки в `.env.example`
- Визуально выровнен блок платежных знаков: проблемные Белкарт / 3-D Secure / bePaid теперь рисуются HTML/CSS без битых SVG.

DONE
