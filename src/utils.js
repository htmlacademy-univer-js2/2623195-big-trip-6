import dayjs from 'dayjs';

const DATE_FORMAT = 'MMM D';
const TIME_FORMAT = 'HH:mm';

function humanizePointDate(date) {
  if (!date) {
    return '';
  }
  return dayjs(date).format(DATE_FORMAT);
}

function humanizePointTime(date) {
  if (!date) {
    return '';
  }
  return dayjs(date).format(TIME_FORMAT);
}

function formatTimePart(value) {
  return String(value).padStart(2, '0');
}

function getDuration(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) {
    return '';
  }

  const start = dayjs(dateFrom);
  const end = dayjs(dateTo);
  const totalMinutes = end.diff(start, 'minute');

  if (totalMinutes < 60) {
    return `${totalMinutes}M`;
  }

  if (totalMinutes < 1440) {
    const hoursUnderDay = Math.floor(totalMinutes / 60);
    const minutesUnderDay = totalMinutes % 60;
    return `${formatTimePart(hoursUnderDay)}H ${formatTimePart(minutesUnderDay)}M`;
  }

  const daysOver = Math.floor(totalMinutes / 1440);
  const remainingMinutes = totalMinutes % 1440;
  const hoursOver = Math.floor(remainingMinutes / 60);
  const minutesOver = remainingMinutes % 60;
  return `${formatTimePart(daysOver)}D ${formatTimePart(hoursOver)}H ${formatTimePart(minutesOver)}M`;
}

export {
  humanizePointDate,
  humanizePointTime,
  getDuration
};
