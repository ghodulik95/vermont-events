// /js/app.js
console.log("Started");
import { detectMobile }          from './utils/detectMobile.js';
import { openSidebar, closeSidebar, switchSection } from './ui/sidebar.js';
import { initTabButtons }        from './ui/tabs.js';
import { loadBlog }               from './feeds/blogLoader.js';
import { openPopupEvent }        from './ui/popup.js';

import { renderEventCards, renderCalendar, renderMap } from './render/index.js';
import { parseFiltersFromUrl, filterEvents, updateUrlParams, updateFilterOptions } from './render/filters.js';
import { defaultFillPlaceholders } from './render/fillPlaceholders.js';
//import * as Survey from "survey-core";
//import "survey-js-ui";


let events = [];
(async () => {
  const [config, rawEvents, surveySchema] = await Promise.all([
    fetch('/config.json?v=4').then(r => r.json()),
    fetch('/data/events.json?v=4').then(r => r.json()),
    fetch('/data/createEventSurveyJS.json?v=4').then(r => r.json())
  ]);
  window.config = config;
  document.title = config.siteTitle;

  document.getElementById('loader').style.display = 'none';
  
  defaultFillPlaceholders();

  document.getElementById('hamburgerButton').addEventListener('click', openSidebar);
  document.getElementById('navViewEvents').addEventListener('click', () => switchSection('viewEvents'));
  document.getElementById('navAboutSection').addEventListener('click', () => switchSection('aboutSection'));
  document.getElementById('navBlogSection').addEventListener('click', () => switchSection('blogSection'));
  document.getElementById('navCommentSection').addEventListener('click', () => switchSection('commentSection'));
// Filter collapse
  const filterToggleBtn = document.getElementById('toggleFilters');
  // Default section
  const filters = document.getElementById('filtersContainer');
  //filters.classList.remove('open'); // Always collapse on load

  filterToggleBtn.addEventListener('click', () => {
    const isOpen = filters.classList.toggle('open');
    filterToggleBtn.textContent = isOpen ? 'Hide Filters ▲' : 'Show Filters ▼';
  });
  

  initTabButtons();

  const createEventTabEl = document.getElementById('createEventTab');
  const survey = new Survey.Model(surveySchema);
  survey.onComplete.add(sender => {
    const warningEl = document.getElementById('createEventWarning');
    warningEl.innerHTML = `
      <span style="display:inline-block; width:1em; height:1em; border:2px solid #ccc; border-top:2px solid #333; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:0.5em;"></span>
      Submitting your event…`;
    fetch('/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify(sender.data)
    })
    .then(res => {
      if (res.ok) {
        warningEl.textContent = 'Your event has successfully been submitted.';
      } else {
        warningEl.textContent = 'There was an error submitting your event.';
      }
    })
    .catch(err => {
      warningEl.textContent = 'There was a network error submitting your event.';
      console.error(err);
    });
  });
  survey.completedHtml = `
    <h3>Thank you for submitting your event!</h3>
    <p>We’ll review it and get back to you soon.</p>
    <button id="restartSurveyBtn">Submit Another Event</button>`;
  survey.onValueChanged.add((sender, options) => {
    if (options.name === "begins_on") {
      const endsOnQ = sender.getQuestionByName("ends_on");
      if (endsOnQ && options.value) {
        endsOnQ.min = options.value;
        if (!endsOnQ.value || new Date(endsOnQ.value) < new Date(options.value)) {
          endsOnQ.value = options.value;
        }
      }
    }
  });
  survey.render(createEventTabEl);
  survey.onComplete.add(() => {
    setTimeout(() => {
      const restartBtn = document.getElementById('restartSurveyBtn');
      if (restartBtn) {
        restartBtn.onclick = () => {
          survey.clear();
          survey.currentPageNo = 0;
          survey.render(createEventTabEl);
          document.getElementById('createEventWarning').textContent = '';
        };
      }
    }, 0);
  });

  events = rawEvents;
  renderEventCards(events);
  renderCalendar(events);
  renderMap(events);
  updateFilterOptions(events, events);
  const urlFilters = parseFiltersFromUrl();
  const initialEventPopupId = urlFilters.eventId;
  document.getElementById('textSearch').value = urlFilters.text;
  document.getElementById('startDate').value = urlFilters.start || new Date().toISOString().slice(0,10);
  document.getElementById('endDate').value = urlFilters.end;
  document.getElementById('hideWithLocation').checked = urlFilters.hideLoc;
  Array.from(document.getElementById('townFilter').options).forEach(opt => {
    opt.selected = urlFilters.towns.length === 0
                 ? (opt.value === '')
                 : urlFilters.towns.includes(opt.value);
  });
  Array.from(document.getElementById('categoryFilter').options).forEach(opt => {
    opt.selected = urlFilters.cats.length === 0
                 ? (opt.value === '')
                 : urlFilters.cats.includes(opt.value);
  });

  
  if (initialEventPopupId) {
    const initialPopup = events.find(evt => evt.url === initialEventPopupId);
    const details = {
        title:       initialPopup.title,
        beginsOn:    initialPopup.beginsOn,
        endsOn:      initialPopup.endsOn,
        address:     initialPopup.address,
        linkText:    initialPopup,           // we’ll let getRedirectHTML pick url fields
        description: initialPopup.description,
        category:    initialPopup.category,
        eventId:     initialPopup.url
      };
    openPopupEvent(details);
  }
  
  window.rerenderEvents = () => {
    const filtered = filterEvents(events);
    renderEventCards(filtered);
    renderCalendar(filtered);
    renderMap(filtered);
    updateUrlParams();
  };

  document.getElementById('applyFilters').addEventListener('click', e => {
    e.preventDefault();
    window.rerenderEvents();
  });
  document
    .getElementById('hideWithLocation')
    .addEventListener('input', window.rerenderEvents);

  if (detectMobile()) {
    document.querySelector('[data-tab="cardsTab"]').click();
  } else {
    document.querySelector('[data-tab="calendarTab"]').click();
  }

  if (urlFilters.text || urlFilters.end || urlFilters.towns.length || urlFilters.cats.length) {
    document.getElementById('toggleFilters').click();
    document.getElementById('applyFilters').click();
  }
  
  document.getElementById('sidebarCloseButton').addEventListener('click', closeSidebar);

  const params = new URLSearchParams(window.location.search);
  const initialSection = params.get('sidePanelSection') || 'viewEvents';
  switchSection(initialSection);
})();
