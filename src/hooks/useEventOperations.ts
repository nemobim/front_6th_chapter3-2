import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { deleteRepeatEvent, generateRepeatEvents, modifyRepeatEvent } from '../utils/repeatUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

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

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;

      // 반복 일정인 경우
      if (eventData.repeat.type !== 'none') {
        const repeatEvents = generateRepeatEvents(eventData);

        if (editing) {
          // 반복 일정 수정 시 단일 일정으로 변환
          const modifiedEvent = modifyRepeatEvent(eventData as EventForm, eventData.date);
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(modifiedEvent),
          });
        } else {
          // 새로운 반복 일정 생성
          response = await fetch('/api/events-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: repeatEvents }),
          });
        }
      } else {
        // 단일 일정 처리
        if (editing) {
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        } else {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };
  const deleteEvent = async (id: string) => {
    try {
      // 삭제할 이벤트 찾기
      const eventToDelete = events.find((event) => event.id === id);
      if (!eventToDelete) {
        throw new Error('Event not found');
      }

      // 반복 일정이면서 repeatId가 있는 경우 (반복 일정의 단일 삭제)
      if (eventToDelete.repeat.type !== 'none' && eventToDelete.repeat.id) {
        // 같은 repeatId를 가진 모든 이벤트 찾기
        const repeatEvents = events.filter((event) => event.repeat.id === eventToDelete.repeat.id);

        // 단일 삭제 처리 - 해당 일정만 제외한 나머지 반복 일정들
        const remainingEvents = deleteRepeatEvent(eventToDelete, eventToDelete.date);

        // 기존 반복 일정들 모두 삭제
        const deleteResponse = await fetch('/api/events-list', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds: repeatEvents.map((e) => e.id) }),
        });

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete repeat events');
        }

        // 남은 반복 일정들 다시 생성 (삭제된 일정 제외)
        if (remainingEvents.length > 0) {
          const createResponse = await fetch('/api/events-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: remainingEvents }),
          });

          if (!createResponse.ok) {
            throw new Error('Failed to recreate repeat events');
          }
        }
      } else {
        // 단일 일정 삭제
        const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete event');
        }
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, fetchEvents, saveEvent, deleteEvent };
};
