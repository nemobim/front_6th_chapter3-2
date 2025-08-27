import { EventForm } from '../types';
import { formatDate } from './dateUtils';

/**
 * 반복 일정을 생성합니다.
 * @param event 원본 일정
 * @returns 생성된 반복 일정 배열
 */
export function generateRepeatEvents(event: EventForm): EventForm[] {
  if (event.repeat.type === 'none') {
    return [event];
  }

  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : null;

  const events: EventForm[] = [];
  let currentDate = new Date(startDate);

  while (endDate && currentDate <= endDate) {
    events.push({
      ...event,
      date: formatDate(currentDate),
    });

    currentDate = getNextRepeatDate(currentDate, event.repeat.type, event.repeat.interval);
  }

  return events;
}

/**
 * 다음 반복 날짜를 계산합니다.
 * @param currentDate 현재 날짜
 * @param repeatType 반복 유형
 * @param interval 간격
 * @returns 다음 반복 날짜
 */
function getNextRepeatDate(currentDate: Date, repeatType: string, interval: number): Date {
  const nextDate = new Date(currentDate);

  switch (repeatType) {
    case 'daily':
      nextDate.setDate(currentDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(currentDate.getDate() + 7 * interval);
      break;
    case 'monthly':
      nextDate.setMonth(currentDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDate.setFullYear(currentDate.getFullYear() + interval);
      break;
    default:
      nextDate.setDate(currentDate.getDate() + 1);
  }

  return nextDate;
}
