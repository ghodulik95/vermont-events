// /js/render/mapRenderer.js
import { openPopupEvent } from '../ui/popup.js';

export function renderMap(events) {

  // If a previous map exists, remove it before re‐creating
  if (window._mapInstance) {
    window._mapInstance.remove();
  }

  // Create new Leaflet map centered on VT
  const map = L.map('map').setView([44.0, -72.0], 7);
  window._mapInstance = map;

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Create a marker cluster group
  const markers = L.markerClusterGroup();

  // Loop over each event and add a marker if it has valid geometry
  events.forEach((event) => {
    if (event.address?.geom) {
      const [lng, lat] = event.address.geom.split(';').map(Number);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Create the marker at [lat, lng]
        const marker = L.marker([lat, lng]);

        // Build human‐readable date strings
        const beginsOnStr = event.beginsOn
          ? new Date(event.beginsOn).toLocaleString()
          : '';
        const endsOnStr = event.endsOn
          ? ` – ${new Date(event.endsOn).toLocaleString()}`
          : '';

        // Bind a small Leaflet popup with a “Show more…” link
        marker.bindPopup(
          `<strong>${event.title}</strong><br>
           ${beginsOnStr}${endsOnStr}<br>
           <a href="#" class="show-more-link">Show more…</a>`
        );

        // When that popup opens, attach a click listener to the “Show more…” link
        marker.on('popupopen', (popupEvent) => {
          const popupEl = popupEvent.popup.getElement();
          const btn = popupEl.querySelector('.show-more-link');
          if (!btn) return;

          btn.addEventListener('click', (ev) => {
            ev.preventDefault();

            // Close the Leaflet popup (optional—uncomment if you want it closed)
            // popupEvent.popup._close();

            // Open our fullscreen overlay with all the event details
            openPopupEvent({
              title:       event.title,
              beginsOn:    event.beginsOn,
              endsOn:      event.endsOn,
              address:     event.address,
              linkText:    event,       // again: getRedirectHTML(event) will pick urls
              description: event.description,
              category:    event.category,
              eventId:     event.url
            });
          });
        });

        // Add this marker into the cluster group
        markers.addLayer(marker);
      }
    }
  });

  // Finally, add the entire cluster group to the map
  map.addLayer(markers);
}
