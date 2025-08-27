import { EventForm } from '../../types';
import {
  deleteRepeatEvent,
  generateRepeatEvents,
  modifyRepeatEvent,
} from '../../utils/repeatUtils';
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

    it('31일에 매월을 선택한다면 매월 마지막이 아닌, 31일에만 생성한다.', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-31',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-10-30' },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-01-31');
      expect(result[1].date).toBe('2025-03-31'); // 2월 건너뛰기
      expect(result[2].date).toBe('2025-05-31'); // 4월 건너뛰기
      expect(result[3].date).toBe('2025-07-31'); // 6월 건너뛰기
      expect(result[4].date).toBe('2025-08-31'); // 8월
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

    it('윤년 29일에 매년 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2020-02-29', // 2020년은 윤년
        repeat: { type: 'yearly', interval: 1, endDate: '2025-10-30' },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2020-02-29'); // 2020년 (윤년)
      expect(result[1].date).toBe('2024-02-29'); // 2024년 (윤년) - 2021, 2022, 2023, 2025년은 건너뛰기
    });
  });
  describe('반복 종료 조건을 지정할 수 있다', () => {
    const mockEvent = createMockEvent(1);

    it('특정 날짜까지 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-01-05',
        },
      };

      const result = generateRepeatEvents(event);

      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[1].date).toBe('2025-01-02');
      expect(result[2].date).toBe('2025-01-03');
      expect(result[3].date).toBe('2025-01-04');
      expect(result[4].date).toBe('2025-01-05');
    });

    it('endDate가 없는 경우 기본 종료일(2025-10-30)까지 반복 일정을 생성한다', () => {
      const event: EventForm = {
        ...mockEvent,
        date: '2025-01-01',
        repeat: {
          type: 'daily',
          interval: 1,
          // endDate 없음
        },
      };

      const result = generateRepeatEvents(event);

      // 2025-01-01부터 2025-10-30까지의 일수 계산
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-10-30');
      const expectedDays =
        Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      expect(result).toHaveLength(expectedDays);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[result.length - 1].date).toBe('2025-10-30');
    });
  });
});

describe('modifyRepeatEvent: 반복 일정을 단일 수정한다.', () => {
  const mockEvent = createMockEvent(1);

  it('반복 일정을 수정하면 단일 일정으로 변경된다', () => {
    const originalEvent: EventForm = {
      ...mockEvent,
      date: '2025-01-01',
      repeat: { type: 'daily', interval: 1, endDate: '2025-01-05' },
    };

    const modifiedEvent = modifyRepeatEvent(originalEvent, '2025-01-03');

    expect(modifiedEvent.repeat.type).toBe('none');
    expect(modifiedEvent.repeat.interval).toBe(1);
    expect(modifiedEvent.date).toBe('2025-01-03');
  });

  it('반복 일정을 수정하면 반복 아이콘이 사라진다', () => {
    const originalEvent: EventForm = {
      ...mockEvent,
      date: '2025-01-01',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-01-29' },
    };

    const modifiedEvent = modifyRepeatEvent(originalEvent, '2025-01-15');

    expect(modifiedEvent.repeat.type).toBe('none');
    // 반복 아이콘은 UI에서 처리되므로 repeat.type이 'none'이면 아이콘이 사라짐
  });

  it('수정된 일정의 다른 속성들이 보존된다', () => {
    const originalEvent: EventForm = {
      ...mockEvent,
      title: '회의',
      description: '중요한 회의',
      date: '2025-01-01',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
    };

    const modifiedEvent = modifyRepeatEvent(originalEvent, '2025-03-15');

    // 반복 속성만 변경되고 다른 속성은 보존
    expect(modifiedEvent.title).toBe('회의');
    expect(modifiedEvent.description).toBe('중요한 회의');
    expect(modifiedEvent.date).toBe('2025-03-15');
    expect(modifiedEvent.repeat.type).toBe('none');
  });

  it('반복 일정의 특정 인스턴스만 수정할 수 있다', () => {
    const originalEvent: EventForm = {
      ...mockEvent,
      date: '2025-01-01',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-01-29' },
    };

    // 1월 15일의 반복 일정만 수정
    const modifiedEvent = modifyRepeatEvent(originalEvent, '2025-01-15');

    expect(modifiedEvent.date).toBe('2025-01-15');
    expect(modifiedEvent.repeat.type).toBe('none');
    // 원본 일정은 변경되지 않음
    expect(originalEvent.repeat.type).toBe('weekly');
  });
});

describe('deleteRepeatEvent: 반복 일정을 단일 삭제한다.', () => {
  const mockEvent = createMockEvent(1);

  it('반복 일정을 삭제하면 해당 일정만 삭제된다', () => {
    const originalEvent: EventForm = {
      ...mockEvent,
      date: '2025-01-01',
      repeat: { type: 'daily', interval: 1, endDate: '2025-01-05' },
    };

    const result = deleteRepeatEvent(originalEvent, '2025-01-03');

    expect(result).toHaveLength(4); // 5개에서 1개 삭제
    expect(result.find((event) => event.date === '2025-01-03')).toBeUndefined(); // 삭제된 일정은 없음
    expect(result.find((event) => event.date === '2025-01-01')).toBeDefined(); // 다른 일정은 유지
    expect(result.find((event) => event.date === '2025-01-05')).toBeDefined(); // 다른 일정은 유지
  });

  it('삭제된 일정의 반복 속성은 원본과 동일하게 유지된다', () => {
    const originalEvent: EventForm = {
      ...mockEvent,
      date: '2025-01-01',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-01-29' },
    };

    const result = deleteRepeatEvent(originalEvent, '2025-01-15');

    // 삭제된 일정을 제외한 나머지 일정들은 반복 속성 유지
    result.forEach((event) => {
      expect(event.repeat.type).toBe('weekly');
      expect(event.repeat.interval).toBe(1);
      expect(event.repeat.endDate).toBe('2025-01-29');
    });
  });
});
