import RoutePointView from '../view/point-view.js';
import EditFormView from '../view/edit-form-view.js';
import { render, replace, remove } from '../framework/render.js';

export default class PointPresenter {
  #pointComponent = null;
  #editFormComponent = null;
  #point = null;
  #destinations = null;
  #offers = null;
  #container = null;
  #handleDataChange = null;
  #handleModeChange = null;
  #isEditFormOpen = false;
  #isNewPoint = false;
  #isSaving = false;

  constructor({ container, onDataChange, onModeChange }) {
    this.#container = container;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init(point, destinations, offers, isNewPoint = false) {
    this.#point = point;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#isNewPoint = isNewPoint;
    this.#isSaving = false;

    this.#createComponents();
    this.#setHandlers();

    if (this.#isNewPoint) {
      render(this.#editFormComponent, this.#container);
      this.#isEditFormOpen = true;
    } else {
      render(this.#pointComponent, this.#container);
    }
  }

  update(point) {
    this.#point = point;

    const oldPointComponent = this.#pointComponent;

    this.#pointComponent = new RoutePointView({
      point: this.#point,
      destination: this.#getDestination(),
      offers: this.#offers,
    });

    this.#setPointHandlers();

    if (oldPointComponent && oldPointComponent.element.parentElement) {
      replace(this.#pointComponent, oldPointComponent);
    } else if (oldPointComponent) {
      render(this.#pointComponent, this.#container);
    }
    if (oldPointComponent) {
      remove(oldPointComponent);
    }
  }

  destroy() {
    if (this.#pointComponent) {
      remove(this.#pointComponent);
    }
    if (this.#editFormComponent) {
      this.#editFormComponent.removeEscKeyHandler();
      remove(this.#editFormComponent);
    }
  }

  resetView() {
    if (this.#editFormComponent && this.#isEditFormOpen && !this.#isNewPoint) {
      this.#replaceFormToPoint();
    }
  }

  #createComponents() {
    this.#pointComponent = new RoutePointView({
      point: this.#point,
      destination: this.#getDestination(),
      offers: this.#offers,
    });

    this.#editFormComponent = new EditFormView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      isNewPoint: this.#isNewPoint,
    });
  }

  #setHandlers() {
    this.#setPointHandlers();
    this.#setFormHandlers();
  }

  #setPointHandlers() {
    this.#pointComponent.setEditClickHandler(() => {
      this.#replacePointToForm();
    });

    this.#pointComponent.setFavoriteClickHandler(async () => {
      const updatedPoint = {
        ...this.#point,
        isFavorite: !this.#point.isFavorite,
      };

      try {
        await this.#handleDataChange(updatedPoint, 'update');
      } catch {
        this.#pointComponent.shake();
      }
    });
  }

  #validatePoint(point) {
    if (!point.destination || point.destination === '') {
      return false;
    }

    if (point.dateTo && point.dateFrom && new Date(point.dateTo) < new Date(point.dateFrom)) {
      return false;
    }

    if (point.basePrice < 0) {
      return false;
    }

    if (!point.type) {
      return false;
    }

    return true;
  }

  #setFormHandlers() {
    this.#editFormComponent.setSubmitHandler(async (updatedPoint) => {
      if (this.#isSaving) {
        return;
      }

      if (!this.#validatePoint(updatedPoint)) {
        this.#editFormComponent.shake();
        return;
      }

      this.#isSaving = true;
      this.#setButtonsDisabled(true);

      try {
        if (this.#isNewPoint) {
          const newPoint = {
            id: null,
            type: updatedPoint.type || 'flight',
            destination: updatedPoint.destination,
            dateFrom: updatedPoint.dateFrom || null,
            dateTo: updatedPoint.dateTo || null,
            basePrice: updatedPoint.basePrice || 0,
            offers: updatedPoint.offers || [],
            isFavorite: updatedPoint.isFavorite || false,
          };
          await this.#handleDataChange(newPoint, 'add');
        } else {
          await this.#handleDataChange(updatedPoint, 'update');
        }
        if (this.#isNewPoint) {
          this.destroy();
        } else {
          this.#replaceFormToPoint();
        }
      } catch (err) {
        this.#setButtonsDisabled(false);
        this.#editFormComponent.shake();
        this.#isSaving = false;
      }
    });

    this.#editFormComponent.setDeleteHandler(async () => {
      if (this.#isSaving) {
        return;
      }

      if (this.#isNewPoint) {
        this.destroy();
        const newEventButton = document.querySelector('.trip-main__event-add-btn');
        if (newEventButton) {
          newEventButton.disabled = false;
        }
        this.#handleModeChange();
        return;
      }

      this.#isSaving = true;
      this.#setButtonsDisabled(true);

      try {
        await this.#handleDataChange(this.#point.id, 'delete');
      } catch (err) {
        this.#setButtonsDisabled(false);
        this.#editFormComponent.shake();
        this.#isSaving = false;
      }
    });

    this.#editFormComponent.setRollupClickHandler(() => {
      if (this.#isNewPoint) {
        this.destroy();
      } else {
        this.#editFormComponent.reset(this.#point);
        this.#replaceFormToPoint();
      }
    });

    this.#editFormComponent.setEscKeyHandler(() => {
      if (this.#isNewPoint) {
        this.destroy();
      } else {
        this.#editFormComponent.reset(this.#point);
        this.#replaceFormToPoint();
      }
    });
  }

  #setButtonsDisabled(isDisabled) {
    const saveBtn = this.#editFormComponent.element.querySelector('.event__save-btn');
    const deleteBtn = this.#editFormComponent.element.querySelector('.event__reset-btn');

    if (saveBtn) {
      saveBtn.disabled = isDisabled;
      saveBtn.textContent = isDisabled ? 'Saving...' : 'Save';
    }
    if (deleteBtn && !this.#isNewPoint) {
      deleteBtn.disabled = isDisabled;
      deleteBtn.textContent = isDisabled ? 'Deleting...' : 'Delete';
    }
  }

  #getDestination() {
    if (!this.#point.destination) {
      return { name: '' };
    }
    return this.#destinations.find((dest) => dest.id === this.#point.destination) || { name: '' };
  }

  #getPointOffers() {
    const offersForType = this.#offers[this.#point.type] || [];
    return offersForType.filter((offer) => this.#point.offers && this.#point.offers.includes(offer.id));
  }

  #replacePointToForm() {
    if (this.#isEditFormOpen) {
      return;
    }
    this.#handleModeChange();
    if (this.#editFormComponent && this.#pointComponent && this.#pointComponent.element.parentElement) {
      replace(this.#editFormComponent, this.#pointComponent);
      this.#isEditFormOpen = true;
    } else {
      render(this.#editFormComponent, this.#container);
      this.#isEditFormOpen = true;
    }
  }

  #replaceFormToPoint() {
    if (!this.#isEditFormOpen) {
      return;
    }
    const parentElement = this.#editFormComponent?.element?.parentElement;
    if (parentElement && this.#pointComponent) {
      replace(this.#pointComponent, this.#editFormComponent);
      this.#isEditFormOpen = false;
      this.#editFormComponent.removeEscKeyHandler();
    } else if (this.#pointComponent) {
      render(this.#pointComponent, this.#container);
      this.#isEditFormOpen = false;
    }
  }
}
