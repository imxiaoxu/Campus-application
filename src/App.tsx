import { FormEvent, useEffect, useMemo, useState } from "react";

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "interview"
  | "offer"
  | "rejected";

type MaterialStatus = "未开始" | "准备中" | "已提交" | "需补充";
type Priority = "高" | "中" | "低";

type JobApplication = {
  id: string;
  company: string;
  role: string;
  deadline: string;
  materialStatus: MaterialStatus;
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

const statusTitles = statuses.reduce(
  (acc, status) => ({ ...acc, [status.id]: status.title }),
  {} as Record<ApplicationStatus, string>,
);

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

const readStoredApplications = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return seedApplications;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as JobApplication[]) : seedApplications;
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

function App() {
  const [applications, setApplications] = useState<JobApplication[]>(readStoredApplications);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortByDeadline, setSortByDeadline] = useState(true);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const filtered = showUpcomingOnly
      ? applications.filter(isUpcoming)
      : applications;

    if (!sortByDeadline) {
      return filtered;
    }

    return [...filtered].sort(
      (a, b) =>
        new Date(`${a.deadline}T00:00:00`).getTime() -
        new Date(`${b.deadline}T00:00:00`).getTime(),
    );
  }, [applications, showUpcomingOnly, sortByDeadline]);

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

  const openCreateForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (application: JobApplication) => {
    const { id: _id, ...formValue } = application;
    setForm(formValue);
    setEditingId(application.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm());
    setEditingId(null);
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
    };

    if (!normalizedForm.company || !normalizedForm.role) {
      return;
    }

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
        </div>

        <label className="switch-control">
          <input
            type="checkbox"
            checked={sortByDeadline}
            onChange={(event) => setSortByDeadline(event.target.checked)}
          />
          <span>按截止日期排序</span>
        </label>
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
                  draggable
                  onDragStart={() => setDraggedId(application.id)}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <div className="card-heading">
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
