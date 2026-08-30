import { useState, useEffect, useCallback, useRef } from 'react'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const SSE_URL = `${baseURL}/api/workflow/stream`

export function useWorkflowStream() {
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close()

    const eventSource = new EventSource(SSE_URL)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => setConnected(true)

    eventSource.addEventListener('trace-start', (e) => {
      try {
        const data = JSON.parse(e.data)
        setEvents((prev) => {
          const next = [...prev, { ...data, eventType: 'TRACE_START' }]
          return next.length > 500 ? next.slice(-300) : next
        })
      } catch (err) {
        console.error('Failed to parse trace-start:', err)
      }
    })

    eventSource.addEventListener('workflow-step', (e) => {
      try {
        const data = JSON.parse(e.data)
        setEvents((prev) => {
          const next = [...prev, { ...data, eventType: 'WORKFLOW_STEP' }]
          return next.length > 500 ? next.slice(-300) : next
        })
      } catch (err) {
        console.error('Failed to parse workflow-step:', err)
      }
    })

    eventSource.onerror = () => {
      setConnected(false)
      eventSource.close()
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connect])

  const clearEvents = useCallback(() => setEvents([]), [])

  return { events, connected, clearEvents }
}
