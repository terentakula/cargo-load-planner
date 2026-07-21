import { PlannerScene } from "./components/scene/PlannerScene";
import { usePlannerStore } from "./features/planner/store/usePlannerStore";
import "./App.css";
import { isCargoPositionAvailable } from "./features/planner/lib/collision";
import {
  getRotatedCargoOrientation,
  type CargoRotationAxis,
} from "./features/planner/lib/orientation";
import { getCargoTopLoadKg } from "./features/planner/lib/load";
import { findAvailableFloorPosition } from "./features/planner/lib/placement";
import { isCargoSupportingAnotherCargo } from "./features/planner/lib/support";
import { useState } from "react";
import { CargoCreateForm } from "./features/planner/components/CargoCreateForm";
import type { CargoFormValues } from "./features/planner/model/cargoForm";
import type {
  CargoTemplate,
  PlacedCargo,
} from "./features/planner/model/types";

function App() {
  const [isCargoFormOpen, setIsCargoFormOpen] = useState(false);

  const addCargo = usePlannerStore((state) => state.addCargo);

  const cargoTemplates = usePlannerStore((state) => state.cargoTemplates);

  const cargoSpace = usePlannerStore((state) => state.cargoSpace);

  const placedCargo = usePlannerStore((state) => state.placedCargo);

  const selectedCargoId = usePlannerStore((state) => state.selectedCargoId);

  const selectCargo = usePlannerStore((state) => state.selectCargo);

  const rotateCargo = usePlannerStore((state) => state.rotateCargo);

  const toggleCargoLock = usePlannerStore((state) => state.toggleCargoLock);

  const duplicateCargo = usePlannerStore((state) => state.duplicateCargo);

  const removeCargo = usePlannerStore((state) => state.removeCargo);

  const resetProject = usePlannerStore((state) => state.resetProject);

  const selectedCargo = placedCargo.find(
    (cargo) => cargo.id === selectedCargoId,
  );

  const selectedTemplate = selectedCargo
    ? cargoTemplates.find(
        (template) => template.id === selectedCargo.templateId,
      )
    : null;

  const selectedCargoTopLoadKg = selectedCargo
    ? getCargoTopLoadKg({
        cargoId: selectedCargo.id,
        placedCargo,
        cargoTemplates,
      })
    : 0;

  const selectedCargoSupportsAnotherCargo = selectedCargo
    ? isCargoSupportingAnotherCargo({
        cargoId: selectedCargo.id,
        placedCargo,
        cargoTemplates,
      })
    : false;

  const selectedCargoRemainingTopLoadKg =
    selectedTemplate?.maxTopLoadKg === null ||
    selectedTemplate?.maxTopLoadKg === undefined
      ? null
      : Math.max(0, selectedTemplate.maxTopLoadKg - selectedCargoTopLoadKg);

  const canRotateSelectedCargo = (axis: CargoRotationAxis): boolean => {
    if (!selectedCargo || !selectedTemplate || selectedCargo.locked) {
      return false;
    }

    const requiresTilting = axis === "x" || axis === "z";

    if (requiresTilting && !selectedTemplate.canBeTilted) {
      return false;
    }

    const nextOrientation = getRotatedCargoOrientation(
      selectedCargo.orientation,
      axis,
    );

    return isCargoPositionAvailable({
      cargoId: selectedCargo.id,
      position: selectedCargo.position,
      orientation: nextOrientation,
      cargoSpace,
      placedCargo,
      cargoTemplates,
    });
  };

  const handleRotateCargo = (axis: CargoRotationAxis) => {
    if (!selectedCargo || !canRotateSelectedCargo(axis)) {
      return;
    }

    const nextOrientation = getRotatedCargoOrientation(
      selectedCargo.orientation,
      axis,
    );

    rotateCargo(selectedCargo.id, nextOrientation);
  };

  const handleDuplicateCargo = () => {
    if (!selectedCargo || !selectedTemplate) {
      return;
    }

    const nextTotalWeightKg = totalWeightKg + selectedTemplate.weightKg;

    if (nextTotalWeightKg > cargoSpace.maxWeightKg) {
      window.alert(
        "Нельзя создать копию: будет превышена грузоподъёмность кузова.",
      );

      return;
    }

    const duplicateCargoId = `cargo-${crypto.randomUUID()}`;

    const candidateCargo = {
      ...selectedCargo,
      id: duplicateCargoId,
      position: {
        ...selectedCargo.position,
        yMm: 0,
      },
      locked: false,
    };

    const availablePosition = findAvailableFloorPosition({
      candidateCargo,
      cargoSpace,
      placedCargo,
      cargoTemplates,
    });

    if (!availablePosition) {
      window.alert("Для копии не найдено свободное место на полу кузова.");

      return;
    }

    duplicateCargo(selectedCargo.id, duplicateCargoId, availablePosition);
  };

  const handleRemoveCargo = () => {
    if (!selectedCargo || selectedCargoSupportsAnotherCargo) {
      return;
    }

    const cargoName = selectedTemplate?.name ?? selectedCargo.id;

    const confirmed = window.confirm(`Удалить груз «${cargoName}»?`);

    if (!confirmed) {
      return;
    }

    removeCargo(selectedCargo.id);
  };

  const handleCreateCargo = (values: CargoFormValues) => {
    const name = values.name.trim();
    const sku = values.sku.trim();

    const lengthMm = Number(values.lengthMm);
    const widthMm = Number(values.widthMm);
    const heightMm = Number(values.heightMm);
    const weightKg = Number(values.weightKg);

    const numericValues = [lengthMm, widthMm, heightMm, weightKg];

    if (
      !name ||
      !sku ||
      numericValues.some((value) => !Number.isFinite(value) || value <= 0)
    ) {
      window.alert(
        "Заполните название, артикул, размеры и вес положительными значениями.",
      );

      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(values.color)) {
      window.alert("Цвет должен быть указан в формате #RRGGBB.");

      return;
    }

    const maxTopLoadKg =
      values.stackable && values.maxTopLoadKg !== ""
        ? Number(values.maxTopLoadKg)
        : null;

    if (
      maxTopLoadKg !== null &&
      (!Number.isFinite(maxTopLoadKg) || maxTopLoadKg < 0)
    ) {
      window.alert("Максимальная нагрузка сверху не может быть отрицательной.");

      return;
    }

    if (totalWeightKg + weightKg > cargoSpace.maxWeightKg) {
      window.alert(
        "Нельзя добавить груз: будет превышена грузоподъёмность кузова.",
      );

      return;
    }

    const templateId = `template-${crypto.randomUUID()}`;

    const cargoId = `cargo-${crypto.randomUUID()}`;

    const cargoTemplate: CargoTemplate = {
      id: templateId,
      sku,
      name,
      lengthMm,
      widthMm,
      heightMm,
      weightKg,
      color: values.color,
      canBeTilted: values.canBeTilted,
      stackable: values.stackable,
      maxTopLoadKg,
    };

    const candidateCargo: PlacedCargo = {
      id: cargoId,
      templateId,
      position: {
        xMm: 0,
        yMm: 0,
        zMm: 0,
      },
      orientation: "XYZ",
      locked: false,
    };

    const availablePosition = findAvailableFloorPosition({
      candidateCargo,
      cargoSpace,
      placedCargo,
      cargoTemplates: [...cargoTemplates, cargoTemplate],
    });

    if (!availablePosition) {
      window.alert(
        "Груз не помещается в кузове или на полу нет подходящего свободного места.",
      );

      return;
    }

    addCargo(cargoTemplate, {
      ...candidateCargo,
      position: availablePosition,
    });

    setIsCargoFormOpen(false);
  };

  const handleResetProject = () => {
    const confirmed = window.confirm(
      "Сбросить проект? Все созданные грузы и изменения раскладки будут удалены.",
    );

    if (!confirmed) {
      return;
    }

    resetProject();
    setIsCargoFormOpen(false);
  };

  const canRotateX = canRotateSelectedCargo("x");
  const canRotateY = canRotateSelectedCargo("y");
  const canRotateZ = canRotateSelectedCargo("z");

  const totalWeightKg = placedCargo.reduce((totalWeight, cargo) => {
    const cargoTemplate = cargoTemplates.find(
      (template) => template.id === cargo.templateId,
    );

    return totalWeight + (cargoTemplate?.weightKg ?? 0);
  }, 0);

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
            <div className="cargo-toolbar">
              <button
                className="rotation-button cargo-create-trigger"
                type="button"
                aria-expanded={isCargoFormOpen}
                onClick={() => {
                  setIsCargoFormOpen((currentValue) => !currentValue);
                }}
              >
                {isCargoFormOpen ? "Скрыть форму" : "Добавить груз"}
              </button>

              <button
                className="rotation-button cargo-reset-button"
                type="button"
                onClick={handleResetProject}
              >
                Сбросить проект
              </button>
            </div>

            {isCargoFormOpen && (
              <CargoCreateForm
                onCancel={() => {
                  setIsCargoFormOpen(false);
                }}
                onSubmit={handleCreateCargo}
              />
            )}
            {placedCargo.map((cargo, index) => {
              const cargoTemplate = cargoTemplates.find(
                (template) => template.id === cargo.templateId,
              );

              if (!cargoTemplate) {
                return null;
              }

              const selected = cargo.id === selectedCargoId;

              return (
                <button
                  key={cargo.id}
                  className={`cargo-list__item${
                    selected ? " cargo-list__item--selected" : ""
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
                      {cargoTemplate.lengthMm.toLocaleString("ru-RU")} *{" "}
                      {cargoTemplate.widthMm.toLocaleString("ru-RU")} *{" "}
                      {cargoTemplate.heightMm.toLocaleString("ru-RU")} мм
                    </span>

                    <span className="cargo-list__meta">
                      {cargoTemplate.weightKg.toLocaleString("ru-RU")} кг
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="viewport">
          <div className="viewport__toolbar">
            <span className="viewport__badge">Перспектива</span>

            <span className="viewport__hint">
              Зажмите груз левой кнопкой и перемещайте по полу
            </span>

            <span className="viewport__hint">
              Красный цвет означает пересечение грузов
            </span>
            <span className="viewport__hint">
              Переместите груз над коробкой, чтобы установить его сверху
            </span>
            <span className="viewport__hint">
              Красный груз означает недопустимое положение или превышение
              нагрузки
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
                <span className="property-card__label">Выбранный груз</span>

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
                    {selectedTemplate.lengthMm.toLocaleString("ru-RU")} мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Ширина</dt>
                  <dd>{selectedTemplate.widthMm.toLocaleString("ru-RU")} мм</dd>
                </div>

                <div className="property-list__row">
                  <dt>Высота</dt>
                  <dd>
                    {selectedTemplate.heightMm.toLocaleString("ru-RU")} мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Вес</dt>
                  <dd>
                    {selectedTemplate.weightKg.toLocaleString("ru-RU")} кг
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Ориентация</dt>
                  <dd>{selectedCargo.orientation}</dd>
                </div>

                <div className="property-list__row">
                  <dt>Позиция X</dt>
                  <dd>
                    {selectedCargo.position.xMm.toLocaleString("ru-RU")} мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Позиция Y</dt>
                  <dd>
                    {selectedCargo.position.yMm.toLocaleString("ru-RU")} мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Позиция Z</dt>
                  <dd>
                    {selectedCargo.position.zMm.toLocaleString("ru-RU")} мм
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Позиция зафиксирована</dt>
                  <dd>{selectedCargo.locked ? "Да" : "Нет"}</dd>
                </div>

                <div className="property-list__row">
                  <dt>Штабелирование</dt>
                  <dd>
                    {selectedTemplate.stackable ? "Разрешено" : "Запрещено"}
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Макс. нагрузка сверху</dt>
                  <dd>
                    {!selectedTemplate.stackable
                      ? "Не допускается"
                      : selectedTemplate.maxTopLoadKg === null
                        ? "Без ограничения"
                        : `${selectedTemplate.maxTopLoadKg} кг`}
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Текущая нагрузка сверху</dt>
                  <dd>
                    {selectedTemplate.stackable
                      ? `${selectedCargoTopLoadKg} кг`
                      : "Не допускается"}
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Остаток нагрузки</dt>
                  <dd>
                    {!selectedTemplate.stackable
                      ? "Не допускается"
                      : selectedCargoRemainingTopLoadKg === null
                        ? "Без ограничения"
                        : `${selectedCargoRemainingTopLoadKg} кг`}
                  </dd>
                </div>

                <div className="property-list__row">
                  <dt>Кантование</dt>
                  <dd>
                    {selectedTemplate.canBeTilted ? "Разрешено" : "Запрещено"}
                  </dd>
                </div>
              </dl>

              <div className="rotation-controls">
                <div>
                  <p className="rotation-controls__title">Поворот на 90°</p>

                  <p className="rotation-controls__description">
                    Недоступный поворот создаёт пересечение, выходит за границы
                    кузова или запрещён для этого груза.
                  </p>
                </div>

                <div className="rotation-controls__buttons">
                  <button
                    className="rotation-button"
                    type="button"
                    disabled={!canRotateX}
                    onClick={() => handleRotateCargo("x")}
                  >
                    По X
                  </button>

                  <button
                    className="rotation-button"
                    type="button"
                    disabled={!canRotateY}
                    onClick={() => handleRotateCargo("y")}
                  >
                    По Y
                  </button>

                  <button
                    className="rotation-button"
                    type="button"
                    disabled={!canRotateZ}
                    onClick={() => handleRotateCargo("z")}
                  >
                    По Z
                  </button>
                </div>
              </div>

              <div className="cargo-actions">
                <button
                  className="rotation-button cargo-action-button"
                  type="button"
                  onClick={handleDuplicateCargo}
                >
                  Дублировать груз
                </button>
                <button
                  className="rotation-button cargo-action-button"
                  type="button"
                  onClick={() => {
                    toggleCargoLock(selectedCargo.id);
                  }}
                >
                  {selectedCargo.locked
                    ? "Разблокировать груз"
                    : "Заблокировать груз"}
                </button>

                <button
                  className="rotation-button cargo-action-button cargo-action-button--danger"
                  type="button"
                  disabled={selectedCargoSupportsAnotherCargo}
                  onClick={handleRemoveCargo}
                >
                  Удалить груз
                </button>

                {selectedCargoSupportsAnotherCargo && (
                  <p className="cargo-actions__warning">
                    Сначала снимите грузы, расположенные сверху.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">Груз не выбран</p>

              <p className="empty-state__description">
                Выберите коробку в списке или нажмите на неё в 3D-сцене.
              </p>
            </div>
          )}
        </aside>
      </section>

      <footer className="planner__statusbar">
        <span>Размещено: {placedCargo.length}</span>

        <span>Вес: {totalWeightKg.toLocaleString("ru-RU")} кг</span>

        <span>Заполнение: пока не рассчитано</span>

        <span className="planner__status">Сцена готова</span>
      </footer>
    </main>
  );
}

export default App;
