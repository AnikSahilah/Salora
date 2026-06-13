import { useEffect, useRef } from "react"
import { api, isAuthenticated } from "../api.js"

export default function useNotificationPolling(showToast, interval = 10000) {
  const lastIdRef = useRef(0)

  useEffect(() => {
    if (!isAuthenticated()) return

    async function check() {
      try {
        const notifs = await api("/notifications")
        const baru = notifs.filter((n) => !n.read && n.id > lastIdRef.current)

        for (const n of baru) {
          showToast(`${n.title}: ${n.message}`, "info")
        }

        if (baru.length > 0) {
          const maxId = Math.max(...baru.map((n) => n.id))
          lastIdRef.current = maxId

          await api("/notifications/read-all", { method: "PUT" })
        }
      } catch {}
    }

    check()
    const timer = setInterval(check, interval)
    return () => clearInterval(timer)
  }, [showToast, interval])
}
