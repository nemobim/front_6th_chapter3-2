import { EventForm, RepeatType } from '../types';
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
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : new Date('2025-12-31');

  const events: EventForm[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
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
function getNextRepeatDate(currentDate: Date, repeatType: RepeatType, interval: number): Date {
  const nextDate = new Date(currentDate);

  switch (repeatType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case 'monthly': {
      const currentDay = currentDate.getDate();

      // 다음 달로 이동
      nextDate.setMonth(nextDate.getMonth() + interval);

      // 해당 월에 같은 일자가 존재하는지 확인하고 없으면 건너뛰기
      while (true) {
        const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();

        if (currentDay <= daysInMonth) {
          // 같은 일자가 존재하면 해당 날짜로 설정
          nextDate.setDate(currentDay);
          break;
        } else {
          // 같은 일자가 존재하지 않으면 다음 달로 건너뛰기
          nextDate.setMonth(nextDate.getMonth() + interval);
        }
      }
      break;
    }
    case 'yearly': {
      const currentDay = currentDate.getDate();
      const currentMonth = currentDate.getMonth();

      // 다음 해로 이동
      let targetYear = nextDate.getFullYear() + interval;

      // 윤년 2월 29일 같은 특수한 날짜 처리
      if (currentMonth === 1 && currentDay === 29) {
        // 해당 해가 윤년인지 확인
        const isLeapYear = (year: number) =>
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

        // 윤년이 아니면 다음 윤년까지 건너뛰기
        while (!isLeapYear(targetYear)) {
          targetYear += interval;
        }
      }

      // 최종 날짜 설정
      nextDate.setFullYear(targetYear);
      nextDate.setMonth(currentMonth);
      nextDate.setDate(currentDay);
      break;
    }
  }

  return nextDate;
}
