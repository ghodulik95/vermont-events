// /js/render/calendarRenderer.js
import { openPopupEvent } from '../ui/popup.js';
import { detectMobile }          from '../utils/detectMobile.js';

function getActiveTab() {
    const buttons = document.querySelectorAll('.tabButton');
    for (const button of buttons) {
      if (button.classList.contains('active')) {
        return button.getAttribute('data-tab');
      }
    }
    console.error(
      'No active tab found. This should not happen with expected functioning.'
    );
    return null;
  }

function updateCalendarIndicators(events) {
    const view = window._calendarInstance.view;
    const rangeStart = new Date(view.activeStart);
    const rangeEnd = new Date(view.activeEnd);
    const priorCount = events.filter(
      (e) => new Date(e.beginsOn) < rangeStart
    ).length;
    const futureCount = events.filter(
      (e) => new Date(e.beginsOn) > rangeEnd
    ).length;
    const parts = [];
    if (priorCount > 0) parts.push(`${priorCount} prior event(s) not shown`);
    if (futureCount > 0)
      parts.push(`${futureCount} future event(s) not shown`);
    document.getElementById('calendarIndicators').textContent =
      parts.join(', ');
  }
 

export function renderCalendar(events, applyFilterButtonPress=false, startDateOverride=null) {
  const calendarEl = document.getElementById('calendar');
  let initialDateStr = startDateOverride ? startDateOverride : new Date().toISOString().split('T')[0];
  let viewType = detectMobile() ? "dayGridDay" : "dayGridMonth";

  if (window._calendarInstance) {
    viewType = window._calendarInstance.view.type;
    initialDateStr = window._calendarInstance.getDate().toISOString().split('T')[0];    
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
    initialView: viewType,
    initialDate: initialDateStr,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    events: calEvents,
    eventClick: (info) => {
      // Remove any old popover
      document.getElementById('fcPopover')?.remove();

      // Build popover
      const pop = document.createElement('div');
      pop.id = 'fcPopover';
      pop.className = 'fc-popover';

      // Extract event details
      const startTime = new Date(info.event.start).toLocaleString();
      const endTime = info.event.end
        ? ` – ${new Date(info.event.end).toLocaleString()}`
        : '';
      const addr = info.event.extendedProps.address.description ||
        (info.event.extendedProps.address.street || '') + ', ' +
        (info.event.extendedProps.address.locality || '');

      const evt = info.event;
      const details = {
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
      };

      // Create inner HTML
      pop.innerHTML = `
        <h4>${info.event.title}</h4>
        <p>${startTime}${endTime}</p>
        <p>${addr}</p>
      `;

      // Create the "Show more" button
      const showMoreBtn = document.createElement('button');
      showMoreBtn.textContent = 'Show more';
      showMoreBtn.addEventListener('click', () => openPopupEvent(details));

      // Append the button to the popup
      pop.appendChild(showMoreBtn);

      // Temporarily position it off-screen so we can measure it
      pop.style.position = 'absolute';
      pop.style.top = '-9999px';
      pop.style.left = '-9999px';
      document.body.appendChild(pop);

      // Measure and compute “safe” coords
      const { width: pw, height: ph } = pop.getBoundingClientRect();
      const margin = 8;
      let x = info.jsEvent.pageX;
      let y = info.jsEvent.pageY;

      // If it would run off the right edge, shift left
      if (x + pw + margin > window.innerWidth) {
        x = window.innerWidth - pw - margin;
      }
      // If it would run off the bottom edge, pop it _above_ the tap point
      if (y + ph + margin > window.innerHeight) {
        y = y - ph - margin;
      }

      // Finally position it
      pop.style.top = y + 'px';
      pop.style.left = x + 'px';

      // Dismiss on next tap anywhere (except inside)
      const remover = (e) => {
        if (!pop.contains(e.target)) {
          pop.remove();
          document.body.removeEventListener('click', remover);
        }
      };
      setTimeout(() => document.body.addEventListener('click', remover), 0);
    },
    eventDidMount: function (info) {
      const { title, start, extendedProps, end } = info.event;
      const address = extendedProps.address;
      const startTime = new Date(start).toLocaleString();
      const endTime = end ? ` – ${new Date(end).toLocaleString()}` : '';
      const addressStr =
        address?.description ||
        (address?.street || '') +
          ', ' +
          (address?.locality || '') +
          ', ' +
          (address?.region || '');
      // source domain
      const onlineAddress = extendedProps.url;
      const domain = onlineAddress
        ? new URL(onlineAddress).hostname
        : 'Unknown source';
      info.el.setAttribute(
        'title',
        `${title}\n${startTime}${endTime}\n${addressStr}\n${domain}`
      );
    },
  });

    // Update indicators for events outside current view
  window._calendarInstance.setOption('datesSet', function () {
    updateCalendarIndicators(events);
  });
  updateCalendarIndicators(events);
  window._calendarInstance.render();
  
  setTimeout(() => {
    const activeTab = getActiveTab();
    if (activeTab === "calendarTab" && window._calendarInstance && window._calendarInstance.view.type === 'dayGridMonth') {
      const firstEventEl = document.querySelector('.fc-event');
      const scrollerEl = document.querySelector('.fc-scroller');
      if (firstEventEl && scrollerEl) {
        const priorWindowScrollY = window.scrollY;
        firstEventEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start', // or 'center'
          alignToTop: false,
          container: 'nearest'
        });
        if (!applyFilterButtonPress) {
          window.scrollTo({ top: priorWindowScrollY });
        }
      }
    }
  }, 100);
}
