import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { act, render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';
import { vi } from 'vitest';

import { setupMockHandlerCreation } from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';

const theme = createTheme();

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

const saveScheduleWithNotification = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'> & { notificationTime?: number }
) => {
  const {
    title,
    date,
    startTime,
    endTime,
    location,
    description,
    category,
    notificationTime = 10,
  } = form;

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  // 알림 시간 설정
  const notificationSelect = screen.getByLabelText('알림 설정');
  await user.click(notificationSelect);
  const notificationOption = screen.getByText(`${notificationTime}분 전`);
  await user.click(notificationOption);

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('알림 시스템 통합 테스트', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-15 08:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    server.resetHandlers();
  });

  describe('시나리오 1: 기본 알림 워크플로우', () => {
    it('사용자가 일정을 생성할 때 알림 시간을 10분 전으로 설정하고 알림이 정확한 메시지와 함께 표시되는지 확인', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await saveScheduleWithNotification(user, {
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        notificationTime: 10,
      });

      // 일정 생성 후 10분 전으로 시간 진행 (08:50)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 08:50:00'));
        vi.advanceTimersByTime(1000);
      });

      // 알림이 표시되는지 확인
      await screen.findByText('10분 후 오전 회의 일정이 시작됩니다.');

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('10분 후 오전 회의 일정이 시작됩니다.');
    });

    it('사용자가 알림을 닫으면 알림이 사라지는지 확인', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await saveScheduleWithNotification(user, {
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        notificationTime: 10,
      });

      // 10분 전으로 시간 진행
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 08:50:00'));
        vi.advanceTimersByTime(1000);
      });

      // 알림이 표시되는지 확인
      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();

      // 알림 닫기 버튼 클릭
      const closeButton = within(alert).getByRole('button');
      await user.click(closeButton);

      // 알림이 사라졌는지 확인
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('시나리오 2: 여러 알림 동시 처리', () => {
    it('여러 개의 일정을 각각 다른 알림 시간으로 생성하고 여러 알림이 동시에 표시되는지 확인', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      // 첫 번째 일정: 10분 전 알림
      await saveScheduleWithNotification(user, {
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        notificationTime: 10,
      });

      // 폼 리셋 후 두 번째 일정: 60분 전 알림
      await saveScheduleWithNotification(user, {
        title: '점심 약속',
        date: '2025-10-15',
        startTime: '12:00',
        endTime: '13:00',
        description: '고객과 점심',
        location: '레스토랑',
        category: '업무',
        notificationTime: 60,
      });

      // 시간을 11:00으로 진행 (점심 약속 1시간 전, 오전 회의는 이미 지남)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 11:00:00'));
        vi.advanceTimersByTime(1000);
      });

      // 점심 약속 알림이 표시되는지 확인
      await screen.findByText('60분 후 점심 약속 일정이 시작됩니다.');

      // 시간을 08:50으로 되돌려서 첫 번째 알림도 활성화
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 08:50:00'));
        vi.advanceTimersByTime(1000);
      });

      // 두 알림이 모두 표시되는지 확인
      await screen.findByText('10분 후 오전 회의 일정이 시작됩니다.');
      expect(screen.getByText('60분 후 점심 약속 일정이 시작됩니다.')).toBeInTheDocument();

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });

    it('사용자가 특정 알림만 제거했을 때 다른 알림은 유지되는지 확인', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      // 두 개의 일정 생성
      await saveScheduleWithNotification(user, {
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        notificationTime: 10,
      });

      await saveScheduleWithNotification(user, {
        title: '점심 약속',
        date: '2025-10-15',
        startTime: '12:00',
        endTime: '13:00',
        description: '고객과 점심',
        location: '레스토랑',
        category: '업무',
        notificationTime: 60,
      });

      // 두 알림 모두 활성화되는 시간으로 설정
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 11:00:00'));
        vi.advanceTimersByTime(1000);
      });

      // 두 알림이 모두 표시되는지 확인
      await screen.findByText('60분 후 점심 약속 일정이 시작됩니다.');

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(1);

      // 첫 번째 알림 닫기
      const firstCloseButton = within(alerts[0]).getByRole('button');
      await user.click(firstCloseButton);

      // 첫 번째 알림만 사라지고 두 번째는 유지되는지 확인
      expect(screen.queryByText('60분 후 점심 약속 일정이 시작됩니다.')).not.toBeInTheDocument();

      const remainingAlerts = screen.queryAllByRole('alert');
      expect(remainingAlerts).toHaveLength(0);
    });
  });

  describe('시나리오 3: 알림 자동 만료', () => {
    it('알림이 설정된 일정을 생성하고 일정 시작 시간이 되면 알림이 자동으로 사라지는지 확인', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await saveScheduleWithNotification(user, {
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        notificationTime: 10,
      });

      // 시간을 08:50으로 진행 (10분 전 알림)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 08:50:00'));
        vi.advanceTimersByTime(1000);
      });

      // 알림이 표시되는지 확인
      await screen.findByText('10분 후 오전 회의 일정이 시작됩니다.');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // 시간을 09:01으로 진행 (일정 시작 후)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 09:01:00'));
        vi.advanceTimersByTime(1000);
      });

      // 알림이 자동으로 사라지는지 확인 (일정 시작 시간이 지나면 더 이상 upcoming이 아니므로)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('10분 후 오전 회의 일정이 시작됩니다.')).not.toBeInTheDocument();
    });

    it('여러 알림이 있을 때 각각의 일정 시작 시간에 맞춰 알림이 자동으로 사라지는지 확인', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      // 첫 번째 일정: 09:00 시작, 10분 전 알림
      await saveScheduleWithNotification(user, {
        title: '오전 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        notificationTime: 10,
      });

      // 두 번째 일정: 10:00 시작, 5분 전 알림
      await saveScheduleWithNotification(user, {
        title: '프로젝트 검토',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '프로젝트 검토',
        location: '회의실 B',
        category: '업무',
        notificationTime: 5,
      });

      // 시간을 08:50으로 진행 (첫 번째 일정 10분 전)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 08:50:00'));
        vi.advanceTimersByTime(1000);
      });

      // 첫 번째 알림만 표시되는지 확인
      await screen.findByText('10분 후 오전 회의 일정이 시작됩니다.');
      expect(screen.queryByText('5분 후 프로젝트 검토 일정이 시작됩니다.')).not.toBeInTheDocument();

      // 시간을 09:55로 진행 (두 번째 일정 5분 전, 첫 번째는 이미 시작됨)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 09:55:00'));
        vi.advanceTimersByTime(1000);
      });

      // 두 번째 알림이 표시되는지 확인
      await screen.findByText('5분 후 프로젝트 검토 일정이 시작됩니다.');

      // 시간을 10:01으로 진행 (두 번째 일정도 시작됨)
      act(() => {
        vi.setSystemTime(new Date('2025-10-15 10:01:00'));
        vi.advanceTimersByTime(1000);
      });

      // 모든 알림이 사라지는지 확인
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
