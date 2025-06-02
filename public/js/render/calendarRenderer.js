// /js/render/calendarRenderer.js
import { openPopupEvent } from '../ui/popup.js';

export function renderCalendar(events) {
  const calendarEl = document.getElementById('calendar');
  if (window._calendarInstance) {
    window._calendarInstance.destroy();
  }
  const calEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.beginsOn,
      end: event.endsOn !== null ? event.endsOn : undefined,
      extendedProps: {
        username: event.username,
        address: event.address,
        description: event.description,
        externalParticipationUrl: event.externalParticipationUrl,
        onlineAddress: event.onlineAddress,
        url: event.url
      },
    }));
  window._calendarInstance = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: calEvents,
    eventClick: info => {
      info.jsEvent.preventDefault();
      const evt = info.event;
      openPopupEvent({
          title:       evt.title,
          beginsOn:    evt.start,
          endsOn:      evt.end,
          address:     evt.extendedProps.address,
          linkText:    {
            externalParticipationUrl: evt.extendedProps.externalParticipationUrl,
            onlineAddress:            evt.extendedProps.onlineAddress,
            url:                      evt.extendedProps.url
          },
          description: evt.extendedProps.description || '',
          category:    evt.extendedProps.category || '',
          eventId:     evt.extendedProps.url
        });
    },
  });
  window._calendarInstance.render();
}
