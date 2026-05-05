# Progress

WYSIWYG: в админке `TinyMCEEditorField` для описаний/контента (Rental, AccommodationType, Accommodation, LegalPage), русский UI, санитизация `nh3` в `html_sanitize.py` + `before_create`/`before_edit`. Фронт: `dompurify` в `lib/safeHtml.ts`, юридические страницы и аренда — рендер HTML, карточки размещения и бронирование — plain-text превью. Правка `LegalPage`/`BookingPage` fetch для eslint react-hooks.

Hero (мобильный viewport &lt; md): вместо многострочного h1 — прозрачный `public/images/logo.svg`, под ним жирный слоган (`text-xl` / `sm:text-2xl` для читаемости); нижний дубликат слогана скрыт до md. Абзац «Комфортные домики…» показывается только с `md` и выше. Для читаемости слова RELAX вместо прямоугольной подложки добавлена мягкая овальная засветка за правой частью логотипа. `npm run build` — ок; общий `npm run lint` падает на старых ui-файлах, не на Hero.

DONE
