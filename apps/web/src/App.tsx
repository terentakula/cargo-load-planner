import { PlannerScene } from './components/scene/PlannerScene'
import { usePlannerStore } from './features/planner/store/usePlannerStore'
import './App.css'

function App() {
  const cargoTemplates = usePlannerStore(
    (state) => state.cargoTemplates,
  )

  const placedCargo = usePlannerStore(
    (state) => state.placedCargo,
  )

  const selectedCargoId = usePlannerStore(
    (state) => state.selectedCargoId,
  )

  const selectCargo = usePlannerStore(
    (state) => state.selectCargo,
  )

  const selectedCargo = placedCargo.find(
    (cargo) => cargo.id === selectedCargoId,
  )

  const selectedTemplate = selectedCargo
    ? cargoTemplates.find(
        (template) =>
          template.id === selectedCargo.templateId,
      )
    : null

  const totalWeightKg = placedCargo.reduce(
    (totalWeight, cargo) => {
      const cargoTemplate = cargoTemplates.find(
        (template) => template.id === cargo.templateId,
      )

      return totalWeight + (cargoTemplate?.weightKg ?? 0)
    },
    0,
  )

  return (
    <main className="planner">
      <header className="planner__header">
        <div>
          <p className="planner__eyebrow">
            Cargo Load Planner
          </p>

          <h1 className="planner__title">Новый проект</h1>
        </div>

        <div className="planner__header-actions">
          <button
            className="button button--secondary"
            type="button"
          >
            Сохранить
          </button>

          <button
            className="button button--primary"
            type="button"
          >
            Экспорт PDF
          </button>
        </div>
      </header>

      <section className="planner__workspace">
        <aside className="panel panel--left">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Размещённые</p>
              <h2 className="panel__title">Грузы</h2>
            </div>

            <button
              className="icon-button"
              type="button"
              aria-label="Добавить груз"
            >
              +
            </button>
          </div>

          <div className="cargo-list">
            {placedCargo.map((cargo, index) => {
              const cargoTemplate = cargoTemplates.find(
                (template) =>
                  template.id === cargo.templateId,
              )

              if (!cargoTemplate) {
                return null
              }

              const selected = cargo.id === selectedCargoId

              return (
                <button
                  key={cargo.id}
                  className={`cargo-list__item${
                    selected
                      ? ' cargo-list__item--selected'
                      : ''
                  }`}
                  type="button"
                  onClick={() => selectCargo(cargo.id)}
                >
                  <span
                    className="cargo-list__color"
                    style={{
                      backgroundColor: cargoTemplate.color,
                    }}
                  />

                  <span className="cargo-list__content">
                    <strong className="cargo-list__name">
                      {index + 1}. {cargoTemplate.name}
                    </strong>

                    <span className="cargo-list__meta">
                      {cargoTemplate.lengthMm.toLocaleString(
                        'ru-RU',
                      )}{' '}
                      ×{' '}
                      {cargoTemplate.widthMm.toLocaleString(
                        'ru-RU',
                      )}{' '}
                      ×{' '}
                      {cargoTemplate.heightMm.toLocaleString(
                        'ru-RU',
                      )}{' '}
                      мм
                    </span>

                    <span className="cargo-list__meta">
                      {cargoTemplate.weightKg.toLocaleString(
                        'ru-RU',
                      )}{' '}
                      кг
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="viewport">
          <div className="viewport__toolbar">
            <span className="viewport__badge">
              Перспектива
            </span>

            <span className="viewport__hint">
              Нажмите на груз, чтобы выбрать его
            </span>
          </div>

          <div className="viewport__canvas">
            <PlannerScene />
          </div>
        </section>

        <aside className="panel panel--right">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Редактор</p>
              <h2 className="panel__title">Свойства</h2>
            </div>
          </div>

          {selectedCargo && selectedTemplate ? (
            <>
              <div className="property-card">
                <span className="property-card__label">
                  Выбранный груз
                </span>

                <strong className="property-card__value">
                  {selectedTemplate.name}
                </strong>

                <span className="property-card__sku">
                  {selectedTemplate.sku}
                </span>
              </div>

              <dl className="property-list">
                <div className="property-list__row">
                  <dt>Длина</dt>
                  <dd>
                    {selectedTemplate.lengthMm.toLocaleString(
                      'ru-RU',
                    )}{' '}
                    мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Ширина</dt>
                  <dd>
                    {selectedTemplate.widthMm.toLocaleString(
                      'ru-RU',
                    )}{' '}
                    мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Высота</dt>
                  <dd>
                    {selectedTemplate.heightMm.toLocaleString(
                      'ru-RU',
                    )}{' '}
                    мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Вес</dt>
                  <dd>
                    {selectedTemplate.weightKg.toLocaleString(
                      'ru-RU',
                    )}{' '}
                    кг
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Ориентация</dt>
                  <dd>{selectedCargo.orientation}</dd>
                </div>

                <div className="property-list__row">
                  <dt>Штабелирование</dt>
                  <dd>
                    {selectedTemplate.stackable
                      ? 'Разрешено'
                      : 'Запрещено'}
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Кантование</dt>
                  <dd>
                    {selectedTemplate.canBeTilted
                      ? 'Разрешено'
                      : 'Запрещено'}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">
                Груз не выбран
              </p>

              <p className="empty-state__description">
                Выберите коробку в списке или нажмите на неё
                в 3D-сцене.
              </p>
            </div>
          )}
        </aside>
      </section>

      <footer className="planner__statusbar">
        <span>Размещено: {placedCargo.length}</span>

        <span>
          Вес: {totalWeightKg.toLocaleString('ru-RU')} кг
        </span>

        <span>Заполнение: пока не рассчитано</span>

        <span className="planner__status">
          Сцена готова
        </span>
      </footer>
    </main>
  )
}

export default App