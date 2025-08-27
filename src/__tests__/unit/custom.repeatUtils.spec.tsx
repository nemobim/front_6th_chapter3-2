import { EventForm } from '../../types';
import { generateRepeatEvents } from '../../utils/repeatUtils';
import { createMockEvent } from '../utils';

describe('generateRepeatEvents: 반복 일정을 생성한다.', () => {
  const mockEvent = createMockEvent(1);

  describe('반복 유형을 선택한다.', () => {
    it('반복 유형이 none인 경우 원본 일정만 반환한다.', () => {
      const event: EventForm = {
        ...mockEvent,
        repeat: { type: 'none', interval: 1 },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(event.date);
    });

    it('매일 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-01',
        repeat: { type: 'daily', interval: 1, endDate: '2025-01-03' },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[1].date).toBe('2025-01-02');
      expect(result[2].date).toBe('2025-01-03');
    });

    it('매주 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-01',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-01-29' },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[1].date).toBe('2025-01-08');
      expect(result[2].date).toBe('2025-01-15');
      expect(result[3].date).toBe('2025-01-22');
      expect(result[4].date).toBe('2025-01-29');
    });

    it('매월 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-15',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-15' },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-01-15');
      expect(result[1].date).toBe('2025-02-15');
      expect(result[2].date).toBe('2025-03-15');
      expect(result[3].date).toBe('2025-04-15');
      expect(result[4].date).toBe('2025-05-15');
    });

    it('매년 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-15',
        repeat: { type: 'yearly', interval: 1, endDate: '2028-01-15' },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(4);
      expect(result[0].date).toBe('2025-01-15');
      expect(result[1].date).toBe('2026-01-15');
      expect(result[2].date).toBe('2027-01-15');
      expect(result[3].date).toBe('2028-01-15');
    });
  });
});
