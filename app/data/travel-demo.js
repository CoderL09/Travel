export const initialTrip = {
  destination: '东京，日本',
  startDate: '2026-11-10',
  endDate: '2026-11-14',
  travelers: 2,
  budget: 10000,
  preferences: ['美食', '购物', '文化'],
  image: '/images/4.jpg'
};

export const initialDays = [
  {
    title: '初识东京 · 传统与现代',
    activities: [
      {
        id: 'a1',
        period: '上午',
        time: '09:00–12:00',
        name: '浅草寺',
        description: '漫步雷门与仲见世商店街，感受东京的传统氛围。',
        location: '浅草',
        duration: '2–3 小时'
      },
      {
        id: 'a2',
        period: '下午',
        time: '13:00–16:00',
        name: '东京晴空塔',
        description: '从高处欣赏东京城市景观，体验现代都市魅力。',
        location: '押上',
        duration: '2 小时'
      },
      {
        id: 'a3',
        period: '晚上',
        time: '17:00–20:00',
        name: '涩谷',
        description: '感受繁华街区的夜景，体验购物与东京美食。',
        location: '涩谷',
        duration: '2–3 小时'
      }
    ]
  },
  {
    title: '东京的艺术与街区',
    activities: [
      {
        id: 'b1',
        period: '上午',
        time: '09:00–12:00',
        name: '上野公园',
        description: '在城市绿地里散步，感受东京悠闲的一面。',
        location: '上野',
        duration: '2 小时'
      },
      {
        id: 'b2',
        period: '下午',
        time: '13:00–16:00',
        name: '秋叶原',
        description: '探索动漫、电子产品和特色商店。',
        location: '千代田',
        duration: '3 小时'
      }
    ]
  },
  {
    title: '慢游东京',
    activities: [
      {
        id: 'c1',
        period: '上午',
        time: '09:00–12:00',
        name: '明治神宫',
        description: '穿过森林参道，体验静谧的神社氛围。',
        location: '代代木',
        duration: '2 小时'
      },
      {
        id: 'c2',
        period: '下午',
        time: '13:00–16:00',
        name: '表参道',
        description: '探索设计店铺、咖啡馆和街区建筑。',
        location: '青山',
        duration: '3 小时'
      }
    ]
  },
  {
    title: '城市风景与海湾',
    activities: [
      {
        id: 'd1',
        period: '上午',
        time: '09:00–12:00',
        name: '筑地场外市场',
        description: '品尝当地小吃，开启美食的一天。',
        location: '筑地',
        duration: '2 小时'
      },
      {
        id: 'd2',
        period: '下午',
        time: '13:00–17:00',
        name: '台场',
        description: '欣赏东京湾景色，体验海滨购物与休闲。',
        location: '台场',
        duration: '3 小时'
      }
    ]
  },
  {
    title: '东京的最后一天',
    activities: [
      {
        id: 'e1',
        period: '上午',
        time: '09:00–12:00',
        name: '新宿御苑',
        description: '在公园中散步，放慢旅行节奏。',
        location: '新宿',
        duration: '2 小时'
      },
      {
        id: 'e2',
        period: '下午',
        time: '13:00–16:00',
        name: '东京站',
        description: '选购伴手礼，结束愉快的旅程。',
        location: '丸之内',
        duration: '2 小时'
      }
    ]
  }
];
