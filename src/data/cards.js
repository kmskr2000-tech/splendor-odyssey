// Odyssey reskin: Greek/Roman mythology 90-card set.
// Same costs/bonuses/points/evolutions as the balanced Pokemon set.
// Art: assets/myth/{id}.webp (original dot art).
// 5 domains: monster=천둥 super=바다 hyper=대지 heal=생명 quick=태양 master=신성(와일드)

export const CARDS = [
  {
    id: 'm1-001',
    tier: 1,
    name: '나이아드',
    cost: {
      hyper: 1,
      heal: 1,
      quick: 1
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: 'm2-001',
    evolveReq: {
      hyper: 3
    }
  },
  {
    id: 'm1-002',
    tier: 1,
    name: '드리아드',
    cost: {
      monster: 2,
      hyper: 1
    },
    bonus: 'super',
    points: 0,
    evolvesTo: 'm2-002',
    evolveReq: {
      quick: 3
    }
  },
  {
    id: 'm1-003',
    tier: 1,
    name: '사티로스',
    cost: {
      monster: 2,
      heal: 1
    },
    bonus: 'hyper',
    points: 0,
    evolvesTo: 'm2-003',
    evolveReq: {
      monster: 3
    }
  },
  {
    id: 'm1-004',
    tier: 1,
    name: '하피',
    cost: {
      monster: 2,
      hyper: 3
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: 'm2-004',
    evolveReq: {
      super: 3
    }
  },
  {
    id: 'm1-005',
    tier: 1,
    name: '스핑크스',
    cost: {
      monster: 2,
      super: 1,
      hyper: 1
    },
    bonus: 'quick',
    points: 0,
    evolvesTo: 'm2-005',
    evolveReq: {
      heal: 3
    }
  },
  {
    id: 'm1-006',
    tier: 1,
    name: '케르베로스',
    cost: {
      super: 3,
      hyper: 1
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: 'm2-006',
    evolveReq: {
      super: 3
    }
  },
  {
    id: 'm1-007',
    tier: 1,
    name: '페가수스',
    cost: {
      monster: 1,
      quick: 2
    },
    bonus: 'super',
    points: 0,
    evolvesTo: 'm2-007',
    evolveReq: {
      hyper: 3
    }
  },
  {
    id: 'm1-008',
    tier: 1,
    name: '키클롭스',
    cost: {
      heal: 2,
      quick: 3
    },
    bonus: 'hyper',
    points: 0,
    evolvesTo: 'm2-008',
    evolveReq: {
      heal: 3
    }
  },
  {
    id: 'm1-009',
    tier: 1,
    name: '메두사',
    cost: {
      hyper: 3
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: 'm2-009',
    evolveReq: {
      monster: 3
    }
  },
  {
    id: 'm1-010',
    tier: 1,
    name: '미노타우로스',
    cost: {
      monster: 1,
      super: 1,
      hyper: 1
    },
    bonus: 'quick',
    points: 0,
    evolvesTo: 'm2-010',
    evolveReq: {
      super: 3
    }
  },
  {
    id: 'm1-011',
    tier: 1,
    name: '히드라',
    cost: {
      super: 1,
      hyper: 1,
      quick: 2
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: 'm2-011',
    evolveReq: {
      quick: 3
    }
  },
  {
    id: 'm1-012',
    tier: 1,
    name: '엠푸사',
    cost: {
      monster: 2,
      hyper: 1,
      heal: 1
    },
    bonus: 'super',
    points: 0,
    evolvesTo: 'm2-012',
    evolveReq: {
      heal: 3
    }
  },
  {
    id: 'm1-013',
    tier: 1,
    name: '오레아드',
    cost: {
      super: 1,
      heal: 1,
      quick: 1
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-014',
    tier: 1,
    name: '네레이드',
    cost: {
      monster: 3,
      super: 1
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-015',
    tier: 1,
    name: '켄타우로스',
    cost: {
      super: 2,
      heal: 3
    },
    bonus: 'quick',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-016',
    tier: 1,
    name: '아라크네',
    cost: {
      super: 1,
      heal: 3
    },
    bonus: 'hyper',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-017',
    tier: 1,
    name: '다프네',
    cost: {
      hyper: 2,
      heal: 2
    },
    bonus: 'super',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-018',
    tier: 1,
    name: '고르곤',
    cost: {
      monster: 1,
      super: 2,
      hyper: 1
    },
    bonus: 'quick',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-019',
    tier: 1,
    name: '에리니에스',
    cost: {
      hyper: 3,
      heal: 2
    },
    bonus: 'quick',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-020',
    tier: 1,
    name: '모이라',
    cost: {
      quick: 4
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-021',
    tier: 1,
    name: '카리브디스',
    cost: {
      monster: 2,
      heal: 2
    },
    bonus: 'super',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-022',
    tier: 1,
    name: '폴리페모스',
    cost: {
      monster: 2,
      quick: 1
    },
    bonus: 'hyper',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-023',
    tier: 1,
    name: '안타이오스',
    cost: {
      monster: 1,
      super: 2,
      hyper: 1
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-024',
    tier: 1,
    name: '게리온',
    cost: {
      monster: 1,
      super: 3,
      quick: 1
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-025',
    tier: 1,
    name: '오르트로스',
    cost: {
      monster: 1,
      super: 1,
      quick: 2
    },
    bonus: 'hyper',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-026',
    tier: 1,
    name: '그라이아이',
    cost: {
      monster: 1,
      super: 1,
      heal: 2
    },
    bonus: 'hyper',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-027',
    tier: 1,
    name: '헤스페리데스',
    cost: {
      super: 2,
      hyper: 1,
      heal: 2
    },
    bonus: 'quick',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-028',
    tier: 1,
    name: '알로아다이',
    cost: {
      hyper: 1,
      heal: 1,
      quick: 1
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-029',
    tier: 1,
    name: '시시포스',
    cost: {
      monster: 4
    },
    bonus: 'quick',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-030',
    tier: 1,
    name: '탄탈로스',
    cost: {
      super: 3,
      quick: 2
    },
    bonus: 'heal',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-031',
    tier: 1,
    name: '나르키소스',
    cost: {
      super: 1,
      heal: 1,
      quick: 3
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-032',
    tier: 1,
    name: '판',
    cost: {
      monster: 2,
      super: 3
    },
    bonus: 'hyper',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-033',
    tier: 1,
    name: '에코',
    cost: {
      heal: 2,
      quick: 2
    },
    bonus: 'super',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-034',
    tier: 1,
    name: '살모네우스',
    cost: {
      super: 1,
      hyper: 1,
      heal: 2
    },
    bonus: 'monster',
    points: 0,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm1-035',
    tier: 1,
    name: '티티오스',
    cost: {
      hyper: 3,
      heal: 2
    },
    bonus: 'super',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-001',
    tier: 2,
    name: '트리톤',
    cost: {
      hyper: 2,
      heal: 3
    },
    bonus: 'monster',
    points: 1,
    evolvesTo: 'm3-001',
    evolveReq: {
      heal: 5
    }
  },
  {
    id: 'm2-002',
    tier: 2,
    name: '오리온',
    cost: {
      heal: 4,
      quick: 3
    },
    bonus: 'super',
    points: 2,
    evolvesTo: 'm3-002',
    evolveReq: {
      hyper: 4
    }
  },
  {
    id: 'm2-003',
    tier: 2,
    name: '실레노스',
    cost: {
      monster: 1,
      heal: 4,
      quick: 1
    },
    bonus: 'hyper',
    points: 2,
    evolvesTo: 'm3-003',
    evolveReq: {
      monster: 4
    }
  },
  {
    id: 'm2-004',
    tier: 2,
    name: '그리핀',
    cost: {
      super: 4,
      quick: 3
    },
    bonus: 'heal',
    points: 2,
    evolvesTo: 'm3-004',
    evolveReq: {
      super: 4
    }
  },
  {
    id: 'm2-005',
    tier: 2,
    name: '오이디푸스',
    cost: {
      super: 2,
      hyper: 4
    },
    bonus: 'quick',
    points: 2,
    evolvesTo: 'm3-005',
    evolveReq: {
      heal: 4
    }
  },
  {
    id: 'm2-006',
    tier: 2,
    name: '타나토스',
    cost: {
      hyper: 3,
      heal: 3
    },
    bonus: 'monster',
    points: 1,
    evolvesTo: 'm3-006',
    evolveReq: {
      quick: 4
    }
  },
  {
    id: 'm2-007',
    tier: 2,
    name: '벨레로폰',
    cost: {
      monster: 3,
      heal: 2
    },
    bonus: 'super',
    points: 1,
    evolvesTo: 'm3-007',
    evolveReq: {
      monster: 5
    }
  },
  {
    id: 'm2-008',
    tier: 2,
    name: '탈로스',
    cost: {
      monster: 3,
      heal: 2
    },
    bonus: 'hyper',
    points: 1,
    evolvesTo: 'm3-008',
    evolveReq: {
      quick: 5
    }
  },
  {
    id: 'm2-009',
    tier: 2,
    name: '페르세우스',
    cost: {
      super: 2,
      hyper: 2,
      quick: 2
    },
    bonus: 'heal',
    points: 1,
    evolvesTo: 'm3-009',
    evolveReq: {
      hyper: 4
    }
  },
  {
    id: 'm2-010',
    tier: 2,
    name: '테세우스',
    cost: {
      monster: 3,
      super: 2,
      heal: 1
    },
    bonus: 'quick',
    points: 1,
    evolvesTo: 'm3-010',
    evolveReq: {
      super: 4
    }
  },
  {
    id: 'm2-011',
    tier: 2,
    name: '헤라클레스',
    cost: {
      hyper: 4,
      quick: 3
    },
    bonus: 'monster',
    points: 2,
    evolvesTo: 'm3-011',
    evolveReq: {
      hyper: 4
    }
  },
  {
    id: 'm2-012',
    tier: 2,
    name: '메데이아',
    cost: {
      monster: 3,
      heal: 4
    },
    bonus: 'super',
    points: 2,
    evolvesTo: 'm3-012',
    evolveReq: {
      quick: 4
    }
  },
  {
    id: 'm2-013',
    tier: 2,
    name: '이아손',
    cost: {
      monster: 2,
      heal: 1,
      quick: 2
    },
    bonus: 'hyper',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-014',
    tier: 2,
    name: '아킬레우스',
    cost: {
      hyper: 4,
      quick: 3
    },
    bonus: 'heal',
    points: 2,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-015',
    tier: 2,
    name: '아이아스',
    cost: {
      monster: 2,
      super: 5
    },
    bonus: 'quick',
    points: 2,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-016',
    tier: 2,
    name: '디오메데스',
    cost: {
      monster: 3,
      super: 5
    },
    bonus: 'heal',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-017',
    tier: 2,
    name: '헥토르',
    cost: {
      monster: 2,
      hyper: 3,
      heal: 3
    },
    bonus: 'quick',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-018',
    tier: 2,
    name: '아이네이아스',
    cost: {
      heal: 1,
      quick: 4
    },
    bonus: 'monster',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-019',
    tier: 2,
    name: '멜레아그로스',
    cost: {
      super: 2,
      hyper: 2,
      heal: 2
    },
    bonus: 'monster',
    points: 2,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-020',
    tier: 2,
    name: '아탈란테',
    cost: {
      monster: 1,
      quick: 4
    },
    bonus: 'super',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-021',
    tier: 2,
    name: '키르케',
    cost: {
      monster: 4,
      hyper: 3
    },
    bonus: 'heal',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-022',
    tier: 2,
    name: '안드로메다',
    cost: {
      quick: 5
    },
    bonus: 'hyper',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-023',
    tier: 2,
    name: '아리아드네',
    cost: {
      super: 5,
      quick: 1
    },
    bonus: 'monster',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-024',
    tier: 2,
    name: '카스토르',
    cost: {
      super: 3,
      quick: 4
    },
    bonus: 'heal',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-025',
    tier: 2,
    name: '폴리데우케스',
    cost: {
      hyper: 5,
      heal: 3
    },
    bonus: 'super',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-026',
    tier: 2,
    name: '카드모스',
    cost: {
      monster: 5,
      heal: 2
    },
    bonus: 'quick',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-027',
    tier: 2,
    name: '미노스',
    cost: {
      monster: 4,
      super: 2
    },
    bonus: 'hyper',
    points: 2,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-028',
    tier: 2,
    name: '펠레우스',
    cost: {
      monster: 1,
      heal: 3,
      quick: 2
    },
    bonus: 'super',
    points: 2,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-029',
    tier: 2,
    name: '프로메테우스',
    cost: {
      super: 1,
      heal: 2,
      quick: 4
    },
    bonus: 'hyper',
    points: 2,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm2-030',
    tier: 2,
    name: '오디세우스',
    cost: {
      super: 3,
      hyper: 3
    },
    bonus: 'quick',
    points: 1,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-001',
    tier: 3,
    name: '암피트리테',
    cost: {
      hyper: 4,
      heal: 4
    },
    bonus: 'monster',
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-002',
    tier: 3,
    name: '아르테미스',
    cost: {
      monster: 6,
      hyper: 6
    },
    bonus: 'super',
    points: 5,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-003',
    tier: 3,
    name: '디오니소스',
    cost: {
      super: 6,
      quick: 5
    },
    bonus: 'hyper',
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-004',
    tier: 3,
    name: '아폴론',
    cost: {
      monster: 5,
      quick: 5
    },
    bonus: 'heal',
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-005',
    tier: 3,
    name: '아테나',
    cost: {
      monster: 3,
      super: 5,
      hyper: 4
    },
    bonus: 'quick',
    points: 5,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-006',
    tier: 3,
    name: '하데스',
    cost: {
      hyper: 3,
      heal: 3,
      quick: 2
    },
    bonus: 'monster',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-007',
    tier: 3,
    name: '헬리오스',
    cost: {
      monster: 5,
      heal: 4
    },
    bonus: 'super',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-008',
    tier: 3,
    name: '헤파이스토스',
    cost: {
      super: 5,
      heal: 3
    },
    bonus: 'hyper',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-009',
    tier: 3,
    name: '헤르메스',
    cost: {
      hyper: 4,
      quick: 3
    },
    bonus: 'heal',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-010',
    tier: 3,
    name: '포세이돈',
    cost: {
      monster: 2,
      super: 2,
      hyper: 5
    },
    bonus: 'quick',
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-011',
    tier: 3,
    name: '제우스',
    cost: {
      super: 2,
      hyper: 3,
      heal: 4
    },
    bonus: 'monster',
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-012',
    tier: 3,
    name: '헤카테',
    cost: {
      heal: 5,
      quick: 5
    },
    bonus: 'super',
    points: 5,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-013',
    tier: 3,
    name: '아프로디테',
    cost: {
      super: 4,
      heal: 2,
      quick: 4
    },
    bonus: 'hyper',
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-014',
    tier: 3,
    name: '데메테르',
    cost: {
      super: 1,
      quick: 6
    },
    bonus: 'heal',
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'm3-015',
    tier: 3,
    name: '아레스',
    cost: {
      monster: 4,
      super: 4,
      heal: 3
    },
    bonus: 'quick',
    points: 5,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'rare-001',
    tier: 'rare',
    name: '키메라',
    cost: {
      monster: 3,
      heal: 5
    },
    bonus: [
      'super',
      'hyper'
    ],
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'rare-002',
    tier: 'rare',
    name: '에키드나',
    cost: {
      hyper: 2,
      heal: 2,
      quick: 2
    },
    bonus: [
      'monster',
      'super'
    ],
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'rare-003',
    tier: 'rare',
    name: '피톤',
    cost: {
      monster: 5,
      hyper: 3
    },
    bonus: [
      'heal',
      'quick'
    ],
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'rare-004',
    tier: 'rare',
    name: '라돈',
    cost: {
      monster: 3,
      quick: 4
    },
    bonus: [
      'hyper',
      'heal'
    ],
    points: 3,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'rare-005',
    tier: 'rare',
    name: '스킬라',
    cost: {
      super: 5,
      hyper: 4
    },
    bonus: [
      'quick',
      'monster'
    ],
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'legend-001',
    tier: 'legend',
    name: '크로노스',
    cost: {
      monster: 2,
      hyper: 4,
      heal: 2
    },
    bonus: [
      'quick',
      'super'
    ],
    points: 4,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'legend-002',
    tier: 'legend',
    name: '가이아',
    cost: {
      super: 5,
      hyper: 3,
      quick: 3
    },
    bonus: [
      'heal',
      'monster'
    ],
    points: 5,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'legend-003',
    tier: 'legend',
    name: '우라노스',
    cost: {
      super: 4,
      heal: 3,
      quick: 3
    },
    bonus: [
      'monster',
      'hyper'
    ],
    points: 5,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'legend-004',
    tier: 'legend',
    name: '닉스',
    cost: {
      monster: 3,
      hyper: 4,
      quick: 5
    },
    bonus: [
      'super',
      'heal'
    ],
    points: 6,
    evolvesTo: null,
    evolveReq: null
  },
  {
    id: 'legend-005',
    tier: 'legend',
    name: '타르타로스',
    cost: {
      monster: 3,
      super: 2,
      heal: 4
    },
    bonus: [
      'hyper',
      'quick'
    ],
    points: 4,
    evolvesTo: null,
    evolveReq: null
  }
];
