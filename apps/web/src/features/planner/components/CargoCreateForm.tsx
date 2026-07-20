import { useState } from 'react'
import {
  INITIAL_CARGO_FORM_VALUES,
  type CargoFormValues,
} from '../model/cargoForm'

type Props = {
  onCancel: () => void
  onSubmit: (values: CargoFormValues) => void
}

type NumericField =
  | 'lengthMm'
  | 'widthMm'
  | 'heightMm'
  | 'weightKg'
  | 'maxTopLoadKg'

export function CargoCreateForm({
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<CargoFormValues>(
    INITIAL_CARGO_FORM_VALUES,
  )

  const updateValue = (
    field: keyof CargoFormValues,
    value: string | boolean,
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  const handleNumericChange = (
    field: NumericField,
    value: string,
  ) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }

    updateValue(field, value)
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <form
      className="cargo-create-form"
      onSubmit={handleSubmit}
    >
      <div className="cargo-create-form__header">
        <div>
          <h3>Новый груз</h3>
          <p>
            Укажите реальные габариты и ограничения.
          </p>
        </div>

        <button
          className="cargo-create-form__close"
          type="button"
          aria-label="Закрыть форму"
          onClick={onCancel}
        >
          ×
        </button>
      </div>

      <label className="cargo-form-field">
        <span>Название</span>
        <input
          required
          type="text"
          value={values.name}
          placeholder="Например, европаллета"
          onChange={(event) => {
            updateValue('name', event.target.value)
          }}
        />
      </label>

      <label className="cargo-form-field">
        <span>Артикул</span>
        <input
          required
          type="text"
          value={values.sku}
          placeholder="EUR-PALLET"
          onChange={(event) => {
            updateValue('sku', event.target.value)
          }}
        />
      </label>

      <div className="cargo-form-grid">
        <label className="cargo-form-field">
          <span>Длина, мм</span>
          <input
            required
            min="1"
            type="number"
            value={values.lengthMm}
            onChange={(event) => {
              handleNumericChange(
                'lengthMm',
                event.target.value,
              )
            }}
          />
        </label>

        <label className="cargo-form-field">
          <span>Ширина, мм</span>
          <input
            required
            min="1"
            type="number"
            value={values.widthMm}
            onChange={(event) => {
              handleNumericChange(
                'widthMm',
                event.target.value,
              )
            }}
          />
        </label>

        <label className="cargo-form-field">
          <span>Высота, мм</span>
          <input
            required
            min="1"
            type="number"
            value={values.heightMm}
            onChange={(event) => {
              handleNumericChange(
                'heightMm',
                event.target.value,
              )
            }}
          />
        </label>

        <label className="cargo-form-field">
          <span>Вес, кг</span>
          <input
            required
            min="1"
            type="number"
            value={values.weightKg}
            onChange={(event) => {
              handleNumericChange(
                'weightKg',
                event.target.value,
              )
            }}
          />
        </label>
      </div>

      <label className="cargo-form-field">
        <span>Цвет</span>

        <div className="cargo-color-field">
          <input
            type="color"
            value={values.color}
            onChange={(event) => {
              updateValue('color', event.target.value)
            }}
          />

          <input
            type="text"
            value={values.color}
            pattern="^#[0-9A-Fa-f]{6}$"
            onChange={(event) => {
              updateValue('color', event.target.value)
            }}
          />
        </div>
      </label>

      <label className="cargo-form-checkbox">
        <input
          type="checkbox"
          checked={values.canBeTilted}
          onChange={(event) => {
            updateValue(
              'canBeTilted',
              event.target.checked,
            )
          }}
        />

        <span>Разрешено кантование</span>
      </label>

      <label className="cargo-form-checkbox">
        <input
          type="checkbox"
          checked={values.stackable}
          onChange={(event) => {
            updateValue(
              'stackable',
              event.target.checked,
            )
          }}
        />

        <span>Разрешено ставить груз сверху</span>
      </label>

      {values.stackable && (
        <label className="cargo-form-field">
          <span>
            Максимальная нагрузка сверху, кг
          </span>

          <input
            min="0"
            type="number"
            value={values.maxTopLoadKg}
            placeholder="Пусто — без ограничения"
            onChange={(event) => {
              handleNumericChange(
                'maxTopLoadKg',
                event.target.value,
              )
            }}
          />
        </label>
      )}

      <div className="cargo-create-form__actions">
        <button
          className="rotation-button"
          type="button"
          onClick={onCancel}
        >
          Отмена
        </button>

        <button
          className="rotation-button cargo-create-form__submit"
          type="submit"
        >
          Добавить груз
        </button>
      </div>
    </form>
  )
}