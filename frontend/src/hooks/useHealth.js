import { useState, useEffect, useCallback } from 'react'
import { checkHealth } from '../services/api'

export function useHealth() {
  const [state, setState] = useState({
    healthy: null,    
    modelsLoaded: null,
    checking: true,
  })

  const check = useCallback(async () => {
    setState(s => ({ ...s, checking: true }))
    try {
      const data = await checkHealth()
      setState({
        healthy: data.status === 'ok',
        modelsLoaded: data.models_loaded === true,
        checking: false,
      })
    } catch {
      setState({ healthy: false, modelsLoaded: false, checking: false })
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  return { ...state, retry: check }
}
