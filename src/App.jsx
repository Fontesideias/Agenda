import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'noteday.tasks.v1'
const THEME_KEY = 'noteday.theme'

function Icon({ children, size = 24, fill = 'none', ...props }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

const ArrowLeft = (props) => <Icon {...props}><path d="m15 18-6-6 6-6" /><path d="M9 12h11" /></Icon>
const ArrowRight = (props) => <Icon {...props}><path d="m9 18 6-6-6-6" /><path d="M4 12h11" /></Icon>
const CalendarDays = (props) => <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /></Icon>
const Check = (props) => <Icon {...props}><path d="m5 12 5 5L20 7" /></Icon>
const CircleCheckBig = (props) => <Icon {...props}><path d="M21.8 10A10 10 0 1 1 17 3.3" /><path d="m9 11 3 3L22 4" /></Icon>
const Clock3 = (props) => <Icon {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6h4" /></Icon>
const MoonStar = (props) => <Icon {...props}><path d="M12 3a6.5 6.5 0 1 0 9 9 9 9 0 1 1-9-9" /><path d="M19 3v4" /><path d="M17 5h4" /></Icon>
const Play = (props) => <Icon {...props}><path d="M6 4.75v14.5L19 12Z" /></Icon>
const Plus = (props) => <Icon {...props}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
const SunMedium = (props) => <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 3v1" /><path d="M12 20v1" /><path d="m18.36 5.64-.7.7" /><path d="m6.34 17.66-.7.7" /><path d="M21 12h-1" /><path d="M4 12H3" /><path d="m17.66 17.66.7.7" /><path d="m5.64 5.64.7.7" /></Icon>
const Timer = (props) => <Icon {...props}><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M4 13a8 8 0 1 0 8-8 8.6 8.6 0 0 0-2 .25" /></Icon>
const Trash2 = (props) => <Icon {...props}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6 18 21H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></Icon>

function toDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function dateFromKey(value) {
  return new Date(`${value}T12:00:00`)
}

function formatDay(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromKey(value))
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatTime(timestamp) {
  if (!timestamp) return null
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function formatDuration(startedAt, endedAt, now) {
  if (!startedAt) return '--'
  const milliseconds = Math.max(0, (endedAt || now) - startedAt)
  return formatElapsed(milliseconds)
}

function formatElapsed(milliseconds, showEmpty = false) {
  if (showEmpty && milliseconds === 0) return '0 min'
  const minutes = Math.floor(milliseconds / 60_000)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours) return `${hours}h ${String(remainder).padStart(2, '0')}min`
  if (minutes) return `${minutes} min`
  return '< 1 min'
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function initialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme) return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const today = toDateKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const [tasks, setTasks] = useState(loadTasks)
  const [theme, setTheme] = useState(initialTheme)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.date === selectedDate),
    [selectedDate, tasks],
  )

  const categorized = useMemo(
    () => ({
      active: visibleTasks.filter((task) => task.status === 'active'),
      pending: visibleTasks.filter((task) => task.status === 'pending'),
      completed: visibleTasks.filter((task) => task.status === 'completed'),
    }),
    [visibleTasks],
  )

  const completedDuration = categorized.completed.reduce((total, task) => {
    if (!task.startedAt || !task.endedAt) return total
    return total + Math.max(0, task.endedAt - task.startedAt)
  }, 0)

  function shiftDate(days) {
    const date = dateFromKey(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(toDateKey(date))
  }

  function addTask(values) {
    const task = {
      id: crypto.randomUUID(),
      ...values,
      status: 'pending',
      startedAt: null,
      endedAt: null,
      createdAt: Date.now(),
    }
    setTasks((current) => [task, ...current])
    setSelectedDate(values.date)
  }

  function updateTask(id, updates) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    )
  }

  function startTask(id) {
    updateTask(id, { status: 'active', startedAt: Date.now(), endedAt: null })
  }

  function finishTask(id) {
    updateTask(id, { status: 'completed', endedAt: Date.now() })
  }

  function completeWithoutTimer(id) {
    updateTask(id, { status: 'completed', endedAt: Date.now() })
  }

  function removeTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] transition-colors duration-500">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,var(--glow),transparent_38%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-5 sm:px-7 lg:px-10">
        <Header
          date={new Date()}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />

        <main className="mt-7 grid flex-1 gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <TaskComposer selectedDate={selectedDate} onAdd={addTask} />
            <DailyOverview
              pending={categorized.pending.length}
              active={categorized.active.length}
              completed={categorized.completed.length}
              focusedTime={formatElapsed(completedDuration, true)}
            />
          </aside>

          <section className="notebook-panel flex flex-col rounded-[28px] p-4 sm:p-6">
            <DayNavigation
              selectedDate={selectedDate}
              today={today}
              onPrevious={() => shiftDate(-1)}
              onNext={() => shiftDate(1)}
              onToday={() => setSelectedDate(today)}
            />

            <div className="mt-6 space-y-7">
              <TaskSection
                title="Em andamento"
                status="active"
                tasks={categorized.active}
                now={now}
                emptyText="Nenhuma tarefa em execução."
                onStart={startTask}
                onFinish={finishTask}
                onComplete={completeWithoutTimer}
                onRemove={removeTask}
              />
              <TaskSection
                title="Pendentes"
                status="pending"
                tasks={categorized.pending}
                now={now}
                emptyText="Tudo organizado. Adicione um compromisso para este dia."
                onStart={startTask}
                onFinish={finishTask}
                onComplete={completeWithoutTimer}
                onRemove={removeTask}
              />
              <TaskSection
                title="Concluídas"
                status="completed"
                tasks={categorized.completed}
                now={now}
                emptyText="As tarefas concluídas aparecerão aqui."
                onStart={startTask}
                onFinish={finishTask}
                onComplete={completeWithoutTimer}
                onRemove={removeTask}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function Header({ date, theme, onThemeToggle }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-shadow)]">
          <CalendarDays size={21} strokeWidth={1.9} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.27em] text-[var(--muted)]">
            NoteDay
          </p>
          <h1 className="text-sm font-medium sm:text-base">{capitalize(formatFullDate(date))}</h1>
        </div>
      </div>
      <button className="icon-button size-11" type="button" onClick={onThemeToggle} aria-label="Alternar tema">
        {theme === 'dark' ? <SunMedium size={19} /> : <MoonStar size={19} />}
      </button>
    </header>
  )
}

