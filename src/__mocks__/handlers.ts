import { http, HttpResponse } from 'msw';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event } from '../types';

export const handlers = [
  http.get('/api/events', () => {
    return HttpResponse.json({ events });
  }),

  http.post('/api/events', async ({ request }) => {
    const newEvent = (await request.json()) as Event;
    newEvent.id = String(events.length + 1);
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.put('/api/events/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedEvent = (await request.json()) as Event;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return HttpResponse.json({ ...events[index], ...updatedEvent });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/events/:id', ({ params }) => {
    const { id } = params;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return new HttpResponse(null, { status: 204 });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  /**
   * 반복 일정 생성
   */
  http.post('/api/events-list', async ({ request }) => {
    const { events: newEvents } = (await request.json()) as { events: Event[] };

    const eventsWithIds = newEvents.map((event, index) => ({
      ...event,
      id: String(events.length + index + 1),
    }));

    return HttpResponse.json(eventsWithIds, { status: 201 });
  }),

  /**
   * 반복 일정 수정
   */
  http.put('/api/events-list', async ({ request }) => {
    const { events: updatedEvents } = (await request.json()) as { events: Event[] };
    let isUpdated = false;

    updatedEvents.forEach((updatedEvent) => {
      const index = events.findIndex((event) => event.id === updatedEvent.id);
      if (index !== -1) {
        isUpdated = true;
        Object.assign(events[index], updatedEvent);
      }
    });

    if (isUpdated) {
      return HttpResponse.json(events);
    } else {
      return new HttpResponse(null, { status: 404 });
    }
  }),

  /**
   * 반복 일정 삭제
   */
  http.delete('/api/events-list', async ({ request }) => {
    const { eventIds } = (await request.json()) as { eventIds: string[] };

    for (let i = events.length - 1; i >= 0; i--) {
      if (eventIds.includes(events[i].id)) {
        events.splice(i, 1);
      }
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
