import { initialData } from "./data.js";
import {
  renderRecords,
  renderStats,
  renderRecentLists,
  getEntityConfig
} from "./renderer.js";

const STORAGE_KEY = "rentflow-data";
const PAGE_SIZE = 8;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let data;
let entity = "properties";
let page = 1;
let view = "table";
let editingId = null;
let filteredRecords = [];

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          ...structuredClone(initialData),
          ...parsed
        };
      }
    }
  } catch {}

  return structuredClone(initialData);
}

data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showToast(message, type = "success") {
  const container = $("#toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.append(toast);

  setTimeout(() => toast.remove(), 3000);
}

function setTheme(theme) {
  if (!["light", "dark", "corporate"].includes(theme)) return;

  document.documentElement.dataset.theme = theme;
  localStorage.setItem("rentflow-theme", theme);

  if ($("#theme-select")) $("#theme-select").value = theme;
}

function setAccent(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;

  document.documentElement.style.setProperty("--primary", color);
  document.documentElement.style.setProperty("--accent", color);
  localStorage.setItem("rentflow-accent", color);

  if ($("#accent-picker")) $("#accent-picker").value = color;
}

function refreshDashboard() {
  renderStats(data);
  renderRecentLists(data);
}

function refresh() {
  saveData();
  refreshDashboard();
  applyFilters();
}

function applyFilters() {
  const search = ($("#record-search")?.value || "").trim().toLowerCase();
  const status = $("#status-filter")?.value || "";
  const sort = $("#sort-select")?.value || "date-desc";

  const priorities = $$('input[name="priority"]:checked')
    .map(input => input.value);

  filteredRecords = data[entity].filter(record => {
    const matchesSearch = Object.values(record)
      .join(" ")
      .toLowerCase()
      .includes(search);

    const matchesStatus = !status || record.status === status;

    const matchesPriority =
      entity !== "maintenanceRequests" ||
      priorities.length === 0 ||
      priorities.includes(record.priority);

    return matchesSearch && matchesStatus && matchesPriority;
  });

  filteredRecords.sort((a, b) => {
    if (sort === "date-asc") {
      return String(a.date || "").localeCompare(String(b.date || ""));
    }

    if (sort === "date-desc") {
      return String(b.date || "").localeCompare(String(a.date || ""));
    }

    if (sort === "title-asc") {
      return String(a.title || "").localeCompare(String(b.title || ""), "ru");
    }

    if (sort === "title-desc") {
      return String(b.title || "").localeCompare(String(a.title || ""), "ru");
    }

    return 0;
  });

  page = Math.min(
    page,
    Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  );

  renderCurrentPage();
}

function renderCurrentPage() {
  const start = (page - 1) * PAGE_SIZE;
  const records = filteredRecords.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / PAGE_SIZE)
  );

  const loading = $("#loading-state");
  const empty = $("#empty-state");
  const table = $("#table-wrapper");
  const grid = $("#records-grid");

  if (loading) loading.hidden = true;

  if (empty) empty.hidden = filteredRecords.length > 0;

  if (table) table.hidden = view !== "table" || records.length === 0;

  if (grid) grid.hidden = view !== "cards" || records.length === 0;

  renderRecords(records, entity, view);

  if (loading) loading.hidden = true;

  if (empty) empty.hidden = filteredRecords.length > 0;

  if ($("#pagination-summary")) {
    $("#pagination-summary").textContent = filteredRecords.length
      ? `${start + 1}–${Math.min(start + PAGE_SIZE, filteredRecords.length)} из ${filteredRecords.length}`
      : "Нет записей";
  }

  if ($("#page-indicator")) {
    $("#page-indicator").textContent = `${page} / ${totalPages}`;
  }

  if ($("#previous-page")) {
    $("#previous-page").disabled = page <= 1;
  }

  if ($("#next-page")) {
    $("#next-page").disabled = page >= totalPages;
  }

  const activeTab = $(`.tab-button[data-entity="${entity}"]`);

  if (activeTab && $("#data-panel")) {
    $("#data-panel").setAttribute("aria-labelledby", activeTab.id);
  }
}


