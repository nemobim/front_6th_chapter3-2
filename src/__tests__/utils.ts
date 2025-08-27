import { Event } from '../types';
import { fillZero } from '../utils/dateUtils';

export const assertDate = (date1: Date, date2: Date) => {
  expect(date1.toISOString()).toBe(date2.toISOString());
};

export const parseHM = (timestamp: number) => {
  const date = new Date(timestamp);
  const h = fillZero(date.getHours());
  const m = fillZero(date.getMinutes());
  return `${h}:${m}`;
};

/** mock 이벤트 생성 함수 */
export const createMockEvent = (index: number = 1, overrides: Partial<Event> = {}): Event => {
  return {
    id: `${index}`,
    title: `테스트 이벤트 ${index}`,
    date: '2025-08-01',
    startTime: '09:00',
    endTime: '10:00',
    description: '테스트 설명',
    location: '테스트 장소',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
    ...overrides,
  };
};
