import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('開始填充種子資料...');

  // 建立預設系統獎項
  const systemRewards = [
    {
      name: '按摩券',
      description: '可兌換一次肩頸按摩服務',
      pointsCost: 500,
      iconUrl: '/icons/rewards/massage.png',
      isSystem: true,
    },
    {
      name: '電影票',
      description: '可兌換一張電影票',
      pointsCost: 800,
      iconUrl: '/icons/rewards/movie.png',
      isSystem: true,
    },
    {
      name: '下午茶',
      description: '可兌換一份精緻下午茶',
      pointsCost: 600,
      iconUrl: '/icons/rewards/tea.png',
      isSystem: true,
    },
    {
      name: '家庭聚餐',
      description: '可兌換一次家庭聚餐',
      pointsCost: 1500,
      iconUrl: '/icons/rewards/dinner.png',
      isSystem: true,
    },
    {
      name: '購物禮券',
      description: '可兌換 100 元購物禮券',
      pointsCost: 1000,
      iconUrl: '/icons/rewards/shopping.png',
      isSystem: true,
    },
  ];

  for (const reward of systemRewards) {
    await prisma.reward.upsert({
      where: {
        id: `system-${reward.name}`
      },
      update: reward,
      create: {
        id: `system-${reward.name}`,
        ...reward,
      },
    });
  }

  console.log(`已建立 ${systemRewards.length} 個系統獎項`);

  // 建立成就定義
  const achievements = [
    {
      code: 'FIRST_EXERCISE',
      name: '初試啼聲',
      description: '完成第一次運動',
      iconUrl: '/icons/achievements/first.png',
      condition: { type: 'exercise_count', value: 1 },
      pointsBonus: 50,
    },
    {
      code: 'EXERCISE_3_DAYS',
      name: '三日不懈',
      description: '連續三天運動',
      iconUrl: '/icons/achievements/3days.png',
      condition: { type: 'consecutive_days', value: 3 },
      pointsBonus: 100,
    },
    {
      code: 'EXERCISE_7_DAYS',
      name: '一週達人',
      description: '連續七天運動',
      iconUrl: '/icons/achievements/7days.png',
      condition: { type: 'consecutive_days', value: 7 },
      pointsBonus: 200,
    },
    {
      code: 'EXERCISE_30_DAYS',
      name: '月度冠軍',
      description: '連續三十天運動',
      iconUrl: '/icons/achievements/30days.png',
      condition: { type: 'consecutive_days', value: 30 },
      pointsBonus: 500,
    },
    {
      code: 'TOTAL_10_HOURS',
      name: '十小時里程碑',
      description: '累計運動時間達到 10 小時',
      iconUrl: '/icons/achievements/10hours.png',
      condition: { type: 'total_minutes', value: 600 },
      pointsBonus: 150,
    },
    {
      code: 'TOTAL_50_HOURS',
      name: '五十小時成就',
      description: '累計運動時間達到 50 小時',
      iconUrl: '/icons/achievements/50hours.png',
      condition: { type: 'total_minutes', value: 3000 },
      pointsBonus: 300,
    },
    {
      code: 'TOTAL_100_HOURS',
      name: '百小時傳奇',
      description: '累計運動時間達到 100 小時',
      iconUrl: '/icons/achievements/100hours.png',
      condition: { type: 'total_minutes', value: 6000 },
      pointsBonus: 500,
    },
    {
      code: 'EARLY_BIRD',
      name: '早起鳥兒',
      description: '在早上 6 點前開始運動',
      iconUrl: '/icons/achievements/earlybird.png',
      condition: { type: 'exercise_before_hour', value: 6 },
      pointsBonus: 100,
    },
    {
      code: 'NIGHT_OWL',
      name: '夜貓子',
      description: '在晚上 9 點後開始運動',
      iconUrl: '/icons/achievements/nightowl.png',
      condition: { type: 'exercise_after_hour', value: 21 },
      pointsBonus: 100,
    },
    {
      code: 'FIRST_REWARD',
      name: '首次兌換',
      description: '第一次兌換獎項',
      iconUrl: '/icons/achievements/firstreward.png',
      condition: { type: 'reward_count', value: 1 },
      pointsBonus: 50,
    },
    {
      code: 'REWARD_COLLECTOR',
      name: '獎項收藏家',
      description: '兌換 10 個獎項',
      iconUrl: '/icons/achievements/collector.png',
      condition: { type: 'reward_count', value: 10 },
      pointsBonus: 200,
    },
    {
      code: 'POINTS_1000',
      name: '千點俱樂部',
      description: '累計獲得 1000 點',
      iconUrl: '/icons/achievements/1000points.png',
      condition: { type: 'total_points', value: 1000 },
      pointsBonus: 100,
    },
    {
      code: 'POINTS_5000',
      name: '五千點達人',
      description: '累計獲得 5000 點',
      iconUrl: '/icons/achievements/5000points.png',
      condition: { type: 'total_points', value: 5000 },
      pointsBonus: 250,
    },
    {
      code: 'POINTS_10000',
      name: '萬點傳說',
      description: '累計獲得 10000 點',
      iconUrl: '/icons/achievements/10000points.png',
      condition: { type: 'total_points', value: 10000 },
      pointsBonus: 500,
    },
    {
      code: 'EXERCISE_100',
      name: '百次運動',
      description: '完成 100 次運動',
      iconUrl: '/icons/achievements/100exercises.png',
      condition: { type: 'exercise_count', value: 100 },
      pointsBonus: 300,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        condition: achievement.condition,
        pointsBonus: achievement.pointsBonus,
      },
      create: achievement,
    });
  }

  console.log(`已建立 ${achievements.length} 個成就定義`);

  console.log('種子資料填充完成！');
}

main()
  .catch((e) => {
    console.error('種子資料填充失敗：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
