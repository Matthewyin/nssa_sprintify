import { useState, useEffect, useRef, useCallback } from 'react'

interface TimerState {
  time: number // 秒数
  isRunning: boolean
  isPaused: boolean
}

interface TimerControls {
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  reset: () => void
  addTime: (seconds: number) => void
}

/**
 * 计时器Hook（用于番茄钟等功能）
 */
export function useTimer(
  initialTime: number = 0,
  onComplete?: () => void
): [TimerState, TimerControls] {
  const [state, setState] = useState<TimerState>({
    time: initialTime,
    isRunning: false,
    isPaused: false
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  // 更新回调引用
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setState(prev => ({ ...prev, isRunning: true, isPaused: false }))

    intervalRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.time + 1
        
        // 检查是否需要触发完成回调
        if (onCompleteRef.current && newTime > 0 && newTime % 60 === 0) {
          // 每分钟触发一次（可以根据需要调整）
        }
        
        return { ...prev, time: newTime }
      })
    }, 1000)
  }, [])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState(prev => ({ ...prev, isRunning: false, isPaused: true }))
  }, [])

  const resume = useCallback(() => {
    if (state.isPaused) {
      start()
    }
  }, [state.isPaused, start])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState(prev => ({ ...prev, isRunning: false, isPaused: false }))
    
    if (onCompleteRef.current) {
      onCompleteRef.current()
    }
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState({
      time: initialTime,
      isRunning: false,
      isPaused: false
    })
  }, [initialTime])

  const addTime = useCallback((seconds: number) => {
    setState(prev => ({ ...prev, time: prev.time + seconds }))
  }, [])

  return [
    state,
    {
      start,
      pause,
      resume,
      stop,
      reset,
      addTime
    }
  ]
}

/**
 * 番茄钟Hook
 */
export function usePomodoroTimer(
  workDuration: number = 25 * 60, // 25分钟
  breakDuration: number = 5 * 60, // 5分钟
  onWorkComplete?: () => void,
  onBreakComplete?: () => void
) {
  const [isWorkSession, setIsWorkSession] = useState(true)
  const [sessionCount, setSessionCount] = useState(0)
  
  const handleWorkComplete = useCallback(() => {
    setIsWorkSession(false)
    setSessionCount(prev => prev + 1)
    onWorkComplete?.()
  }, [onWorkComplete])
  
  const handleBreakComplete = useCallback(() => {
    setIsWorkSession(true)
    onBreakComplete?.()
  }, [onBreakComplete])
  
  const [workTimer, workControls] = useTimer(0, handleWorkComplete)
  const [breakTimer, breakControls] = useTimer(0, handleBreakComplete)
  
  const currentTimer = isWorkSession ? workTimer : breakTimer
  const currentControls = isWorkSession ? workControls : breakControls
  const currentDuration = isWorkSession ? workDuration : breakDuration
  
  const startSession = useCallback(() => {
    if (isWorkSession) {
      workControls.reset()
      workControls.start()
    } else {
      breakControls.reset()
      breakControls.start()
    }
  }, [isWorkSession, workControls, breakControls])
  
  const switchToWork = useCallback(() => {
    breakControls.stop()
    setIsWorkSession(true)
  }, [breakControls])
  
  const switchToBreak = useCallback(() => {
    workControls.stop()
    setIsWorkSession(false)
  }, [workControls])
  
  return {
    currentTimer,
    currentControls,
    currentDuration,
    isWorkSession,
    sessionCount,
    startSession,
    switchToWork,
    switchToBreak
  }
}
