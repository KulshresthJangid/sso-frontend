import { motion, type Variants } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AppWindow, Users, Shield, ArrowRight, Check, Copy, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clientsApi, usersApi, rolesApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function OverviewPage() {
  const navigate = useNavigate()
  const { slug, orgName } = useOrgStore()
  const [stats, setStats] = useState({ apps: 0, users: 0, roles: 0 })
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!slug) return
    Promise.all([
      clientsApi.list(slug).catch(() => []),
      usersApi.list(slug).catch(() => []),
      rolesApi.listRoles(slug).catch(() => []),
    ]).then(([apps, users, roles]) => {
      setStats({
        apps: Array.isArray(apps) ? apps.length : 0,
        users: Array.isArray(users) ? users.length : 0,
        roles: Array.isArray(roles) ? roles.length : 0,
      })
    })
  }, [slug])

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const BASE = `http://localhost:9000/${slug}`
  const endpoints = [
    { label: 'Authorization URL', value: `${BASE}/oauth2/authorize`, key: 'auth' },
    { label: 'Token URL', value: `${BASE}/oauth2/token`, key: 'token' },
    { label: 'JWKS URL', value: `http://localhost:9000/oauth2/jwks`, key: 'jwks' },
    { label: 'Issuer', value: BASE, key: 'issuer' },
  ]

  const statCards = [
    { icon: AppWindow, label: 'Applications', value: stats.apps, to: '/dashboard/apps', color: '#6366f1' },
    { icon: Users, label: 'Users', value: stats.users, to: '/dashboard/users', color: '#22c55e' },
    { icon: Shield, label: 'Roles', value: stats.roles, to: '/dashboard/roles', color: '#f59e0b' },
  ]

  return (
    <div style={{ padding: '1.75rem', maxWidth: 900 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: '1.75rem' }}
      >
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.3rem' }}>
          Overview
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>
          Welcome back to{' '}
          <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{orgName || slug}</span>
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}
      >
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.label}
              variants={itemVariants}
              onClick={() => navigate(card.to)}
              className="card"
              style={{
                padding: '1.25rem',
                textAlign: 'left',
                background: 'var(--surface)',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', marginBottom: '1.25rem',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '0.5rem',
                  background: `${card.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
                <ArrowRight size={13} style={{ color: 'var(--text-3)', marginTop: '0.25rem' }} />
              </div>
              <div style={{
                fontSize: '2rem', fontWeight: 700,
                color: 'var(--text-1)', lineHeight: 1, marginBottom: '0.375rem',
              }}>{card.value}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{card.label}</div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Two column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* OAuth2 Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="card"
          style={{ padding: '1.25rem', background: 'var(--surface)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ExternalLink size={14} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' }}>
              OAuth2 Endpoints
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {endpoints.map(ep => (
              <div key={ep.key}>
                <p style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-3)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {ep.label}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: '0.375rem', padding: '0.4rem 0.625rem',
                }}>
                  <code style={{
                    flex: 1, fontSize: '0.72rem',
                    color: 'var(--text-2)',
                    fontFamily: "'JetBrains Mono', monospace",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{ep.value}</code>
                  <button
                    className="copy-btn"
                    onClick={() => copyText(ep.value, ep.key)}
                    title="Copy"
                  >
                    {copied === ep.key
                      ? <Check size={12} style={{ color: 'var(--success)' }} />
                      : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick start checklist */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="card"
          style={{ padding: '1.25rem', background: 'var(--surface)' }}
        >
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.375rem' }}>
            Getting started
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
            Complete these steps to go live
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'Register your first app', done: stats.apps > 0, to: '/dashboard/apps' },
              { label: 'Invite a team member', done: stats.users > 1, to: '/dashboard/users' },
              { label: 'Create roles & permissions', done: stats.roles > 0, to: '/dashboard/roles' },
              { label: 'Read the integration guide', done: false, to: '/dashboard/guide' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0.625rem',
                  borderRadius: '0.5rem', background: 'none',
                  border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  opacity: item.done ? 0.5 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: item.done ? 'rgba(34,197,94,0.15)' : 'var(--surface-2)',
                  border: item.done ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                }}>
                  {item.done
                    ? <Check size={10} style={{ color: 'var(--success)' }} />
                    : <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-2)', display: 'block' }} />}
                </div>
                <span style={{
                  fontSize: '0.8125rem',
                  color: item.done ? 'var(--text-3)' : 'var(--text-2)',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>{item.label}</span>
                {!item.done && (
                  <ArrowRight size={11} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
