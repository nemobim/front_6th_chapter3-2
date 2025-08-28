import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import { setupMockHandlerRepeatCreation } from '../__mocks__/handlersUtils';
import App from '../App';
import { EventForm } from '../types';
import { createMockEvent } from './utils';

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
const saveRepeatSchedule = async (user: UserEvent, baseEvent: EventForm) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = baseEvent;

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
  await user.click(screen.getByLabelText('반복 유형'));
  await user.click(within(screen.getByLabelText('반복 유형')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${repeat.type}-option` }));

  // 반복 종료일 설정
  if (repeat.endDate) {
    await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate);
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정 통합 테스트', () => {
  describe('시나리오 1: 반복 일정 생성 및 표시', () => {
    it('매일 반복 일정을 생성하고 달력에 올바르게 표시한다', async () => {
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
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
      });

      await saveRepeatSchedule(user, mockEvent);

      // 일정 로딩 완료
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
      // 성공 toast 확인
      expect(screen.getByText('3개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 이벤트 리스트에서 반복 일정 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('매일 스크럼')).toHaveLength(3);

      // 월간 뷰에서 반복 아이콘 표시 확인
      const monthView = within(screen.getByTestId('month-view'));
      expect(monthView.getAllByTestId('repeat-icon')).toHaveLength(3);
    }, 10000);

    it('매주 반복 일정을 생성하고 달력에 올바르게 표시한다', async () => {
      setupMockHandlerRepeatCreation();

      const { user } = setup(<App />);

      const mockEvent = createMockEvent(2, {
        title: '주간 팀 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '회의 진행',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-11-05' },
      });

      await saveRepeatSchedule(user, mockEvent);

      // 일정 로딩 완료
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
      // 성공 toast 확인
      expect(screen.getByText('4개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 이벤트 리스트에서 반복 일정 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('주간 팀 회의')).toHaveLength(3); //10-15, 10-22, 10-29

      // 월간 뷰에서 반복 아이콘 표시 확인
      const monthView = within(screen.getByTestId('month-view'));
      expect(monthView.getAllByTestId('repeat-icon')).toHaveLength(3);
    }, 10000);

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
        repeat: { type: 'monthly', interval: 1, endDate: '2025-10-30' },
      });

      await saveRepeatSchedule(user, mockEvent);

      // 일정 로딩 완료
      expect(screen.getByText('일정 로딩 완료!')).toBeInTheDocument();
      // 성공 toast 확인
      expect(screen.getByText('1개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();

      // 월간 뷰에서 반복 일정 확인
      const monthView = within(screen.getByTestId('month-view'));
      expect(monthView.getAllByText('월간 프로젝트 리뷰')).toHaveLength(1);

      // 반복 아이콘 확인
      expect(monthView.getAllByTestId('repeat-icon')).toHaveLength(1);
    }, 10000);

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
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
      });

      // 매일 반복 일정 생성
      await saveRepeatSchedule(user, mockEvent);

      // 이벤트 리스트에서 반복 아이콘 확인
      const eventList = within(screen.getByTestId('event-list'));
      const repeatIcons = eventList.getAllByTestId('repeat-icon');
      expect(repeatIcons).toHaveLength(2);
      expect(repeatIcons[0]).toHaveAttribute('data-repeat-type', 'daily');
    }, 10000);

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
        repeat: { type: 'yearly', interval: 1, endDate: '2025-02-28' },
      });

      await saveRepeatSchedule(user, mockEvent);

      // 윤년이 아닌 해는 건너뛰므로 2개의 일정만 생성 (2020, 2024)
      expect(screen.getByText('2개의 반복 일정이 생성되었습니다.')).toBeInTheDocument();
    });
  });
});
