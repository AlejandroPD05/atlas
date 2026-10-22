import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useAppStore, type Notice } from '../store/appStore'
import { cn } from '../utils/cn'
import styles from './ToastHost.module.css'

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
} as const

function Toast({ notice }: { notice: Notice }) {
  const dismiss = useAppStore((s) => s.dismissNotice)

  useEffect(() => {
    const ttl = notice.kind === 'error' ? 8000 : 5200
    const t = setTimeout(() => dismiss(notice.id), ttl)
    return () => clearTimeout(t)
  }, [notice.id, notice.kind, dismiss])

  const Icon = ICONS[notice.kind]

  return (
    <div
      className={cn(styles.toast, styles[notice.kind])}
      role={notice.kind === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{notice.title}</p>
        {notice.detail && <p className={styles.detail}>{notice.detail}</p>}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar aviso"
        onClick={() => dismiss(notice.id)}
      >
        <X size={13} />
      </button>
    </div>
  )
}

/** Avisos discretos, nunca alertas del navegador. */
export function ToastHost() {
  const notices = useAppStore((s) => s.notices)
  if (notices.length === 0) return null
  return (
    <div className={styles.host} aria-live="polite">
      {notices.map((n) => (
        <Toast key={n.id} notice={n} />
      ))}
    </div>
  )
}
