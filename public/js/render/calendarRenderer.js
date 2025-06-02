// /js/render/calendarRenderer.js
import { openPopupEvent } from '../ui/popup.js';

export function renderCalendar(events) {
  const calendarEl = document.getElementById('calendar');
  if (window._calendarInstance) {
    window._calendarInstance.destroy();
  }
  const calEvents = events.map(e => ({
    id: e.id || '',
    title: e.title,
    start: e.beginsOn,
    end: e.endsOn,
    extendedProps: {
      address: e.address,
      url: e.link,
      category: e.category,
      description: e.description,
    },
  }));
  window._calendarInstance = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: calEvents,
    eventClick: info => {
      info.jsEvent.preventDefault();
      const ev = info.event;
      openPopupEvent({
        title: ev.title,
        beginsOn: ev.start,
        endsOn: ev.end,
        address: ev.extendedProps.address,
        linkText: { url: ev.extendedProps.url },
        description: ev.extendedProps.description,
        category: ev.extendedProps.category,
        eventId: ev.id,
      });
    },
  });
  window._calendarInstance.render();
}
