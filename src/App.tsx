import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "interview"
  | "offer"
  | "rejected";

type MaterialStatus = "未开始" | "准备中" | "已提交" | "需补充";
type Priority = "高" | "中" | "低";
type BoardView = "all" | "upcoming" | "active" | "offer";
type AuthMode = "login" | "register";
type Language = "zh" | "en";
type ThemeMode = "system" | "light" | "dark";

type MaterialItem = {
  id: string;
  label: string;
  completed: boolean;
};

type ProcessStepId = "written" | "first" | "second" | "hr" | "offerTalk";

type ProcessStep = {
  id: ProcessStepId;
  title: string;
  date: string;
  result: string;
  notes: string;
};

type JobApplication = {
  id: string;
  company: string;
  role: string;
  deadline: string;
  materialStatus: MaterialStatus;
  materials: MaterialItem[];
  progress: string;
  priority: Priority;
  notes: string;
  status: ApplicationStatus;
  processSteps: ProcessStep[];
};

type ApplicationForm = Omit<JobApplication, "id">;

const STORAGE_KEY = "campus-application-board-v1";
const AUTH_USERS_KEY = "campus-application-board-users-v1";
const AUTH_SESSION_KEY = "campus-application-board-session-v1";
const LANGUAGE_KEY = "campus-application-board-language-v1";
const THEME_KEY = "campus-application-board-theme-v1";
const DETAIL_HASH_PREFIX = "#application-";

type StoredUser = {
  name: string;
  email: string;
  password: string;
};

type AuthForm = {
  name: string;
  email: string;
  password: string;
};

const copy = {
  zh: {
    appName: "求职申请管理看板",
    eyebrow: "校园招聘",
    subtitle: "统一管理岗位截止日期、材料状态和面试进度。",
    language: "语言",
    theme: "主题",
    system: "跟随系统",
    light: "浅色",
    dark: "深色",
    login: "登录",
    logout: "退出登录",
    guest: "访客",
    addApplication: "新增申请",
    calendar: "添加到日历",
    overviewLabel: "求职申请概览",
    boardActions: "看板操作",
    totalApplications: "申请总数",
    upcomingDeadlines: "即将截止",
    inProgress: "推进中",
    offers: "录用",
    showAll: "显示全部",
    filterUpcoming: "筛选即将截止",
    search: "搜索",
    searchPlaceholder: "公司、岗位、进度或备注",
    priority: "优先级",
    materialStatus: "材料状态",
    all: "全部",
    sortByDeadline: "按截止日期排序",
    backToBoardView: "返回状态看板",
    currentPage: "当前页面",
    backToAll: "返回全部",
    deadlineSortTitle: "按截止日期排序",
    statusBoardLabel: "申请状态看板",
    noMatchedApplications: "暂无符合条件的申请",
    noStatusApplicationsPrefix: "暂无",
    noStatusApplicationsSuffix: "申请",
    dragToColumn: "拖拽到其他状态列",
    deadline: "截止日期",
    progress: "当前进度",
    notes: "备注",
    noNotes: "暂无备注",
    movePrevious: "前移",
    moveNext: "后移",
    edit: "编辑",
    delete: "删除",
    backToBoard: "返回看板",
    detailLabel: "申请详情",
    progressInfo: "进度信息",
    materialsChecklist: "申请材料 checklist",
    interviewProcess: "面试流程",
    detailActions: "详情操作",
    result: "结果",
    notScheduled: "未安排",
    pendingUpdate: "待更新",
    formLabel: "申请表单",
    createRecord: "新增岗位",
    updateRecord: "更新记录",
    editApplication: "编辑申请",
    companyName: "公司名称",
    companyPlaceholder: "例如：阿里巴巴",
    roleName: "岗位名称",
    rolePlaceholder: "例如：数据分析实习生",
    currentStatus: "当前状态",
    progressPlaceholder: "例如：等待 HR 电话面试",
    addCustomMaterial: "添加自定义材料",
    add: "添加",
    remove: "移除",
    time: "时间",
    resultPlaceholder: "例如：通过 / 待参加 / 未通过",
    processNotesPlaceholder: "记录准备重点、面试反馈或后续事项",
    notesPlaceholder: "记录材料补充、面试准备或跟进事项",
    cancel: "取消",
    saveApplication: "保存申请",
    closeForm: "关闭表单",
    closeLogin: "关闭登录",
    register: "注册",
    nickname: "昵称",
    nicknamePlaceholder: "例如：小徐",
    email: "邮箱",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    registerAndEnter: "注册并进入",
    guestLogin: "访客登录",
    authSubtitle: "登录后管理岗位、DDL、面试流程和日历提醒。",
    authModeLabel: "登录方式",
    authNote: "当前版本使用浏览器本地登录，数据保存在这台设备的 localStorage。",
    fillAllFields: "请填写完整信息。",
    emailRegistered: "这个邮箱已经注册，请直接登录。",
    wrongCredentials: "邮箱或密码不正确。",
    calendarFeedbackPrefix: "已打开",
    calendarFeedbackSuffix: "个日历事件。若浏览器未弹出日历，请在下载记录中打开 .ics 文件导入。",
  },
  en: {
    appName: "Job Application Board",
    eyebrow: "Campus Recruiting",
    subtitle: "Track deadlines, materials, and interview progress in one place.",
    language: "Language",
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    login: "Sign in",
    logout: "Sign out",
    guest: "Guest",
    addApplication: "Add Application",
    calendar: "Add to Calendar",
    overviewLabel: "Application Overview",
    boardActions: "Board Actions",
    totalApplications: "Total",
    upcomingDeadlines: "Due Soon",
    inProgress: "In Progress",
    offers: "Offers",
    showAll: "Show All",
    filterUpcoming: "Due Soon",
    search: "Search",
    searchPlaceholder: "Company, role, progress, or notes",
    priority: "Priority",
    materialStatus: "Materials",
    all: "All",
    sortByDeadline: "Sort by Deadline",
    backToBoardView: "Back to Board",
    currentPage: "Current View",
    backToAll: "Back to All",
    deadlineSortTitle: "Sorted by Deadline",
    statusBoardLabel: "Application Status Board",
    noMatchedApplications: "No matching applications",
    noStatusApplicationsPrefix: "No",
    noStatusApplicationsSuffix: "applications",
    dragToColumn: "Drag to another status column",
    deadline: "Deadline",
    progress: "Progress",
    notes: "Notes",
    noNotes: "No notes",
    movePrevious: "Previous",
    moveNext: "Next",
    edit: "Edit",
    delete: "Delete",
    backToBoard: "Back to Board",
    detailLabel: "Application Details",
    progressInfo: "Progress Details",
    materialsChecklist: "Materials Checklist",
    interviewProcess: "Interview Process",
    detailActions: "Detail Actions",
    result: "Result",
    notScheduled: "Not scheduled",
    pendingUpdate: "Pending update",
    formLabel: "Application Form",
    createRecord: "New Role",
    updateRecord: "Update Record",
    editApplication: "Edit Application",
    companyName: "Company",
    companyPlaceholder: "e.g. Alibaba",
    roleName: "Role",
    rolePlaceholder: "e.g. Data Analyst Intern",
    currentStatus: "Current Status",
    progressPlaceholder: "e.g. Waiting for HR phone screen",
    addCustomMaterial: "Add custom material",
    add: "Add",
    remove: "Remove",
    time: "Date",
    resultPlaceholder: "e.g. Passed / Pending / Rejected",
    processNotesPlaceholder: "Preparation notes, interview feedback, or follow-up items",
    notesPlaceholder: "Materials, interview prep, or follow-up notes",
    cancel: "Cancel",
    saveApplication: "Save Application",
    closeForm: "Close form",
    closeLogin: "Close sign in",
    register: "Register",
    nickname: "Name",
    nicknamePlaceholder: "e.g. Alex",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "Enter password",
    registerAndEnter: "Register and Enter",
    guestLogin: "Continue as Guest",
    authSubtitle: "Sign in to manage roles, deadlines, interviews, and calendar reminders.",
    authModeLabel: "Sign-in Method",
    authNote: "This version uses local browser sign-in. Data stays in this device's localStorage.",
    fillAllFields: "Please fill in all required fields.",
    emailRegistered: "This email is already registered. Sign in instead.",
    wrongCredentials: "Email or password is incorrect.",
    calendarFeedbackPrefix: "Opened",
    calendarFeedbackSuffix: "calendar events. If your browser did not open Calendar, import the .ics file from downloads.",
  },
} satisfies Record<Language, Record<string, string>>;

const readLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  return stored === "en" ? "en" : "zh";
};

const readTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
};

const statuses: Array<{
  id: ApplicationStatus;
  title: string;
  shortTitle: string;
}> = [
  { id: "draft", title: "未投递", shortTitle: "准备" },
  { id: "submitted", title: "已投递", shortTitle: "等待" },
  { id: "interview", title: "笔试/面试中", shortTitle: "推进" },
  { id: "offer", title: "已录用", shortTitle: "录用" },
  { id: "rejected", title: "已拒绝", shortTitle: "归档" },
];

const materialOptions: MaterialStatus[] = ["未开始", "准备中", "已提交", "需补充"];
const priorityOptions: Priority[] = ["高", "中", "低"];
const allFilterOption = "全部";
const activeStatuses: ApplicationStatus[] = ["draft", "submitted", "interview"];

const statusLabels: Record<
  Language,
  Record<ApplicationStatus, { title: string; shortTitle: string }>
> = {
  zh: {
    draft: { title: "未投递", shortTitle: "准备" },
    submitted: { title: "已投递", shortTitle: "等待" },
    interview: { title: "笔试/面试中", shortTitle: "推进" },
    offer: { title: "已录用", shortTitle: "录用" },
    rejected: { title: "已拒绝", shortTitle: "归档" },
  },
  en: {
    draft: { title: "Not Applied", shortTitle: "Prep" },
    submitted: { title: "Applied", shortTitle: "Waiting" },
    interview: { title: "Tests / Interviews", shortTitle: "Process" },
    offer: { title: "Offer", shortTitle: "Offer" },
    rejected: { title: "Rejected", shortTitle: "Archive" },
  },
};

const materialStatusLabels: Record<Language, Record<MaterialStatus, string>> = {
  zh: {
    未开始: "未开始",
    准备中: "准备中",
    已提交: "已提交",
    需补充: "需补充",
  },
  en: {
    未开始: "Not Started",
    准备中: "Preparing",
    已提交: "Submitted",
    需补充: "Needs Update",
  },
};

const priorityLabels: Record<Language, Record<Priority, string>> = {
  zh: { 高: "高", 中: "中", 低: "低" },
  en: { 高: "High", 中: "Medium", 低: "Low" },
};

const processStepLabels: Record<Language, Record<ProcessStepId, string>> = {
  zh: {
    written: "笔试时间",
    first: "一面时间",
    second: "二面时间",
    hr: "HR 面时间",
    offerTalk: "Offer 沟通时间",
  },
  en: {
    written: "Written Test",
    first: "First Interview",
    second: "Second Interview",
    hr: "HR Interview",
    offerTalk: "Offer Discussion",
  },
};

const defaultMaterialTemplates = [
  "中文简历",
  "英文简历",
  "成绩单",
  "作品集",
  "推荐信",
  "网申问题",
];

const processStepTemplates: Array<Pick<ProcessStep, "id" | "title">> = [
  { id: "written", title: "笔试时间" },
  { id: "first", title: "一面时间" },
  { id: "second", title: "二面时间" },
  { id: "hr", title: "HR 面时间" },
  { id: "offerTalk", title: "Offer 沟通时间" },
];

const createDefaultMaterials = (completed = false): MaterialItem[] =>
  defaultMaterialTemplates.map((label) => ({
    id: label,
    label,
    completed,
  }));

const createDefaultProcessSteps = (): ProcessStep[] =>
  processStepTemplates.map((step) => ({
    ...step,
    date: "",
    result: "",
    notes: "",
  }));

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const emptyForm = (): ApplicationForm => ({
  company: "",
  role: "",
  deadline: addDays(14),
  materialStatus: "准备中",
  materials: createDefaultMaterials(),
  progress: "梳理岗位要求",
  priority: "中",
  notes: "",
  status: "draft",
  processSteps: createDefaultProcessSteps(),
});

