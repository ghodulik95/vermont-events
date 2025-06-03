// /js/ui/popup.js
import {
  getRedirectHTML
}
from '../utils/urlHelpers.js';
import {
  updateUrlParams
}
from '../render/filters.js';
//import Isso from 'https://comments.vermontmobilizon.xyz/js/embed.min.js';

// js/ui/issoComments.js (or wherever you define defaultLinkText)

const defaultLinkText = {
  url: "",
  description: "",
  category: "",
  eventId: null
};

export function openPopupEvent({
  title,
  beginsOn,
  endsOn = null,
  address = {},
  linkText = defaultLinkText,
  description = '',
  category = '',
  eventId = null
}) {

    const popupCardEventId = document.getElementById("popupCardEventId");
    if (eventId) {
      popupCardEventId.textContent = eventId;
    }
    const popupOverlay = document.getElementById('popupOverlay');
    const popupCard = document.getElementById('popupCardContent');

    popupCard.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'popup-event-card';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const dateEl = document.createElement('p');
    dateEl.innerHTML = `<strong>Date:</strong> ${new Date(beginsOn).toLocaleString()}`
       + (endsOn ? ` – ${new Date(endsOn).toLocaleString()}` : '');

    const locEl = document.createElement('p');
    locEl.innerHTML = `<strong>Location:</strong> ${address.locality || 'Unknown'}`;

    const srcEl = document.createElement('p');
    srcEl.innerHTML = `<strong>More details at:</strong> ${getRedirectHTML(linkText)}`;

    card.append(titleEl, dateEl, locEl, srcEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.classList.add('popup-card-description');
      descEl.innerHTML = `<strong>Description:</strong> ${description}`;
      card.append(descEl);
    }

    const commentEl = document.createElement('section');
    commentEl.id = 'isso-thread';
    commentEl.setAttribute('data-isso-id', '/event_comments/' + linkText.url);

    popupCard.append(card, commentEl);

    popupOverlay.classList.add('active');
    mountIssoComments();

    const close = () => {
      popupOverlay.classList.remove('active');
      popupOverlay.removeEventListener('click', close);
      document.getElementById('closePopup').removeEventListener('click', close);
      popupCard.innerHTML = '';
      popupCardEventId.textContent = '';
      updateUrlParams();
    };

    document.getElementById('closePopup').addEventListener('click', close);
    popupOverlay.addEventListener('click', e => {
      if (e.target === popupOverlay)
        close();
    });
    document.querySelectorAll(".sidebar-nav").forEach(el => {
      el.addEventListener('click', () => {
        popupCard.innerHTML = '';
        popupCardEventId.textContent = '';
        updateUrlParams();
      });
    });

    updateUrlParams();
  }

  export function mountIssoComments() {
    if (window.Isso) {
      window.Isso.init();
      window.Isso.fetchComments();
    }
  }