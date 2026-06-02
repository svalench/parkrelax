# Progress

## Изолированная замена по шаблону

- `presetId` в `accommodation_features` (миграция f7a8b9c0d1e2, batch_alter для SQLite)
- apply: delete только `presetId == текущий шаблон`, insert с `presetId`
- админка: HasOne preset, обновлены тексты apply-формы

DONE
