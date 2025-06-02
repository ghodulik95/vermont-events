// /js/render/filters.js
export function parseFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    text:    params.get('text')    || '',
    start:   params.get('start')   || '',
    end:     params.get('end')     || '',
    towns:   params.getAll('town'),
    cats:    params.getAll('cat'),
    hideLoc: params.get('hide') === '1',
    eventId: params.get('eventId') || ''
  };
}

export function updateUrlParams() {
  const params = new URLSearchParams(window.location.search);
  ['text','start','end','town','cat','hide','eventId'].forEach(k => params.delete(k));

  const textSearch = document.getElementById('textSearch');
  const startDate  = document.getElementById('startDate');
  const endDate    = document.getElementById('endDate');
  const townFilter = document.getElementById('townFilter');
  const catFilter  = document.getElementById('categoryFilter');
  const hideWithLocation = document.getElementById('hideWithLocation');
  const popupCardEventIdEl = document.getElementById("popupCardEventId");

  if (textSearch.value)   params.set('text',  textSearch.value);
  if (startDate.value)    params.set('start', startDate.value);
  if (endDate.value)      params.set('end',   endDate.value);

  Array.from(townFilter.selectedOptions)
       .map(o => o.value)
       .filter(v => v)
       .forEach(v => params.append('town', v));

  Array.from(catFilter.selectedOptions)
       .map(o => o.value)
       .filter(v => v)
       .forEach(v => params.append('cat', v));

  if (hideWithLocation.checked) params.set('hide','1');
  if (popupCardEventIdEl.textContent) {
    params.set('eventId', popupCardEventIdEl.textContent);
  }

  history.replaceState(null, '', window.location.pathname + '?' + params.toString());
}

export function updateFilterOptions(events, allEvents) {
  const townFilter = document.getElementById('townFilter');
  const catFilter  = document.getElementById('categoryFilter');

  const prevTowns = Array.from(townFilter.selectedOptions).map(o => o.value);
  const prevCats  = Array.from(catFilter.selectedOptions).map(o => o.value);

  const townCounts = allEvents.reduce((acc, e) => {
    const t = e.address?.locality?.trim();
    if (t) acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  townFilter.innerHTML = '';
  const allTownOpt = document.createElement('option');
  allTownOpt.value = '';
  allTownOpt.textContent = 'All Towns';
  allTownOpt.selected = prevTowns.length === 0 || prevTowns.includes('');
  townFilter.appendChild(allTownOpt);
  Object.keys(townCounts).sort().forEach(town => {
    const opt = document.createElement('option');
    opt.value = town;
    opt.textContent = `${town} (${townCounts[town]})`;
    if (prevTowns.includes(town)) opt.selected = true;
    townFilter.appendChild(opt);
  });

  const catCounts = events.reduce((acc, e) => {
    const c = e.category?.trim();
    if (c) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  catFilter.innerHTML = '';
  const allCatOpt = document.createElement('option');
  allCatOpt.value = '';
  allCatOpt.textContent = 'All Categories';
  allCatOpt.selected = prevCats.length === 0 || prevCats.includes('');
  catFilter.appendChild(allCatOpt);
  Object.keys(catCounts).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${humanizeCategory(cat)} (${catCounts[cat]})`;
    if (prevCats.includes(cat)) opt.selected = true;
    catFilter.appendChild(opt);
  });
}

export function humanizeCategory(cat) {
  return cat
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function filterEvents(events) {
  const text = document.getElementById('textSearch').value.toLowerCase();
  const start = new Date(document.getElementById('startDate').value);
  const end   = new Date(document.getElementById('endDate').value);
  const selectedTowns = Array.from(document.getElementById('townFilter').selectedOptions).map(o => o.value.toLowerCase());
  const selectedCats  = Array.from(document.getElementById('categoryFilter').selectedOptions).map(o => o.value.toLowerCase());
  const filterAllTowns = selectedTowns.includes('');
  const filterAllCats  = selectedCats.includes('');
  const hideLoc = document.getElementById('hideWithLocation').checked;

  const filteredIgnoreCat = events.filter(event => {
    const d = new Date(event.beginsOn);
    const matchText = (
      (event.title?.toLowerCase().includes(text)) ||
      (event.address?.description?.toLowerCase().includes(text)) ||
      (event.address?.locality?.toLowerCase().includes(text)) ||
      ((event.category || '').toLowerCase().includes(text))
    );
    const eventTown = (event.address?.locality || '').toLowerCase();
    const matchTown = filterAllTowns || selectedTowns.includes(eventTown);
    const inDateRange = (!document.getElementById('startDate').value || d >= start) &&
                        (!document.getElementById('endDate').value   || d <= end);
    const matchLocation = !hideLoc || !event.address.geom;
    return matchText && matchTown && inDateRange && matchLocation;
  });

  const filteredIgnoreTown = events.filter(event => {
    const d = new Date(event.beginsOn);
    const matchText = (
      (event.title?.toLowerCase().includes(text)) ||
      (event.address?.description?.toLowerCase().includes(text)) ||
      (event.address?.locality?.toLowerCase().includes(text)) ||
      ((event.category || '').toLowerCase().includes(text))
    );
    const eventCat = (event.category || '').toLowerCase();
    const matchCategory = filterAllCats || selectedCats.includes(eventCat);
    const inDateRange = (!document.getElementById('startDate').value || d >= start) &&
                        (!document.getElementById('endDate').value   || d <= end);
    const matchLocation = !hideLoc || !event.address.geom;
    return matchText && matchCategory && inDateRange && matchLocation;
  });

  const filtered = events.filter(event => {
    const d = new Date(event.beginsOn);
    const matchText = (
      (event.title?.toLowerCase().includes(text)) ||
      (event.address?.description?.toLowerCase().includes(text)) ||
      (event.address?.locality?.toLowerCase().includes(text)) ||
      ((event.category || '').toLowerCase().includes(text))
    );
    const eventTown = (event.address?.locality || '').toLowerCase();
    const matchTown = filterAllTowns || selectedTowns.includes(eventTown);
    const eventCat  = (event.category || '').toLowerCase();
    const matchCategory = filterAllCats || selectedCats.includes(eventCat);
    const inDateRange = (!document.getElementById('startDate').value || d >= start) &&
                        (!document.getElementById('endDate').value   || d <= end);
    const matchLocation = !hideLoc || !event.address.geom;
    return matchText && matchTown && matchCategory && inDateRange && matchLocation;
  });

  updateFilterOptions(filteredIgnoreCat, filteredIgnoreTown);
  return filtered;
}
