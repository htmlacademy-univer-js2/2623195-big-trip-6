import Observable from '../framework/observable.js';

export default class PointsModel extends Observable {
  #pointsApiService = null;
  #points = [];
  #destinations = [];
  #offers = {};
  #activeFilter = 'everything';
  #isLoading = true;
  #hasError = false;

  constructor({ pointsApiService }) {
    super();
    this.#pointsApiService = pointsApiService;
  }

  async init() {
    this.#isLoading = true;
    this.#hasError = false;

    try {
      const [points, destinations, offers] = await Promise.all([
        this.#pointsApiService.getPoints(),
        this.#pointsApiService.getDestinations(),
        this.#pointsApiService.getOffers()
      ]);

      this.#points = points;
      this.#destinations = destinations;
      this.#offers = offers;
    } catch (err) {
      this.#hasError = true;
      this.#points = [];
      this.#destinations = [];
      this.#offers = {};
    } finally {
      this.#isLoading = false;
      this._notify('INIT');
      this._notify('MAJOR');
      this._notify('TRIP_INFO');
    }
  }

  getPoints() {
    return this.#getFilteredPoints();
  }

  getRawPoints() {
    return this.#points;
  }

  getDestinations() {
    return this.#destinations;
  }

  getOffers() {
    return this.#offers;
  }

  getDestinationById(id) {
    return this.#destinations.find((dest) => dest.id === id);
  }

  getOffersByType(type) {
    return this.#offers[type] || [];
  }

  getFilter() {
    return this.#activeFilter;
  }

  setFilter(filterType) {
    this.#activeFilter = filterType;
  }

  isLoading() {
    return this.#isLoading;
  }

  hasError() {
    return this.#hasError;
  }

  getTripDestinations() {
    const sortedPoints = [...this.#points].sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
    const uniqueDestinations = [];

    for (const point of sortedPoints) {
      const destination = this.#destinations.find((d) => d.id === point.destination);
      if (destination && !uniqueDestinations.includes(destination.name)) {
        uniqueDestinations.push(destination.name);
      }
    }
    return uniqueDestinations;
  }

  getTripStartDate() {
    if (this.#points.length === 0) {
      return null;
    }
    const sortedPoints = [...this.#points].sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
    return sortedPoints[0].dateFrom;
  }

  getTripEndDate() {
    if (this.#points.length === 0) {
      return null;
    }
    const sortedPoints = [...this.#points].sort((a, b) => new Date(b.dateTo) - new Date(a.dateTo));
    return sortedPoints[0].dateTo;
  }

  getTotalPrice() {
    let total = 0;
    for (const point of this.#points) {
      total += point.basePrice;
      const offersForType = this.#offers[point.type] || [];
      for (const offerId of point.offers) {
        const offer = offersForType.find((o) => o.id === offerId);
        if (offer) {
          total += offer.price;
        }
      }
    }
    return total;
  }

  async updatePoint(updateType, updatedPoint) {
    const response = await this.#pointsApiService.updatePoint(updatedPoint);
    const index = this.#points.findIndex((point) => point.id === response.id);
    if (index !== -1) {
      this.#points[index] = response;
      this._notify(updateType, response);
      this._notify('TRIP_INFO');
    }
    return response;
  }

  async addPoint(updateType, newPoint) {
    const response = await this.#pointsApiService.addPoint(newPoint);
    this.#points.push(response);
    this._notify(updateType, response);
    this._notify('TRIP_INFO');
    return response;
  }

  async deletePoint(updateType, pointId) {
    await this.#pointsApiService.deletePoint(pointId);
    const index = this.#points.findIndex((point) => point.id === pointId);
    if (index !== -1) {
      this.#points.splice(index, 1);
      this._notify(updateType, pointId);
      this._notify('TRIP_INFO');
    }
  }

  #getFilteredPoints() {
    const now = new Date();

    switch (this.#activeFilter) {
      case 'future':
        return this.#points.filter((point) => point.dateFrom && new Date(point.dateFrom) > now);
      case 'present':
        return this.#points.filter((point) =>
          point.dateFrom && point.dateTo &&
          new Date(point.dateFrom) <= now && new Date(point.dateTo) >= now
        );
      case 'past':
        return this.#points.filter((point) => point.dateTo && new Date(point.dateTo) < now);
      default:
        return [...this.#points];
    }
  }
}
