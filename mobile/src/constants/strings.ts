// 應用程式字串常數（繁體中文）

export const Strings = {
  // 應用程式名稱
  appName: '長輩運動關懷',

  // 通用
  common: {
    confirm: '確認',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    back: '返回',
    next: '下一步',
    done: '完成',
    close: '關閉',
    retry: '重試',
    loading: '載入中...',
    error: '錯誤',
    success: '成功',
    warning: '警告',
    info: '提示',
    yes: '是',
    no: '否',
    ok: '確定',
    submit: '送出',
    search: '搜尋',
    noData: '暫無資料',
    refresh: '重新整理',
    more: '更多',
    less: '收起',
  },

  // 認證相關
  auth: {
    login: '登入',
    logout: '登出',
    register: '註冊',
    forgotPassword: '忘記密碼',
    resetPassword: '重設密碼',
    phone: '手機號碼',
    password: '密碼',
    confirmPassword: '確認密碼',
    name: '姓名',
    role: '身份',
    elder: '長輩',
    child: '子女',
    selectRole: '請選擇您的身份',
    loginSuccess: '登入成功',
    registerSuccess: '註冊成功',
    logoutConfirm: '確定要登出嗎？',
    invalidPhone: '請輸入有效的手機號碼',
    invalidPassword: '密碼格式不正確',
    passwordMismatch: '兩次密碼輸入不一致',
    phoneExists: '此手機號碼已被註冊',
    loginFailed: '登入失敗，請檢查帳號密碼',
  },

  // 綁定相關
  binding: {
    generateCode: '產生綁定碼',
    enterCode: '輸入綁定碼',
    bindingCode: '綁定碼',
    codeExpiry: '綁定碼有效期為 5 分鐘',
    bindingSuccess: '綁定成功',
    bindingFailed: '綁定失敗',
    invalidCode: '綁定碼無效或已過期',
    unbind: '解除綁定',
    unbindConfirm: '確定要解除綁定嗎？',
    noBindings: '尚未綁定任何人',
    boundElders: '已綁定的長輩',
    boundChildren: '已綁定的子女',
  },

  // 運動相關
  exercise: {
    startExercise: '開始運動',
    endExercise: '結束運動',
    exercising: '運動中',
    duration: '運動時長',
    points: '獲得點數',
    history: '運動記錄',
    statistics: '運動統計',
    noExercise: '尚無運動記錄',
    todayExercise: '今日運動',
    weekExercise: '本週運動',
    monthExercise: '本月運動',
    totalMinutes: '總時長（分鐘）',
    totalPoints: '總點數',
    exerciseCount: '運動次數',
    averageDuration: '平均時長',
    confirmEnd: '確定要結束運動嗎？',
    greatJob: '太棒了！',
    keepGoing: '繼續加油！',
  },

  // 緊急求助
  emergency: {
    sos: '緊急求助',
    emergencyHelp: '緊急求助',
    cancelEmergency: '取消求助',
    emergencyAlert: '緊急警報',
    elderEmergency: '長輩發出緊急求助！',
    confirmSOS: '確定要發送緊急求助嗎？',
    emergencyCancelled: '緊急求助已取消',
    viewLocation: '查看位置',
    callElder: '撥打電話',
  },

  // 通知相關
  notification: {
    notifications: '通知',
    noNotifications: '沒有通知',
    markAllRead: '全部標記已讀',
    exerciseStart: '開始運動',
    exerciseEnd: '運動結束',
    inactivity: '活動提醒',
    achievement: '成就解鎖',
    rewardRedeemed: '獎項兌換',
    newVoice: '新語音訊息',
    settings: '通知設定',
  },

  // 獎項相關
  reward: {
    rewards: '獎項',
    shop: '獎項商城',
    myRewards: '我的收藏',
    redeem: '兌換',
    redeemConfirm: '確定要兌換此獎項嗎？',
    redeemSuccess: '兌換成功',
    insufficientPoints: '點數不足',
    pointsCost: '所需點數',
    currentPoints: '目前點數',
    customReward: '自訂獎項',
    addReward: '新增獎項',
    editReward: '編輯獎項',
    deleteReward: '刪除獎項',
    rewardName: '獎項名稱',
    rewardDescription: '獎項說明',
    noRewards: '尚無獎項',
  },

  // 成就相關
  achievement: {
    achievements: '成就',
    unlocked: '已解鎖',
    locked: '未解鎖',
    progress: '進度',
    bonus: '獎勵點數',
    achievementUnlocked: '恭喜解鎖成就！',
    noAchievements: '尚無成就',
  },

  // 語音相關
  voice: {
    voiceMessages: '語音訊息',
    record: '錄音',
    play: '播放',
    stop: '停止',
    delete: '刪除',
    upload: '上傳',
    recording: '錄音中...',
    uploading: '上傳中...',
    maxDuration: '最長 30 秒',
    quota: '語音配額',
    used: '已使用',
    remaining: '剩餘',
    noVoices: '尚無語音訊息',
    recordHint: '長按開始錄音',
    deleteConfirm: '確定要刪除此語音嗎？',
  },

  // 個人資料
  profile: {
    profile: '個人資料',
    editProfile: '編輯資料',
    changeAvatar: '更換頭像',
    changePassword: '修改密碼',
    oldPassword: '舊密碼',
    newPassword: '新密碼',
    settings: '設定',
    about: '關於',
    version: '版本',
    privacy: '隱私政策',
    terms: '服務條款',
    help: '幫助',
    feedback: '意見回饋',
  },

  // 錯誤訊息
  errors: {
    networkError: '網路連線失敗，請檢查網路設定',
    serverError: '伺服器錯誤，請稍後再試',
    unknownError: '發生未知錯誤',
    timeout: '請求逾時，請重試',
    unauthorized: '請重新登入',
    forbidden: '權限不足',
    notFound: '找不到資料',
    validation: '資料格式錯誤',
  },

  // 時間相關
  time: {
    justNow: '剛剛',
    minutesAgo: '分鐘前',
    hoursAgo: '小時前',
    daysAgo: '天前',
    today: '今天',
    yesterday: '昨天',
    thisWeek: '本週',
    thisMonth: '本月',
  },
} as const;

export default Strings;
