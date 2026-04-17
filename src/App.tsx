import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "interview"
  | "offer"
  | "rejected";

type MaterialStatus = "未开始" | "准备中" | "已提交" | "需补充";
type Priority = "高" | "中" | "低";

type MaterialItem = {
  id: string;
  label: string;
  completed: boolean;
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

const defaultMaterialTemplates = [
  "中文简历",
  "英文简历",
  "成绩单",
  "作品集",
  "推荐信",
  "网申问题",
];

const createDefaultMaterials = (completed = false): MaterialItem[] =>
  defaultMaterialTemplates.map((label) => ({
    id: label,
    label,
    completed,
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

function App() {
  const [applications, setApplications] = useState<JobApplication[]>(readStoredApplications);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortByDeadline, setSortByDeadline] = useState(true);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
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

  const visibleApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = (showUpcomingOnly
      ? applications.filter(isUpcoming)
      : applications
    ).filter((application) => {
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
    materialFilter,
    priorityFilter,
    searchTerm,
    showUpcomingOnly,
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
    const materialTotals = applications.reduce(
      (acc, application) => {
        const progress = getMaterialProgress(application.materials);
        return {
          completed: acc.completed + progress.completed,
          total: acc.total + progress.total,
        };
      },
      { completed: 0, total: 0 },
    );

    return {
      total: applications.length,
      upcoming: applications.filter(isUpcoming).length,
      active: applications.filter(
        (item) => item.status !== "offer" && item.status !== "rejected",
      ).length,
      offers: applications.filter((item) => item.status === "offer").length,
      materials:
        materialTotals.total === 0
          ? "0%"
          : `${Math.round((materialTotals.completed / materialTotals.total) * 100)}%`,
    };
  }, [applications]);

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
        <article className="metric">
          <span>申请总数</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="metric urgent">
          <span>即将截止</span>
          <strong>{metrics.upcoming}</strong>
        </article>
        <article className="metric">
          <span>推进中</span>
          <strong>{metrics.active}</strong>
        </article>
        <article className="metric success">
          <span>录用</span>
          <strong>{metrics.offers}</strong>
        </article>
        <article className="metric">
          <span>材料完成率</span>
          <strong>{metrics.materials}</strong>
        </article>
      </section>

      <section className="toolbar" aria-label="看板操作">
        <div className="toolbar-actions">
          <button type="button" className="primary-button" onClick={openCreateForm}>
            新增申请
          </button>
          <button
            type="button"
            className={showUpcomingOnly ? "filter-button is-active" : "filter-button"}
            onClick={() => setShowUpcomingOnly((value) => !value)}
          >
            {showUpcomingOnly ? "显示全部" : "筛选即将截止"}
          </button>
          <button type="button" className="filter-button" onClick={exportApplications}>
            导出数据
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
                      <dd>
                        {application.materialStatus}
                        <small>清单 {getMaterialProgress(application.materials).label}</small>
                      </dd>
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

                  <div className="material-checklist" aria-label={`${application.company}材料清单`}>
                    {application.materials.slice(0, 4).map((material) => (
                      <label key={material.id} className="material-chip">
                        <input
                          type="checkbox"
                          checked={material.completed}
                          onChange={() =>
                            toggleApplicationMaterial(application.id, material.id)
                          }
                        />
                        <span>{material.label}</span>
                      </label>
                    ))}
                    {application.materials.length > 4 && (
                      <span className="more-materials">
                        +{application.materials.length - 4} 项
                      </span>
                    )}
                  </div>

                  <div className="card-actions">
                    <button type="button" onClick={() => moveApplication(application.id, -1)}>
                      前移
                    </button>
                    <button type="button" onClick={() => moveApplication(application.id, 1)}>
                      后移
                    </button>
                    <button type="button" onClick={() => openEditForm(application)}>
                      编辑
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deleteApplication(application.id)}
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
      )}
    </main>
  );
}

export default App;
