import SortView, {SortType} from '../view/sort-view.js';
import TripEventsListView from '../view/trip-events-list-view.js';
import EmptyPointsView from '../view/empty-points-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
import PointPresenter from './point-presenter.js';
import {render, remove} from '../framework/render.js';
import {sortPoints} from '../utils/sort.js';
import {FilterType} from '../const.js';

export default class TripPresenter {
  #sortComponent = null;
  #tripEventsListComponent = new TripEventsListView();
  #emptyPointsComponent = null;
  #loadingComponent = null;
  #errorComponent = null;
  #tripEventsContainer = null;
  #pointsModel = null;
  #filterModel = null;
  #points = [];
  #destinations = [];
  #offers = [];
  #currentSortType = SortType.DAY;
  #pointPresenters = new Map();
  #isCreating = false;
  #newPointPresenter = null;

  constructor({tripEventsContainer, pointsModel, filterModel}) {
    this.#tripEventsContainer = tripEventsContainer;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
  }

  init() {
    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleFilterChange);
    this.#renderBoard();
  }

  createPoint() {
    if (this.#isCreating) {
      return;
    }

    this.#pointPresenters.forEach((presenter) => presenter.resetView());

    this.#isCreating = true;

    this.#filterModel.setFilter('MAJOR', FilterType.EVERYTHING);
    this.#currentSortType = SortType.DAY;

    this.#renderBoard();

    setTimeout(() => {
      this.#openCreateForm();
    }, 100);
  }

  #openCreateForm() {
    if (this.#newPointPresenter) {
      return;
    }

    const blankPoint = {
      id: null,
      type: 'flight',
      destination: '',
      dateFrom: null,
      dateTo: null,
      basePrice: 0,
      offers: [],
      isFavorite: false
    };

    this.#newPointPresenter = new PointPresenter({
      container: this.#tripEventsListComponent.element,
      onDataChange: this.#handleDataChange.bind(this),
      onModeChange: this.#handleModeChange.bind(this)
    });

    this.#newPointPresenter.init(blankPoint, this.#destinations, this.#offers, true);

    const container = this.#tripEventsListComponent.element;
    if (container.children.length > 1) {
      const formElement = container.lastChild;
      container.insertBefore(formElement, container.firstChild);
    }
  }

  #closeCreateForm() {
    if (this.#newPointPresenter) {
      this.#newPointPresenter.destroy();
      this.#newPointPresenter = null;
    }
    this.#isCreating = false;

    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    if (newEventButton) {
      newEventButton.disabled = false;
    }
  }

  #handleModelEvent = () => {
    this.#renderBoard();
  };

  #handleFilterChange = () => {
    this.#currentSortType = SortType.DAY;
    this.#renderBoard();
  };

  #handleDataChange = async (data, actionType = 'update') => {
    switch (actionType) {
      case 'update':
        await this.#pointsModel.updatePoint('MINOR', data);
        break;
      case 'delete':
        await this.#pointsModel.deletePoint('MINOR', data);
        break;
      case 'add':
        await this.#pointsModel.addPoint('MINOR', data);
        break;
    }

    this.#closeCreateForm();
    this.#renderBoard();
  };

  #handleModeChange = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());

    if (this.#newPointPresenter) {
      this.#closeCreateForm();
      this.#renderBoard();
    }
  };

  #renderBoard() {
    if (this.#pointsModel.isLoading()) {
      this.#renderLoading();
      return;
    }

    if (this.#pointsModel.hasError()) {
      this.#renderError();
      return;
    }

    const rawPoints = this.#pointsModel.getRawPoints();
    this.#points = this.#filterPoints(rawPoints);
    this.#destinations = this.#pointsModel.getDestinations();
    this.#offers = this.#pointsModel.getOffers();

    this.#clearComponents();

    if (this.#points.length === 0 && !this.#isCreating) {
      this.#renderEmptyPoints();
      return;
    }

    this.#renderSort();
    this.#renderPointsList();
  }

  #clearComponents() {
    if (this.#loadingComponent) {
      remove(this.#loadingComponent);
      this.#loadingComponent = null;
    }
    if (this.#errorComponent) {
      remove(this.#errorComponent);
      this.#errorComponent = null;
    }
    if (this.#emptyPointsComponent) {
      remove(this.#emptyPointsComponent);
      this.#emptyPointsComponent = null;
    }
    if (this.#sortComponent) {
      remove(this.#sortComponent);
      this.#sortComponent = null;
    }
    this.#tripEventsContainer.innerHTML = '';
  }

  #renderLoading() {
    this.#clearComponents();
    this.#loadingComponent = new LoadingView();
    render(this.#loadingComponent, this.#tripEventsContainer);
  }

  #renderError() {
    this.#clearComponents();
    this.#errorComponent = new ErrorView();
    render(this.#errorComponent, this.#tripEventsContainer);
  }

  #filterPoints(points) {
    const filterType = this.#filterModel.filter;
    const now = new Date();

    switch (filterType) {
      case FilterType.FUTURE:
        return points.filter((point) => point.dateFrom && new Date(point.dateFrom) > now);
      case FilterType.PRESENT:
        return points.filter((point) =>
          point.dateFrom && point.dateTo &&
          new Date(point.dateFrom) <= now && new Date(point.dateTo) >= now
        );
      case FilterType.PAST:
        return points.filter((point) => point.dateTo && new Date(point.dateTo) < now);
      default:
        return [...points];
    }
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      onSortTypeChange: (sortType) => {
        if (this.#currentSortType === sortType) {
          return;
        }
        this.#currentSortType = sortType;
        this.#renderPointsList();
      }
    });

    render(this.#sortComponent, this.#tripEventsContainer);
  }

  #renderPointsList() {
    const sortedPoints = sortPoints[this.#currentSortType]([...this.#points]);

    this.#tripEventsListComponent.element.innerHTML = '';
    this.#pointPresenters.clear();

    render(this.#tripEventsListComponent, this.#tripEventsContainer);

    sortedPoints.forEach((point) => {
      const pointPresenter = new PointPresenter({
        container: this.#tripEventsListComponent.element,
        onDataChange: this.#handleDataChange.bind(this),
        onModeChange: this.#handleModeChange.bind(this)
      });
      pointPresenter.init(point, this.#destinations, this.#offers, false);
      this.#pointPresenters.set(point.id, pointPresenter);
    });
  }

  #renderEmptyPoints() {
    this.#emptyPointsComponent = new EmptyPointsView({filterType: this.#filterModel.filter});
    render(this.#emptyPointsComponent, this.#tripEventsContainer);
  }
}
