import he from 'he';
import AbstractView from '../framework/view/abstract-view.js';

const ONE_DESTINATION = 1;
const TWO_DESTINATIONS = 2;
const THREE_DESTINATIONS = 3;
const DESTINATIONS_LIMIT = 3;

function createTripInfoTemplate(destinations, dateFrom, dateTo, totalPrice) {
  let routeText = '';
  if (destinations.length === ONE_DESTINATION) {
    routeText = destinations[0];
  } else if (destinations.length === TWO_DESTINATIONS) {
    routeText = `${destinations[0]} — ${destinations[1]}`;
  } else if (destinations.length === THREE_DESTINATIONS) {
    routeText = `${destinations[0]} — ${destinations[1]} — ${destinations[2]}`;
  } else if (destinations.length > DESTINATIONS_LIMIT) {
    routeText = `${destinations[0]} — ... — ${destinations[destinations.length - 1]}`;
  }

  const formatDateRange = (start, end) => {
    if (!start || !end) {
      return '';
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const endMonth = endDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    return `${startDay} ${startMonth} — ${endDay} ${endMonth}`;
  };

  return `
    <div class="trip-info">
      <div class="trip-info__main">
        <h1 class="trip-info__title">${he.encode(routeText)}</h1>
        <p class="trip-info__dates">${formatDateRange(dateFrom, dateTo)}</p>
      </div>
      <p class="trip-info__cost">€ <span class="trip-info__cost-value">${totalPrice}</span></p>
    </div>
  `;
}

export default class TripInfoView extends AbstractView {
  #destinations = [];
  #dateFrom = null;
  #dateTo = null;
  #totalPrice = 0;

  constructor({ destinations, dateFrom, dateTo, totalPrice }) {
    super();
    this.#destinations = destinations;
    this.#dateFrom = dateFrom;
    this.#dateTo = dateTo;
    this.#totalPrice = totalPrice;
  }

  get template() {
    return createTripInfoTemplate(this.#destinations, this.#dateFrom, this.#dateTo, this.#totalPrice);
  }
}