function TaskComposer({ selectedDate, onAdd }) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(selectedDate)
  const [notes, setNotes] = useState('')

  useEffect(() => setDate(selectedDate), [selectedDate])

  function submit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    onAdd({ title: cleanTitle, time, date, notes: notes.trim() })
    setTitle('')
    setTime('')
    setNotes('')
  }

  return (
    <form className="notebook-panel rounded-[28px] p-5 sm:p-6" onSubmit={submit}>
      <p className="eyebrow">Novo item</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Planeje seu foco</h2>
      <label className="field mt-6">
        <span>Tarefa ou compromisso</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Revisar proposta"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="field">
          <span>Data</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <label className="field">
          <span>Horário</span>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
      </div>
      <label className="field mt-3">
        <span>Nota</span>
        <textarea
          rows="2"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Detalhe opcional"
        />
      </label>
      <button type="submit" className="primary-button mt-5 w-full">
        <Plus size={17} />
        Adicionar à agenda
      </button>
    </form>
  )
}

function DailyOverview({ pending, active, completed, focusedTime }) {
  return (
    <div className="notebook-panel rounded-[28px] p-5 sm:p-6">
      <p className="eyebrow">Resumo do dia</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric number={pending} label="Pendentes" />
        <Metric number={active} label="Ativas" emphasis />
        <Metric number={completed} label="Feitas" />
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-[var(--subtle)] p-4">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Timer size={16} />
          Tempo concluído
        </div>
        <span className="text-sm font-semibold">{focusedTime}</span>
      </div>
    </div>
  )
}

function Metric({ number, label, emphasis }) {
  return (
    <div className={`rounded-2xl px-2 py-3 text-center ${emphasis ? 'bg-[var(--accent-soft)]' : 'bg-[var(--subtle)]'}`}>
      <p className="text-xl font-semibold">{number}</p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  )
}

function DayNavigation({ selectedDate, today, onPrevious, onNext, onToday }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
      <div>
        <p className="eyebrow">{selectedDate === today ? 'Hoje' : 'Agenda diária'}</p>
        <h2 className="mt-2 text-2xl font-semibold capitalize tracking-tight">{formatDay(selectedDate)}</h2>
      </div>
      <div className="flex items-center gap-2">
        {selectedDate !== today && (
          <button type="button" className="secondary-button text-xs" onClick={onToday}>
            Hoje
          </button>
        )}
        <button type="button" className="icon-button size-10" aria-label="Dia anterior" onClick={onPrevious}>
          <ArrowLeft size={17} />
        </button>
        <button type="button" className="icon-button size-10" aria-label="Próximo dia" onClick={onNext}>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}

function TaskSection({ title, status, tasks, now, emptyText, onStart, onFinish, onComplete, onRemove }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className={`status-dot status-dot-${status}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full bg-[var(--subtle)] px-2 py-0.5 text-xs text-[var(--muted)]">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-5 text-sm text-[var(--muted)]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              now={now}
              onStart={onStart}
              onFinish={onFinish}
              onComplete={onComplete}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, now, onStart, onFinish, onComplete, onRemove }) {
  const isActive = task.status === 'active'
  const isComplete = task.status === 'completed'
  return (
    <article className={`task-card ${isActive ? 'task-active' : ''} ${isComplete ? 'task-complete' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {task.time && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--subtle)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
              <Clock3 size={12} />
              {task.time}
            </span>
          )}
          {isActive && <span className="active-chip">Em execução</span>}
          {isComplete && <CircleCheckBig size={16} className="text-[var(--success)]" />}
        </div>
        <h4 className={`mt-2 font-medium ${isComplete ? 'text-[var(--muted)] line-through decoration-[var(--line)]' : ''}`}>
          {task.title}
        </h4>
        {task.notes && <p className="mt-1 text-sm text-[var(--muted)]">{task.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          {task.startedAt && <span>Início {formatTime(task.startedAt)}</span>}
          {task.endedAt && task.startedAt && <span>Término {formatTime(task.endedAt)}</span>}
          {(task.startedAt || isComplete) && (
            <span className="font-medium text-[var(--text)]">
              Duração {formatDuration(task.startedAt, task.endedAt, now)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {task.status === 'pending' && (
          <>
            <button className="action-button action-start" type="button" onClick={() => onStart(task.id)} title="Iniciar tarefa">
              <Play size={15} fill="currentColor" />
              <span className="hidden sm:block">Iniciar</span>
            </button>
            <button className="icon-button size-9" type="button" title="Marcar concluída" onClick={() => onComplete(task.id)}>
              <Check size={16} />
            </button>
          </>
        )}
        {isActive && (
          <button className="action-button action-finish" type="button" onClick={() => onFinish(task.id)}>
            <Check size={15} />
            Finalizar
          </button>
        )}
        <button className="delete-button" type="button" aria-label="Excluir tarefa" onClick={() => onRemove(task.id)}>
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  )
}
