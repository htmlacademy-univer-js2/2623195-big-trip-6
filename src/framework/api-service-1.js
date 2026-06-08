export default class ApiService {
  constructor(endPoint, authorization) {
    this._endPoint = endPoint;
    this._authorization = authorization;
  }

  async _load({
    url,
    method = 'GET',
    body = null,
    headers = new Headers(),
  }) {
    headers.append('Authorization', this._authorization);

    const response = await fetch(
      `${this._endPoint}/${url}`,
      { method, body, headers },
    );

    try {
      ApiService.checkStatus(response);
      return response;
    } catch (err) {
      ApiService.catchError(err);
    }
  }

  static parseResponse(response) {
    return response.json();
  }

  static checkStatus(response) {
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
  }

  static catchError(err) {
    throw err;
  }
}
