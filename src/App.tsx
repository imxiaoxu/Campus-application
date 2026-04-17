import {
  ChangeEvent,
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

const formatDeadline = (deadline: string) => {
  const days = getDaysUntil(deadline);
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

function App() {
  const [applications, setApplications] = useState<JobApplication[]>(readStoredApplications);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortByDeadline, setSortByDeadline] = useState(true);
  const [boardView, setBoardView] = useState<BoardView>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof allFilterOption>(
    allFilterOption,
  );
  const [materialFilter, setMaterialFilter] = useState<
    MaterialStatus | typeof allFilterOption
  >(allFilterOption);
  const [customMaterialLabel, setCustomMaterialLabel] = useState("");
  const [importFeedback, setImportFeedback] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

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
    all: "全部申请",
    upcoming: "即将截止",
    active: "推进中",
    offer: "录用",
  };

  const switchBoardView = (view: BoardView) => {
    setBoardView(view);
    setDetailApplicationId(null);
    window.setTimeout(() => {
      document.querySelector(".board")?.scrollIntoView({ behavior: "smooth" });
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

  const exportApplications = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        applications,
      },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-applications-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setImportFeedback("已导出当前申请数据。");
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
    setImportFeedback(
      `已打开 ${events.length} 个日历事件。若浏览器未弹出日历，请在下载记录中打开 .ics 文件导入。`,
    );
  };

  const importApplications = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const rawApplications = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.applications)
            ? parsed.applications
            : null;

        if (!rawApplications) {
          throw new Error("Invalid import file");
        }

        const imported = (rawApplications as Partial<JobApplication>[]).map(
          normalizeApplication,
        );
        setApplications(imported);
        setImportFeedback(`已导入 ${imported.length} 条申请数据。`);
      } catch {
        setImportFeedback("导入失败，请选择有效的申请数据 JSON 文件。");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedApplication) {
    const materialProgress = getMaterialProgress(selectedApplication.materials);

    return (
      <main className="app-shell detail-shell">
        <button
          type="button"
          className="back-button"
          onClick={() => setDetailApplicationId(null)}
        >
          返回看板
        </button>

        <section className="detail-hero" aria-labelledby="detail-title">
          <div>
            <p className="eyebrow">{statusTitles[selectedApplication.status]}</p>
            <h1 id="detail-title">{selectedApplication.company}</h1>
            <p className="subtitle">{selectedApplication.role}</p>
          </div>
          <span className="priority-badge detail-priority">
            {selectedApplication.priority}
          </span>
        </section>

        <section className="detail-grid" aria-label="申请详情">
          <article className="detail-panel">
            <h2>进度信息</h2>
            <dl className="detail-list">
              <div>
                <dt>截止日期</dt>
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
                  <small>{formatDeadline(selectedApplication.deadline)}</small>
                </dd>
              </div>
              <div>
                <dt>材料状态</dt>
                <dd>{selectedApplication.materialStatus}</dd>
              </div>
              <div>
                <dt>当前进度</dt>
                <dd>{selectedApplication.progress}</dd>
              </div>
              <div>
                <dt>备注</dt>
                <dd>{selectedApplication.notes || "暂无备注"}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-panel">
            <div className="section-heading">
              <h2>申请材料 checklist</h2>
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

        <section className="detail-panel detail-timeline-panel" aria-label="面试流程">
          <h2>面试流程</h2>
          <div className="timeline-list">
            {selectedApplication.processSteps.map((step) => (
              <article className="timeline-item" key={step.id}>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.date || "未安排"}</p>
                </div>
                <dl>
                  <div>
                    <dt>结果</dt>
                    <dd>{step.result || "待更新"}</dd>
                  </div>
                  <div>
                    <dt>备注</dt>
                    <dd>{step.notes || "暂无备注"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="detail-actions" aria-label="详情操作">
          <button
            type="button"
            onClick={() => moveApplication(selectedApplication.id, -1)}
          >
            前移
          </button>
          <button
            type="button"
            onClick={() => moveApplication(selectedApplication.id, 1)}
          >
            后移
          </button>
          <button type="button" onClick={() => openEditForm(selectedApplication)}>
            编辑
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => deleteApplication(selectedApplication.id)}
          >
            删除
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
          />
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="top-bar" aria-labelledby="page-title">
        <div className="title-group">
          <p className="eyebrow">校园招聘</p>
          <h1 id="page-title">求职申请管理看板</h1>
          <p className="subtitle">
            统一管理岗位截止日期、材料状态和面试进度。
          </p>
        </div>

        <div className="campus-photo">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
            alt="校园学生讨论求职计划"
          />
        </div>
      </section>

      <section className="dashboard" aria-label="求职申请概览">
        <button
          type="button"
          className={boardView === "all" ? "metric is-active" : "metric"}
          onClick={() => switchBoardView("all")}
        >
          <span>申请总数</span>
          <strong>{metrics.total}</strong>
        </button>
        <button
          type="button"
          className={
            boardView === "upcoming" ? "metric urgent is-active" : "metric urgent"
          }
          onClick={() => switchBoardView("upcoming")}
        >
          <span>即将截止</span>
          <strong>{metrics.upcoming}</strong>
        </button>
        <button
          type="button"
          className={boardView === "active" ? "metric is-active" : "metric"}
          onClick={() => switchBoardView("active")}
        >
          <span>推进中</span>
          <strong>{metrics.active}</strong>
        </button>
        <button
          type="button"
          className={boardView === "offer" ? "metric success is-active" : "metric success"}
          onClick={() => switchBoardView("offer")}
        >
          <span>录用</span>
          <strong>{metrics.offers}</strong>
        </button>
      </section>

      <section className="toolbar" aria-label="看板操作">
        <div className="toolbar-actions">
          <button type="button" className="primary-button" onClick={openCreateForm}>
            新增申请
          </button>
          <button
            type="button"
            className={boardView === "upcoming" ? "filter-button is-active" : "filter-button"}
            onClick={() =>
              setBoardView((current) => (current === "upcoming" ? "all" : "upcoming"))
            }
          >
            {boardView === "upcoming" ? "显示全部" : "筛选即将截止"}
          </button>
          <button type="button" className="filter-button" onClick={exportApplications}>
            导出数据
          </button>
          <button type="button" className="filter-button" onClick={exportCalendarEvents}>
            打开日历
          </button>
          <label className="import-button">
            导入数据
            <input type="file" accept="application/json" onChange={importApplications} />
          </label>
        </div>

        <div className="filter-grid">
          <label>
            搜索
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="公司、岗位、进度或备注"
            />
          </label>

          <label>
            优先级
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as Priority | typeof allFilterOption)
              }
            >
              <option>{allFilterOption}</option>
              {priorityOptions.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            材料状态
            <select
              value={materialFilter}
              onChange={(event) =>
                setMaterialFilter(
                  event.target.value as MaterialStatus | typeof allFilterOption,
                )
              }
            >
              <option>{allFilterOption}</option>
              {materialOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="switch-control">
            <input
              type="checkbox"
              checked={sortByDeadline}
              onChange={(event) => setSortByDeadline(event.target.checked)}
            />
            <span>按截止日期排序</span>
          </label>
        </div>
      </section>
      {importFeedback && <p className="feedback-message">{importFeedback}</p>}

      <section className="view-banner" aria-label="当前看板页面">
        <div>
          <span>当前页面</span>
          <strong>{viewTitles[boardView]}</strong>
        </div>
        {boardView !== "all" && (
          <button type="button" onClick={() => switchBoardView("all")}>
            返回全部
          </button>
        )}
      </section>

      <section className="board" aria-label="申请状态看板">
        {statuses.map((status) => (
          <section
            className="board-column"
            key={status.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(status.id)}
            aria-label={status.title}
          >
            <div className="column-header">
              <div>
                <p>{status.shortTitle}</p>
                <h2>{status.title}</h2>
              </div>
              <span>{groupedApplications[status.id].length}</span>
            </div>

            <div className="card-list">
              {groupedApplications[status.id].map((application) => (
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
                    title="拖拽到其他状态列"
                  >
                    <div>
                      <h3>{application.company}</h3>
                      <p>{application.role}</p>
                    </div>
                    <span className="priority-badge">{application.priority}</span>
                  </div>

                  <dl className="card-details">
                    <div>
                      <dt>截止日期</dt>
                      <dd>
                        <span className={getDaysUntil(application.deadline) <= 3 ? "deadline hot" : "deadline"}>
                          {application.deadline}
                        </span>
                        <small>{formatDeadline(application.deadline)}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>材料状态</dt>
                      <dd>{application.materialStatus}</dd>
                    </div>
                    <div>
                      <dt>当前进度</dt>
                      <dd>{application.progress}</dd>
                    </div>
                    <div>
                      <dt>备注</dt>
                      <dd>{application.notes || "暂无备注"}</dd>
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
                      前移
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveApplication(application.id, 1);
                      }}
                    >
                      后移
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditForm(application);
                      }}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteApplication(application.id);
                      }}
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))}

              {groupedApplications[status.id].length === 0 && (
                <div className="empty-state">暂无{status.title}申请</div>
              )}
            </div>
          </section>
        ))}
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
        />
      )}
    </main>
  );
}

