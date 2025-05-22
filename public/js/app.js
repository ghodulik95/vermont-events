function detectMobile() {
  // 1) Try the modern hint
  if (navigator.userAgentData?.mobile !== undefined) {
    return navigator.userAgentData.mobile;
  }

  // 2) Fall back to pointer check
  if (window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }

  // 3) Finally, fall back to UA regex
  return /Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
}

function getRedirectHTML(rawEvent, truncate = null) {
  const { externalParticipationUrl, onlineAddress, url } = rawEvent;

  const links = [];

  if (isValidUrl(externalParticipationUrl)) {
    links.push(createLink(externalParticipationUrl, truncate));
  }

  if (isValidUrl(onlineAddress)) {
    if (
      !isValidUrl(externalParticipationUrl) ||
      getDomain(onlineAddress) != getDomain(externalParticipationUrl)
    ) {
      links.push(createLink(onlineAddress, truncate));
    }
  }

  if (links.length === 0 && url) {
    // Assume `url` is always valid
    links.push(createLink(url, truncate));
  }

  return links.join(', ');
}

function createLink(linkUrl, truncate) {
  const domain = getDomain(linkUrl);
  const label =
    truncate && domain.length > truncate
      ? domain.slice(0, truncate) + '...'
      : domain;

  return `<a href="${linkUrl}" target="_blank">${label}</a>`;
}

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  } catch (e) {
    return 'Invalid URL';
  }
}

function isValidUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}
function surveyComplete(survey) {
  saveSurveyResults('/create-event', survey.data);
}

async function saveSurveyResults(url, json) {
  const warningEl = document.getElementById('createEventWarning');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify(json),
    });

    if (response.ok) {
      warningEl.textContent = 'Your event has successfully been submitted.';
    } else {
      warningEl.textContent = 'There was an error submitting your event.';

      // Attempt to decode the body
      try {
        const clone = response.clone(); // clone before reading in case .json() fails
        const json = await clone.json();
        console.error("Server responded with error JSON:", json);
      } catch (jsonErr) {
        try {
          const text = await response.text();
          console.error("Server responded with plain text:", text);
        } catch (textErr) {
          console.error("Could not read error response body at all", textErr);
        }
      }
    }
  } catch (networkErr) {
    warningEl.textContent = 'There was a network error submitting your event.';
    console.error("Network or fetch error:", networkErr);
  }
}



