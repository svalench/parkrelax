# Progress

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
