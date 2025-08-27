import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import App from '../App';
import { Event, RepeatType } from '../types';
import { createMockEvent } from './utils';
// 수정: 반복 일정용 mock handler 추가
import { setupMockHandlerRepeatCreation } from '../__mocks__/handlersUtils';

// 테스트 환경 설정
const theme = createTheme();

// 테스트 환경 설정 함수
const setup = (element: ReactElement) => {
  const user = userEvent.setup();
  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

/** 반복 일정 저장 헬퍼 함수 */
const saveRepeatSchedule = async (
  user: UserEvent,
  baseEvent: Omit<Event, 'id' | 'notificationTime' | 'repeat'>,
  repeatType: RepeatType,
  interval: number = 1,
  endDate?: string
) => {
  const { title, date, startTime, endTime, location, description, category } = baseEvent;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);

  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  // 반복 유형 선택
  await user.click(within(screen.getByLabelText('반복 유형')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${repeatType}-option` }));

  // 반복 간격 설정 - number input을 찾기
  const numberInputs = screen.getAllByDisplayValue('1');
  const intervalInput = numberInputs[numberInputs.length - 1]; // 마지막 number input (반복 간격)
  await user.clear(intervalInput);
  await user.type(intervalInput, interval.toString());

  // 반복 종료일 설정 (있는 경우) - date input을 찾기
  if (endDate) {
    const dateInputs = screen.getAllByDisplayValue('');
    const endDateInput = dateInputs[dateInputs.length - 1]; // 마지막 date input (반복 종료일)
    await user.type(endDateInput, endDate);
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정 통합 테스트', () => {
  describe('시나리오 1: 반복 일정 생성 및 표시', () => {
    it('매일 반복 일정을 생성하고 달력에 올바르게 표시한다', async () => {
      // 수정: 반복 일정 생성용 mock handler 사용
      setupMockHandlerRepeatCreation();

      const { user } = setup(<App />);

      const mockEvent = createMockEvent(1, {
        title: '매일 스크럼',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '09:30',
        description: '일일 스크럼 미팅',
        location: '온라인',
        category: '업무',
      });

      await saveRepeatSchedule(user, mockEvent, 'daily', 1, '2025-10-17');

      // 성공 toast 확인
      expect(screen.getByText('3개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 이벤트 리스트에서 반복 일정 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('매일 스크럼')).toBeInTheDocument();
      expect(eventList.getByText('반복: 1일마다 (종료: 2025-10-17)')).toBeInTheDocument();

      // 주간 뷰에서 반복 일정 확인
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));

      // 10월 15일, 16일, 17일에 반복 일정이 표시되는지 확인
      expect(weekView.getByText('매일 스크럼')).toBeInTheDocument();

      // 반복 아이콘이 표시되는지 확인
      const repeatIcons = screen.getAllByTestId('repeat-icon');
      expect(repeatIcons).toHaveLength(3); // 3개의 반복 일정에 대해 아이콘 표시
    });

    it('매주 반복 일정을 생성하고 주간 뷰에서 올바르게 표시한다', async () => {
      setupMockHandlerRepeatCreation();

      const { user } = setup(<App />);

      const mockEvent = createMockEvent(2, {
        title: '주간 팀 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '주간 팀 회의',
        location: '회의실 A',
        category: '업무',
      });

      await saveRepeatSchedule(user, mockEvent, 'weekly', 1, '2025-11-05');

      // 성공 toast 확인
      expect(screen.getByText('4개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 주간 뷰로 전환
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));

      // 첫 번째 주에 반복 일정이 표시되는지 확인
      expect(weekView.getByText('주간 팀 회의')).toBeInTheDocument();

      // 반복 아이콘 확인
      const repeatIcons = screen.getAllByTestId('repeat-icon');
      expect(repeatIcons.length).toBeGreaterThan(0);
    });

    it('매월 반복 일정을 생성하고 월간 뷰에서 올바르게 표시한다', async () => {
      setupMockHandlerRepeatCreation();

      const { user } = setup(<App />);

      const mockEvent = createMockEvent(3, {
        title: '월간 프로젝트 리뷰',
        date: '2025-10-15',
        startTime: '16:00',
        endTime: '17:00',
        description: '월간 프로젝트 진행 상황 리뷰',
        location: '회의실 B',
        category: '업무',
      });

      await saveRepeatSchedule(user, mockEvent, 'monthly', 1, '2025-12-15');

      // 성공 toast 확인
      expect(screen.getByText('3개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 월간 뷰에서 반복 일정 확인
      const monthView = within(screen.getByTestId('month-view'));
      expect(monthView.getByText('월간 프로젝트 리뷰')).toBeInTheDocument();

      // 반복 아이콘 확인
      const repeatIcons = screen.getAllByTestId('repeat-icon');
      expect(repeatIcons.length).toBeGreaterThan(0);
    });

    it('반복 일정에 올바른 아이콘이 표시된다', async () => {
      setupMockHandlerRepeatCreation();

      const { user } = setup(<App />);

      const mockEvent = createMockEvent(4, {
        title: '테스트 반복 일정',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '아이콘 테스트용',
        location: '테스트',
        category: '기타',
      });

      // 매일 반복 일정 생성
      await saveRepeatSchedule(user, mockEvent, 'daily', 1, '2025-10-16');

      // 이벤트 리스트에서 반복 아이콘 확인
      const eventList = within(screen.getByTestId('event-list'));
      const repeatIcon = eventList.getByTestId('repeat-icon');
      expect(repeatIcon).toBeInTheDocument();
      expect(repeatIcon).toHaveAttribute('data-repeat-type', 'daily');
    });

    it('매년 반복 일정을 생성하고 윤년 처리가 올바르게 작동한다', async () => {
      setupMockHandlerRepeatCreation();

      const { user } = setup(<App />);

      const mockEvent = createMockEvent(5, {
        title: '생일 파티',
        date: '2020-02-29', // 2020년은 윤년
        startTime: '18:00',
        endTime: '20:00',
        description: '생일 축하 파티',
        location: '집',
        category: '개인',
      });

      await saveRepeatSchedule(user, mockEvent, 'yearly', 1, '2025-02-28');

      // 윤년이 아닌 해는 건너뛰므로 2개의 일정만 생성 (2020, 2024)
      expect(screen.getByText('2개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 이벤트 리스트에서 반복 일정 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('생일 파티')).toBeInTheDocument();
      expect(eventList.getByText('반복: 1년마다 (종료: 2025-02-28)')).toBeInTheDocument();
    });
  });
});
