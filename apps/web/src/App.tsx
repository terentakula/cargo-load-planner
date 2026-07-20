import { PlannerScene } from "./components/scene/PlannerScene";
import "./App.css";
import { DEFAULT_CARGO_SPACE } from "./features/planner/model/defaults";

function App() {
  return (
    <main className="planner">
      <header className="planner__header">
        <div>
          <p className="planner__eyebrow">Cargo Load Planner</p>
          <h1 className="planner__title">Новый проект</h1>
        </div>

        <div className="planner__header-actions">
          <button className="button button--secondary" type="button">
            Сохранить
          </button>

          <button className="button button--primary" type="button">
            Экспорт PDF
          </button>
        </div>
      </header>

      <section className="planner__workspace">
        <aside className="panel panel--left">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Каталог</p>
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

          <div className="empty-state">
            <p className="empty-state__title">Список пока пуст</p>
            <p className="empty-state__description">
              Здесь появятся грузы, которые можно добавить в контейнер.
            </p>
          </div>
        </aside>

        <section className="viewport">
          <div className="viewport__toolbar">
            <span className="viewport__badge">Перспектива</span>
            <span className="viewport__hint">
              Левая кнопка — вращение, колесо — масштаб
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

          <div className="property-card">
            <span className="property-card__label">Грузовое пространство</span>
            <strong className="property-card__value">
              {DEFAULT_CARGO_SPACE.name}
            </strong>
          </div>

          <dl className="property-list">
            <div className="property-list__row">
              <dt>Длина</dt>
              <dd>{DEFAULT_CARGO_SPACE.lengthMm.toLocaleString("ru-RU")} мм</dd>
            </div>

            <div className="property-list__row">
              <dt>Ширина</dt>
              <dd>{DEFAULT_CARGO_SPACE.widthMm.toLocaleString("ru-RU")} мм</dd>
            </div>

            <div className="property-list__row">
              <dt>Высота</dt>
              <dd>{DEFAULT_CARGO_SPACE.heightMm.toLocaleString("ru-RU")} мм</dd>
            </div>

            <div className="property-list__row">
              <dt>Грузоподъёмность</dt>
              <dd>
                {DEFAULT_CARGO_SPACE.maxWeightKg.toLocaleString("ru-RU")} кг
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <footer className="planner__statusbar">
        <span>Размещено: 1 груз</span>
        <span>Вес: 0 кг</span>
        <span>Заполнение: 0%</span>
        <span className="planner__status">Сцена готова</span>
      </footer>
    </main>
  );
}

export default App;
