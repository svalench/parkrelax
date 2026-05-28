"""Применение шаблонов особенностей к размещениям."""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Accommodation,
    AccommodationFeature,
    AccommodationFeaturePreset,
    AccommodationFeaturePresetItem,
)


async def apply_feature_preset_to_accommodations(
    db: AsyncSession,
    preset_id: int,
    accommodation_ids: list[int],
    *,
    replace_existing: bool = True,
) -> tuple[int, int]:
    """
    Копирует пункты шаблона в accommodation_features для каждого размещения.

    Returns:
        (число размещений, число созданных записей особенностей)
    """
    if not accommodation_ids:
        return 0, 0

    preset_result = await db.execute(
        select(AccommodationFeaturePreset).where(AccommodationFeaturePreset.id == preset_id)
    )
    preset = preset_result.scalar_one_or_none()
    if not preset:
        raise ValueError("Шаблон особенностей не найден")

    items_result = await db.execute(
        select(AccommodationFeaturePresetItem)
        .where(
            AccommodationFeaturePresetItem.presetId == preset_id,
            AccommodationFeaturePresetItem.isActive == True,
        )
        .order_by(AccommodationFeaturePresetItem.sortOrder)
    )
    preset_items = list(items_result.scalars().all())
    if not preset_items:
        raise ValueError("В шаблоне нет активных особенностей")

    acc_result = await db.execute(
        select(Accommodation.id).where(Accommodation.id.in_(accommodation_ids))
    )
    valid_ids = list(acc_result.scalars().all())
    if not valid_ids:
        raise ValueError("Не найдено ни одного размещения")

    if replace_existing:
        await db.execute(
            delete(AccommodationFeature).where(
                AccommodationFeature.accommodationId.in_(valid_ids)
            )
        )

    created = 0
    for acc_id in valid_ids:
        for item in preset_items:
            db.add(
                AccommodationFeature(
                    accommodationId=acc_id,
                    iconName=item.iconName,
                    label=item.label,
                    sortOrder=item.sortOrder,
                    isActive=True,
                )
            )
            created += 1

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return len(valid_ids), created
