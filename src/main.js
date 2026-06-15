import TripPresenter from './presenter/trip-presenter.js';
import PointsModel from './model/points-model.js';
import FilterModel from './model/filter-model.js';
import FilterPresenter from './presenter/filter-presenter.js';
import PointsApiService from './api/points-api-service.js';
import TripInfoView from './view/trip-info-view.js';
import { render } from './framework/render.js';

const RADIX = 36;
const RANDOM_STRING_START = 2;
const RANDOM_STRING_END = 15;
const generateRandomString = () => Math.random().toString(RADIX).substring(RANDOM_STRING_START, RANDOM_STRING_END);
const AUTHORIZATION = `Basic ${generateRandomString()}`;
const END_POINT = 'https://23.objects.htmlacademy.pro/big-trip';

const pageHeaderElement = document.querySelector('.page-header');
const tripControlsFilters = pageHeaderElement.querySelector('.trip-controls__filters');
const pageMainElement = document.querySelector('.page-main');
const tripEventsElement = pageMainElement.querySelector('.trip-events');
const tripMainElement = document.querySelector('.trip-main');

const pointsApiService = new PointsApiService(END_POINT, AUTHORIZATION);
const pointsModel = new PointsModel({ pointsApiService });
const filterModel = new FilterModel();

const filterPresenter = new FilterPresenter({
  filterContainer: tripControlsFilters,
  filterModel,
  pointsModel,
});

const tripPresenter = new TripPresenter({
  tripEventsContainer: tripEventsElement,
  pointsModel,
  filterModel,
});

function updateTripInfo() {
  const destinations = pointsModel.getTripDestinations();
  const dateFrom = pointsModel.getTripStartDate();
  const dateTo = pointsModel.getTripEndDate();
  const totalPrice = pointsModel.getTotalPrice();

  const oldTripInfo = document.querySelector('.trip-info');
  if (oldTripInfo) {
    oldTripInfo.remove();
  }

  const tripInfoView = new TripInfoView({
    destinations,
    dateFrom,
    dateTo,
    totalPrice
  });

  render(tripInfoView, tripMainElement, 'afterbegin');
}

pointsModel.addObserver((event) => {
  if (event === 'TRIP_INFO' || event === 'INIT') {
    updateTripInfo();
  }
});

filterPresenter.init();
tripPresenter.init();

pointsModel.init().catch(() => {
});

const newEventButton = document.querySelector('.trip-main__event-add-btn');
if (newEventButton) {
  newEventButton.addEventListener('click', () => {
    newEventButton.disabled = true;
    tripPresenter.createPoint();
  });
}