const seedApplications: JobApplication[] = [
  {
    id: "seed-1",
    company: "腾讯",
    role: "产品运营实习生",
    deadline: addDays(3),
    materialStatus: "准备中",
    materials: createDefaultMaterials().map((item) =>
      item.label === "中文简历" ? { ...item, completed: true } : item,
    ),
    progress: "等待简历终稿",
    priority: "高",
    notes: "补充校园社团增长项目数据。",
    status: "draft",
    processSteps: createDefaultProcessSteps(),
  },
  {
    id: "seed-2",
    company: "字节跳动",
    role: "前端开发校招",
    deadline: addDays(9),
    materialStatus: "已提交",
    materials: createDefaultMaterials(true),
    progress: "等待笔试通知",
    priority: "高",
    notes: "复习浏览器、React 和算法高频题。",
    status: "submitted",
    processSteps: createDefaultProcessSteps().map((step) =>
      step.id === "written"
        ? { ...step, date: addDays(4), result: "待参加", notes: "复习算法与浏览器基础。" }
        : step,
    ),
  },
  {
    id: "seed-3",
    company: "招商银行",
    role: "金融科技管培生",
    deadline: addDays(5),
    materialStatus: "已提交",
    materials: createDefaultMaterials(true).map((item) =>
      item.label === "推荐信" ? { ...item, completed: false } : item,
    ),
    progress: "一面已约",
    priority: "中",
    notes: "准备银行数字化案例。",
    status: "interview",
    processSteps: createDefaultProcessSteps().map((step) =>
      step.id === "written"
        ? { ...step, date: addDays(-1), result: "通过", notes: "行测部分时间较紧。" }
        : step.id === "first"
          ? { ...step, date: addDays(2), result: "已预约", notes: "准备金融科技案例。" }
          : step,
    ),
  },
  {
    id: "seed-4",
    company: "华为",
    role: "软件测试工程师",
    deadline: addDays(18),
    materialStatus: "已提交",
    materials: createDefaultMaterials(true),
    progress: "已收到录用意向",
    priority: "中",
    notes: "确认三方协议时间。",
    status: "offer",
    processSteps: createDefaultProcessSteps().map((step) => {
      if (step.id === "written") {
        return { ...step, date: addDays(-18), result: "通过", notes: "笔试完成。" };
      }
      if (step.id === "first") {
        return { ...step, date: addDays(-12), result: "通过", notes: "技术问题回答稳定。" };
      }
      if (step.id === "hr") {
        return { ...step, date: addDays(-6), result: "通过", notes: "沟通入职城市。" };
      }
      if (step.id === "offerTalk") {
        return { ...step, date: addDays(1), result: "沟通中", notes: "确认三方协议时间。" };
      }
      return step;
    }),
  },
  {
    id: "seed-5",
    company: "小米",
    role: "用户研究实习生",
    deadline: addDays(-2),
    materialStatus: "需补充",
    materials: createDefaultMaterials().map((item) =>
      item.label === "中文简历" || item.label === "作品集"
        ? { ...item, completed: true }
        : item,
    ),
    progress: "流程结束",
    priority: "低",
    notes: "复盘作品集呈现方式。",
    status: "rejected",
    processSteps: createDefaultProcessSteps().map((step) =>
      step.id === "first"
        ? { ...step, date: addDays(-8), result: "未通过", notes: "作品集案例讲解不够聚焦。" }
        : step,
    ),
  },
];

const createId = () => {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `application-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeMaterials = (materials: unknown, completed = false): MaterialItem[] => {
  if (!Array.isArray(materials)) {
    return createDefaultMaterials(completed);
  }

  const normalized = materials
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const material = item as Partial<MaterialItem>;
      if (!material.label) {
        return null;
      }

      return {
        id: material.id || material.label,
        label: material.label,
        completed: Boolean(material.completed),
      };
    })
    .filter((item): item is MaterialItem => Boolean(item));

  return normalized.length > 0 ? normalized : createDefaultMaterials(completed);
};

const normalizeProcessSteps = (steps: unknown): ProcessStep[] => {
  const source = Array.isArray(steps) ? steps : [];

  return processStepTemplates.map((template) => {
    const matched = source.find((step) => {
      if (!step || typeof step !== "object") {
        return false;
      }
      return (step as Partial<ProcessStep>).id === template.id;
    }) as Partial<ProcessStep> | undefined;

    return {
      ...template,
      date: matched?.date || "",
      result: matched?.result || "",
      notes: matched?.notes || "",
    };
  });
};

const normalizeApplication = (application: Partial<JobApplication>): JobApplication => {
  const materialStatus = materialOptions.includes(application.materialStatus as MaterialStatus)
    ? (application.materialStatus as MaterialStatus)
    : "准备中";
  const status = statuses.some((item) => item.id === application.status)
    ? (application.status as ApplicationStatus)
    : "draft";
  const priority = priorityOptions.includes(application.priority as Priority)
    ? (application.priority as Priority)
    : "中";

  return {
    id: application.id || createId(),
    company: application.company || "未命名公司",
    role: application.role || "未命名岗位",
    deadline: application.deadline || addDays(14),
    materialStatus,
    materials: normalizeMaterials(application.materials, materialStatus === "已提交"),
    progress: application.progress || "待更新",
    priority,
    notes: application.notes || "",
    status,
    processSteps: normalizeProcessSteps(application.processSteps),
  };
};

const readStoredApplications = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return seedApplications;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? (parsed as Partial<JobApplication>[]).map(normalizeApplication)
      : seedApplications;
  } catch {
    return seedApplications;
  }
};

const getDaysUntil = (deadline: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${deadline}T00:00:00`);
  const difference = target.getTime() - today.getTime();
  return Math.ceil(difference / 86_400_000);
};

const formatDeadline = (deadline: string, language: Language) => {
  const days = getDaysUntil(deadline);
  if (language === "en") {
    if (days < 0) {
      return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
    }
    if (days === 0) {
      return "Due today";
    }
    if (days === 1) {
      return "Due tomorrow";
    }
    return `Due in ${days} days`;
  }

  if (days < 0) {
    return `逾期 ${Math.abs(days)} 天`;
  }
  if (days === 0) {
    return "今天截止";
  }
  if (days === 1) {
    return "明天截止";
  }
  return `${days} 天后截止`;
};

const isUpcoming = (application: JobApplication) => {
  const days = getDaysUntil(application.deadline);
  const inactive = application.status === "offer" || application.status === "rejected";
  return !inactive && days <= 7;
};

