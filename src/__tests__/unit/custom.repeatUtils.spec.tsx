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
  });
});
