import AbstractView from '../framework/view/abstract-view.js';

export const SortType = {
  DAY: 'day',
  TIME: 'time',
  PRICE: 'price'
};

function createSortTemplate(currentSortType) {
  return `
    <form class="trip-events__trip-sort trip-sort" action="#" method="get">
      <div class="trip-sort__item trip-sort__item--day">
        <input id="sort-day" class="trip-sort__input visually-hidden" type="radio" name="trip-sort" value="day" data-sort-type="${SortType.DAY}" ${currentSortType === SortType.DAY ? 'checked' : ''}>
        <label class="trip-sort__btn" for="sort-day">Day</label>
      </div>

      <div class="trip-sort__item trip-sort__item--event">
        <input id="sort-event" class="trip-sort__input visually-hidden" type="radio" name="trip-sort" value="event" disabled>
        <label class="trip-sort__btn" for="sort-event">Event</label>
      </div>

      <div class="trip-sort__item trip-sort__item--time">
        <input id="sort-time" class="trip-sort__input visually-hidden" type="radio" name="trip-sort" value="time" data-sort-type="${SortType.TIME}" ${currentSortType === SortType.TIME ? 'checked' : ''}>
        <label class="trip-sort__btn" for="sort-time">Time</label>
      </div>

      <div class="trip-sort__item trip-sort__item--price">
        <input id="sort-price" class="trip-sort__input visually-hidden" type="radio" name="trip-sort" value="price" data-sort-type="${SortType.PRICE}" ${currentSortType === SortType.PRICE ? 'checked' : ''}>
        <label class="trip-sort__btn" for="sort-price">Price</label>
      </div>

      <div class="trip-sort__item trip-sort__item--offer">
        <input id="sort-offer" class="trip-sort__input visually-hidden" type="radio" name="trip-sort" value="offer" disabled>
        <label class="trip-sort__btn" for="sort-offer">Offers</label>
      </div>
    </form>
  `;
}

export default class SortView extends AbstractView {
  #currentSortType = null;
  #handleSortTypeChange = null;

  constructor({currentSortType, onSortTypeChange}) {
    super();
    this.#currentSortType = currentSortType;
    this.#handleSortTypeChange = onSortTypeChange;
    this.element.addEventListener('click', this.#sortClickHandler);
  }

  get template() {
    return createSortTemplate(this.#currentSortType);
  }

  #sortClickHandler = (evt) => {
    const label = evt.target.closest('.trip-sort__btn');
    if (!label) {
      return;
    }

    const div = label.closest('.trip-sort__item');
    const input = div?.querySelector('.trip-sort__input');

    if (!input || input.disabled) {
      return;
    }

    const sortType = input.dataset.sortType;
    if (sortType && sortType !== this.#currentSortType) {
      this.#handleSortTypeChange(sortType);
    }
  };
}
