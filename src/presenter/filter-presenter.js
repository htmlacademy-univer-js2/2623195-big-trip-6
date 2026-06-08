import {render, replace, remove} from '../framework/render.js';
import FilterView from '../view/filter-view.js';
import {FilterType} from '../const.js';

export default class FilterPresenter {
  #filterContainer = null;
  #filterModel = null;
  #pointsModel = null;
  #filterComponent = null;
  #currentFilter = null;

  constructor({filterContainer, filterModel, pointsModel}) {
    this.#filterContainer = filterContainer;
    this.#filterModel = filterModel;
    this.#pointsModel = pointsModel;
  }

  init() {
    this.#currentFilter = this.#filterModel.filter;
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#pointsModel.addObserver(this.#handlePointsModelEvent);
    this.#renderFilter();
  }

  #renderFilter() {
    const filters = this.#generateFilters();
    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FilterView({
      filters,
      currentFilterType: this.#currentFilter,
      onFilterChange: this.#handleFilterChange
    });

    if (prevFilterComponent === null) {
      render(this.#filterComponent, this.#filterContainer);
    } else {
      replace(this.#filterComponent, prevFilterComponent);
      remove(prevFilterComponent);
    }
  }

  #generateFilters() {
    const points = this.#pointsModel.getRawPoints();

    if (points.length === 0) {
      return [
        {type: FilterType.EVERYTHING, count: 0},
        {type: FilterType.FUTURE, count: 0},
        {type: FilterType.PRESENT, count: 0},
        {type: FilterType.PAST, count: 0}
      ];
    }

    const now = new Date();

    const futureCount = points.filter((point) => new Date(point.dateFrom) > now).length;
    const presentCount = points.filter((point) =>
      new Date(point.dateFrom) <= now && new Date(point.dateTo) >= now
    ).length;
    const pastCount = points.filter((point) => new Date(point.dateTo) < now).length;
    const everythingCount = points.length;

    return [
      {type: FilterType.EVERYTHING, count: everythingCount},
      {type: FilterType.FUTURE, count: futureCount},
      {type: FilterType.PRESENT, count: presentCount},
      {type: FilterType.PAST, count: pastCount}
    ];
  }

  #handleFilterChange = (filterType) => {
    if (this.#currentFilter === filterType) {
      return;
    }
    this.#currentFilter = filterType;
    this.#filterModel.setFilter('MAJOR', filterType);
  };

  #handleModelEvent = () => {
    this.#currentFilter = this.#filterModel.filter;
    this.#renderFilter();
  };

  #handlePointsModelEvent = () => {
    this.#renderFilter();
  };
}
