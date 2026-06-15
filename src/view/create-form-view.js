import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import {humanizePointDate, humanizePointTime} from '../utils.js';
import { isEscEvent, findDestinationById } from '../common.js';

const BLANK_POINT = {
  type: 'flight',
  destination: '',
  dateFrom: new Date(),
  dateTo: new Date(),
  basePrice: 0,
  offers: [],
  isFavorite: false
};

export default class CreateFormView extends AbstractStatefulView {
  #destinations = null;
  #offers = null;

  constructor({point = BLANK_POINT, destinations = [], offers = []} = {}) {
    super();
    this._state = this.#pointToState(point);
    this.#destinations = destinations;
    this.#offers = offers;
    this._restoreHandlers();
  }

  get template() {
    return this.#createTemplate();
  }

  #pointToState(point) {
    return {
      type: point.type,
      destination: point.destination,
      dateFrom: point.dateFrom,
      dateTo: point.dateTo,
      basePrice: point.basePrice,
      offers: [...point.offers],
      isFavorite: point.isFavorite
    };
  }

  #stateToPoint() {
    return {
      type: this._state.type,
      destination: this._state.destination,
      dateFrom: this._state.dateFrom,
      dateTo: this._state.dateTo,
      basePrice: this._state.basePrice,
      offers: [...this._state.offers],
      isFavorite: this._state.isFavorite
    };
  }

  #createTemplate() {
    const {type, destination: destinationId, dateFrom, dateTo, basePrice, offers: selectedOffers} = this._state;
    const destinationObj = findDestinationById(this.#destinations, destinationId);
    const destinationName = destinationObj ? destinationObj.name : '';

    const dateFromFormatted = humanizePointDate(dateFrom);
    const dateToFormatted = humanizePointDate(dateTo);
    const timeFromFormatted = humanizePointTime(dateFrom);
    const timeToFormatted = humanizePointTime(dateTo);

    const types = ['taxi', 'bus', 'train', 'ship', 'drive', 'flight', 'check-in', 'sightseeing', 'restaurant'];
    const typeTemplate = types.map((typeName) => `
      <div class="event__type-item">
        <input id="event-type-${typeName}-2" class="event__type-input visually-hidden" type="radio" name="event-type" value="${typeName}" ${typeName === type ? 'checked' : ''}>
        <label class="event__type-label event__type-label--${typeName}" for="event-type-${typeName}-2">${typeName.charAt(0).toUpperCase() + typeName.slice(1)}</label>
      </div>
    `).join('');

    const options = this.#destinations.map((destination) => `<option value="${destination.name}"></option>`).join('');
    const destinationTemplate = `
      <div class="event__field-group event__field-group--destination">
        <label class="event__label event__type-output" for="event-destination-2">
          ${destinationName || 'Flight'}
        </label>
        <input class="event__input event__input--destination" id="event-destination-2" type="text" name="event-destination" value="${destinationName || ''}" list="destination-list-2">
        <datalist id="destination-list-2">
          ${options}
        </datalist>
      </div>
    `;

    const currentOffers = this.#offers[type] || [];
    const offersTemplate = currentOffers.length ? `
      <section class="event__section event__section--offers">
        <h3 class="event__section-title event__section-title--offers">Offers</h3>
        <div class="event__available-offers">
          ${currentOffers.map((offer) => `
            <div class="event__offer-selector">
              <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-2" type="checkbox" name="event-offer-${offer.id}" ${selectedOffers.includes(offer.id) ? 'checked' : ''}>
              <label class="event__offer-label" for="event-offer-${offer.id}-2">
                <span class="event__offer-title">${offer.title}</span>
                &plus;&euro;&nbsp;
                <span class="event__offer-price">${offer.price}</span>
              </label>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    const destinationDetailsTemplate = destinationObj?.description ? `
      <section class="event__section event__section--destination">
        <h3 class="event__section-title event__section-title--destination">Destination</h3>
        <p class="event__destination-description">${destinationObj.description}</p>
        <div class="event__photos-container">
          <div class="event__photos-tape">
            ${destinationObj.pictures.map((picture) => `
              <img class="event__photo" src="${picture.src}" alt="${picture.description}">
            `).join('')}
          </div>
        </div>
      </section>
    ` : '';

    return `
      <li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type event__type-btn" for="event-type-toggle-2">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
              </label>
              <input class="event__type-toggle visually-hidden" id="event-type-toggle-2" type="checkbox">
              <div class="event__type-list">
                <fieldset class="event__type-group">
                  <legend class="visually-hidden">Event type</legend>
                  ${typeTemplate}
                </fieldset>
              </div>
            </div>
            ${destinationTemplate}
            <div class="event__field-group event__field-group--time">
              <label class="visually-hidden" for="event-start-time-2">From</label>
              <input class="event__input event__input--time" id="event-start-time-2" type="text" name="event-start-time" value="${dateFromFormatted} ${timeFromFormatted}">
              &mdash;
              <label class="visually-hidden" for="event-end-time-2">To</label>
              <input class="event__input event__input--time" id="event-end-time-2" type="text" name="event-end-time" value="${dateToFormatted} ${timeToFormatted}">
            </div>
            <div class="event__field-group event__field-group--price">
              <label class="event__label" for="event-price-2">
                <span class="visually-hidden">Price</span>
                &euro;
              </label>
              <input class="event__input event__input--price" id="event-price-2" type="text" name="event-price" value="${basePrice}">
            </div>
            <button class="event__save-btn btn btn--blue" type="submit">Save</button>
            <button class="event__reset-btn" type="reset">Cancel</button>
          </header>
          <section class="event__details">
            ${offersTemplate}
            ${destinationDetailsTemplate}
          </section>
        </form>
      </li>
    `;
  }

  #setInnerHandlers() {
    const typeInputs = this.element.querySelectorAll('.event__type-input');
    typeInputs.forEach((input) => {
      input.removeEventListener('change', this.#typeChangeHandler);
      input.addEventListener('change', this.#typeChangeHandler);
    });

    const destinationInput = this.element.querySelector('.event__input--destination');
    if (destinationInput) {
      destinationInput.removeEventListener('change', this.#destinationChangeHandler);
      destinationInput.addEventListener('change', this.#destinationChangeHandler);
    }

    const priceInput = this.element.querySelector('.event__input--price');
    if (priceInput) {
      priceInput.removeEventListener('change', this.#priceChangeHandler);
      priceInput.addEventListener('change', this.#priceChangeHandler);
    }

    const offersContainer = this.element.querySelector('.event__available-offers');
    if (offersContainer) {
      offersContainer.removeEventListener('change', this.#offersChangeHandler);
      offersContainer.addEventListener('change', this.#offersChangeHandler);
    }
  }

  #typeChangeHandler = (event) => {
    const newType = event.target.value;
    if (newType !== this._state.type) {
      this.updateElement({
        type: newType,
        offers: []
      });
    }
  };

  #destinationChangeHandler = (event) => {
    const selectedCity = event.target.value;
    const destination = this.#destinations.find((dest) => dest.name === selectedCity);
    if (destination && destination.id !== this._state.destination) {
      this.updateElement({
        destination: destination.id
      });
    }
  };

  #priceChangeHandler = (event) => {
    const newPrice = parseInt(event.target.value, 10);
    if (!isNaN(newPrice) && newPrice !== this._state.basePrice) {
      this.updateElement({
        basePrice: newPrice
      });
    }
  };

  #offersChangeHandler = (event) => {
    if (event.target.classList.contains('event__offer-checkbox')) {
      const offerId = event.target.id.replace('event-offer-', '').replace('-2', '');
      let updatedOffers = [...this._state.offers];

      if (event.target.checked) {
        if (!updatedOffers.includes(offerId)) {
          updatedOffers.push(offerId);
        }
      } else {
        updatedOffers = updatedOffers.filter((id) => id !== offerId);
      }

      this.updateElement({offers: updatedOffers});
    }
  };

  _restoreHandlers() {
    this.#setInnerHandlers();
    this.setSubmitHandler(this._callbacks?.submit);
    this.setCancelHandler(this._callbacks?.cancel);
    this.setEscKeyHandler(this._callbacks?.escKey);
  }

  setSubmitHandler(callback) {
    this._callbacks.submit = callback;
    const saveBtn = this.element?.querySelector('.event__save-btn');
    if (saveBtn) {
      saveBtn.removeEventListener('click', this.#submitHandler);
      saveBtn.addEventListener('click', this.#submitHandler);
    }
  }

  setCancelHandler(callback) {
    this._callbacks.cancel = callback;
    const cancelBtn = this.element?.querySelector('.event__reset-btn');
    if (cancelBtn) {
      cancelBtn.removeEventListener('click', this.#cancelHandler);
      cancelBtn.addEventListener('click', this.#cancelHandler);
    }
  }

  setEscKeyHandler(callback) {
    this._callbacks.escKey = callback;
    document.removeEventListener('keydown', this.#escKeyHandler);
    document.addEventListener('keydown', this.#escKeyHandler);
  }

  setFocus() {
    this.element?.querySelector('.event__input--destination')?.focus();
  }

  removeEscKeyHandler() {
    document.removeEventListener('keydown', this.#escKeyHandler);
  }

  #submitHandler = (event) => {
    event.preventDefault();
    this._callbacks.submit?.(this.#stateToPoint());
  };

  #cancelHandler = (event) => {
    event.preventDefault();
    this._callbacks.cancel?.();
  };

  #escKeyHandler = (evt) => {
    if (isEscEvent(evt)) {
      evt.preventDefault();
      this._callbacks.escKey?.();
    }
  };
}
