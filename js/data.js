export const initialData = {
  properties: [
    {
      id: 1,
      title: "ЖК Центральный",
      address: "Москва, ул. Тверская, 12",
      type: "Квартира",
      area: 65,
      price: 85000,
      status: "Сдан",
      date: "2026-09-15"
    },
    {
      id: 2,
      title: "Студия у парка",
      address: "Москва, ул. Лесная, 8",
      type: "Студия",
      area: 32,
      price: 45000,
      status: "Свободен",
      date: "2026-09-20"
    },
    {
      id: 3,
      title: "Офис бизнес-класса",
      address: "Москва, Пресненская наб., 10",
      type: "Коммерческая",
      area: 110,
      price: 180000,
      status: "Сдан",
      date: "2026-08-28"
    },
    {
      id: 4,
      title: "Двухкомнатная квартира",
      address: "Москва, ул. Профсоюзная, 45",
      type: "Квартира",
      area: 54,
      price: 65000,
      status: "На обслуживании",
      date: "2026-09-25"
    },
    {
      id: 5,
      title: "Загородный дом",
      address: "Московская область, Одинцово",
      type: "Дом",
      area: 140,
      price: 120000,
      status: "Свободен",
      date: "2026-09-30"
    }
  ],

  tenants: [
    {
      id: 1,
      title: "Александр Иванов",
      email: "ivanov@example.com",
      phone: "+7 900 111-22-33",
      property: "ЖК Центральный",
      status: "Активен",
      date: "2026-09-15"
    },
    {
      id: 2,
      title: "Мария Смирнова",
      email: "smirnova@example.com",
      phone: "+7 900 222-33-44",
      property: "Офис бизнес-класса",
      status: "Активен",
      date: "2026-08-28"
    },
    {
      id: 3,
      title: "Дмитрий Козлов",
      email: "kozlov@example.com",
      phone: "+7 900 333-44-55",
      property: "Двухкомнатная квартира",
      status: "Ожидает заселения",
      date: "2026-09-25"
    },
    {
      id: 4,
      title: "Анна Петрова",
      email: "petrova@example.com",
      phone: "+7 900 444-55-66",
      property: "Студия у парка",
      status: "Неактивен",
      date: "2026-07-10"
    }
  ],

  payments: [
    {
      id: 1,
      title: "Александр Иванов",
      property: "ЖК Центральный",
      amount: 85000,
      status: "Оплачен",
      date: "2026-10-05"
    },
    {
      id: 2,
      title: "Мария Смирнова",
      property: "Офис бизнес-класса",
      amount: 180000,
      status: "Оплачен",
      date: "2026-10-03"
    },
    {
      id: 3,
      title: "Дмитрий Козлов",
      property: "Двухкомнатная квартира",
      amount: 65000,
      status: "Ожидает",
      date: "2026-10-12"
    },
    {
      id: 4,
      title: "Александр Иванов",
      property: "ЖК Центральный",
      amount: 85000,
      status: "Просрочен",
      date: "2026-09-05"
    }
  ],

  maintenanceRequests: [
    {
      id: 1,
      title: "Протечка крана",
      property: "ЖК Центральный",
      description: "Необходимо проверить кран на кухне",
      priority: "Высокий",
      status: "В работе",
      date: "2026-10-08"
    },
    {
      id: 2,
      title: "Замена ламп",
      property: "Офис бизнес-класса",
      description: "Перегорели лампы в коридоре",
      priority: "Низкий",
      status: "Новая",
      date: "2026-10-07"
    },
    {
      id: 3,
      title: "Ремонт стиральной машины",
      property: "Двухкомнатная квартира",
      description: "Машина не сливает воду",
      priority: "Высокий",
      status: "В работе",
      date: "2026-10-06"
    },
    {
      id: 4,
      title: "Проверка отопления",
      property: "Загородный дом",
      description: "Требуется плановая проверка системы",
      priority: "Средний",
      status: "Завершена",
      date: "2026-10-01"
    }
  ]
};