(async () => {
  const [config, events, about, createEventSurveyJS] = await Promise.all([
    fetch('/config.json?v=3').then((r) => r.json()),
    fetch('/data/events.json?v=3').then((r) => r.json()),
    fetch('/partials/about-tab.html?v=3').then((r) => r.text()),
    fetch('/data/createEventSurveyJS.json?v=1').then((r) => r.json()),
  ]);
  document.getElementById('aboutTab').outerHTML = about;
  document.title = config.siteTitle;

  // Create the survey
  const createEventTabEl = document.getElementById('createEventTab');
  const survey = new Survey.Model(createEventSurveyJS);
  survey.onComplete.add(surveyComplete);
  // Customize the thank-you message and add a button to restart
  survey.completedHtml = `
  <h3>Thank you for submitting your event!</h3>
  <p>We'll review it and get back to you soon.</p>
  <button id="restartSurveyBtn" style="margin-top:1em;">Submit Another Event</button>
`;

  survey.render(createEventTabEl);

  // Attach handler after survey completes
  survey.onComplete.add(function () {
    setTimeout(() => {
      const restartBtn = document.getElementById('restartSurveyBtn');
      if (restartBtn) {
        restartBtn.onclick = () => {
          survey.clear(); // Clear responses
          survey.currentPageNo = 0; // Go back to first page
          survey.render('createEventTab'); // Re-render

          const warningEl = document.getElementById('createEventWarning');
          warningEl.textContent = '';
        };
      }
    }, 0); // Wait for DOM to update
  });

  function insertText(className, text, prefix = '.') {
    document.querySelectorAll(prefix + className).forEach((el) => {
      el.textContent = text;
    });
  }

  function insertLink(className, link, text) {
    document.querySelectorAll('.' + className).forEach((el) => {
      const l = document.createElement('a');
      l.href = link;
      l.textContent = text;
      l.target = '_blank';
      l.rel = 'noopener noreferrer';
      el.innerHTML = '';
      el.appendChild(l);
    });
  }

  function insertMail(className, email, text) {}

  insertLink(
    'mobilizon-url',
    config.mobilizonUrl,
    config.mobilizonUrl.replace(/^https?:\/\//, '')
  );
  insertText('site-name-text', config.siteTitle);
  insertText('topBanner', config.topBannerText, '#');
  if (config.splashText !== null) {
    insertText('splashText', config.splashText, '#');
  }

  document.getElementById('startDate').value = new Date()
    .toISOString()
    .split('T')[0];

  // Initialize global variables for map and calendar instances
  let map = null;
  let markerCluster = null;
  let calendar = null;
  let calendarInitialized = false;

  // Tab switching logic
  document.querySelectorAll('.tabButton').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tabContent').forEach((tab) => {
        tab.style.display = 'none';
      });
      document.querySelectorAll('.tabButton').forEach((btn) => {
        btn.classList.remove('active');
      });
      const targetId = button.getAttribute('data-tab');
      document.getElementById(targetId).style.display = 'block';
      button.classList.add('active');
      if (targetId === 'calendarTab' && calendar) {
        setTimeout(() => {
          calendar.updateSize();
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
      if (targetId === 'mapTab' && map) {
        setTimeout(() => map.invalidateSize(), 0);
      }
    });
  });

  // Get currently active tab
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

  // Show calendar tab by default
  if (detectMobile()) {
    document.querySelector('[data-tab="cardsTab"]').click();
  } else {
    document.querySelector('[data-tab="calendarTab"]').click();
  }

  // About panel sidebar switching
  document.querySelectorAll('.about-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('.about-link')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document
        .querySelectorAll('.about-panel')
        .forEach((p) => (p.style.display = 'none'));
      document.getElementById(btn.dataset.panel).style.display = 'block';
    });
  });

  function renderEventCards(events, sortOrder = 'asc') {
    const container = document.getElementById('eventCards');
    container.innerHTML = events.length ? '' : '<p>No events found.</p>';

    const sortedEvents = [...events].sort((a, b) => {
      const timeA = new Date(a.beginsOn).getTime();
      const timeB = new Date(b.beginsOn).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    sortedEvents.forEach((event) => {
      const card = document.createElement('div');
      const titleEl = document.createElement('h3');
      titleEl.textContent = event.title;

      const dateEl = document.createElement('p');
      dateEl.innerHTML = `<strong>Date:</strong> ${new Date(
        event.beginsOn
      ).toLocaleString()}`;

      const locEl = document.createElement('p');
      locEl.innerHTML = `<strong>Location:</strong> ${
        event.address?.locality || 'Unknown'
      }`;

      const srcEl = document.createElement('p');
      srcEl.innerHTML = `<strong>More details at:</strong> ${getRedirectHTML(
        event
      )}`;

      card.append(titleEl, dateEl, locEl, srcEl);

      if (
        event.description &&
        !event.description.startsWith('No description')
      ) {
        const descEl = document.createElement('p');
        descEl.classList.add('card-description');
        descEl.innerHTML = `<strong>Description:</strong> ${event.description}`;

        const expandBtn = document.createElement('span');
        expandBtn.classList.add('expand-btn');
        expandBtn.textContent = '+';
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = descEl.classList.toggle('expanded');
          expandBtn.textContent = isExpanded ? '−' : '+';
        });

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.append(descEl, expandBtn);
        card.append(wrapper);
      }
      /*
      card.addEventListener('click', () => {
        const link = getRedirectHTML(event);
        if (link) window.open(link, '_blank');
      });
      */

      container.appendChild(card);
    });
  }

  // Render events as cards, calendar entries, and map markers
  function renderEvents(events) {
    renderEventCards(events);

    // Calendar setup
    const calEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.beginsOn,
      end: event.endsOn !== null ? event.endsOn : undefined,
      extendedProps: {
        username: event.username,
        address: event.address,
        linkText: getRedirectHTML(event, 12),
      },
    }));
    const calendarEl = document.getElementById('calendar');
    let initialDateStr = new Date().toISOString().split('T')[0];
    if (calendarInitialized) {
      initialDateStr = calendar.getDate().toISOString().split('T')[0];
      calendar.destroy();
    }
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: initialDateStr,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      events: calEvents,
      eventClick: function (info) {
        info.jsEvent.preventDefault();
        // Remove any old popover
        document.getElementById('fcPopover')?.remove();

        // Build popover
        const pop = document.createElement('div');
        pop.id = 'fcPopover';
        pop.className = 'fc-popover';
        const startTime = new Date(info.event.start).toLocaleString();
        const endTime = info.event.end
          ? ` – ${new Date(info.event.end).toLocaleString()}`
          : '';
        const addr =
          info.event.extendedProps.address.description ||
          (info.event.extendedProps.address.street || '') +
            ', ' +
            (info.event.extendedProps.address.locality || '');
        pop.innerHTML = `
              <h4>${info.event.title}</h4>
              <p>${startTime}${endTime}</p>
              <p>${addr}</p>
              More details at ${info.event.extendedProps.linkText}
            `;

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
    function updateCalendarIndicators(events) {
      const view = calendar.view;
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
    calendar.setOption('datesSet', function () {
      updateCalendarIndicators(events);
    });
    updateCalendarIndicators(events);
    if (document.getElementById('calendarTab').style.display !== 'none') {
      calendar.render();
      calendarInitialized = true;
    } else {
      const renderOnce = () => {
        calendar.render();
        calendar.updateSize();
        document
          .querySelector('[data-tab="calendarTab"]')
          .removeEventListener('click', renderOnce);
      };
      document
        .querySelector('[data-tab="calendarTab"]')
        .addEventListener('click', renderOnce);
    }

    // Map and marker clusters
    if (!map) {
      map = L.map('map').setView([43.6, -72.97], 8);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
    }
    if (markerCluster) {
      markerCluster.clearLayers();
    } else {
      markerCluster = L.markerClusterGroup();
      map.addLayer(markerCluster);
    }
    events.forEach((event) => {
      if (event.address?.geom) {
        const [lng, lat] = event.address.geom.split(';').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng]);
          const beginsOnStr = new Date(event.beginsOn).toLocaleString();
          const endsOnStr = event.endsOn
            ? ` – ${new Date(event.endsOn).toLocaleString()}`
            : '';

          marker.bindPopup(
            `<strong>${event.title}</strong><br>
             ${beginsOnStr}${endsOnStr}<br>
             More details at ${getRedirectHTML(event)}`
          );
          // no click-handler needed: Leaflet will open the popup on tap

          markerCluster.addLayer(marker);
        }
      }
    });
    map.addLayer(markerCluster);

    // Show count of events without location data
    const noLocCount = events.filter((e) => !e.address.geom).length;
    const mapIndicators = document.getElementById('mapIndicators');
    if (noLocCount > 0) {
      mapIndicators.innerHTML = `${noLocCount} event(s) without location data<br>
            <small>See these in Event Cards tab by selecting Hide events with location data</small>`;
    } else {
      mapIndicators.textContent = '';
    }
  }

  // Format category strings for display
  function humanizeCategory(cat) {
    return cat
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Update filter dropdowns dynamically based on event list
  function updateFilterOptions(catEvents, townEvents) {
    const townFilter = document.getElementById('townFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    const selectedTown = townFilter.value;
    const selectedCategory = categoryFilter.value;

    const townCounts = townEvents.reduce((acc, e) => {
      const t = e.address?.locality?.trim();
      if (t) acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const catCounts = catEvents.reduce((acc, e) => {
      const c = e.category?.trim();
      if (c) acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    townFilter.innerHTML = '';
    const allTownOpt = document.createElement('option');
    allTownOpt.value = '';
    allTownOpt.textContent = 'All Towns';
    townFilter.appendChild(allTownOpt);
    Object.keys(townCounts)
      .sort()
      .forEach((town) => {
        const opt = document.createElement('option');
        opt.value = town;
        opt.textContent = `${town} (${townCounts[town]})`;
        townFilter.appendChild(opt);
      });
    townFilter.value = townCounts[selectedTown] ? selectedTown : '';

    categoryFilter.innerHTML = '';
    const allCatOpt = document.createElement('option');
    allCatOpt.value = '';
    allCatOpt.textContent = 'All Categories';
    categoryFilter.appendChild(allCatOpt);
    Object.keys(catCounts)
      .sort()
      .forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = `${humanizeCategory(cat)} (${catCounts[cat]})`;
        categoryFilter.appendChild(opt);
      });
    categoryFilter.value = catCounts[selectedCategory] ? selectedCategory : '';
  }

  updateFilterOptions(events, events);
  renderEvents(events);

  const textSearch = document.getElementById('textSearch');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const townFilter = document.getElementById('townFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const hideWithLocation = document.getElementById('hideWithLocation');

  function filterEvents() {
    const text = textSearch.value.toLowerCase();
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const town = townFilter.value.toLowerCase();
    const category = categoryFilter.value.toLowerCase();
    const targetId = getActiveTab();
    const doHide = targetId === 'cardsTab' && hideWithLocation.checked;

    const filteredIgnoreCat = events.filter((event) => {
      const d = new Date(event.beginsOn);
      const matchText =
        event.title?.toLowerCase().includes(text) ||
        event.address?.description?.toLowerCase().includes(text) ||
        event.address?.locality?.toLowerCase().includes(text) ||
        (event.category || '').toLowerCase().includes(text);
      const matchTown =
        !town || event.address?.locality?.toLowerCase() === town;
      const inDateRange =
        (!startDate.value || d >= start) && (!endDate.value || d <= end);
      const matchLocation = !doHide || !event.address.geom;

      return matchText && matchTown && inDateRange && matchLocation;
    });

    const filteredIgnoreTown = events.filter((event) => {
      const d = new Date(event.beginsOn);
      const matchText =
        event.title?.toLowerCase().includes(text) ||
        event.address?.description?.toLowerCase().includes(text) ||
        event.address?.locality?.toLowerCase().includes(text) ||
        (event.category || '').toLowerCase().includes(text);
      const matchCategory =
        !category || (event.category || '').toLowerCase() === category;
      const inDateRange =
        (!startDate.value || d >= start) && (!endDate.value || d <= end);
      const matchLocation = !doHide || !event.address.geom;

      return matchText && matchCategory && inDateRange && matchLocation;
    });

    const filtered = events.filter((event) => {
      const d = new Date(event.beginsOn);
      const matchText =
        event.title?.toLowerCase().includes(text) ||
        event.address?.description?.toLowerCase().includes(text) ||
        event.address?.locality?.toLowerCase().includes(text) ||
        (event.category || '').toLowerCase().includes(text);
      const matchTown =
        !town || event.address?.locality?.toLowerCase() === town;
      const matchCategory =
        !category || (event.category || '').toLowerCase() === category;
      const inDateRange =
        (!startDate.value || d >= start) && (!endDate.value || d <= end);
      const matchLocation = !doHide || !event.address.geom;

      return (
        matchText && matchTown && matchCategory && inDateRange && matchLocation
      );
    });

    updateFilterOptions(filteredIgnoreCat, filteredIgnoreTown);
    renderEvents(filtered);
  }

  // Listen to submit filter button
  document.getElementById('applyFilters').addEventListener('click', (e) => {
    e.preventDefault();
    filterEvents();
  });

  // Attach filter listeners
  document
    .getElementById('hideWithLocation')
    .addEventListener('input', filterEvents);

  // Listen to event card sort order
  const sortOrderSelect = document.getElementById('sortOrder');
  sortOrderSelect.addEventListener('change', () => {
    renderEventCards(events, sortOrderSelect.value);
  });

  // Initial render with default sort (upcoming first)
  filterEvents();

  // Remove loader
  const loader = document.getElementById('loader');
  if (loader) loader.remove();
})();
