import {remove, render, RenderPosition} from '../framework/render.js';
import EditFormView from '../view/edit-form-view.js';

export default class NewPointPresenter {
  #pointListContainer = null;
  #handleDataChange = null;
  #handleDestroy = null;
  #editFormComponent = null;
  #destinations = null;
  #offers = null;

  constructor({pointListContainer, destinations, offers, onDataChange, onDestroy}) {
    this.#pointListContainer = pointListContainer;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init() {
    if (this.#editFormComponent !== null) {
      return;
    }

    const blankPoint = {
      id: null,
      type: 'flight',
      destination: '',
      dateFrom: new Date(),
      dateTo: new Date(),
      basePrice: 0,
      offers: [],
      isFavorite: false
    };

    this.#editFormComponent = new EditFormView({
      point: blankPoint,
      destinations: this.#destinations,
      offers: this.#offers,
      isNewPoint: true
    });

    this.#editFormComponent.setSubmitHandler(this.#handleFormSubmit);
    this.#editFormComponent.setDeleteHandler(this.#handleDeleteClick);
    this.#editFormComponent.setEscKeyHandler(this.#handleDeleteClick);

    render(this.#editFormComponent, this.#pointListContainer, RenderPosition.AFTERBEGIN);
    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy() {
    if (this.#editFormComponent === null) {
      return;
    }
    this.#handleDestroy();
    remove(this.#editFormComponent);
    this.#editFormComponent = null;
    document.removeEventListener('keydown', this.#escKeyDownHandler);

    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    if (newEventButton) {
      newEventButton.disabled = false;
    }
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange('add', {id: Date.now() + Math.random(), ...point});
    this.destroy();
  };

  #handleDeleteClick = () => {
    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.destroy();
    }
  };
}
