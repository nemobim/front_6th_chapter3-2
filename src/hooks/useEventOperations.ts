import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { deleteRepeatEvent, generateRepeatEvents, modifyRepeatEvent } from '../utils/repeatUtils';

/**
 * 이벤트 CRUD 작업을 관리하는 훅
 * @param editing 편집 모드 여부
 * @param onSave 저장 완료 후 호출될 콜백 함수
 */
export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  /**
   * 서버에서 이벤트 목록을 가져와 상태를 업데이트
   */
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  /**
   * 단일 이벤트를 생성하거나 수정
   * @param eventData 저장할 이벤트 데이터
   * @param showToast 성공 메시지 표시 여부
   */
  const saveEvent = async (eventData: Event | EventForm, showToast: boolean = true) => {
    try {
      let response;
      if (editing) {
        // 편집 모드: PUT 요청으로 기존 이벤트 수정
        response = await fetch(`/api/events/${(eventData as Event).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        // 생성 모드: POST 요청으로 새 이벤트 생성
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();

      if (showToast) {
        enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  /**
   * 반복 일정을 생성하여 서버에 저장
   * generateRepeatEvents로 생성된 여러 일정을 /api/events-list로 한 번에 전송
   * @param eventData 반복 일정의 기본 정보
   */
  const saveRepeatEvents = async (eventData: EventForm) => {
    try {
      const repeatEvents = generateRepeatEvents(eventData);

      const response = await fetch('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: repeatEvents }),
      });

      if (!response.ok) {
        throw new Error('Failed to save repeat events');
      }

      await fetchEvents();
      onSave?.();

      enqueueSnackbar(`${repeatEvents.length}개의 반복 일정이 생성되었습니다.`, {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving repeat events:', error);
      enqueueSnackbar('반복 일정 저장 실패', { variant: 'error' });
    }
  };

  /**
   * 특정 날짜의 반복 일정만 수정
   * modifyRepeatEvent로 해당 날짜의 일정을 수정하고 나머지는 유지
   * @param event 수정할 반복 일정
   * @param targetDate 수정할 대상 날짜
   */
  const updateRepeatEvent = async (event: Event, targetDate: string) => {
    try {
      const modifiedEvent = modifyRepeatEvent(event, targetDate);

      const response = await fetch('/api/events-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [modifiedEvent] }),
      });

      if (!response.ok) {
        throw new Error('Failed to update repeat event');
      }

      await fetchEvents();
      onSave?.();

      enqueueSnackbar('반복 일정이 수정되었습니다.', { variant: 'success' });
    } catch (error) {
      console.error('Error updating repeat event:', error);
      enqueueSnackbar('반복 일정 수정 실패', { variant: 'error' });
    }
  };

  /**
   * 특정 날짜의 반복 일정만 삭제
   * deleteRepeatEvent로 해당 날짜의 일정을 삭제하고 나머지는 유지
   * 남은 반복 일정이 있으면 다시 서버에 저장
   * @param event 삭제할 반복 일정
   * @param targetDate 삭제할 대상 날짜
   */
  const deleteRepeatEventById = async (event: Event, targetDate: string) => {
    try {
      const remainingEvents = deleteRepeatEvent(event, targetDate);

      // 대상 날짜의 일정 삭제
      const response = await fetch('/api/events-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: [event.id] }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete repeat event');
      }

      // 남은 반복 일정들을 다시 서버에 저장
      if (remainingEvents.length > 0) {
        const addResponse = await fetch('/api/events-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: remainingEvents }),
        });

        if (!addResponse.ok) {
          throw new Error('Failed to add remaining repeat events');
        }
      }

      await fetchEvents();
      onSave?.();

      enqueueSnackbar('반복 일정이 삭제되었습니다.', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting repeat event:', error);
      enqueueSnackbar('반복 일정 삭제 실패', { variant: 'error' });
    }
  };

  /**
   * 단일 이벤트를 서버에서 삭제
   * @param id 삭제할 이벤트의 ID
   */
  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  /**
   * 컴포넌트 초기화 시 이벤트 목록을 로드
   */
  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    fetchEvents,
    saveEvent,
    deleteEvent,
    saveRepeatEvents,
    updateRepeatEvent,
    deleteRepeatEventById,
  };
};
