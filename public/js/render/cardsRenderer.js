// /js/render/cardsRenderer.js
import { openPopupEvent } from '../ui/popup.js';

export function renderEventCards(events, sortOrder='asc') {
  const container = document.getElementById('eventCards');
  container.innerHTML = events.length ? '' : '<p>No events found.</p>';
  const sortedEvents = [...events].sort((a,b) => {
    const timeA = new Date(a.beginsOn).getTime();
    const timeB = new Date(b.beginsOn).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });
  sortedEvents.forEach(event => {
    const card = document.createElement('div');
    const titleEl = document.createElement('h3');
    titleEl.textContent = event.title;
    const dateEl = document.createElement('p');
    dateEl.textContent = new Date(event.beginsOn).toLocaleString() + (event.endsOn ? ` – ${new Date(event.endsOn).toLocaleString()}`: '');
    card.append(titleEl, dateEl);
    card.addEventListener('click', () => {
      openPopupEvent({
        title: event.title,
        beginsOn: event.beginsOn,
        endsOn: event.endsOn,
        address: event.address,
        linkText: { url: event.link },
        description: event.description,
        category: event.category,
        eventId: event.id || ''
      });
    });
    if (event.address?.locality) {
      const locEl = document.createElement('p');
      locEl.textContent = event.address.locality;
      card.append(locEl);
    }
    if (event.description) {
      const descEl = document.createElement('p');
      descEl.textContent = event.description.slice(0, 100);
      descEl.classList.add('card-desc');
      const expandBtn = document.createElement('span');
      expandBtn.classList.add('expand-btn');
      expandBtn.textContent = '+';
      expandBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isExpanded = descEl.classList.toggle('expanded');
        expandBtn.textContent = isExpanded ? '−' : '+';
      });
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.append(descEl, expandBtn);
      card.append(wrapper);
    }
    container.append(card);
  });
}
