import { createClient } from '@supabase/supabase-js'
import './styles.css'

// Publishable credentials are intentionally safe in a browser; authorization is enforced by RLS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ovdpickavnunobseqzuj.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_d7WSuzc1oRs6euOBAVMUrg_nLK8Uv7C'
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('PROJECT_REF'))
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 8 } }
}) : null

const app = document.querySelector('#app')
const CAMPAIGN_TARGET = 45000
const TOTAL_DPT = 78500
const state = {
  session: null, profile: null, page: 'dashboard', busy: false, realtime: null,
  voters: [], activities: [], reports: [], commands: [], opponents: [], profiles: [], teams: [], notifications: [],
  filters: { voter: '', status: '', report: '' }, strategy: null
}

const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]))
const rupiah = n => new Intl.NumberFormat('id-ID').format(Number(n || 0))
const dateId = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : '-'
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
const initials = name => String(name || 'U').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()
const title = s => ({ dashboard: 'Dasbor Komando', voters: 'Data Pemilih', field: 'Kegiatan Lapangan', commands: 'AI Strategy Advisor', more: 'Menu Utama' }[s] || 'Dasbor Komando')
const roleName = r => ({ admin: 'Admin', owner: 'Owner', team: 'Tim Pemenangan' }[r] || r)
const voterStatus = s => ({ support: 'Siap Bergabung', swing: 'Swing Voter', refuse: 'Belum Bersedia', unknown: 'Belum Dipetakan' }[s] || s)
const statusChip = s => ({ support: 'ok', swing: 'warn', refuse: 'bad', unknown: 'info', active: 'ok', pending: 'warn', rejected: 'bad', done: 'ok', in_progress: 'info', planned: 'warn', urgent: 'bad' }[s] || 'info')
const can = (...roles) => state.profile && roles.includes(state.profile.role)
const clearCampaignData = () => { for (const key of ['voters', 'activities', 'reports', 'commands', 'opponents', 'profiles', 'teams', 'notifications']) state[key] = [] }
const icon = (name, cls = '') => {
  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',
    sparkle: '<path d="m12 3-1.4 4.1L6.5 8.5l4.1 1.4L12 14l1.4-4.1 4.1-1.4-4.1-1.4L12 3Z"/><path d="m19 14-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8L19 14ZM5 14l-.7 1.8-1.8.7 1.8.7L5 19l.7-1.8 1.8-.7-1.8-.7L5 14Z"/>',
    menu: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    hamburger: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.6 2.1c-.9.5-1.4 1-1.4 2M12 17h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 9m16 6-2.2 2.8A7 7 0 0 1 5.5 15"/>'
    ,camera: '<path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4.5Z"/><circle cx="12" cy="12" r="4"/>'
    ,copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>'
    ,save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'
    ,whatsapp: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 8.5c.5 3 2 4.5 5 5"/>'
  }
  return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`
}

function toast(message, type = '') {
  let stack = document.querySelector('.toast-stack')
  if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.append(stack) }
  const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message; stack.append(el)
  setTimeout(() => el.remove(), 3200)
}

function setBusy(button, busy, label = 'Memproses…') {
  state.busy = busy
  if (!button) return
  if (busy) { button.dataset.old = button.textContent; button.textContent = label; button.disabled = true }
  else { button.textContent = button.dataset.old || button.textContent; button.disabled = false }
}

function configScreen() {
  app.innerHTML = `<main class="auth-shell"><section class="auth-card"><div class="auth-head"><span class="brand-mark">P</span><h1>Konfigurasi belum terpasang</h1><p>Tambahkan variabel Supabase pada environment deployment.</p></div><div class="info-box"><strong>VITE_SUPABASE_URL</strong><br><strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong></div><p class="muted">Publishable key aman digunakan di frontend karena akses data tetap dilindungi RLS.</p><footer>BBR @ SYNERGY smart system</footer></section></main>`
}

function authScreen(mode = 'login', message = '') {
  app.innerHTML = `<main class="auth-shell"><section class="auth-card">
    <div class="auth-head"><span class="brand-mark">P</span><h1>Pantauan Pemenangan</h1><p>Pusat kendali tim kandidat, aman dan real-time.</p></div>
    <div class="tabs"><button class="tab ${mode === 'login' ? 'active' : ''}" data-auth-tab="login">Masuk</button><button class="tab ${mode === 'register' ? 'active' : ''}" data-auth-tab="register">Daftar Tim</button></div>
    ${message ? `<div class="info-box">${esc(message)}</div>` : ''}
    <form id="auth-form" data-mode="${mode}">
      ${mode === 'register' ? `<div class="field"><label for="full_name">Nama lengkap</label><input class="input" id="full_name" name="full_name" maxlength="100" autocomplete="name" required></div><div class="field"><label for="phone">Nomor WhatsApp</label><input class="input" id="phone" name="phone" inputmode="tel" maxlength="18" placeholder="08xxxxxxxxxx" required></div>` : ''}
      <div class="field"><label for="email">Email</label><input class="input" id="email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="password">Password</label><input class="input" id="password" name="password" type="password" minlength="8" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required></div>
      <div id="auth-error"></div><button class="btn btn-primary btn-block" type="submit">${mode === 'login' ? 'Masuk ke Aplikasi' : 'Buat Akun'}</button>
    </form>
    ${mode === 'login' ? `<button class="link btn-block" data-action="forgot">Lupa password?</button>` : `<p class="muted" style="font-size:12px;text-align:center">Akun tim baru harus disetujui Admin.</p>`}
    <footer>BBR @ SYNERGY smart system</footer></section></main>`
}

function pendingScreen() {
  const rejected = state.profile?.approval_status === 'rejected'
  app.innerHTML = `<main class="auth-shell"><section class="auth-card"><div class="auth-head"><span class="brand-mark">${initials(state.profile?.full_name)}</span><h1>${rejected ? 'Akun belum dapat digunakan' : 'Menunggu persetujuan Admin'}</h1><p>${rejected ? 'Hubungi Admin untuk meninjau kembali akun Anda.' : 'Pendaftaran berhasil. Admin akan menetapkan tim dan hak akses Anda.'}</p></div><div class="info-box"><strong>${esc(state.profile?.full_name)}</strong><br>${esc(state.session?.user?.email)}</div><button class="btn btn-ghost btn-block" data-action="logout">Keluar</button><footer>BBR @ SYNERGY smart system</footer></section></main>`
}

async function loadProfile() {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', state.session.user.id).single()
  if (error) throw error
  state.profile = data
}

async function loadAll(quiet = false) {
  if (!quiet) app.querySelector('.main')?.classList.add('skeleton')
  const queries = [
    supabase.from('voters').select('*, teams(name)').order('created_at', { ascending: false }).limit(1000),
    supabase.from('activities').select('*, teams(name), profiles!activities_assignee_id_fkey(full_name)').order('created_at', { ascending: false }).limit(500),
    supabase.from('field_reports').select('*, teams(name), profiles!field_reports_reporter_id_fkey(full_name)').order('created_at', { ascending: false }).limit(500),
    supabase.from('commands').select('*, profiles!commands_created_by_fkey(full_name)').order('created_at', { ascending: false }).limit(300),
    supabase.from('opponent_snapshots').select('*').order('snapshot_date', { ascending: false }).limit(200),
    supabase.from('teams').select('*').order('name'),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
  ]
  if (can('admin', 'owner')) queries.push(supabase.from('profiles').select('*').order('created_at', { ascending: false }))
  const results = await Promise.all(queries)
  const failed = results.find(x => x.error)
  if (failed) throw failed.error
  ;[state.voters, state.activities, state.reports, state.commands, state.opponents, state.teams, state.notifications] = results.slice(0, 7).map(x => x.data || [])
  state.profiles = results[7]?.data || []
  if (!quiet) renderShell()
}

function subscribeRealtime() {
  if (state.realtime) supabase.removeChannel(state.realtime)
  const channel = supabase.channel(`campaign-${state.profile.id}`)
  for (const table of ['voters', 'activities', 'field_reports', 'commands', 'opponent_snapshots', 'profiles', 'notifications']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, debounceReload)
  }
  state.realtime = channel.subscribe()
}
let reloadTimer
function debounceReload() { clearTimeout(reloadTimer); reloadTimer = setTimeout(async () => { try { await loadAll(true); renderPage(); updateBadge() } catch { /* transient realtime refresh */ } }, 350) }

function navButtons(cls = '') {
  const items = [['dashboard', 'dashboard', 'Dasbor'], ['voters', 'users', 'Pemilih'], ['field', 'clipboard', 'Kegiatan'], ['commands', 'sparkle', 'AI Advisor'], ['more', 'menu', 'Menu']]
  return items.map(([id, iconName, label]) => `<button class="nav-btn ${cls} ${state.page === id ? 'active' : ''}" data-page="${id}">${icon(iconName)}<span>${label}</span></button>`).join('')
}

function renderShell() {
  app.innerHTML = `<div class="shell"><aside class="desktop-side"><div class="side-brand"><span class="brand-mark">C</span><div><strong>Command Center</strong><small>Pantauan Pemenangan</small></div></div><nav class="side-nav">${navButtons()}</nav><div class="side-status"><i></i><div><strong>Realtime tersambung</strong><small>Database & lapangan aktif</small></div></div><div class="side-user"><div class="avatar">${initials(state.profile.full_name)}</div><div><strong>${esc(state.profile.full_name)}</strong><small>${esc(roleName(state.profile.role))}</small></div></div></aside>
    <header class="topbar"><button class="icon-btn hamburger-button" data-action="open-menu" aria-label="Buka menu utama">${icon('hamburger')}</button><div class="top-profile"><div class="avatar">${initials(state.profile.full_name)}</div><div class="topbar-title"><strong>${esc(state.profile.full_name)}</strong><small>CANDIDATE COMMAND CENTER V2.0</small></div></div><div class="top-live"><i></i> REAL-TIME</div><button class="icon-btn bell-button" data-action="notifications" aria-label="Notifikasi">${icon('bell')}<b class="badge ${unreadCount() ? '' : 'hidden'}" id="notif-badge">${unreadCount()}</b></button><button class="exit-button" data-action="logout" aria-label="Keluar dari aplikasi">${icon('logout')}<span>Keluar</span></button></header>
    <main class="main layout" id="page"></main><button class="fab no-print" id="fab" data-action="add" aria-label="Tambah data">＋</button>
    <nav class="bottom-nav">${navButtons()}</nav><footer>BBR @ SYNERGY smart system</footer></div>`
  renderPage()
}

function openMenuDrawer() {
  document.querySelector('.menu-drawer-backdrop')?.remove()
  const wrap = document.createElement('div')
  wrap.className = 'menu-drawer-backdrop'
  wrap.innerHTML = `<button class="drawer-scrim" data-action="close-menu" aria-label="Tutup menu"></button><aside class="menu-drawer" role="dialog" aria-modal="true" aria-label="Menu utama"><div class="drawer-head"><div class="side-brand"><span class="brand-mark">C</span><div><strong>Command Center</strong><small>${esc(roleName(state.profile.role))}</small></div></div><button class="close" data-action="close-menu" aria-label="Tutup">×</button></div><nav class="drawer-nav">${navButtons('drawer-item')}</nav><div class="drawer-shortcuts"><button class="btn action-cyan" data-action="add-report">${icon('camera')} Laporan Kamera</button>${can('admin', 'owner') ? `<button class="btn action-amber" data-page="commands">${icon('sparkle')} Strategy Engine</button>` : ''}</div><button class="drawer-logout" data-action="logout">${icon('logout')} Keluar ke Login</button><footer>BBR @ SYNERGY smart system</footer></aside>`
  document.body.append(wrap)
}

function unreadCount() { return state.notifications.filter(n => !n.read_at).length }
function updateBadge() { const b = document.querySelector('#notif-badge'); if (b) { b.textContent = unreadCount(); b.classList.toggle('hidden', !unreadCount()) } }

function renderPage() {
  const page = document.querySelector('#page'); if (!page) return
  page.innerHTML = ({ dashboard: dashboardPage, voters: votersPage, field: fieldPage, commands: commandsPage, more: morePage }[state.page] || dashboardPage)()
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === state.page))
  const fab = document.querySelector('#fab'); if (fab) fab.classList.toggle('hidden', !['voters', 'field', 'commands'].includes(state.page) || (state.page === 'commands' && !can('admin', 'owner')))
}

function dashboardPage() {
  const counts = Object.fromEntries(['support', 'swing', 'refuse', 'unknown'].map(s => [s, state.voters.filter(v => v.preference === s).length]))
  const total = state.voters.length || 1, pct = Math.min(100, Math.round(counts.support / CAMPAIGN_TARGET * 100))
  const done = state.activities.filter(a => a.status === 'done').length
  const fieldPct = state.activities.length ? Math.round(done / state.activities.length * 100) : 0
  return `<section class="command-banner"><div class="command-copy"><span class="eyebrow">CANDIDATE COMMAND CENTER V2.0</span><h1>${esc(state.profile.full_name)}</h1><p><strong>${rupiah(CAMPAIGN_TARGET)} Suara</strong> dari Total DPT ${rupiah(TOTAL_DPT)}</p></div><div class="hero-actions"><button class="btn action-amber" data-action="add-voter">${icon('plus')} Input Pemilih</button><button class="btn action-cyan" data-action="add-report">${icon('clipboard')} Lapor Kegiatan</button></div></section>
    <section class="card target-card"><div class="card-heading"><div><span>CAPAIAN RIIL TARGET SUARA</span><small>Data pendukung tervalidasi</small></div><b>${rupiah(counts.support)} / ${rupiah(CAMPAIGN_TARGET)} <em>(${pct}%)</em></b></div><div class="target-track"><i style="width:${Math.max(.4, pct)}%"></i></div></section>
    <section class="bento-grid metric-grid">
      ${metricCard('support', 'PENDUKUNG (SIAP)', counts.support, 'Suara siap dikawal', 'user')}
      ${metricCard('swing', 'SWING VOTER', counts.swing, 'Perlu pendekatan taktis', 'help')}
      ${metricCard('refuse', 'PENOLAK (LAWAN)', counts.refuse, 'Terdata di basis lawan', 'shield')}
      ${metricCard('total', 'TOTAL PEMILIH TERDATA', state.voters.length, `Dari total DPT Wilayah`, 'database')}
    </section>
    <section class="bento-grid analytics-grid">
      <article class="card chart-card"><div class="card-heading"><div><span>KLASIFIKASI SUARA</span><small>Komposisi data terpetakan</small></div><button class="mini-action" data-page="voters">Detail</button></div>${classificationChart(counts, total)}</article>
      <article class="card chart-card"><div class="card-heading"><div><span>SEBARAN PEMILIH PER WILAYAH</span><small>Basis data desa / kelurahan</small></div>${icon('map')}</div>${territoryChart()}</article>
    </section>
    ${can('admin', 'owner') ? rivalComparisonCard(counts) : ''}
    <section class="card ai-strategy-card"><div class="ai-orb">${icon('sparkle')}</div><div class="ai-copy"><span class="command-badge">${icon('sparkle')} COMMAND PANEL</span><h2>AI Strategy Assistant</h2><p>Konsultasi situasi lapangan, respon taktis pergerakan lawan, dan otomatisasi pembuatan pesan komando WhatsApp ke Korlap Desa.</p><div class="advisor-insight">${esc(advisorText(counts, fieldPct))}</div><div class="hero-actions"><button class="btn action-amber" data-action="send-command">${icon('send')} Kirim Perintah ke Tim</button><button class="btn btn-ghost" data-action="check-ai-data">${icon('database')} Cek Data Dasar AI</button></div></div></section>
    <section class="bento-grid reports-grid"><article class="card report-panel"><div class="card-heading"><div><span>LAPORAN KEJADIAN PENTING</span><small>Insiden yang perlu tindak lanjut</small></div><b class="alert-count">${state.reports.filter(r => r.report_type === 'incident').length}</b></div><div class="compact-list">${incidentItems()}</div></article><article class="card report-panel"><div class="card-heading"><div><span>LAPORAN LAPANGAN TERAKHIR</span><small>Pembaruan kegiatan terkini</small></div><button class="mini-action" data-page="field">Semua</button></div><div class="compact-list">${latestFieldItems()}</div></article></section>`
}

function rivalComparisonCard(counts) {
  const ourPct = state.voters.length ? Math.round(counts.support / state.voters.length * 100) : 0
  const latest = new Map()
  for (const row of state.opponents) if (!latest.has(row.opponent_name)) latest.set(row.opponent_name, Number(row.estimated_support || 0))
  const rivals = [...latest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  const leader = rivals[0] || ['Belum ada data rival', 0]
  const gap = ourPct - leader[1]
  const risk = !rivals.length ? 'DATA MINIM' : gap >= 8 ? 'TERKENDALI' : gap >= 0 ? 'WASPADA' : 'TINGGI'
  const recommendation = !rivals.length
    ? 'Tambahkan snapshot rival agar mesin dapat menghitung selisih dukungan dan risiko secara akurat.'
    : gap < 0
      ? `Kita tertinggal ${Math.abs(gap)} poin dari ${leader[0]}. Prioritaskan swing voter di desa dengan basis terdata terbesar dan tingkatkan frekuensi door-to-door.`
      : gap < 8
        ? `Keunggulan baru ${gap} poin. Jaga pendukung aktif dan siapkan respons cepat terhadap pergerakan ${leader[0]}.`
        : `Keunggulan ${gap} poin cukup sehat. Fokus pada validasi ulang pendukung dan cegah perpindahan suara menjelang hari pemilihan.`
  const rows = [['Tim Kita', ourPct], ...rivals]
  return `<section class="card rival-card"><div class="card-heading"><div><span>PERBANDINGAN TIM KITA VS RIVAL</span><small>Ringkasan khusus Owner / Admin</small></div><div class="risk-badge ${risk.toLowerCase().replace(' ', '-')}">RISIKO ${risk}</div></div><div class="rival-layout"><div class="rival-bars">${rows.map(([name, value], index) => `<div class="rival-row"><div><strong>${esc(name)}</strong><b>${value}%</b></div><div class="rival-track"><i class="${index ? 'rival' : 'ours'}" style="width:${Math.max(1, Math.min(100, value))}%"></i></div></div>`).join('')}</div><div class="rival-advice"><span>${icon('sparkle')} REKOMENDASI KEPUTUSAN</span><p>${esc(recommendation)}</p><button class="btn action-amber" data-page="commands">Buka Analisis Risiko AI</button><button class="mini-action" data-action="add-opponent">＋ Data Rival</button></div></div></section>`
}

function metricCard(type, label, value, description, iconName) {
  return `<article class="card metric-card ${type}"><div class="metric-icon">${icon(iconName)}</div><span>${label}</span><strong>${rupiah(value)}</strong><small>${esc(description)}</small></article>`
}

function classificationChart(counts, total) {
  const known = Math.max(1, counts.support + counts.swing + counts.refuse)
  const supportPct = counts.support / known * 100, swingPct = counts.swing / known * 100, refusePct = counts.refuse / known * 100
  return `<div class="classification"><div class="ring" style="background:conic-gradient(var(--ok) 0 ${supportPct}%,var(--amber) 0 ${supportPct + swingPct}%,var(--bad) 0 ${supportPct + swingPct + refusePct}%,#263244 0)"><div><strong>${Math.round(counts.support / total * 100)}%</strong><small>Dukungan</small></div></div><div class="legend">${[['Pendukung', counts.support, 'var(--ok)'], ['Swing Voter', counts.swing, 'var(--amber)'], ['Penolak', counts.refuse, 'var(--bad)']].map(([label, val, color]) => `<div><span style="--c:${color}">${label}</span><b>${rupiah(val)}</b></div>`).join('')}</div></div>`
}

function territoryChart() {
  const areas = new Map()
  for (const voter of state.voters) { const area = voter.village?.trim() || 'Belum ditentukan'; areas.set(area, (areas.get(area) || 0) + 1) }
  const rows = [...areas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const display = rows.length ? rows : [['Desa Sukamaju', 0], ['Desa Kencana', 0], ['Desa Murni', 0], ['Desa Sejahtera', 0]]
  const max = Math.max(1, ...display.map(x => x[1]))
  return `<div class="territory-bars">${display.map(([name, val]) => `<div class="territory-row"><div><span>${esc(name)}</span><b>${rupiah(val)}</b></div><div class="territory-track"><i style="width:${val ? Math.max(7, val / max * 100) : 3}%"></i></div></div>`).join('')}</div>`
}

function incidentItems() {
  const incidents = state.reports.filter(r => r.report_type === 'incident').slice(0, 4)
  if (!incidents.length) return empty('Belum ada kejadian penting. Kondisi lapangan terkendali.')
  return incidents.map((r, index) => `<article class="incident-item"><div class="severity ${index === 0 ? 'high' : 'medium'}">${index === 0 ? 'TINGGI' : 'SEDANG'}</div><div><strong>${esc(r.title)}</strong><p>${esc(r.summary)}</p><small>${esc(r.teams?.name || 'Wilayah belum dicatat')} · ${esc(r.profiles?.full_name || 'Tim lapangan')}</small></div></article>`).join('')
}

function latestFieldItems() {
  const reports = state.reports.filter(r => r.report_type !== 'incident').slice(0, 4)
  if (!reports.length) return empty('Belum ada laporan kegiatan lapangan.')
  return reports.map((r, index) => { const related = state.activities[index]; const progress = related?.progress ?? 100; return `<article class="field-report-item"><button class="report-thumb ${r.media_path ? 'has-media' : ''}" ${r.media_path ? `data-action="open-media" data-path="${esc(r.media_path)}"` : 'disabled'} aria-label="Bukti kegiatan">${icon('clipboard')}</button><div class="field-report-copy"><div><span class="activity-type">${esc(String(r.title || r.report_type).replaceAll(' ', '_').toUpperCase())}</span><time>${dateId(r.created_at)}</time></div><strong>${esc(r.summary)}</strong><div class="report-progress"><i style="width:${Math.min(100, progress)}%"></i></div><small>${esc(r.profiles?.full_name || 'Tim lapangan')} · ${progress}% capaian</small></div></article>` }).join('')
}

function opponentChart() {
  const own = state.voters.length ? Math.round(state.voters.filter(v => v.preference === 'support').length / state.voters.length * 100) : 0
  const latest = new Map(); for (const o of state.opponents) if (!latest.has(o.opponent_name)) latest.set(o.opponent_name, Number(o.estimated_support || 0))
  const rows = [['Kandidat Kita', own], ...latest.entries()].slice(0, 6), max = Math.max(100, ...rows.map(x => x[1]))
  return rows.length ? `<div class="bars">${rows.map(([name, val]) => `<div class="bar-wrap"><div class="bar" style="height:${Math.max(3, val / max * 125)}px" title="${esc(name)} ${val}%"></div><span class="bar-label">${esc(name)}</span><b style="font-size:11px">${val}%</b></div>`).join('')}</div>` : empty('Belum ada data perbandingan.')
}

function advisorText(counts, fieldPct) {
  const tips = []
  if (counts.swing > counts.support * .35) tips.push(`Prioritaskan pendekatan personal kepada ${counts.swing} swing voter; bagi target per tim dan catat hasil kunjungan.`)
  if (fieldPct < 70) tips.push(`Penyelesaian tugas baru ${fieldPct}%. Pecah tugas besar menjadi target harian dan tetapkan penanggung jawab.`)
  if (state.reports.filter(r => r.report_date === today()).length < Math.max(1, state.teams.length)) tips.push('Belum semua tim mengirim laporan hari ini. Kirim pengingat dan minta bukti kegiatan sebelum malam.')
  if (!tips.length) tips.push('Tren lapangan cukup baik. Pertahankan ritme, verifikasi ulang pendukung, dan fokuskan sumber daya pada wilayah dengan swing voter tertinggi.')
  return tips.join(' ')
}

function votersPage() {
  const q = state.filters.voter.toLowerCase(), status = state.filters.status
  const items = state.voters.filter(v => (!q || `${v.full_name} ${v.address} ${v.village} ${v.polling_station}`.toLowerCase().includes(q)) && (!status || v.preference === status))
  return `<div class="page-head"><div><h1>Data Pemilih</h1><p>${items.length} dari ${state.voters.length} data terlihat.</p></div></div><div class="toolbar no-print"><input class="input" id="voter-search" value="${esc(state.filters.voter)}" placeholder="Cari nama/wilayah…"><select class="input" id="voter-status"><option value="">Semua status</option>${['support', 'swing', 'refuse', 'unknown'].map(s => `<option value="${s}" ${status === s ? 'selected' : ''}>${voterStatus(s)}</option>`).join('')}</select><button class="btn btn-ghost" data-action="export-voters">Ekspor CSV</button><button class="btn btn-ghost" data-action="print">Cetak/PDF</button></div><div class="section-title"><h2>Daftar Pemilih</h2></div><section class="list">${items.map(voterItem).join('') || empty('Belum ada data pemilih yang cocok.')}</section>`
}

function voterItem(v) {
  return `<article class="list-item"><div class="avatar">${initials(v.full_name)}</div><div class="list-main"><strong>${esc(v.full_name)}</strong><p>${esc([v.village, v.address, v.polling_station ? `TPS ${v.polling_station}` : ''].filter(Boolean).join(' • '))}</p><div class="meta"><span class="chip ${statusChip(v.preference)}">${voterStatus(v.preference)}</span>${v.teams?.name ? `<span class="chip">${esc(v.teams.name)}</span>` : ''}</div></div><button class="icon-btn no-print" data-action="edit-voter" data-id="${v.id}">⋮</button></article>`
}

function fieldPage() {
  return `<div class="page-head"><div><h1>Kinerja Lapangan</h1><p>Tugas, progres, foto, dan bukti kegiatan tersinkron ke akun pusat.</p></div></div><section class="grid quick-grid"><button class="card card-pad quick btn" data-action="add-activity"><span>✓</span><strong>Tambah Tugas</strong><small class="muted">Rencana dan progres</small></button><button class="card card-pad quick btn camera-quick" data-action="add-report">${icon('camera')}<strong>Buka Kamera & Lapor</strong><small class="muted">Foto langsung ke pusat</small></button></section><div class="section-title"><h2>Daftar Tugas</h2></div><section class="list">${state.activities.map(activityItem).join('') || empty('Belum ada tugas lapangan.')}</section><div class="section-title"><h2>Laporan Lapangan</h2></div><section class="list">${state.reports.map(reportItem).join('') || empty('Belum ada laporan lapangan.')}</section>`
}

function activityItem(a) {
  return `<article class="list-item"><div class="list-main"><strong>${esc(a.title)}</strong><p>${esc(a.description || '')}</p><div class="progress"><i style="width:${Math.min(100, a.progress || 0)}%"></i></div><div class="meta"><span class="chip ${statusChip(a.status)}">${a.progress || 0}% • ${esc(a.status)}</span>${a.teams?.name ? `<span class="chip">${esc(a.teams.name)}</span>` : ''}${a.due_date ? `<span class="chip">Target ${esc(a.due_date)}</span>` : ''}</div></div><button class="icon-btn no-print" data-action="edit-activity" data-id="${a.id}">⋮</button></article>`
}

function reportItem(r) {
  return `<article class="list-item"><div class="list-main"><strong>${esc(r.title)}</strong><p>${esc(r.summary)}</p><div class="meta"><span class="chip info">${esc(r.report_type)}</span><span class="chip">${esc(r.profiles?.full_name || '')}</span><span class="chip">${dateId(r.created_at)}</span>${r.media_path ? `<button class="chip btn" data-action="open-media" data-path="${esc(r.media_path)}">Lihat bukti</button>` : ''}</div></div></article>`
}

function commandsPage() {
  if (!can('admin', 'owner')) return `<section class="page-head"><div><span class="eyebrow">PUSAT KOMANDO</span><h1>Instruksi Tim</h1><p>Daftar arahan yang diterbitkan Owner dan Admin.</p></div></section>${commandHistory()}`
  const categories = ['Aksi Money Politics / Sembako Tim Lawan', 'Penurunan Suara Pendukung & Keraguan Pemilih', 'Tingginya Swing Voter di TPS Kunci', 'Perusakan Alat Peraga Kampanye', 'Isu Black Campaign', 'Persiapan Debat & Penguasaan Isu Daerah']
  const actualAreas = [...new Set(state.voters.map(v => v.village).filter(Boolean))]
  const areas = [...new Set([...actualAreas, 'Desa Sukamaju', 'Desa Kencana', 'Desa Murni', 'Seluruh Wilayah Pemilihan'])]
  return `<section class="strategy-engine"><div class="strategy-header"><span class="gemini-badge">${icon('sparkle')} INTELLIGENCE STRATEGY ENGINE · GEMINI-READY</span><h1>Pertimbangan & Strategi AI Pemenangan</h1><p>Asisten kecerdasan buatan untuk Owner & Kandidat. Dapatkan analisis taktis, rekomendasi aksi relawan, dan draf instruksi komando ke WhatsApp.</p></div><form class="card strategy-form" id="strategy-form"><div class="strategy-form-grid"><div class="field"><label for="strategy_category">Kategori Masalah Lapangan</label><select class="input" id="strategy_category" name="strategy_category" required>${categories.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div><div class="field"><label for="strategy_area">Wilayah Fokus / Target Desa</label><select class="input" id="strategy_area" name="strategy_area" required>${areas.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div></div><div class="field"><label for="strategy_detail">Rincian Masalah Spesifik</label><textarea class="input" id="strategy_detail" name="strategy_detail" required maxlength="1800" placeholder="Tuliskan kronologi riil, waktu kejadian, aktor yang terlibat, dan respons warga…"></textarea></div><button class="btn action-amber strategy-submit" type="submit">${icon('sparkle')} Hasilkan Pertimbangan & Strategi AI</button><small class="engine-note">Analisis instan menggunakan data internal yang diizinkan RLS. Kunci layanan eksternal tidak pernah disimpan di browser.</small></form>${state.strategy ? strategyResult(state.strategy) : `<section class="strategy-placeholder"><div class="ai-orb">${icon('sparkle')}</div><h2>Mesin siap menganalisis</h2><p>Pilih masalah, wilayah, dan masukkan kronologi untuk menghasilkan empat lapisan analisis strategis.</p></section>`}</section><div class="section-title"><h2>Riwayat Komando Tersimpan</h2></div>${commandHistory()}`
}

function commandHistory() {
  return `<section class="list command-list">${state.commands.map(c => `<article class="list-item"><span class="command-symbol">${c.priority === 'urgent' ? '!' : '↗'}</span><div class="list-main"><strong>${esc(c.title)}</strong><p>${esc(c.message)}</p><div class="meta"><span class="chip ${statusChip(c.priority)}">${esc(c.priority)}</span><span class="chip">${dateId(c.created_at)}</span>${c.whatsapp_message ? `<a class="chip whatsapp" href="https://wa.me/?text=${encodeURIComponent(c.whatsapp_message)}" target="_blank" rel="noopener">Bagikan WhatsApp</a>` : ''}</div></div></article>`).join('') || empty('Belum ada komando. Hasil strategi dapat disimpan di sini.')}</section>`
}

function generateStrategy(category, area, detail) {
  const support = state.voters.filter(v => v.preference === 'support').length
  const swing = state.voters.filter(v => v.preference === 'swing').length
  const incidents = state.reports.filter(r => r.report_type === 'incident').length
  const urgent = /Money|Black|Perusakan/i.test(category)
  const situation = `${category} di ${area} berpotensi memengaruhi persepsi keamanan, kepercayaan, dan keteguhan pilihan warga. Kronologi yang dilaporkan: ${detail}. Pola ini perlu dibaca sebagai upaya merebut perhatian, membangun keraguan, atau melemahkan koordinasi relawan. Basis saat ini mencatat ${support} pendukung dan ${swing} swing voter, sehingga respons harus terukur, legal, dan tidak reaktif.`
  const risks = urgent
    ? ['Jangka pendek: eskalasi emosi, penyebaran bukti tanpa verifikasi, dan konflik antar-relawan.', 'Jangka panjang: normalisasi pelanggaran, penurunan kepercayaan kepada kandidat, serta potensi kehilangan basis suara jika narasi lawan tidak diimbangi.']
    : ['Jangka pendek: kebingungan pemilih dan turunnya intensitas dukungan di wilayah fokus.', 'Jangka panjang: swing voter berpindah, relawan kehilangan ritme, dan selisih elektabilitas semakin sulit dipulihkan.']
  const tactics = urgent
    ? ['Verifikasi kronologi melalui dua sumber lapangan dan simpan bukti asli secara privat.', 'Aktifkan korlap desa untuk pemetaan titik kejadian tanpa konfrontasi langsung.', 'Lakukan kunjungan silaturahmi dan edukasi politik santun kepada warga terdampak.', 'Koordinasikan respons hukum/etik melalui tim resmi; hindari penyebaran tuduhan yang belum terbukti.', 'Pantau perubahan sikap pemilih selama 48 jam dan laporkan hasilnya ke pusat komando.']
    : ['Petakan TPS dengan swing voter tertinggi dan tetapkan penanggung jawab harian.', 'Laksanakan door-to-door berbasis isu lokal dengan pesan singkat yang konsisten.', 'Perkuat alat peraga dan kegiatan sosial di titik dengan penurunan interaksi.', 'Hubungi ulang pendukung untuk validasi komitmen dan identifikasi keberatan terbaru.', 'Evaluasi hasil setiap malam dan alihkan relawan ke wilayah dengan konversi terbaik.']
  const draft = `KOMANDO RESMI TIM PEMENANGAN\n\nFokus: ${category}\nWilayah: ${area}\n\nKepada seluruh Korlap dan relawan, lakukan langkah berikut:\n${tactics.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\nJaga ketertiban, hindari provokasi, dokumentasikan setiap kegiatan, dan kirim laporan terverifikasi ke Pusat Komando.\n\n— ${state.profile.full_name}`
  return { category, area, detail, situation, risks, tactics, draft, riskLevel: urgent || incidents > 2 ? 'TINGGI' : swing > support * .5 ? 'SEDANG' : 'TERKENDALI' }
}

function strategyResult(result) {
  return `<section class="strategy-results"><div class="strategy-result-head"><div><span>HASIL INTELLIGENCE ENGINE</span><h2>${esc(result.category)}</h2><p>${esc(result.area)} · Risiko ${esc(result.riskLevel)}</p></div><span class="risk-badge ${result.riskLevel.toLowerCase()}">${esc(result.riskLevel)}</span></div><article class="analysis-section"><span>SEKSI 1</span><h3>Analisis Situasi & Pemetaan Lapangan</h3><p>${esc(result.situation)}</p></article><article class="analysis-section risk-section"><span>SEKSI 2</span><h3>Analisis Risiko Lapangan</h3>${result.risks.map(x => `<p>${esc(x)}</p>`).join('')}</article><article class="analysis-section"><span>SEKSI 3</span><h3>Rekomendasi Tanggap Segera</h3><ol>${result.tactics.map(x => `<li>${esc(x)}</li>`).join('')}</ol></article><article class="analysis-section command-draft"><span>SEKSI 4</span><h3>Draf Pesan Komando WhatsApp Korlap</h3><pre id="strategy-draft">${esc(result.draft)}</pre><div class="strategy-actions"><button class="btn btn-ghost" data-action="copy-strategy">${icon('copy')} Salin Teks</button><button class="btn action-amber" data-action="save-strategy">${icon('save')} Simpan ke Pusat Komando</button><button class="btn whatsapp-button" data-action="whatsapp-strategy">${icon('whatsapp')} Buka & Kirim via WhatsApp</button></div></article><footer>BBR @ SYNERGY smart system</footer></section>`
}

function morePage() {
  const pending = state.profiles.filter(p => p.approval_status === 'pending')
  return `<section class="card profile-card"><div class="avatar">${initials(state.profile.full_name)}</div><h2>${esc(state.profile.full_name)}</h2><p class="muted">${esc(roleName(state.profile.role))} • ${esc(state.session.user.email)}</p>${state.profile.phone ? `<a class="chip" href="https://wa.me/${phoneIntl(state.profile.phone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</section>
    <div class="section-title"><h2>Menu</h2></div><section class="list"><button class="list-item btn" data-action="notifications"><span>♢</span><div class="list-main"><strong>Notifikasi</strong><p>${unreadCount()} belum dibaca</p></div></button>${can('admin', 'owner') ? `<button class="list-item btn" data-action="add-opponent"><span>▥</span><div class="list-main"><strong>Data Tim Lawan</strong><p>Input estimasi kondisi lapangan</p></div></button>` : ''}<button class="list-item btn" data-action="change-password"><span>⌘</span><div class="list-main"><strong>Ganti Password</strong><p>Perbarui keamanan akun</p></div></button><button class="list-item btn" data-action="logout"><span>↪</span><div class="list-main"><strong>Keluar</strong><p>Akhiri sesi aplikasi</p></div></button></section>
    ${can('admin') ? `<div class="section-title"><h2>Persetujuan Akun (${pending.length})</h2></div><section class="list">${pending.map(p => `<article class="list-item"><div class="avatar">${initials(p.full_name)}</div><div class="list-main"><strong>${esc(p.full_name)}</strong><p>${esc(p.phone || '')}</p><div class="meta"><select class="input" id="role-${p.id}" style="min-height:36px"><option value="team">Tim Pemenangan</option><option value="owner">Owner</option><option value="admin">Admin</option></select><select class="input" id="team-${p.id}" style="min-height:36px"><option value="">Tanpa tim</option>${state.teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select><button class="btn btn-primary" data-action="approve-user" data-id="${p.id}">Setujui</button><button class="btn btn-danger" data-action="reject-user" data-id="${p.id}">Tolak</button></div></div></article>`).join('') || empty('Tidak ada akun menunggu.')}</section><div class="section-title"><h2>Tim Pemenangan</h2><button class="btn btn-ghost" data-action="add-team">＋ Tim</button></div><section class="list">${state.teams.map(t => `<article class="list-item"><div class="list-main"><strong>${esc(t.name)}</strong><p>${esc(t.area || 'Wilayah belum ditetapkan')}</p></div></article>`).join('') || empty('Belum ada tim.')}</section>` : ''}`
}

function empty(text) { return `<div class="empty"><div class="empty-icon">◇</div>${esc(text)}</div>` }
function phoneIntl(p) { const x = String(p || '').replace(/\D/g, ''); return x.startsWith('0') ? `62${x.slice(1)}` : x }

function openModal(titleText, body, formId = '') {
  const wrap = document.createElement('div'); wrap.className = 'modal-backdrop'; wrap.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${esc(titleText)}</h2><button class="close" data-action="close-modal" aria-label="Tutup">×</button></div>${formId ? `<form id="${formId}">${body}</form>` : body}</section>`; document.body.append(wrap); wrap.querySelector('input,select,textarea,button')?.focus()
}
function field(name, label, value = '', opts = '') { return `<div class="field"><label for="${name}">${label}</label><input class="input" id="${name}" name="${name}" value="${esc(value ?? '')}" ${opts}></div>` }
function selectField(name, label, options, selected = '') { return `<div class="field"><label for="${name}">${label}</label><select class="input" id="${name}" name="${name}">${options.map(([v, l]) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` }
function teamOptions(selected = '') { return [['', 'Tanpa tim'], ...state.teams.map(t => [t.id, t.name])].map(([v, l]) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('') }

function voterModal(v = {}) {
  openModal(v.id ? 'Ubah Data Pemilih' : 'Tambah Pemilih', `<input type="hidden" name="id" value="${v.id || ''}"><div class="form-grid two">${field('full_name', 'Nama lengkap', v.full_name, 'required maxlength="120"')}${field('phone', 'Nomor WhatsApp', v.phone, 'inputmode="tel" maxlength="18"')}${field('village', 'Desa/Kelurahan', v.village, 'required maxlength="100"')}${field('address', 'Alamat / RT-RW', v.address, 'maxlength="220"')}${field('polling_station', 'Nomor TPS', v.polling_station, 'maxlength="20"')}${selectField('preference', 'Status dukungan', [['support', 'Siap Bergabung'], ['swing', 'Swing Voter'], ['refuse', 'Belum Bersedia'], ['unknown', 'Belum Dipetakan']], v.preference || 'unknown')}<div class="field"><label for="team_id">Tim penanggung jawab</label><select class="input" id="team_id" name="team_id">${teamOptions(v.team_id)}</select></div></div><div class="field"><label for="notes">Catatan terbatas</label><textarea class="input" id="notes" name="notes" maxlength="500">${esc(v.notes || '')}</textarea></div><div class="actions">${v.id ? `<button class="btn btn-danger" type="button" data-action="delete-voter" data-id="${v.id}">Hapus</button>` : ''}<button class="btn btn-primary" type="submit">Simpan</button></div>`, 'voter-form')
}

function activityModal(a = {}) {
  openModal(a.id ? 'Perbarui Tugas' : 'Tambah Tugas Lapangan', `<input type="hidden" name="id" value="${a.id || ''}">${field('title', 'Judul tugas', a.title, 'required maxlength="160"')}<div class="field"><label for="description">Uraian</label><textarea class="input" id="description" name="description" maxlength="1000">${esc(a.description || '')}</textarea></div><div class="form-grid two"><div class="field"><label for="team_id">Tim</label><select class="input" id="team_id" name="team_id">${teamOptions(a.team_id || state.profile.team_id)}</select></div>${selectField('status', 'Status', [['planned', 'Direncanakan'], ['in_progress', 'Dikerjakan'], ['done', 'Selesai']], a.status || 'planned')}${field('progress', 'Progres (%)', a.progress || 0, 'type="number" min="0" max="100" required')}${field('due_date', 'Target selesai', a.due_date, 'type="date"')}</div><div class="actions"><button class="btn btn-primary" type="submit">Simpan Tugas</button></div>`, 'activity-form')
}

function reportModal() {
  openModal('Kirim Laporan ke Pusat', `${field('title', 'Judul laporan', '', 'required maxlength="160"')}<div class="field"><label for="summary">Ringkasan hasil</label><textarea class="input" id="summary" name="summary" required maxlength="1500" placeholder="Jelaskan kegiatan, lokasi, hasil, dan temuan penting…"></textarea></div><div class="form-grid two">${selectField('report_type', 'Jenis laporan', [['activity', 'Kegiatan'], ['incident', 'Kejadian penting'], ['survey', 'Kondisi lapangan']], 'activity')}${field('report_date', 'Tanggal kegiatan', today(), 'type="date" required')}</div><div class="camera-field"><div class="camera-icon">${icon('camera')}</div><div><strong>Foto Bukti Lapangan</strong><p>Pada HP, tombol ini akan membuka kamera belakang. Foto disimpan privat dan hanya dapat dibuka melalui tautan aman sementara.</p></div><label class="btn action-cyan camera-trigger" for="media">${icon('camera')} Buka Kamera / Pilih Foto</label><input id="media" name="media" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"><div id="media-preview" class="camera-preview hidden"></div></div><div class="actions"><button class="btn btn-cyan" type="submit">${icon('send')} Kirim Laporan ke Pusat</button></div>`, 'report-form')
}

async function optimizeImage(file) {
  if (!file?.type?.startsWith('image/') || file.size < 800 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio)
    canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82))
    if (!blob) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'foto-lapangan'}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch { return file }
}

function commandModal() {
  openModal('Buat Komando', `${field('title', 'Judul komando', '', 'required maxlength="160"')}<div class="field"><label for="message">Isi instruksi</label><textarea class="input" id="message" name="message" required maxlength="1500"></textarea></div>${selectField('priority', 'Prioritas', [['normal', 'Normal'], ['urgent', 'Mendesak']], 'normal')}<div class="field"><label for="whatsapp_message">Pesan WhatsApp (opsional)</label><textarea class="input" id="whatsapp_message" name="whatsapp_message" maxlength="1000"></textarea></div><div class="actions"><button class="btn btn-primary" type="submit">Terbitkan Komando</button></div>`, 'command-form')
}

function exportCsv() {
  const rows = [['Nama', 'WhatsApp', 'Desa', 'Alamat', 'TPS', 'Status', 'Tim', 'Tanggal Input'], ...state.voters.map(v => [v.full_name, v.phone, v.village, v.address, v.polling_station, voterStatus(v.preference), v.teams?.name || '', dateId(v.created_at)])]
  const csv = '\ufeff' + rows.map(r => r.map(x => `"${String(x || '').replaceAll('"', '""')}"`).join(';')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `data-pemilih-${today()}.csv`; a.click(); URL.revokeObjectURL(a.href)
}

async function save(table, payload, id, button) {
  setBusy(button, true)
  const query = id ? supabase.from(table).update(payload).eq('id', id) : supabase.from(table).insert(payload)
  const { error } = await query
  setBusy(button, false)
  if (error) throw error
  document.querySelector('.modal-backdrop')?.remove(); await loadAll(true); renderPage(); toast('Data berhasil disimpan.')
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action],[data-page],[data-auth-tab]'); if (!el) return
  if (el.dataset.authTab) return authScreen(el.dataset.authTab)
  if (el.dataset.page) { state.page = el.dataset.page; el.closest('.modal-backdrop')?.remove(); document.querySelector('.menu-drawer-backdrop')?.remove(); renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const action = el.dataset.action
  try {
    if (action === 'close-modal') el.closest('.modal-backdrop')?.remove()
    if (action === 'open-menu') openMenuDrawer()
    if (action === 'close-menu') document.querySelector('.menu-drawer-backdrop')?.remove()
    if (action === 'logout') {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      if (state.realtime) { supabase.removeChannel(state.realtime); state.realtime = null }
      clearCampaignData(); state.strategy = null; state.session = null; state.profile = null; authScreen(); return
    }
    if (action === 'refresh') { await loadAll(true); renderPage(); toast('Data sudah diperbarui.') }
    if (action === 'print') window.print()
    if (action === 'export-voters') exportCsv()
    if (action === 'add-voter') voterModal()
    if (action === 'add-report') { document.querySelector('.menu-drawer-backdrop')?.remove(); reportModal() }
    if (action === 'send-command') { if (can('admin', 'owner')) commandModal(); else toast('Pembuatan komando hanya untuk Owner atau Admin.', 'error') }
    if (action === 'check-ai-data') {
      const counts = Object.fromEntries(['support', 'swing', 'refuse', 'unknown'].map(s => [s, state.voters.filter(v => v.preference === s).length]))
      openModal('Data Dasar AI Strategy', `<section class="ai-data-grid"><div><span>Total pemilih</span><strong>${rupiah(state.voters.length)}</strong></div><div><span>Pendukung</span><strong>${rupiah(counts.support)}</strong></div><div><span>Swing voter</span><strong>${rupiah(counts.swing)}</strong></div><div><span>Laporan lapangan</span><strong>${rupiah(state.reports.length)}</strong></div></section><div class="info-box">Analisis menggunakan data yang diizinkan oleh hak akses akun dan RLS Supabase. Data pribadi tidak dikirim ke layanan AI eksternal.</div><button class="btn action-cyan btn-block" data-page="voters">Buka Data Pemilih</button>`)
    }
    if (action === 'copy-strategy' && state.strategy) { await navigator.clipboard.writeText(state.strategy.draft); toast('Draf komando berhasil disalin.') }
    if (action === 'save-strategy' && state.strategy) await save('commands', { title: `Strategi: ${state.strategy.category}`, message: state.strategy.situation, priority: state.strategy.riskLevel === 'TINGGI' ? 'urgent' : 'normal', whatsapp_message: state.strategy.draft, created_by: state.profile.id }, null, el)
    if (action === 'whatsapp-strategy' && state.strategy) window.open(`https://wa.me/?text=${encodeURIComponent(state.strategy.draft)}`, '_blank', 'noopener')
    if (action === 'add') ({ voters: () => voterModal(), field: () => reportModal(), commands: commandModal }[state.page]?.())
    if (action === 'edit-voter') voterModal(state.voters.find(v => v.id === el.dataset.id))
    if (action === 'delete-voter' && confirm('Hapus data pemilih ini? Tindakan tercatat dalam audit.')) { const { error } = await supabase.from('voters').delete().eq('id', el.dataset.id); if (error) throw error; el.closest('.modal-backdrop')?.remove(); await loadAll(true); renderPage(); toast('Data dihapus.') }
    if (action === 'add-activity') activityModal()
    if (action === 'edit-activity') activityModal(state.activities.find(a => a.id === el.dataset.id))
    if (action === 'add-opponent') openModal('Data Kondisi Lawan', `${field('opponent_name', 'Nama kandidat/tim lawan', '', 'required maxlength="120"')}${field('estimated_support', 'Estimasi dukungan (%)', '', 'type="number" min="0" max="100" required')}<div class="field"><label for="notes">Catatan sumber lapangan</label><textarea class="input" id="notes" name="notes" maxlength="600"></textarea></div><div class="actions"><button class="btn btn-primary">Simpan</button></div>`, 'opponent-form')
    if (action === 'add-team') openModal('Tambah Tim', `${field('name', 'Nama tim', '', 'required maxlength="100"')}${field('area', 'Wilayah kerja', '', 'maxlength="160"')}<div class="actions"><button class="btn btn-primary">Simpan Tim</button></div>`, 'team-form')
    if (action === 'approve-user') { const role = document.querySelector(`#role-${el.dataset.id}`).value, team_id = document.querySelector(`#team-${el.dataset.id}`).value || null; await save('profiles', { role, team_id, approval_status: 'active', approved_at: new Date().toISOString(), approved_by: state.profile.id }, el.dataset.id, el) }
    if (action === 'reject-user') { if (confirm('Tolak pendaftaran akun ini?')) await save('profiles', { approval_status: 'rejected', approved_at: new Date().toISOString(), approved_by: state.profile.id }, el.dataset.id, el) }
    if (action === 'open-media') { const { data, error } = await supabase.storage.from('field-evidence').createSignedUrl(el.dataset.path, 300); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener') }
    if (action === 'notifications') { openModal('Notifikasi', `<section class="list">${state.notifications.map(n => `<article class="list-item"><div class="list-main"><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><div class="meta"><span class="chip">${dateId(n.created_at)}</span></div></div></article>`).join('') || empty('Belum ada notifikasi.')}</section><button class="btn btn-ghost btn-block" data-action="read-notifications">Tandai semua dibaca</button>`); }
    if (action === 'read-notifications') { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null); await loadAll(true); document.querySelector('.modal-backdrop')?.remove(); renderPage() }
    if (action === 'change-password') openModal('Ganti Password', `${field('new_password', 'Password baru', '', 'type="password" minlength="8" required autocomplete="new-password"')}<div class="actions"><button class="btn btn-primary">Perbarui Password</button></div>`, 'password-form')
    if (action === 'forgot') { const email = document.querySelector('#email')?.value; if (!email) return toast('Isi email terlebih dahulu.', 'error'); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); if (error) throw error; toast('Tautan reset telah dikirim.') }
  } catch (err) { console.error(err); toast(err.message || 'Terjadi kesalahan.', 'error') }
})

document.addEventListener('input', e => { if (e.target.id === 'voter-search') { state.filters.voter = e.target.value; clearTimeout(reloadTimer); reloadTimer = setTimeout(renderPage, 180) } })
document.addEventListener('change', e => {
  if (e.target.id === 'voter-status') { state.filters.status = e.target.value; renderPage() }
  if (e.target.id === 'media') {
    const file = e.target.files?.[0], preview = document.querySelector('#media-preview')
    if (!preview) return
    if (!file) { preview.classList.add('hidden'); preview.innerHTML = ''; return }
    const url = URL.createObjectURL(file)
    preview.innerHTML = `<img src="${url}" alt="Pratinjau foto laporan"><div><strong>${esc(file.name)}</strong><small>${(file.size / 1024 / 1024).toFixed(1)} MB · siap dikirim</small></div>`
    preview.classList.remove('hidden')
  }
})

document.addEventListener('submit', async e => {
  e.preventDefault(); if (state.busy) return
  const form = e.target, fd = new FormData(form), button = form.querySelector('[type="submit"],button:not([type])')
  try {
    if (form.id === 'auth-form') {
      setBusy(button, true); const email = String(fd.get('email')).trim(), password = String(fd.get('password'))
      const result = form.dataset.mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { full_name: String(fd.get('full_name')).trim(), phone: String(fd.get('phone')).trim() } } })
      setBusy(button, false); if (result.error) throw result.error
      if (form.dataset.mode === 'register' && !result.data.session) authScreen('login', 'Pendaftaran berhasil. Periksa email untuk konfirmasi, lalu masuk.')
      return
    }
    if (form.id === 'strategy-form') {
      state.strategy = generateStrategy(String(fd.get('strategy_category')), String(fd.get('strategy_area')), String(fd.get('strategy_detail')).trim())
      renderPage(); document.querySelector('.strategy-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); toast('Analisis strategi selesai dibuat.'); return
    }
    if (form.id === 'voter-form') { const id = fd.get('id') || null; return save('voters', { full_name: fd.get('full_name').trim(), phone: fd.get('phone').trim() || null, village: fd.get('village').trim(), address: fd.get('address').trim() || null, polling_station: fd.get('polling_station').trim() || null, preference: fd.get('preference'), team_id: fd.get('team_id') || null, notes: fd.get('notes').trim() || null, updated_by: state.profile.id }, id, button) }
    if (form.id === 'activity-form') { const id = fd.get('id') || null; return save('activities', { title: fd.get('title').trim(), description: fd.get('description').trim() || null, team_id: fd.get('team_id') || null, status: fd.get('status'), progress: Number(fd.get('progress')), due_date: fd.get('due_date') || null, assignee_id: state.profile.id, updated_by: state.profile.id }, id, button) }
    if (form.id === 'report-form') {
      setBusy(button, true, 'Mengirim…'); let media_path = null; let file = fd.get('media')
      if (file?.size) { if (file.size > 20 * 1024 * 1024) throw new Error('Ukuran foto maksimal 20 MB.'); file = await optimizeImage(file); const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); media_path = `${state.profile.id}/${Date.now()}-${safe}`; const up = await supabase.storage.from('field-evidence').upload(media_path, file, { cacheControl: '3600', contentType: file.type, upsert: false }); if (up.error) throw up.error }
      const { error } = await supabase.from('field_reports').insert({ title: fd.get('title').trim(), summary: fd.get('summary').trim(), report_type: fd.get('report_type'), report_date: fd.get('report_date'), media_path, reporter_id: state.profile.id, team_id: state.profile.team_id })
      if (error) { if (media_path) await supabase.storage.from('field-evidence').remove([media_path]); throw error }
      setBusy(button, false); form.closest('.modal-backdrop').remove(); await loadAll(true); renderPage(); toast('Laporan berhasil dikirim.'); return
    }
    if (form.id === 'command-form') return save('commands', { title: fd.get('title').trim(), message: fd.get('message').trim(), priority: fd.get('priority'), whatsapp_message: fd.get('whatsapp_message').trim() || null, created_by: state.profile.id }, null, button)
    if (form.id === 'opponent-form') return save('opponent_snapshots', { opponent_name: fd.get('opponent_name').trim(), estimated_support: Number(fd.get('estimated_support')), notes: fd.get('notes').trim() || null, snapshot_date: today(), created_by: state.profile.id }, null, button)
    if (form.id === 'team-form') return save('teams', { name: fd.get('name').trim(), area: fd.get('area').trim() || null, created_by: state.profile.id }, null, button)
    if (form.id === 'password-form') { setBusy(button, true); const { error } = await supabase.auth.updateUser({ password: fd.get('new_password') }); setBusy(button, false); if (error) throw error; form.closest('.modal-backdrop').remove(); toast('Password berhasil diperbarui.') }
  } catch (err) { setBusy(button, false); console.error(err); const box = form.querySelector('#auth-error'); if (box) box.innerHTML = `<div class="error-box">${esc(err.message)}</div>`; else toast(err.message || 'Gagal memproses data.', 'error') }
})

async function start() {
  if (!configured) return configScreen()
  const { data } = await supabase.auth.getSession(); state.session = data.session
  supabase.auth.onAuthStateChange((_event, session) => { if (session?.user?.id !== state.session?.user?.id || (!session && state.session)) { state.session = session; setTimeout(bootSession, 0) } })
  await bootSession()
}

async function bootSession() {
  if (!state.session) { state.profile = null; if (state.realtime) supabase.removeChannel(state.realtime); return authScreen() }
  try {
    await loadProfile()
    if (state.profile.approval_status !== 'active') return pendingScreen()
    clearCampaignData()
    renderShell()
    await loadAll(true)
    renderPage()
    subscribeRealtime()
  } catch (err) { console.error(err); app.innerHTML = `<main class="auth-shell"><section class="auth-card"><div class="error-box">Gagal memuat aplikasi: ${esc(err.message)}</div><button class="btn btn-ghost btn-block" data-action="logout">Keluar</button></section></main>` }
}

start()
