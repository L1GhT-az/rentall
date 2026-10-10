const configs = {
  properties: {
    title: "Недвижимость",
    columns: [
      ["title", "Название"],
      ["address", "Адрес"],
      ["type", "Тип"],
      ["area", "Площадь"],
      ["price", "Цена"],
      ["status", "Статус"],
      ["date", "Дата"]
    ]
  },
  tenants: {
    title: "Арендаторы",
    columns: [
      ["title", "ФИО"],
      ["email", "Email"],
      ["phone", "Телефон"],
      ["property", "Объект"],
      ["status", "Статус"],
      ["date", "Дата"]
    ]
  },
  payments: {
    title: "Платежи",
    columns: [
      ["title", "Арендатор"],
      ["property", "Объект"],
      ["amount", "Сумма"],
      ["status", "Статус"],
      ["date", "Дата"]
    ]
  },
  maintenanceRequests: {
    title: "Заявки на обслуживание",
    columns: [
      ["title", "Заявка"],
      ["property", "Объект"],
      ["description", "Описание"],
      ["priority", "Приоритет"],
      ["status", "Статус"],
      ["date", "Дата"]
    ]
  }
};

const statusTypes = {
  "Сдан": "success",
  "Активен": "success",
  "Оплачен": "success",
  "Завершена": "success",
  "Свободен": "info",
  "Ожидает": "warning",
  "Ожидает заселения": "warning",
  "В работе": "warning",
  "Новая": "info",
  "На обслуживании": "warning",
  "Просрочен": "danger",
  "Неактивен": "neutral",
  "Высокий": "danger",
  "Средний": "warning",
  "Низкий": "success"
};

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);

  if (className) node.className = className;
  if (text !== "") node.textContent = text;

  return node;
}

function formatValue(field, value) {
  if (value === undefined || value === null || value === "") return "—";

  if (["price", "amount"].includes(field)) {
    return `${Number(value).toLocaleString("ru-RU")} ₽`;
  }

  if (field === "area") return `${value} м²`;

  if (field === "date") {
    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("ru-RU");
  }

  return String(value);
}

function createBadge(value) {
  const type = statusTypes[value] || "neutral";
  return element("span", `badge badge-${type}`, value || "—");
}

function createAction(action, id, text) {
  const button = element("button", "button button--secondary button--small", text);

  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = String(id);

  return button;
}

function createCell(record, field) {
  const cell = document.createElement("td");

  if (field === "status" || field === "priority") {
    cell.append(createBadge(record[field]));
  } else {
    cell.textContent = formatValue(field, record[field]);
  }

  return cell;
}

function createCard(record, config) {
  const card = element("article", "record-card");
  const header = element("div", "record-card-header");
  const heading = element("h3", "", record.title || `Запись №${record.id}`);

  header.append(heading);

  if (record.status) header.append(createBadge(record.status));
  else if (record.priority) header.append(createBadge(record.priority));

  card.append(header);

  config.columns.forEach(([field, label]) => {
    if (["title", "status", "priority"].includes(field)) return;

    const paragraph = element(
      "p",
      "",
      `${label}: ${formatValue(field, record[field])}`
    );

    card.append(paragraph);
  });

  const actions = element("div", "record-card-actions");

  actions.append(
    createAction("edit", record.id, "Изменить"),
    createAction("delete", record.id, "Удалить")
  );

  card.append(actions);

  return card;
}

export function renderRecords(records, entity, view = "table") {
  const config = configs[entity];

  if (!config) return;

  const head = document.querySelector("#table-head-row");
  const body = document.querySelector("#table-body");
  const table = document.querySelector("#table-wrapper");
  const grid = document.querySelector("#records-grid");
  const title = document.querySelector("#data-title");
  const empty = document.querySelector("#empty-state");

  if (!head || !body || !table || !grid) return;

  if (title) {
    title.replaceChildren(
      document.createTextNode(config.title + " "),
      element("span", "records-count", String(records.length))
    );
  }

  head.replaceChildren();
  body.replaceChildren();
  grid.replaceChildren();

  config.columns.forEach(([, label]) => {
    head.append(element("th", "", label));
  });

  head.append(element("th", "", "Действия"));

  records.forEach(record => {
    const row = document.createElement("tr");

    config.columns.forEach(([field]) => {
      row.append(createCell(record, field));
    });

    const actions = document.createElement("td");

    actions.append(
      createAction("edit", record.id, "Изменить"),
      createAction("delete", record.id, "Удалить")
    );

    row.append(actions);
    body.append(row);
    grid.append(createCard(record, config));
  });

  table.hidden = view !== "table" || records.length === 0;
  grid.hidden = view !== "cards" || records.length === 0;

  if (empty) {
    empty.hidden = records.length > 0;
  }
}

export function renderStats(data) {
  const properties = data.properties || [];
  const tenants = data.tenants || [];
  const payments = data.payments || [];
  const requests = data.maintenanceRequests || [];

  const activeTenants = tenants.filter(
    item => item.status === "Активен"
  ).length;

  const income = payments
    .filter(item => item.status === "Оплачен")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const openRequests = requests.filter(
    item => item.status !== "Завершена"
  ).length;

  const values = {
    "#stat-properties": properties.length,
    "#stat-tenants": activeTenants,
    "#stat-income": `${income.toLocaleString("ru-RU")} ₽`,
    "#stat-requests": openRequests,
    "#requests-count": openRequests
  };

  Object.entries(values).forEach(([selector, value]) => {
    const node = document.querySelector(selector);

    if (node) node.textContent = String(value);
  });

  return { activeTenants, income, openRequests };
}

export function renderRecentLists(data) {
  renderActivityList(
    "#recent-requests",
    [...(data.maintenanceRequests || [])]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 4),
    record => [
      record.title,
      record.property,
      record.status,
      record.priority,
      record.date
    ]
  );

  renderActivityList(
    "#upcoming-payments",
    [...(data.payments || [])]
      .filter(record => record.status !== "Оплачен")
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 4),
    record => [
      record.title,
      record.property,
      formatValue("amount", record.amount),
      record.status,
      record.date
    ]
  );
}

function renderActivityList(selector, records, getDetails) {
  const container = document.querySelector(selector);

  if (!container) return;

  container.replaceChildren();

  if (!records.length) {
    container.append(element("p", "", "Нет записей"));
    return;
  }

  records.forEach(record => {
    const item = element("article", "activity-item");

    item.append(
      element("h3", "activity-title", record.title || "Без названия")
    );

    getDetails(record).filter(Boolean).forEach((value, index) => {
      item.append(element("p", "activity-detail", String(value)));
    });

    container.append(item);
  });
}

export function getEntityConfig(entity) {
  return configs[entity] || null;
}