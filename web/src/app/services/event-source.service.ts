import {Observable, Subscriber} from 'rxjs';

import {EventSource, EventSourceInit} from 'eventsource';

/**
 * Method for establishing connection and subscribing to events from SSE
 * @param url - SSE server api path
 * @param options - configuration object for SSE
 * @param eventNames - all event names except error (listens by default) you want to listen to
 */
export function connectToEventSource(
  url: string,
  options: EventSourceInit,
  eventNames: string[] = [],
): Observable<MessageEvent> {
  const eventSource = new EventSource(url, options);

  return new Observable((subscriber: Subscriber<MessageEvent>) => {
    eventSource.onerror = (error) => subscriber.error(error);

    eventNames.forEach((event: string) => {
      eventSource.addEventListener(event, (data) => subscriber.next(data));
    });

    subscriber.add(() => eventSource.close());
  });
}