function switchEntity(nextEntity) {
  if (!data[nextEntity] || !getEntityConfig(nextEntity)) return;

  entity = nextEntity;
  page = 1;

  $$(".tab-button").forEach(tab => {
    const active = tab.dataset.entity === entity;

    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  const statusFilter = $("#status-filter");

  if (statusFilter) {
    statusFilter.replaceChildren(new Option("Все статусы", ""));

    [...new Set(data[entity].map(record => record.status).filter(Boolean))]
      .forEach(status => {
        statusFilter.add(new Option(status, status));
      });
  }

  $$(".priority-filter input[name='priority']").forEach(input => {
    input.checked = true;
  });

  const priorityFilter = $(".priority-filter");

  if (priorityFilter) {
    priorityFilter.hidden = entity !== "maintenanceRequests";
  }

  if ($("#record-search")) $("#record-search").value = "";
  if ($("#global-search-input")) $("#global-search-input").value = "";

  applyFilters();
}

function openModal(record = null) {
  const modal = $("#record-modal");
  const form = $("#record-form");
  const body = $("#modal-body");

  if (!modal || !form || !body) return;

  editingId = record ? record.id : null;
  body.replaceChildren();

  const fields = {
    properties: [
      ["title", "Название", "text"],
      ["address", "Адрес", "text"],
      ["type", "Тип объекта", "text"],
      ["area", "Площадь, м²", "number"],
      ["price", "Цена аренды, ₽", "number"],
      ["status", "Статус", "select"],
      ["date", "Дата", "date"]
    ],
    tenants: [
      ["title", "ФИО", "text"],
      ["email", "Email", "email"],
      ["phone", "Телефон", "tel"],
      ["property", "Объект", "text"],
      ["status", "Статус", "select"],
      ["date", "Дата", "date"]
    ],
    payments: [
      ["title", "Арендатор", "text"],
      ["property", "Объект", "text"],
      ["amount", "Сумма, ₽", "number"],
      ["status", "Статус", "select"],
      ["date", "Дата", "date"]
    ],
    maintenanceRequests: [
      ["title", "Название заявки", "text"],
      ["property", "Объект", "text"],
      ["description", "Описание", "textarea"],
      ["priority", "Приоритет", "select"],
      ["status", "Статус", "select"],
      ["date", "Дата", "date"]
    ]
  };

  const options = {
    properties: {
      status: ["Свободен", "Сдан", "На обслуживании"]
    },
    tenants: {
      status: ["Активен", "Неактивен", "Ожидает заселения"]
    },
    payments: {
      status: ["Ожидает", "Оплачен", "Просрочен"]
    },
    maintenanceRequests: {
      priority: ["Низкий", "Средний", "Высокий"],
      status: ["Новая", "В работе", "Завершена"]
    }
  };

  fields[entity].forEach(([name, title, type]) => {
    const label = document.createElement("label");
    label.append(document.createTextNode(title));

    let input;

    if (type === "select") {
      input = document.createElement("select");

      options[entity][name].forEach(value => {
        input.add(new Option(value, value));
      });
    } else if (type === "textarea") {
      input = document.createElement("textarea");
    } else {
      input = document.createElement("input");
      input.type = type;
    }

    input.name = name;
    input.required = true;

    if (record && record[name] !== undefined) {
      input.value = record[name];
    } else if (type === "date") {
      input.value = new Date().toISOString().slice(0, 10);
    }

    if (type === "number") input.min = "0";

    label.append(input);
    body.append(label);
  });

  $("#modal-title").textContent = record
    ? "Редактировать запись"
    : "Новая запись";

  modal.showModal();
}

function closeModal() {
  $("#record-modal")?.close();
  editingId = null;
}

function saveRecord(event) {
  event.preventDefault();

  const form = $("#record-form");

  if (!form.reportValidity()) return;

  const record = Object.fromEntries(new FormData(form).entries());

  $$("#modal-body input[type='number']").forEach(input => {
    record[input.name] = Number(input.value);
  });

  const records = data[entity];

  if (editingId !== null) {
    const index = records.findIndex(item => item.id === editingId);

    if (index !== -1) {
      records[index] = {
        ...records[index],
        ...record,
        id: editingId
      };
    }

    showToast("Запись обновлена");
  } else {
    const id = Math.max(0, ...records.map(item => Number(item.id) || 0)) + 1;

    records.unshift({ ...record, id });
    showToast("Запись добавлена");
  }

  closeModal();
  refresh();
}

function handleRecordAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const record = data[entity].find(item => item.id === id);

  if (!record) return;

  if (button.dataset.action === "edit") {
    openModal(record);
  }

  if (button.dataset.action === "delete") {
    if (!confirm("Удалить эту запись?")) return;

    data[entity] = data[entity].filter(item => item.id !== id);

    showToast("Запись удалена");
    refresh();
  }
}

function exportData() {
  if (!filteredRecords.length) {
    showToast("Нет данных для экспорта", "warning");
    return;
  }

  const headers = [...new Set(
    filteredRecords.flatMap(record => Object.keys(record))
  )];

  const escapeCSV = value =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  const csv = [
    headers.map(escapeCSV).join(";"),
    ...filteredRecords.map(record =>
      headers.map(key => escapeCSV(record[key])).join(";")
    )
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `rentflow-${entity}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  showToast("Экспорт завершён");
}

function setupNavigation() {
  const sidebar = $("#sidebar");
  const overlay = $("#sidebar-overlay");
  const menuButton = $("#menu-toggle");

  function closeSidebar() {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("visible");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  menuButton?.addEventListener("click", () => {
    const open = !sidebar.classList.contains("open");

    sidebar.classList.toggle("open", open);
    overlay?.classList.toggle("visible", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });

  overlay?.addEventListener("click", closeSidebar);

  $$(".navigation-link").forEach(link => {
    link.addEventListener("click", event => {
      const target = link.getAttribute("href");
      const section = target ? $(target) : null;

      if (!section) return;

      event.preventDefault();

      $$(".navigation-link").forEach(item => {
        item.classList.remove("is-active");
        item.removeAttribute("aria-current");
      });

      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");

      section.scrollIntoView({ behavior: "smooth", block: "start" });
      closeSidebar();
    });
  });
}

function setupEvents() {
  $$(".tab-button").forEach(tab => {
    tab.addEventListener("click", () => {
      switchEntity(tab.dataset.entity);
    });
  });

  $("#filters-form")?.addEventListener("submit", event => {
    event.preventDefault();
    page = 1;
    applyFilters();
  });

  $("#record-search")?.addEventListener("input", () => {
    page = 1;
    applyFilters();
  });

  $("#status-filter")?.addEventListener("change", () => {
    page = 1;
    applyFilters();
  });

  $("#sort-select")?.addEventListener("change", () => {
    page = 1;
    applyFilters();
  });

  $$('input[name="priority"]').forEach(input => {
    input.addEventListener("change", () => {
      page = 1;
      applyFilters();
    });
  });

  $$('input[name="view"]').forEach(input => {
    input.addEventListener("change", () => {
      view = input.value;
      renderCurrentPage();
    });
  });

  $("#reset-filters")?.addEventListener("click", () => {
    $("#record-search").value = "";
    $("#status-filter").value = "";
    $("#sort-select").value = "date-desc";

    $$('input[name="priority"]').forEach(input => {
      input.checked = true;
    });

    $$('input[name="view"]').forEach(input => {
      input.checked = input.value === "table";
    });

    view = "table";
    page = 1;
    applyFilters();
  });

  $("#previous-page")?.addEventListener("click", () => {
    if (page > 1) {
      page--;
      renderCurrentPage();
    }
  });

  $("#next-page")?.addEventListener("click", () => {
    if (page < Math.ceil(filteredRecords.length / PAGE_SIZE)) {
      page++;
      renderCurrentPage();
    }
  });

  $("#create-record-button")?.addEventListener("click", () => openModal());
  $("#add-record-button")?.addEventListener("click", () => openModal());

  $("#modal-close")?.addEventListener("click", closeModal);
  $("#modal-cancel")?.addEventListener("click", closeModal);
  $("#record-form")?.addEventListener("submit", saveRecord);

  $("#table-body")?.addEventListener("click", handleRecordAction);
  $("#records-grid")?.addEventListener("click", handleRecordAction);
  $("#export-button")?.addEventListener("click", exportData);

  $("#theme-select")?.addEventListener("change", event => {
    setTheme(event.target.value);
  });

  $("#accent-picker")?.addEventListener("input", event => {
    setAccent(event.target.value);
  });

  $("#global-search")?.addEventListener("submit", event => {
    event.preventDefault();
  });

  $("#global-search-input")?.addEventListener("input", event => {
    $("#record-search").value = event.target.value;
    page = 1;
    applyFilters();
  });

  $("#help-trigger")?.addEventListener("click", () => {
    const content = $("#help-content");
    if (!content) return;

    content.hidden = !content.hidden;
    $("#help-trigger").setAttribute(
      "aria-expanded",
      String(!content.hidden)
    );
  });

  $("#profile-button")?.addEventListener("click", () => {
    showToast("Вы вошли как администратор");
  });

  $("#notifications-button")?.addEventListener("click", () => {
    const count = data.maintenanceRequests.filter(
      item => item.status !== "Завершена"
    ).length;

    showToast(`Открытых заявок: ${count}`, "warning");
  });
}

function init() {
  setTheme(localStorage.getItem("rentflow-theme") || "light");

  const accent = localStorage.getItem("rentflow-accent");

  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
    setAccent(accent);
  }

  setupNavigation();
  setupEvents();
  refreshDashboard();
  switchEntity("properties");
}

init();