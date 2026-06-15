export const isEscEvent = (evt) => evt.key === 'Escape' || evt.key === 'Esc';

export const findDestinationById = (destinations, id) => destinations.find((destination) => destination.id === id);
