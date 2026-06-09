import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowLeft, Home } from 'lucide-react'
import { useOrgStore } from '../store/orgStore'

// Maps backend error codes → human-readable messages
const ERROR_MESSAGES: Record<string, string> = {
  ORG_NOT_FOUND: "Organization not found or is inactive.",
  access_denied: "You denied access to this application.",
  invalid_client: "The application is not properly configured.",
  invalid_scope: "The requested permissions are not available.",
  unauthorized_client: "This app is not authorized to use this login method.",
}

type State = 'loading' | 'success' | 'error'

export default function CallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { slug, orgName, userEmail } = useOrgStore()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(3)

  const code = params.get('code')
  const error = params.get('error')
  const errorDesc = params.get('error_description')

  useEffect(() => {
    if (error) {
      setErrorMsg(ERROR_MESSAGES[error] || errorDesc || 'An unknown error occurred.')
      setState('error')
      return
    }
    if (code) {
      // Auth code received — exchange happens server-side via redirect
      // In a real PKCE flow the SPA would exchange code here
      setTimeout(() => setState('success'), 1200)
    } else {
      setErrorMsg('No authorization code received.')
      setState('error')
    }
  }, [code, error])

  useEffect(() => {
    if (state !== 'success') return
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); navigate('/dashboard'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [state])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-md mx-6 p-10 text-center"
        style={{ background: '#ffffff' }}>

        {state === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Black spinner */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-4 border-transparent mx-auto mb-6"
              style={{ borderTopColor: '#0a0a0a', borderRightColor: '#e5e5e5' }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0a0a0a' }}>Authenticating...</h2>
            <p className="text-sm" style={{ color: '#6b6b6b' }}>Verifying your credentials securely</p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: '#16a34a' }}>
              <CheckCircle size={32} color="white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#0a0a0a' }}>You're in!</h2>
            <p className="text-sm mb-4" style={{ color: '#6b6b6b' }}>
              Welcome back, <strong style={{ color: '#0a0a0a' }}>{userEmail || 'user'}</strong>
            </p>

            {slug && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium mb-6"
                style={{ background: '#f5f5f5', color: '#0a0a0a', border: '1px solid #e5e5e5' }}>
                {orgName || slug}
              </span>
            )}

            <p className="text-sm mb-3" style={{ color: '#6b6b6b' }}>Redirecting to dashboard in {countdown}s...</p>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
              <motion.div className="h-full rounded-full" style={{ background: '#0a0a0a' }}
                initial={{ width: '100%' }} animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }} />
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: '#dc2626' }}>
              <XCircle size={32} color="white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#0a0a0a' }}>Access Denied</h2>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#6b6b6b' }}>{errorMsg}</p>
            {error && (
              <p className="text-xs mb-6 font-mono px-3 py-1.5 rounded inline-block"
                style={{ background: '#f5f5f5', color: '#6b6b6b', border: '1px solid #e5e5e5' }}>
                error: {error}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => navigate('/login')} className="btn-primary flex items-center justify-center gap-2 flex-1">
                <ArrowLeft size={14} /> Try another org
              </button>
              <button onClick={() => navigate('/')} className="btn-ghost flex items-center justify-center gap-2 flex-1">
                <Home size={14} /> Home
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
