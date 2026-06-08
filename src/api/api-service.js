export default class ApiService {
  constructor(endPoint, authorization) {
    this._endPoint = endPoint;
    this._authorization = authorization;
  }

  async _load({ url, method = 'GET', body = null, headers = new Headers() }) {
    headers.append('Authorization', this._authorization);

    if (body) {
      headers.append('Content-Type', 'application/json');
    }

    const response = await fetch(
      `${this._endPoint}/${url}`,
      { method, body, headers },
    );

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response;
  }

  static parseResponse(response) {
    return response.json();
  }
}