const getStatusIndex = (status: ApplicationStatus) =>
  statuses.findIndex((item) => item.id === status);

const getMaterialProgress = (materials: MaterialItem[]) => {
  const completed = materials.filter((item) => item.completed).length;
  return {
    completed,
    total: materials.length,
    label: `${completed}/${materials.length}`,
  };
};

const toCalendarDate = (date: string) => date.replaceAll("-", "");

const getNextCalendarDate = (date: string) => {
  const nextDate = new Date(`${date}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString().slice(0, 10).replaceAll("-", "");
};

const toCalendarTimestamp = () =>
  new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const escapeCalendarText = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");

const readStoredUsers = () => {
  try {
    const stored = localStorage.getItem(AUTH_USERS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
};

const getDetailApplicationIdFromHash = () => {
  if (!window.location.hash.startsWith(DETAIL_HASH_PREFIX)) {
    return null;
  }

  return decodeURIComponent(window.location.hash.slice(DETAIL_HASH_PREFIX.length));
};

const clearDetailHash = () => {
  if (!window.location.hash.startsWith(DETAIL_HASH_PREFIX)) {
    return;
  }

  window.history.replaceState(null, "", window.location.pathname + window.location.search);
};

function App() {
  const [users, setUsers] = useState<StoredUser[]>(readStoredUsers);
  const [sessionEmail, setSessionEmail] = useState<string | null>(() =>
    localStorage.getItem(AUTH_SESSION_KEY),
  );
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState<AuthForm>({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(readLanguage);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readTheme);
  const [applications, setApplications] = useState<JobApplication[]>(readStoredApplications);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(
    getDetailApplicationIdFromHash,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortByDeadline, setSortByDeadline] = useState(false);
  const [boardView, setBoardView] = useState<BoardView>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof allFilterOption>(
    allFilterOption,
  );
  const [materialFilter, setMaterialFilter] = useState<
    MaterialStatus | typeof allFilterOption
  >(allFilterOption);
  const [customMaterialLabel, setCustomMaterialLabel] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const t = copy[language];
  const visibleStatuses = statusLabels[language];
  const visibleMaterials = materialStatusLabels[language];
  const visiblePriorities = priorityLabels[language];
  const visibleProcessSteps = processStepLabels[language];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeMode);
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    const syncDetailRoute = () => {
      setDetailApplicationId(getDetailApplicationIdFromHash());
    };

    window.addEventListener("hashchange", syncDetailRoute);
    syncDetailRoute();

    return () => window.removeEventListener("hashchange", syncDetailRoute);
  }, []);

  const currentUser =
    users.find((user) => user.email === sessionEmail?.toLowerCase()) || null;
  const currentUserName =
    currentUser?.email === "guest@local" ? t.guest : currentUser?.name || t.guest;

  const handleAuthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password.trim();
    const name = authForm.name.trim();

    if (!email || !password || (authMode === "register" && !name)) {
      setAuthError(t.fillAllFields);
      return;
    }

    if (authMode === "register") {
      if (users.some((user) => user.email === email)) {
        setAuthError(t.emailRegistered);
        return;
      }

      const nextUser = { name, email, password };
      setUsers((current) => [...current, nextUser]);
      localStorage.setItem(AUTH_SESSION_KEY, email);
      setSessionEmail(email);
      setIsAuthOpen(false);
      setAuthError("");
      setAuthForm({ name: "", email: "", password: "" });
      return;
    }

    const matchedUser = users.find(
      (user) => user.email === email && user.password === password,
    );

    if (!matchedUser) {
      setAuthError(t.wrongCredentials);
      return;
    }

    localStorage.setItem(AUTH_SESSION_KEY, matchedUser.email);
    setSessionEmail(matchedUser.email);
    setIsAuthOpen(false);
    setAuthError("");
    setAuthForm({ name: "", email: "", password: "" });
  };

  const loginAsGuest = () => {
    const guestUser = {
      name: "访客",
      email: "guest@local",
      password: "guest",
    };

    setUsers((current) =>
      current.some((user) => user.email === guestUser.email)
        ? current
        : [...current, guestUser],
    );
    localStorage.setItem(AUTH_SESSION_KEY, guestUser.email);
    setSessionEmail(guestUser.email);
    setIsAuthOpen(false);
    setAuthError("");
    setAuthForm({ name: "", email: "", password: "" });
  };

  const logout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setSessionEmail(null);
    setDetailApplicationId(null);
    setIsFormOpen(false);
    clearDetailHash();
  };

  const selectedApplication =
    applications.find((application) => application.id === detailApplicationId) || null;

  const visibleApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const viewApplications = applications.filter((application) => {
      if (boardView === "upcoming") {
        return isUpcoming(application);
      }
      if (boardView === "active") {
        return activeStatuses.includes(application.status);
      }
      if (boardView === "offer") {
        return application.status === "offer";
      }
      return true;
    });

    const filtered = viewApplications.filter((application) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          application.company,
          application.role,
          application.progress,
          application.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesPriority =
        priorityFilter === allFilterOption || application.priority === priorityFilter;
      const matchesMaterial =
        materialFilter === allFilterOption ||
        application.materialStatus === materialFilter;

      return matchesSearch && matchesPriority && matchesMaterial;
    });

    if (!sortByDeadline) {
      return filtered;
    }

    return [...filtered].sort(
      (a, b) =>
        new Date(`${a.deadline}T00:00:00`).getTime() -
        new Date(`${b.deadline}T00:00:00`).getTime(),
    );
  }, [
    applications,
    boardView,
    materialFilter,
    priorityFilter,
    searchTerm,
    sortByDeadline,
  ]);

  const groupedApplications = useMemo(() => {
    return statuses.reduce(
      (acc, status) => {
        acc[status.id] = visibleApplications.filter(
          (application) => application.status === status.id,
        );
        return acc;
      },
      {} as Record<ApplicationStatus, JobApplication[]>,
    );
  }, [visibleApplications]);

  const metrics = useMemo(() => {
    return {
      total: applications.length,
      upcoming: applications.filter(isUpcoming).length,
      active: applications.filter(
        (item) => item.status !== "offer" && item.status !== "rejected",
      ).length,
      offers: applications.filter((item) => item.status === "offer").length,
    };
  }, [applications]);

  const viewTitles: Record<BoardView, string> = {
    all: t.all,
    upcoming: t.upcomingDeadlines,
    active: t.inProgress,
    offer: t.offers,
  };

  const switchBoardView = (view: BoardView) => {
    setBoardView(view);
    setDetailApplicationId(null);
    clearDetailHash();
    window.setTimeout(() => {
      document
        .querySelector(".board, .deadline-list")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const openCreateForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setCustomMaterialLabel("");
    setIsFormOpen(true);
  };

  const openEditForm = (application: JobApplication) => {
    const { id: _id, ...formValue } = application;
    setForm(formValue);
    setEditingId(application.id);
    setCustomMaterialLabel("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setCustomMaterialLabel("");
    setIsFormOpen(false);
  };

  const saveApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedForm = {
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      progress: form.progress.trim(),
      notes: form.notes.trim(),
      materials: form.materials.map((item) => ({
        ...item,
        label: item.label.trim(),
      })),
      processSteps: form.processSteps.map((step) => ({
        ...step,
        result: step.result.trim(),
        notes: step.notes.trim(),
      })),
    };

    if (!normalizedForm.company || !normalizedForm.role) {
      return;
    }

    normalizedForm.materials = normalizedForm.materials.filter((item) => item.label);

    if (editingId) {
      setApplications((current) =>
        current.map((application) =>
          application.id === editingId
            ? { ...application, ...normalizedForm }
            : application,
        ),
      );
    } else {
      setApplications((current) => [
        { id: createId(), ...normalizedForm },
        ...current,
      ]);
    }

    closeForm();
  };

  const deleteApplication = (id: string) => {
    setApplications((current) => current.filter((application) => application.id !== id));
    if (detailApplicationId === id) {
      setDetailApplicationId(null);
      clearDetailHash();
    }
    if (editingId === id) {
      closeForm();
    }
  };

  const updateApplicationStatus = (id: string, status: ApplicationStatus) => {
    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    );
  };

  const toggleApplicationMaterial = (applicationId: string, materialId: string) => {
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              materials: application.materials.map((material) =>
                material.id === materialId
                  ? { ...material, completed: !material.completed }
                  : material,
              ),
            }
          : application,
      ),
    );
  };

  const toggleFormMaterial = (materialId: string) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === materialId
          ? { ...material, completed: !material.completed }
          : material,
      ),
    }));
  };

  const addCustomMaterial = () => {
    const label = customMaterialLabel.trim();
    if (!label) {
      return;
    }

    setForm((current) => ({
      ...current,
      materials: [
        ...current.materials,
        {
          id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          label,
          completed: false,
        },
      ],
    }));
    setCustomMaterialLabel("");
  };

  const removeFormMaterial = (materialId: string) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.filter((material) => material.id !== materialId),
    }));
  };

  const exportCalendarEvents = () => {
    const timestamp = toCalendarTimestamp();
    const events = applications.flatMap((application) => {
      const deadlineEvent = {
        uid: `${application.id}-deadline`,
        date: application.deadline,
        summary: `DDL：${application.company} ${application.role}`,
        description: [
          `公司：${application.company}`,
          `岗位：${application.role}`,
          `材料状态：${application.materialStatus}`,
          `当前进度：${application.progress}`,
          application.notes ? `备注：${application.notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };

      const processEvents = application.processSteps
        .filter((step) => step.date)
        .map((step) => ({
          uid: `${application.id}-${step.id}`,
          date: step.date,
          summary: `${step.title}：${application.company} ${application.role}`,
          description: [
            `公司：${application.company}`,
            `岗位：${application.role}`,
            `流程：${step.title}`,
            step.result ? `结果：${step.result}` : "结果：待更新",
            step.notes ? `备注：${step.notes}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        }));

      return [deadlineEvent, ...processEvents];
    });

    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Campus Application Board//Job Calendar//CN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events.flatMap((event) => [
        "BEGIN:VEVENT",
        `UID:${event.uid}@campus-application-board`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${toCalendarDate(event.date)}`,
        `DTEND;VALUE=DATE:${getNextCalendarDate(event.date)}`,
        `SUMMARY:${escapeCalendarText(event.summary)}`,
        `DESCRIPTION:${escapeCalendarText(event.description)}`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `job-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
      link.click();
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setFeedbackMessage(
      `${t.calendarFeedbackPrefix} ${events.length} ${t.calendarFeedbackSuffix}`,
    );
  };

  const moveApplication = (id: string, direction: -1 | 1) => {
    const application = applications.find((item) => item.id === id);
    if (!application) {
      return;
    }

    const nextIndex = getStatusIndex(application.status) + direction;
    const nextStatus = statuses[nextIndex]?.id;
    if (nextStatus) {
      updateApplicationStatus(id, nextStatus);
    }
  };

  const handleDrop = (status: ApplicationStatus) => {
    if (draggedId) {
      updateApplicationStatus(draggedId, status);
      setDraggedId(null);
    }
  };

  const openApplicationDetail = (applicationId: string) => {
    setDetailApplicationId(applicationId);
    setIsFormOpen(false);
    window.location.hash = `${DETAIL_HASH_PREFIX}${encodeURIComponent(applicationId)}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderApplicationCard = (application: JobApplication) => (
    <article
      className={`application-card priority-${application.priority}`}
      key={application.id}
      role="button"
      tabIndex={0}
      onClick={() => openApplicationDetail(application.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openApplicationDetail(application.id);
        }
      }}
    >
      <div
        className="card-heading drag-handle"
        draggable
        onDragStart={() => setDraggedId(application.id)}
        onDragEnd={() => setDraggedId(null)}
        title={t.dragToColumn}
      >
        <div>
          <h3>{application.company}</h3>
          <p>{application.role}</p>
        </div>
        <span className="priority-badge">{visiblePriorities[application.priority]}</span>
      </div>

      <dl className="card-details">
        <div>
          <dt>{t.deadline}</dt>
          <dd>
            <span
              className={getDaysUntil(application.deadline) <= 3 ? "deadline hot" : "deadline"}
            >
              {application.deadline}
            </span>
            <small>{formatDeadline(application.deadline, language)}</small>
          </dd>
        </div>
        <div>
          <dt>{t.materialStatus}</dt>
          <dd>{visibleMaterials[application.materialStatus]}</dd>
        </div>
        <div>
          <dt>{t.progress}</dt>
          <dd>{application.progress}</dd>
        </div>
        <div>
          <dt>{t.notes}</dt>
          <dd>{application.notes || t.noNotes}</dd>
        </div>
      </dl>

      <div className="card-actions">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            moveApplication(application.id, -1);
          }}
        >
          {t.movePrevious}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            moveApplication(application.id, 1);
          }}
        >
          {t.moveNext}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openEditForm(application);
          }}
        >
          {t.edit}
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={(event) => {
            event.stopPropagation();
            deleteApplication(application.id);
          }}
        >
          {t.delete}
        </button>
      </div>
    </article>
  );

  const topNavigation = (
    <header className="app-top-nav" aria-label={t.boardActions}>
      <div>
        <strong>{t.appName}</strong>
        <span>{currentUserName}</span>
      </div>

      <div className="top-nav-actions">
        <label>
          {t.language}
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          {t.theme}
          <select
            value={themeMode}
            onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
          >
            <option value="system">{t.system}</option>
            <option value="light">{t.light}</option>
            <option value="dark">{t.dark}</option>
          </select>
        </label>

        {currentUser ? (
          <button type="button" onClick={logout}>
            {t.logout}
          </button>
        ) : (
          <button type="button" onClick={() => setIsAuthOpen(true)}>
            {t.login}
          </button>
        )}
      </div>
    </header>
  );

  const authDialog = isAuthOpen && (
    <AuthScreen
      mode={authMode}
      form={authForm}
      error={authError}
      onModeChange={(mode) => {
        setAuthMode(mode);
        setAuthError("");
      }}
      onFormChange={setAuthForm}
      onSubmit={handleAuthSubmit}
      onGuestLogin={loginAsGuest}
      onClose={() => setIsAuthOpen(false)}
      t={t}
    />
  );

  if (selectedApplication) {
    const materialProgress = getMaterialProgress(selectedApplication.materials);

    return (
      <main className="app-shell detail-shell">
        {topNavigation}
        <button
          type="button"
          className="back-button"
          onClick={() => {
            if (window.location.hash.startsWith(DETAIL_HASH_PREFIX)) {
              window.history.back();
              return;
            }
            setDetailApplicationId(null);
          }}
        >
          {t.backToBoard}
        </button>

        <section className="detail-hero" aria-labelledby="detail-title">
          <div>
            <p className="eyebrow">{visibleStatuses[selectedApplication.status].title}</p>
            <h1 id="detail-title">{selectedApplication.company}</h1>
            <p className="subtitle">{selectedApplication.role}</p>
          </div>
          <span className="priority-badge detail-priority">
            {visiblePriorities[selectedApplication.priority]}
          </span>
        </section>

        <section className="detail-grid" aria-label={t.detailLabel}>
          <article className="detail-panel">
            <h2>{t.progressInfo}</h2>
            <dl className="detail-list">
              <div>
                <dt>{t.deadline}</dt>
                <dd>
                  <span
                    className={
                      getDaysUntil(selectedApplication.deadline) <= 3
                        ? "deadline hot"
                        : "deadline"
                    }
                  >
                    {selectedApplication.deadline}
                  </span>
                  <small>{formatDeadline(selectedApplication.deadline, language)}</small>
                </dd>
              </div>
              <div>
                <dt>{t.materialStatus}</dt>
                <dd>{visibleMaterials[selectedApplication.materialStatus]}</dd>
              </div>
              <div>
                <dt>{t.progress}</dt>
                <dd>{selectedApplication.progress}</dd>
              </div>
              <div>
                <dt>{t.notes}</dt>
                <dd>{selectedApplication.notes || t.noNotes}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-panel">
            <div className="section-heading">
              <h2>{t.materialsChecklist}</h2>
              <span>{materialProgress.label}</span>
            </div>
            <div className="detail-materials">
              {selectedApplication.materials.map((material) => (
                <label key={material.id} className="material-chip">
                  <input
                    type="checkbox"
                    checked={material.completed}
                    onChange={() =>
                      toggleApplicationMaterial(selectedApplication.id, material.id)
                    }
                  />
                  <span>{material.label}</span>
                </label>
              ))}
            </div>
          </article>
        </section>

        <section className="detail-panel detail-timeline-panel" aria-label={t.interviewProcess}>
          <h2>{t.interviewProcess}</h2>
          <div className="timeline-list">
            {selectedApplication.processSteps.map((step) => (
              <article className="timeline-item" key={step.id}>
                <div>
                  <h3>{visibleProcessSteps[step.id]}</h3>
                  <p>{step.date || t.notScheduled}</p>
                </div>
                <dl>
                  <div>
                    <dt>{t.result}</dt>
                    <dd>{step.result || t.pendingUpdate}</dd>
                  </div>
                  <div>
                    <dt>{t.notes}</dt>
                    <dd>{step.notes || t.noNotes}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="detail-actions" aria-label={t.detailActions}>
          <button
            type="button"
            onClick={() => moveApplication(selectedApplication.id, -1)}
          >
            {t.movePrevious}
          </button>
          <button
            type="button"
            onClick={() => moveApplication(selectedApplication.id, 1)}
          >
            {t.moveNext}
          </button>
          <button type="button" onClick={() => openEditForm(selectedApplication)}>
            {t.edit}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => deleteApplication(selectedApplication.id)}
          >
            {t.delete}
          </button>
        </section>

        {isFormOpen && (
          <ApplicationFormPanel
            editingId={editingId}
            form={form}
            customMaterialLabel={customMaterialLabel}
            setForm={setForm}
            setCustomMaterialLabel={setCustomMaterialLabel}
            closeForm={closeForm}
            saveApplication={saveApplication}
            toggleFormMaterial={toggleFormMaterial}
            removeFormMaterial={removeFormMaterial}
            addCustomMaterial={addCustomMaterial}
            t={t}
            language={language}
            visibleStatuses={visibleStatuses}
            visibleMaterials={visibleMaterials}
            visiblePriorities={visiblePriorities}
            visibleProcessSteps={visibleProcessSteps}
          />
        )}
        {authDialog}
      </main>
    );
  }

  return (
    <main className="app-shell">
      {topNavigation}
      <section className="top-bar" aria-labelledby="page-title">
        <div className="title-group">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 id="page-title">{t.appName}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>

        <div className="campus-photo">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
            alt="校园学生讨论求职计划"
          />
        </div>
      </section>

      <section className="dashboard" aria-label={t.overviewLabel}>
        <button
          type="button"
          className={boardView === "all" ? "metric is-active" : "metric"}
          onClick={() => switchBoardView("all")}
        >
          <span>{t.totalApplications}</span>
          <strong>{metrics.total}</strong>
        </button>
        <button
          type="button"
          className={
            boardView === "upcoming" ? "metric urgent is-active" : "metric urgent"
          }
          onClick={() => switchBoardView("upcoming")}
        >
          <span>{t.upcomingDeadlines}</span>
          <strong>{metrics.upcoming}</strong>
        </button>
        <button
          type="button"
          className={boardView === "active" ? "metric is-active" : "metric"}
          onClick={() => switchBoardView("active")}
        >
          <span>{t.inProgress}</span>
          <strong>{metrics.active}</strong>
        </button>
        <button
          type="button"
          className={boardView === "offer" ? "metric success is-active" : "metric success"}
          onClick={() => switchBoardView("offer")}
        >
          <span>{t.offers}</span>
          <strong>{metrics.offers}</strong>
        </button>
      </section>

      <section className="toolbar" aria-label={t.boardActions}>
        <div className="toolbar-actions">
          <button type="button" className="primary-button" onClick={openCreateForm}>
            {t.addApplication}
          </button>
          <button
            type="button"
            className={boardView === "upcoming" ? "filter-button is-active" : "filter-button"}
            onClick={() =>
              setBoardView((current) => (current === "upcoming" ? "all" : "upcoming"))
            }
          >
            {boardView === "upcoming" ? t.showAll : t.filterUpcoming}
          </button>
          <button type="button" className="filter-button" onClick={exportCalendarEvents}>
            {t.calendar}
          </button>
        </div>

        <div className="filter-grid">
          <label>
            {t.search}
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>

          <label>
            {t.priority}
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as Priority | typeof allFilterOption)
              }
            >
              <option value={allFilterOption}>{t.all}</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {visiblePriorities[priority]}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t.materialStatus}
            <select
              value={materialFilter}
              onChange={(event) =>
                setMaterialFilter(
                  event.target.value as MaterialStatus | typeof allFilterOption,
                )
              }
            >
              <option value={allFilterOption}>{t.all}</option>
              {materialOptions.map((option) => (
                <option key={option} value={option}>
                  {visibleMaterials[option]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={sortByDeadline ? "filter-button is-active" : "filter-button"}
            onClick={() => setSortByDeadline((current) => !current)}
          >
            {sortByDeadline ? t.backToBoardView : t.sortByDeadline}
          </button>
        </div>
      </section>
      {feedbackMessage && <p className="feedback-message">{feedbackMessage}</p>}

      <section className="view-banner" aria-label={t.currentPage}>
        <div>
          <span>{t.currentPage}</span>
          <strong>{viewTitles[boardView]}</strong>
        </div>
        {boardView !== "all" && (
          <button type="button" onClick={() => switchBoardView("all")}>
            {t.backToAll}
          </button>
        )}
      </section>

      {sortByDeadline ? (
        <section className="deadline-list" aria-label={t.deadlineSortTitle}>
          <div className="column-header">
            <div>
              <p>DDL</p>
              <h2>{t.deadlineSortTitle}</h2>
            </div>
            <span>{visibleApplications.length}</span>
          </div>
          <div className="deadline-card-list">
            {visibleApplications.map(renderApplicationCard)}
            {visibleApplications.length === 0 && (
              <div className="empty-state">{t.noMatchedApplications}</div>
            )}
          </div>
        </section>
      ) : (
        <section className="board" aria-label={t.statusBoardLabel}>
          {statuses.map((status) => (
            <section
              className="board-column"
              key={status.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(status.id)}
              aria-label={visibleStatuses[status.id].title}
            >
              <div className="column-header">
                <div>
                  <p>{visibleStatuses[status.id].shortTitle}</p>
                  <h2>{visibleStatuses[status.id].title}</h2>
                </div>
                <span>{groupedApplications[status.id].length}</span>
              </div>

              <div className="card-list">
                {groupedApplications[status.id].map(renderApplicationCard)}

                {groupedApplications[status.id].length === 0 && (
                  <div className="empty-state">
                    {t.noStatusApplicationsPrefix}
                    {language === "zh" ? visibleStatuses[status.id].title : ` ${visibleStatuses[status.id].title} `}
                    {t.noStatusApplicationsSuffix}
                  </div>
                )}
              </div>
            </section>
          ))}
        </section>
      )}

      {isFormOpen && (
        <ApplicationFormPanel
          editingId={editingId}
          form={form}
          customMaterialLabel={customMaterialLabel}
          setForm={setForm}
          setCustomMaterialLabel={setCustomMaterialLabel}
          closeForm={closeForm}
          saveApplication={saveApplication}
          toggleFormMaterial={toggleFormMaterial}
          removeFormMaterial={removeFormMaterial}
          addCustomMaterial={addCustomMaterial}
          t={t}
          language={language}
          visibleStatuses={visibleStatuses}
          visibleMaterials={visibleMaterials}
          visiblePriorities={visiblePriorities}
          visibleProcessSteps={visibleProcessSteps}
        />
      )}
      {authDialog}
    </main>
  );
}

type AuthScreenProps = {
  mode: AuthMode;
  form: AuthForm;
  error: string;
  onModeChange: (mode: AuthMode) => void;
  onFormChange: Dispatch<SetStateAction<AuthForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGuestLogin: () => void;
  onClose: () => void;
  t: (typeof copy)[Language];
};

function AuthScreen({
  mode,
  form,
  error,
  onModeChange,
  onFormChange,
  onSubmit,
  onGuestLogin,
  onClose,
  t,
}: AuthScreenProps) {
  const isRegister = mode === "register";

  return (
    <div className="auth-shell" role="presentation">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-header">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 id="auth-title">{t.appName}</h1>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.closeLogin}>
            x
          </button>
        </div>
        <div>
          <p className="subtitle">{t.authSubtitle}</p>
        </div>

        <div className="auth-tabs" aria-label={t.authModeLabel}>
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => onModeChange("login")}
          >
            {t.login}
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => onModeChange("register")}
          >
            {t.register}
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {isRegister && (
            <label>
              {t.nickname}
              <input
                value={form.name}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={t.nicknamePlaceholder}
              />
            </label>
          )}

          <label>
            {t.email}
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="name@example.com"
            />
          </label>

          <label>
            {t.password}
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, password: event.target.value }))
              }
              placeholder={t.passwordPlaceholder}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="primary-button">
            {isRegister ? t.registerAndEnter : t.login}
          </button>
          <button type="button" className="guest-button" onClick={onGuestLogin}>
            {t.guestLogin}
          </button>
        </form>

        <p className="auth-note">{t.authNote}</p>
      </section>
    </div>
  );
}

