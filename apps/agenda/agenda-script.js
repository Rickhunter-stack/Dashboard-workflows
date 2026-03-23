(() => {
  const WEEK_START_HOUR = 8;
  const WEEK_HOURS = 13; // 8h -> 20h

  let currentDate = new Date();
  let currentView = "week";

  const weekContainer = document.getElementById("agenda-week");
  const monthContainer = document.getElementById("agenda-month");
  const currentLabelEl = document.getElementById("agenda-current-label");
  const miniMonthLabelEl = document.getElementById("mini-month-label");
  const miniMonthGridEl = document.getElementById("mini-month-grid");
  const viewSelect = document.getElementById("agenda-view-select");
  const btnPrev = document.getElementById("btn-prev-period");
  const btnNext = document.getElementById("btn-next-period");
  const btnToday = document.getElementById("btn-today");

  function startOfWeek(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // lundi = 0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function startOfMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatMonthLabel(date) {
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }

  function formatWeekLabel(start) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = start.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    const endStr = end.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  }

  function toDayKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function buildEvents(reminders, roadmap) {
    const events = [];

    (reminders || []).forEach((r) => {
      if (!r.dateTime) return;
      const start = new Date(r.dateTime);
      if (Number.isNaN(start.getTime())) return;
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 60);
      events.push({
        type: "reminder",
        title: r.text || "Rappel",
        date: start,
        end,
      });
    });

    if (roadmap && Array.isArray(roadmap.projects)) {
      roadmap.projects.forEach((project) => {
        if (!project || !project.deadline) return;
        const d = new Date(project.deadline);
        if (Number.isNaN(d.getTime())) return;
        const end = new Date(d);
        end.setHours(d.getHours() + 1);
        events.push({
          type: "project",
          title: project.name || "Projet",
          date: d,
          end,
        });
      });
    }

    return events;
  }

  function groupEventsByDay(events) {
    const map = {};
    events.forEach((e) => {
      const key = toDayKey(e.date);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }

  function renderMiniMonth(eventsByDay) {
    if (!miniMonthGridEl || !miniMonthLabelEl) return;
    const ref = startOfMonth(currentDate);
    const month = ref.getMonth();

    miniMonthLabelEl.textContent = formatMonthLabel(ref);
    miniMonthGridEl.innerHTML = "";

    const dayNames = ["L", "M", "M", "J", "V", "S", "D"];
    dayNames.forEach((name) => {
      const el = document.createElement("div");
      el.className = "mini-day-name";
      el.textContent = name;
      miniMonthGridEl.appendChild(el);
    });

    const start = new Date(ref);
    const offset = (start.getDay() + 6) % 7;
    for (let i = 0; i < offset; i += 1) {
      const empty = document.createElement("div");
      miniMonthGridEl.appendChild(empty);
    }

    const todayKey = toDayKey(new Date());

    let d = new Date(ref);
    while (d.getMonth() === month) {
      const key = toDayKey(d);
      const hasEvent = !!eventsByDay[key];

      const el = document.createElement("button");
      el.type = "button";
      el.className = "mini-day";
      if (key === todayKey) el.classList.add("today");
      if (hasEvent) el.classList.add("has-event");
      el.textContent = d.getDate();
      el.addEventListener("click", () => {
        currentDate = new Date(d);
        renderAll(eventsByDay);
      });
      miniMonthGridEl.appendChild(el);

      d.setDate(d.getDate() + 1);
    }
  }

  function renderWeek(events) {
    if (!weekContainer) return;
    const start = startOfWeek(currentDate);
    const eventsByDay = groupEventsByDay(events);

    currentLabelEl.textContent = formatWeekLabel(start);

    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    const headerCols = [
      '<div class="agenda-week-header"><div></div>',
      ...days.map((d) => {
        const name = d.toLocaleDateString("fr-FR", { weekday: "short" });
        const num = d.getDate();
        return `<div class="agenda-week-day-header"><span class="day-name">${name}</span><span class="day-number">${num}</span></div>`;
      }),
      "</div>",
    ].join("");

    const timeCol = [];
    for (let i = 0; i < WEEK_HOURS; i += 1) {
      const h = WEEK_START_HOUR + i;
      const label = `${h.toString().padStart(2, "0")}:00`;
      timeCol.push(
        `<div class="agenda-time-cell">${label}</div>`,
      );
    }

    const body = [
      '<div class="agenda-week-body">',
      `<div class="agenda-time-column">${timeCol.join("")}</div>`,
    ];

    days.forEach((d) => {
      const key = toDayKey(d);
      const dayEvents = (eventsByDay[key] || []).filter(
        (e) => e.date.getHours() >= WEEK_START_HOUR
          && e.date.getHours() < WEEK_START_HOUR + WEEK_HOURS,
      );

      const slots = [];
      for (let i = 0; i < WEEK_HOURS; i += 1) {
        slots.push('<div class="agenda-slot"></div>');
      }

      const colHtml = [`<div class="agenda-day-column">${slots.join("")}`];

      dayEvents.forEach((e) => {
        const startHour = e.date.getHours() + e.date.getMinutes() / 60;
        const endHour = e.end.getHours() + e.end.getMinutes() / 60;
        const top =
          (Math.max(startHour, WEEK_START_HOUR) - WEEK_START_HOUR)
          * (40);
        const height = Math.max((endHour - startHour) * 40, 22);
        const cls = e.type === "project" ? "event-project" : "event-reminder";
        colHtml.push(
          `<div class="agenda-event ${cls}" style="top:${top}px;height:${height}px;">${e.title}</div>`,
        );
      });

      colHtml.push("</div>");
      body.push(colHtml.join(""));
    });

    body.push("</div>");
    weekContainer.innerHTML = headerCols + body.join("");
    weekContainer.hidden = false;
    monthContainer.hidden = true;

    return eventsByDay;
  }

  function renderMonth(events) {
    if (!monthContainer) return;
    const ref = startOfMonth(currentDate);
    const month = ref.getMonth();
    const eventsByDay = groupEventsByDay(events);

    currentLabelEl.textContent = formatMonthLabel(ref);
    monthContainer.innerHTML = "";

    const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    dayNames.forEach((name) => {
      const h = document.createElement("div");
      h.className = "agenda-month-day";
      h.innerHTML = `<div class="agenda-month-day-label"><span>${name}</span></div>`;
      monthContainer.appendChild(h);
    });

    const start = new Date(ref);
    const offset = (start.getDay() + 6) % 7;
    for (let i = 0; i < offset; i += 1) {
      const empty = document.createElement("div");
      empty.className = "agenda-month-day";
      monthContainer.appendChild(empty);
    }

    let d = new Date(ref);
    while (d.getMonth() === month) {
      const key = toDayKey(d);
      const dayEvents = eventsByDay[key] || [];

      const wrapper = document.createElement("div");
      wrapper.className = "agenda-month-day";

      const label = document.createElement("div");
      label.className = "agenda-month-day-label";
      label.innerHTML = `<span class="agenda-month-day-number">${d.getDate()}</span>`;

      const eventsList = document.createElement("div");
      eventsList.className = "agenda-month-events";

      dayEvents.slice(0, 3).forEach((e) => {
        const pill = document.createElement("div");
        pill.className = `agenda-month-pill ${
          e.type === "project" ? "project" : "reminder"
        }`;
        pill.textContent = e.title;
        eventsList.appendChild(pill);
      });

      if (dayEvents.length > 3) {
        const more = document.createElement("div");
        more.className = "agenda-month-pill";
        more.textContent = `+${dayEvents.length - 3} autres`;
        eventsList.appendChild(more);
      }

      wrapper.appendChild(label);
      wrapper.appendChild(eventsList);
      monthContainer.appendChild(wrapper);

      d.setDate(d.getDate() + 1);
    }

    weekContainer.hidden = true;
    monthContainer.hidden = false;

    return eventsByDay;
  }

  function renderAll(eventsByDayOpt) {
    const eventsPromise = (async () => {
      if (eventsByDayOpt) return eventsByDayOpt;
      const [rowsRappels, roadmap] = await Promise.all([
        window.supabaseShared ? window.supabaseShared.fetchRappels() : null,
        window.supabaseShared ? window.supabaseShared.fetchProjectRoadmap() : null,
      ]);
      const reminders =
        rowsRappels && Array.isArray(rowsRappels)
          ? rowsRappels.map((row) => row.payload || row)
          : [];
      const events = buildEvents(reminders, roadmap);
      return groupEventsByDay(events);
    })().catch((err) => {
      console.warn("[Agenda] renderAll failed, fallback to empty", err);
      return {};
    });

    eventsPromise.then((eventsByDay) => {
      const allEvents = [];
      Object.values(eventsByDay).forEach((list) => {
        allEvents.push(...list);
      });

      if (currentView === "week") {
        const grouped = {};
        allEvents.forEach((e) => {
          const key = toDayKey(e.date);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(e);
        });
        const fromWeek = renderWeek(allEvents);
        renderMiniMonth(fromWeek);
      } else {
        const byDay = groupEventsByDay(allEvents);
        renderMonth(allEvents);
        renderMiniMonth(byDay);
      }
    });
  }

  if (viewSelect) {
    viewSelect.addEventListener("change", () => {
      currentView = viewSelect.value === "month" ? "month" : "week";
      renderAll();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() - 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }
      renderAll();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      renderAll();
    });
  }

  if (btnToday) {
    btnToday.addEventListener("click", () => {
      currentDate = new Date();
      renderAll();
    });
  }

  renderAll();
})();