const statusTitles = statuses.reduce(
  (acc, status) => ({ ...acc, [status.id]: status.title }),
  {} as Record<ApplicationStatus, string>,
);

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
      <section className="application-form-panel" aria-label="申请表单">
        <div className="form-heading">
          <div>
            <p>{editingId ? "更新记录" : "新增岗位"}</p>
            <h2>{editingId ? "编辑申请" : "新增申请"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={closeForm} aria-label="关闭表单">
            x
          </button>
        </div>

        <form onSubmit={saveApplication}>
          <label>
            公司名称
            <input
              required
              value={form.company}
              onChange={(event) =>
                setForm((current) => ({ ...current, company: event.target.value }))
              }
              placeholder="例如：阿里巴巴"
            />
          </label>

          <label>
            岗位名称
            <input
              required
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
              placeholder="例如：数据分析实习生"
            />
          </label>

          <div className="form-row">
            <label>
              截止日期
              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deadline: event.target.value }))
                }
              />
            </label>

            <label>
              优先级
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
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              材料提交状态
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
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              当前状态
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
                    {status.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            当前进度
            <input
              value={form.progress}
              onChange={(event) =>
                setForm((current) => ({ ...current, progress: event.target.value }))
              }
              placeholder="例如：等待 HR 电话面试"
            />
          </label>

          <section className="form-section" aria-label="申请材料清单">
            <div className="section-heading">
              <h3>申请材料 checklist</h3>
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
                    移除
                  </button>
                </div>
              ))}
            </div>

            <div className="add-material-row">
              <input
                value={customMaterialLabel}
                onChange={(event) => setCustomMaterialLabel(event.target.value)}
                placeholder="添加自定义材料"
              />
              <button type="button" onClick={addCustomMaterial}>
                添加
              </button>
            </div>
          </section>

          <section className="form-section" aria-label="面试流程">
            <div className="section-heading">
              <h3>面试流程</h3>
              <span>5 步</span>
            </div>

            <div className="process-form-list">
              {form.processSteps.map((step) => (
                <article className="process-form-item" key={step.id}>
                  <h4>{step.title}</h4>
                  <div className="form-row">
                    <label>
                      时间
                      <input
                        type="date"
                        value={step.date}
                        onChange={(event) =>
                          updateProcessStep(step.id, { date: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      结果
                      <input
                        value={step.result}
                        onChange={(event) =>
                          updateProcessStep(step.id, { result: event.target.value })
                        }
                        placeholder="例如：通过 / 待参加 / 未通过"
                      />
                    </label>
                  </div>
                  <label>
                    备注
                    <textarea
                      rows={2}
                      value={step.notes}
                      onChange={(event) =>
                        updateProcessStep(step.id, { notes: event.target.value })
                      }
                      placeholder="记录准备重点、面试反馈或后续事项"
                    />
                  </label>
                </article>
              ))}
            </div>
          </section>

          <label>
            备注
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="记录材料补充、面试准备或跟进事项"
            />
          </label>

          <div className="form-actions">
            <button type="button" onClick={closeForm}>
              取消
            </button>
            <button type="submit" className="primary-button">
              保存申请
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;
