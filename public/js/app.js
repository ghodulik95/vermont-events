(async () => {
  const [config, events] = await Promise.all([
    fetch('/config.json').then(r => r.json()),
    fetch('/data/events.json').then(r => r.json())
  ]);

  document.querySelectorAll(".mobilizon-url").forEach(el => {
    const l = document.createElement("a");
    l.href = config.mobilizonUrl;
    l.textContent = config.mobilizonUrl.replace(/^https?:\/\//, ''); // clean display
    l.target = "_blank";
    l.rel = "noopener noreferrer";
    el.innerHTML = "";
    el.appendChild(l);
  });


  // Site title
  //document.getElementById('site-title').textContent = config.siteTitle
  
  // Initialize global variables for map and calendar instances
      let map = null;
      let markerCluster = null;
      let calendar = null;
      let calendarInitialized = false;
      
      // Tab switching logic
      document.querySelectorAll(".tabButton").forEach(button => {
        button.addEventListener("click", () => {
          document.querySelectorAll(".tabContent").forEach(tab => {
            tab.style.display = "none";
          });
          document.querySelectorAll(".tabButton").forEach(btn => {
            btn.classList.remove("active");
          });
          const targetId = button.getAttribute("data-tab");
          document.getElementById(targetId).style.display = "block";
          button.classList.add("active");
          if (targetId === "calendarTab" && calendar) {
            setTimeout(() => {
              calendar.updateSize();
              window.dispatchEvent(new Event("resize"));
            }, 100);
          }
          if (targetId === "mapTab" && map) {
            setTimeout(() => map.invalidateSize(), 0);
          }
        });
      });
      
      // Get currently active tab
      function getActiveTab() {
        const buttons = document.querySelectorAll(".tabButton");
        for (const button of buttons) {
          if (button.classList.contains("active")) {
            return button.getAttribute("data-tab");
          }
        }
        console.error("No active tab found. This should not happen with expected functioning.");
        return null;
      }
      
      // Show calendar tab by default
      document.querySelector('[data-tab="calendarTab"]').click();
      
      // About panel sidebar switching
      document.querySelectorAll(".about-link").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".about-link").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          document.querySelectorAll(".about-panel").forEach(p => p.style.display = "none");
          document.getElementById(btn.dataset.panel).style.display = "block";
        });
      });
      
      // Populate town and category filters
      function populateFilters(events) {
        const townSet = new Set();
        const categorySet = new Set();
        events.forEach(event => {
          if (event.address?.locality) {
            townSet.add(event.address.locality.trim());
          }
          if (event.category) {
            categorySet.add(event.category.trim());
          }
        });
        const townFilter = document.getElementById("townFilter");
        const categoryFilter = document.getElementById("categoryFilter");
        [...townSet].sort().forEach(town => {
          const opt = document.createElement("option");
          opt.value = town;
          opt.textContent = town;
          townFilter.appendChild(opt);
        });
        [...categorySet].sort().forEach(cat => {
          const opt = document.createElement("option");
          opt.value = cat;
          opt.textContent = cat;
          categoryFilter.appendChild(opt);
        });
      }
      
      // Render events as cards, calendar entries, and map markers
      function renderEvents(events) {
        // Event cards
        const container = document.getElementById("eventCards");
        container.innerHTML = events.length ? "" : "<p>No events found.</p>";
        // create a card for each event with title, date, location, and source domain
        events.forEach(event => {
          const card = document.createElement("div");

          // build title and date
          const titleEl = document.createElement("h3");
          titleEl.textContent = event.title;
          const dateEl = document.createElement("p");
          dateEl.innerHTML = `<strong>Date:</strong> ${new Date(event.beginsOn).toLocaleString()}`;
          // location line
          const locEl = document.createElement("p");
          locEl.innerHTML = `<strong>Location:</strong> ${event.address?.locality || 'Unknown'}`;
          // source domain
          const domain = event.onlineAddress
            ? new URL(event.onlineAddress).hostname
            : 'Unknown source';
          const srcEl = document.createElement("p");
          srcEl.innerHTML = `<strong>Source:</strong> ${domain}`;

          card.append(titleEl, dateEl, locEl, srcEl);

          // only add description if it doesn't start with "No description"
          if (event.description && !event.description.startsWith("No description")) {
            const descEl = document.createElement("p");
            descEl.classList.add("card-description");
            descEl.innerHTML = `<strong>Description:</strong> ${event.description}`;

            const expandBtn = document.createElement("span");
            expandBtn.classList.add("expand-btn");
            expandBtn.textContent = "+";

            // toggle full text on click
            expandBtn.addEventListener("click", e => {
              e.stopPropagation();
              const isExpanded = descEl.classList.toggle("expanded");
              expandBtn.textContent = isExpanded ? "−" : "+";
            });

            // wrapping container so the expand button sits on top
            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.append(descEl, expandBtn);
            card.append(wrapper);
          }

          // open link when clicking the card
          card.addEventListener("click", () => {
            if (event.onlineAddress) window.open(event.onlineAddress, "_blank");
          });

          container.appendChild(card);
        });


      
        // Calendar setup
        const calEvents = events.map(event => ({
          id: event.id,
          title: event.title,
          start: event.beginsOn,
          extendedProps: {
            username: event.username,
            address: event.address,
            url: event.onlineAddress
          }
        }));
        const calendarEl = document.getElementById("calendar");
        let initialDateStr = new Date().toISOString().split("T")[0];
        if (calendarInitialized) {
          initialDateStr = calendar.getDate().toISOString().split("T")[0];
          calendar.destroy();
        }
        calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: "dayGridMonth",
          initialDate: initialDateStr,
          headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          },
          events: calEvents,
          eventClick: function(info) {
            info.jsEvent.preventDefault();
            // Remove any old popover
            document.getElementById("fcPopover")?.remove();

            // Build popover
            const pop = document.createElement("div");
            pop.id = "fcPopover";
            pop.className = "fc-popover";
            const start = new Date(info.event.start).toLocaleString();
            const addr = info.event.extendedProps.address.description ||
                         `${info.event.extendedProps.address.street||""}, ${info.event.extendedProps.address.locality||""}`;
            pop.innerHTML = `
              <h4>${info.event.title}</h4>
              <p>${start}</p>
              <p>${addr}</p>
              <a href="${info.event.extendedProps.url}" target="_blank">View Event</a>
            `;

            // Temporarily position it off-screen so we can measure it
            pop.style.position = "absolute";
            pop.style.top = "-9999px";
            pop.style.left = "-9999px";
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
            pop.style.top  = y + "px";
            pop.style.left = x + "px";

            // Dismiss on next tap anywhere (except inside)
            const remover = (e) => {
              if (!pop.contains(e.target)) {
                pop.remove();
                document.body.removeEventListener("click", remover);
              }
            };
            setTimeout(() => document.body.addEventListener("click", remover), 0);
          },
          eventDidMount: function(info) {
            const { title, start, extendedProps } = info.event;
            const address = extendedProps.address;
            const startTime = new Date(start).toLocaleString();
            const addressStr = address?.description ||
              `${address?.street || ""}, ${address?.locality || ""}, ${address?.region || ""}`;
            // source domain
            const onlineAddress = extendedProps.url;
            const domain = onlineAddress
              ? new URL(onlineAddress).hostname
              : 'Unknown source';
            info.el.setAttribute("title", `${title}\n${startTime}\n${addressStr}\n${domain}`);
          }
        });
      
        // Update indicators for events outside current view
        function updateCalendarIndicators(events) {
          const view = calendar.view;
          const rangeStart = new Date(view.activeStart);
          const rangeEnd = new Date(view.activeEnd);
          const priorCount = events.filter(e => new Date(e.beginsOn) < rangeStart).length;
          const futureCount = events.filter(e => new Date(e.beginsOn) > rangeEnd).length;
          const parts = [];
          if (priorCount > 0) parts.push(`${priorCount} prior event(s) not shown`);
          if (futureCount > 0) parts.push(`${futureCount} future event(s) not shown`);
          document.getElementById("calendarIndicators").textContent = parts.join(", ");
        }
        calendar.setOption("datesSet", function() {
          updateCalendarIndicators(events);
        });
        updateCalendarIndicators(events);
        if (document.getElementById("calendarTab").style.display !== "none") {
          calendar.render();
          calendarInitialized = true;
        } else {
          const renderOnce = () => {
            calendar.render();
            calendar.updateSize();
            document.querySelector('[data-tab="calendarTab"]').removeEventListener("click", renderOnce);
          };
          document.querySelector('[data-tab="calendarTab"]').addEventListener("click", renderOnce);
        }
      
        // Map and marker clusters
        if (!map) {
          map = L.map("map").setView([43.6, -72.97], 8);
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
        }
        if (markerCluster) {
          markerCluster.clearLayers();
        } else {
          markerCluster = L.markerClusterGroup();
          map.addLayer(markerCluster);
        }
        events.forEach(event => {
          if (event.address?.geom) {
            const [lng, lat] = event.address.geom.split(";").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = L.marker([lat, lng]);
              const domain = event.onlineAddress
                ? new URL(event.onlineAddress).hostname
                : 'Unknown source';
              marker.bindPopup(
                `<strong>${event.title}</strong><br>
                 ${new Date(event.beginsOn).toLocaleString()}<br>
                 <a href="${event.onlineAddress}" target="_blank">View Event</a>`
              );
              // no click-handler needed: Leaflet will open the popup on tap

              markerCluster.addLayer(marker);
            }
          }
        });
        map.addLayer(markerCluster);
      
        // Show count of events without location data
        const noLocCount = events.filter(e => !e.address.geom).length;
        const mapIndicators = document.getElementById("mapIndicators");
        if (noLocCount > 0) {
          mapIndicators.innerHTML = `${noLocCount} event(s) without location data<br>
            <small>See these in Event Cards tab by selecting Hide events with location data</small>`;
        } else {
          mapIndicators.textContent = "";
        }
      }
      
     
      // Format category strings for display
      function humanizeCategory(cat) {
        return cat
          .toLowerCase()
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
      
      // Update filter dropdowns dynamically based on event list
      function updateFilterOptions(catEvents, townEvents) {
        const townFilter = document.getElementById("townFilter");
        const categoryFilter = document.getElementById("categoryFilter");
      
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
      
        townFilter.innerHTML = "";
        const allTownOpt = document.createElement("option");
        allTownOpt.value = "";
        allTownOpt.textContent = "All Towns";
        townFilter.appendChild(allTownOpt);
        Object.keys(townCounts).sort().forEach(town => {
          const opt = document.createElement("option");
          opt.value = town;
          opt.textContent = `${town} (${townCounts[town]})`;
          townFilter.appendChild(opt);
        });
        townFilter.value = townCounts[selectedTown] ? selectedTown : "";
      
        categoryFilter.innerHTML = "";
        const allCatOpt = document.createElement("option");
        allCatOpt.value = "";
        allCatOpt.textContent = "All Categories";
        categoryFilter.appendChild(allCatOpt);
        Object.keys(catCounts).sort().forEach(cat => {
          const opt = document.createElement("option");
          opt.value = cat;
          opt.textContent = `${humanizeCategory(cat)} (${catCounts[cat]})`;
          categoryFilter.appendChild(opt);
        });
        categoryFilter.value = catCounts[selectedCategory] ? selectedCategory : "";
      }
      
          updateFilterOptions(events, events);
          renderEvents(events);
      
          const textSearch = document.getElementById("textSearch");
          const startDate = document.getElementById("startDate");
          const endDate = document.getElementById("endDate");
          const townFilter = document.getElementById("townFilter");
          const categoryFilter = document.getElementById("categoryFilter");
          const hideWithLocation = document.getElementById("hideWithLocation");
      
          function filterEvents() {
            const text = textSearch.value.toLowerCase();
            const start = new Date(startDate.value);
            const end = new Date(endDate.value);
            const town = townFilter.value.toLowerCase();
            const category = categoryFilter.value.toLowerCase();
            const targetId = getActiveTab();
            const doHide = targetId === "cardsTab" && hideWithLocation.checked;
            
            const filteredIgnoreCat = events.filter(event => {
              const hasLink = event.onlineAddress?.length > 0;
              const d = new Date(event.beginsOn);
              const matchText =
                event.title?.toLowerCase().includes(text) ||
                event.address?.description?.toLowerCase().includes(text) ||
                event.address?.locality?.toLowerCase().includes(text) ||
                (event.category || "").toLowerCase().includes(text);
              const matchTown = !town || event.address?.locality?.toLowerCase() === town;
              const inDateRange = (!startDate.value || d >= start) && (!endDate.value || d <= end);
              const matchLocation = !doHide || !event.address.geom;
      
              return hasLink && matchText && matchTown && inDateRange && matchLocation;
            });
            
            const filteredIgnoreTown = events.filter(event => {
              const hasLink = event.onlineAddress?.length > 0;
              const d = new Date(event.beginsOn);
              const matchText =
                event.title?.toLowerCase().includes(text) ||
                event.address?.description?.toLowerCase().includes(text) ||
                event.address?.locality?.toLowerCase().includes(text) ||
                (event.category || "").toLowerCase().includes(text);
              const matchCategory = !category || (event.category || "").toLowerCase() === category;
              const inDateRange = (!startDate.value || d >= start) && (!endDate.value || d <= end);
              const matchLocation = !doHide || !event.address.geom;
      
              return hasLink && matchText && matchCategory && inDateRange && matchLocation;
            });
      
            const filtered = events.filter(event => {
              const hasLink = event.onlineAddress?.length > 0;
              const d = new Date(event.beginsOn);
              const matchText =
                event.title?.toLowerCase().includes(text) ||
                event.address?.description?.toLowerCase().includes(text) ||
                event.address?.locality?.toLowerCase().includes(text) ||
                (event.category || "").toLowerCase().includes(text);
              const matchTown = !town || event.address?.locality?.toLowerCase() === town;
              const matchCategory = !category || (event.category || "").toLowerCase() === category;
              const inDateRange = (!startDate.value || d >= start) && (!endDate.value || d <= end);
              const matchLocation = !doHide || !event.address.geom;
      
              return hasLink && matchText && matchTown && matchCategory && inDateRange && matchLocation;
            });

            updateFilterOptions(filteredIgnoreCat, filteredIgnoreTown);
            renderEvents(filtered);
          }
      
          // Attach filter listeners
          [textSearch, startDate, endDate, townFilter, categoryFilter, hideWithLocation]
            .forEach(el => el.addEventListener("input", filterEvents));
          document.querySelectorAll(".tabButton").forEach(button => {
            button.addEventListener("click", filterEvents);
          });
})();