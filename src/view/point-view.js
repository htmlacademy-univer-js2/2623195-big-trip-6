import he from 'he';
import AbstractView from '../framework/view/abstract-view.js';
import {humanizePointDate, humanizePointTime, getDuration} from '../utils.js';

export default class RoutePointView extends AbstractView {
  constructor({point, destination, offers}) {
    super();
    this._point = point;
    this._destination = destination || { name: '' };
    this._allOffers = offers || {};
    this._callbacks = {};
  }

  get template() {
    const {type, basePrice, dateFrom, dateTo, isFavorite, offers: selectedOfferIds} = this._point;
    const destinationName = this._destination?.name || '';

    const date = humanizePointDate(dateFrom);
    const startTime = humanizePointTime(dateFrom);
    const endTime = humanizePointTime(dateTo);
    const duration = getDuration(dateFrom, dateTo);

    const offersForType = this._allOffers[type] || [];

    const selectedOffers = offersForType
      .filter((offer) => selectedOfferIds && selectedOfferIds.includes(offer.id))
      .map((offer) => `
        <li class="event__offer">
          <span class="event__offer-title">${he.encode(offer.title)}</span>
          &plus;&euro;&nbsp;
          <span class="event__offer-price">${offer.price}</span>
        </li>
      `).join('');

    const favoriteClass = isFavorite ? 'event__favorite-btn--active' : '';

    return `
      <li class="trip-events__item">
        <div class="event">
          <time class="event__date" datetime="${dateFrom}">${date}</time>
          <div class="event__type">
            <img class="event__type-icon" width="42" height="42" src="img/icons/${type}.png" alt="Event type icon">
          </div>
          <h3 class="event__title">${he.encode(type)} ${he.encode(destinationName)}</h3>
          <div class="event__schedule">
            <p class="event__time">
              <time class="event__start-time" datetime="${dateFrom}">${startTime}</time>
              &mdash;
              <time class="event__end-time" datetime="${dateTo}">${endTime}</time>
            </p>
            <p class="event__duration">${duration}</p>
          </div>
          <p class="event__price">
            &euro;&nbsp;<span class="event__price-value">${basePrice}</span>
          </p>
          <h4 class="visually-hidden">Offers:</h4>
          <ul class="event__selected-offers">
            ${selectedOffers}
          </ul>
          <button class="event__favorite-btn ${favoriteClass}" type="button">
            <span class="visually-hidden">Add to favorite</span>
            <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
              <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"/>
            </svg>
          </button>
          <button class="event__rollup-btn" type="button">
            <span class="visually-hidden">Open event</span>
          </button>
        </div>
      </li>
    `;
  }

  setEditClickHandler(callback) {
    this._callbacks.editClick = callback;
    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#editClickHandler);
  }

  setFavoriteClickHandler(callback) {
    this._callbacks.favoriteClick = callback;
    this.element.querySelector('.event__favorite-btn')
      .addEventListener('click', this.#favoriteClickHandler);
  }

  #editClickHandler = (evt) => {
    evt.preventDefault();
    this._callbacks.editClick?.();
  };

  #favoriteClickHandler = (evt) => {
    evt.preventDefault();
    this._callbacks.favoriteClick?.();
  };
}
