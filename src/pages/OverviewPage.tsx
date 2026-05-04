import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AppWindow, Users, Shield, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clientsApi, usersApi, rolesApi } from '../lib/api'
import { useOrgStore } from '../store/orgStore'

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] } } }
}

export default function OverviewPage() {
  const navigate = useNavigate()
  const { slug, orgName } = useOrgStore()
  const [stats, setStats] = useState({ apps: 0, users: 0, roles: 0 })

  useEffect(() => {
    if (!slug) return
    Promise.all([
      clientsApi.list(slug).catch(() => []),
      usersApi.list(slug).catch(() => []),
      rolesApi.listRoles(slug).catch(() => []),
    ]).then(([apps, users, roles]) => {
      setStats({ apps: apps.length, users: users.length, roles: roles.length })
    })
  }, [slug])

  const cards = [
    { icon: <AppWindow size={20} />, label: 'Applications', value: stats.apps, color: '#6366f1', to: '/dashboard/apps' },
    { icon: <Users size={20} />, label: 'Users', value: stats.users, color: '#22c55e', to: '/dashboard/users' },
    { icon: <Shield size={20} />, label: 'Roles', value: stats.roles, color: '#f59e0b', to: '/dashboard/roles' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Good morning 👋
        </h1>
        <p className="text-sm" style={{ color: '#908fa0' }}>
          Here's what's happening in <span style={{ color: '#c0c1ff' }}>{orgName || slug}</span>
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger.container} initial="hidden" animate="show"
        className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <motion.button key={card.label} variants={stagger.item}
            onClick={() => navigate(card.to)}
            className="glass rounded-2xl p-5 text-left group transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}20`, color: card.color }}>
                {card.icon}
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform"
                style={{ color: '#908fa0' }} />
            </div>
            <div className="text-3xl font-bold tracking-tight mb-1">{card.value}</div>
            <div className="text-sm" style={{ color: '#908fa0' }}>{card.label}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* Quick start */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="glass rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-base font-semibold mb-1">Quick start</h2>
        <p className="text-sm mb-5" style={{ color: '#908fa0' }}>Get your SSO setup in 3 steps</p>
        <div className="flex flex-col gap-3">
          {[
            { step: '1', label: 'Register your first app', done: stats.apps > 0, to: '/dashboard/apps' },
            { step: '2', label: 'Invite your first user', done: stats.users > 0, to: '/dashboard/users' },
            { step: '3', label: 'Create roles & permissions', done: stats.roles > 0, to: '/dashboard/roles' },
          ].map(item => (
            <button key={item.step} onClick={() => navigate(item.to)}
              className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/5 text-left"
              style={{ opacity: item.done ? 0.5 : 1 }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: item.done ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                  color: item.done ? '#22c55e' : '#6366f1'
                }}>
                {item.done ? '✓' : item.step}
              </div>
              <span className="text-sm" style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#908fa0' : '#e4e1ed' }}>
                {item.label}
              </span>
              {!item.done && <ArrowRight size={13} className="ml-auto" style={{ color: '#908fa0' }} />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