type ApplicationFormPanelProps = {
  editingId: string | null;
  form: ApplicationForm;
  customMaterialLabel: string;
  setForm: Dispatch<SetStateAction<ApplicationForm>>;
  setCustomMaterialLabel: Dispatch<SetStateAction<string>>;
  closeForm: () => void;
  saveApplication: (event: FormEvent<HTMLFormElement>) => void;
  toggleFormMaterial: (materialId: string) => void;
  removeFormMaterial: (materialId: string) => void;
  addCustomMaterial: () => void;
  t: (typeof copy)[Language];
  language: Language;
  visibleStatuses: Record<ApplicationStatus, { title: string; shortTitle: string }>;
  visibleMaterials: Record<MaterialStatus, string>;
  visiblePriorities: Record<Priority, string>;
  visibleProcessSteps: Record<ProcessStepId, string>;
};

function ApplicationFormPanel({
  editingId,
  form,
  customMaterialLabel,
  setForm,
  setCustomMaterialLabel,
  closeForm,
  saveApplication,
  toggleFormMaterial,
  removeFormMaterial,
  addCustomMaterial,
  t,
  language,
  visibleStatuses,
  visibleMaterials,
  visiblePriorities,
  visibleProcessSteps,
}: ApplicationFormPanelProps) {
  const updateProcessStep = (
    stepId: ProcessStepId,
    patch: Partial<Pick<ProcessStep, "date" | "result" | "notes">>,
  ) => {
    setForm((current) => ({
      ...current,
      processSteps: current.processSteps.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step,
      ),
    }));
  };

  return (
    <div className="form-backdrop" role="presentation">
      <section className="application-form-panel" aria-label={t.formLabel}>
        <div className="form-heading">
          <div>
            <p>{editingId ? t.updateRecord : t.createRecord}</p>
            <h2>{editingId ? t.editApplication : t.addApplication}</h2>
          </div>
          <button type="button" className="icon-button" onClick={closeForm} aria-label={t.closeForm}>
            x
          </button>
        </div>

        <form onSubmit={saveApplication}>
          <label>
            {t.companyName}
            <input
              required
              value={form.company}
              onChange={(event) =>
                setForm((current) => ({ ...current, company: event.target.value }))
              }
              placeholder={t.companyPlaceholder}
            />
          </label>

          <label>
            {t.roleName}
            <input
              required
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
              placeholder={t.rolePlaceholder}
            />
          </label>

          <div className="form-row">
            <label>
              {t.deadline}
              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deadline: event.target.value }))
                }
              />
            </label>

            <label>
              {t.priority}
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as Priority,
                  }))
                }
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {visiblePriorities[priority]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              {t.materialStatus}
              <select
                value={form.materialStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    materialStatus: event.target.value as MaterialStatus,
                  }))
                }
              >
                {materialOptions.map((option) => (
                  <option key={option} value={option}>
                    {visibleMaterials[option]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.currentStatus}
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as ApplicationStatus,
                  }))
                }
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {visibleStatuses[status.id].title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {t.progress}
            <input
              value={form.progress}
              onChange={(event) =>
                setForm((current) => ({ ...current, progress: event.target.value }))
              }
              placeholder={t.progressPlaceholder}
            />
          </label>

          <section className="form-section" aria-label={t.materialsChecklist}>
            <div className="section-heading">
              <h3>{t.materialsChecklist}</h3>
              <span>{getMaterialProgress(form.materials).label}</span>
            </div>

            <div className="form-material-list">
              {form.materials.map((material) => (
                <div className="form-material-item" key={material.id}>
                  <label className="material-chip">
                    <input
                      type="checkbox"
                      checked={material.completed}
                      onChange={() => toggleFormMaterial(material.id)}
                    />
                    <span>{material.label}</span>
                  </label>
                  <button
                    type="button"
                    className="remove-material-button"
                    onClick={() => removeFormMaterial(material.id)}
                  >
                    {t.remove}
                  </button>
                </div>
              ))}
            </div>

            <div className="add-material-row">
              <input
                value={customMaterialLabel}
                onChange={(event) => setCustomMaterialLabel(event.target.value)}
                placeholder={t.addCustomMaterial}
              />
              <button type="button" onClick={addCustomMaterial}>
                {t.add}
              </button>
            </div>
          </section>

          <section className="form-section" aria-label={t.interviewProcess}>
            <div className="section-heading">
              <h3>{t.interviewProcess}</h3>
              <span>{language === "zh" ? "5 步" : "5 steps"}</span>
            </div>

            <div className="process-form-list">
              {form.processSteps.map((step) => (
                <article className="process-form-item" key={step.id}>
                  <h4>{visibleProcessSteps[step.id]}</h4>
                  <div className="form-row">
                    <label>
                      {t.time}
                      <input
                        type="date"
                        value={step.date}
                        onChange={(event) =>
                          updateProcessStep(step.id, { date: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t.result}
                      <input
                        value={step.result}
                        onChange={(event) =>
                          updateProcessStep(step.id, { result: event.target.value })
                        }
                        placeholder={t.resultPlaceholder}
                      />
                    </label>
                  </div>
                  <label>
                    {t.notes}
                    <textarea
                      rows={2}
                      value={step.notes}
                      onChange={(event) =>
                        updateProcessStep(step.id, { notes: event.target.value })
                      }
                      placeholder={t.processNotesPlaceholder}
                    />
                  </label>
                </article>
              ))}
            </div>
          </section>

          <label>
            {t.notes}
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder={t.notesPlaceholder}
            />
          </label>

          <div className="form-actions">
            <button type="button" onClick={closeForm}>
              {t.cancel}
            </button>
            <button type="submit" className="primary-button">
              {t.saveApplication}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;
