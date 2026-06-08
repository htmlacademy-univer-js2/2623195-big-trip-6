import ApiService from './api-service.js';

export default class PointsApiService extends ApiService {
  async getPoints() {
    const response = await this._load({ url: 'points' });
    const points = await ApiService.parseResponse(response);
    return this.#adaptToClient(points);
  }

  async getDestinations() {
    const response = await this._load({ url: 'destinations' });
    return ApiService.parseResponse(response);
  }

  async getOffers() {
    const response = await this._load({ url: 'offers' });
    const offers = await ApiService.parseResponse(response);
    return this.#adaptOffersToClient(offers);
  }

  async updatePoint(point) {
    const response = await this._load({
      url: `points/${point.id}`,
      method: 'PUT',
      body: JSON.stringify(this.#adaptToServerUpdate(point)),
    });
    const updatedPoint = await ApiService.parseResponse(response);
    return this.#adaptToClient([updatedPoint])[0];
  }

  async addPoint(point) {
    const response = await this._load({
      url: 'points',
      method: 'POST',
      body: JSON.stringify(this.#adaptToServerAdd(point)),
    });
    const newPoint = await ApiService.parseResponse(response);
    return this.#adaptToClient([newPoint])[0];
  }

  async deletePoint(pointId) {
    await this._load({
      url: `points/${pointId}`,
      method: 'DELETE',
    });
  }

  #adaptToClient(points) {
    return points.map((point) => ({
      id: point.id,
      type: point.type,
      destination: point.destination,
      dateFrom: new Date(point.date_from),
      dateTo: new Date(point.date_to),
      basePrice: point.base_price,
      offers: point.offers || [],
      isFavorite: point.is_favorite,
    }));
  }

  #adaptToServerAdd(point) {
    const formatISO = (date) => {
      if (!date) {
        return null;
      }
      const d = new Date(date);
      return d.toISOString();
    };

    // eslint-disable-next-line no-unused-vars
    const { id, ...pointWithoutId } = point;

    const result = {
      type: pointWithoutId.type,
      destination: pointWithoutId.destination,
      // eslint-disable-next-line camelcase
      date_from: formatISO(pointWithoutId.dateFrom),
      // eslint-disable-next-line camelcase
      date_to: formatISO(pointWithoutId.dateTo),
      // eslint-disable-next-line camelcase
      base_price: pointWithoutId.basePrice,
      offers: pointWithoutId.offers || [],
      // eslint-disable-next-line camelcase
      is_favorite: pointWithoutId.isFavorite || false,
    };

    return result;
  }

  #adaptToServerUpdate(point) {
    const formatISO = (date) => {
      if (!date) {
        return null;
      }
      const d = new Date(date);
      return d.toISOString();
    };

    const result = {
      id: point.id,
      type: point.type,
      destination: point.destination,
      // eslint-disable-next-line camelcase
      date_from: formatISO(point.dateFrom),
      // eslint-disable-next-line camelcase
      date_to: formatISO(point.dateTo),
      // eslint-disable-next-line camelcase
      base_price: point.basePrice,
      offers: point.offers || [],
      // eslint-disable-next-line camelcase
      is_favorite: point.isFavorite || false,
    };

    return result;
  }

  #adaptOffersToClient(offers) {
    const offersByType = {};
    offers.forEach((offer) => {
      offersByType[offer.type] = offer.offers.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price
      }));
    });
    return offersByType;
  }
}
