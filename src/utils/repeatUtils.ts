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
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : new Date('2025-10-30'); // 기본 종료일

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
 * 윤년 확인
 * @param year 년도
 * @returns 윤년 여부
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 다음 일 반복 날짜 계산
 * @param currentDate 현재 날짜
 * @param interval 반복 간격
 * @returns 다음 반복 날짜
 */
function getNextDailyDate(currentDate: Date, interval: number): Date {
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + interval);
  return nextDate;
}

/**
 * 다음 주 반복 날짜 계산
 * @param currentDate 현재 날짜
 * @param interval 반복 간격
 * @returns 다음 반복 날짜
 */
function getNextWeeklyDate(currentDate: Date, interval: number): Date {
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 7 * interval);
  return nextDate;
}

/**
 * 다음 월 반복 날짜 계산 함수
 * @param currentDate 현재 날짜
 * @param interval 반복 간격
 * @returns 다음 반복 날짜
 */
function getNextMonthlyDate(currentDate: Date, interval: number): Date {
  const currentDay = currentDate.getDate();
  const nextDate = new Date(currentDate);

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

  return nextDate;
}

/**
 * 다음 년도 반복 날짜 계산 함수
 * @param currentDate 현재 날짜
 * @param interval 반복 간격
 * @returns 다음 반복 날짜
 */
function getNextYearlyDate(currentDate: Date, interval: number): Date {
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();

  let targetYear = currentDate.getFullYear() + interval;

  // 윤년 2월 29일 처리
  if (currentMonth === 1 && currentDay === 29) {
    while (!isLeapYear(targetYear)) {
      targetYear += interval;
    }
  }

  // 최종 날짜 설정
  const nextDate = new Date(currentDate);
  nextDate.setFullYear(targetYear);
  nextDate.setMonth(currentMonth);
  nextDate.setDate(currentDay);
  return nextDate;
}

/**
 * 반복 날짜 계산 함수
 * @param currentDate 현재 날짜
 * @param repeatType 반복 유형
 * @param interval 반복 간격
 * @returns 다음 반복 날짜
 */
function getNextRepeatDate(currentDate: Date, repeatType: RepeatType, interval: number): Date {
  switch (repeatType) {
    case 'daily':
      return getNextDailyDate(currentDate, interval);
    case 'weekly':
      return getNextWeeklyDate(currentDate, interval);
    case 'monthly':
      return getNextMonthlyDate(currentDate, interval);
    case 'yearly':
      return getNextYearlyDate(currentDate, interval);
    default:
      return new Date(currentDate);
  }
}

/**
 * 반복 일정을 단일 일정으로 수정합니다.
 * @param originalEvent 원본 반복 일정
 * @param targetDate 수정할 대상 날짜
 * @returns 수정된 단일 일정
 */
export function modifyRepeatEvent(originalEvent: EventForm, targetDate: string): EventForm {
  return {
    ...originalEvent,
    date: targetDate,
    repeat: { type: 'none', interval: 1 },
  };
}

/**
 * 반복 일정에서 특정 일정을 삭제합니다.
 * @param originalEvent 원본 반복 일정
 * @param targetDate 삭제할 대상 날짜
 * @returns 삭제된 일정을 제외한 반복 일정 배열
 */
export function deleteRepeatEvent(originalEvent: EventForm, targetDate: string): EventForm[] {
  // 반복 일정이 아닌 경우 원본 반환
  if (originalEvent.repeat.type === 'none') {
    return [originalEvent];
  }

  // 반복 일정들을 생성
  const repeatEvents = generateRepeatEvents(originalEvent);

  // 대상 날짜의 일정을 제외하고 반환
  return repeatEvents.filter((event) => event.date !== targetDate);
}
