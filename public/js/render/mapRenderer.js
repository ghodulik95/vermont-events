// /js/render/mapRenderer.js
export function renderMap(events) {
  console.log("Initializing map…", document.getElementById('map').clientHeight)
  if (window._mapInstance) {
    window._mapInstance.remove();
  }
  const map = L.map('map').setView([44.0, -72.0], 7);
  window._mapInstance = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  const markers = L.markerClusterGroup();
  events.forEach(e => {
    if (e.address?.geom) {
      const [lng, lat] = e.address.geom.split(';').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng]);
        marker.bindPopup(`<b>${e.title}</b><br>${e.address.locality}`);
        markers.addLayer(marker);
      }
    }
  });
  map.addLayer(markers);
}
