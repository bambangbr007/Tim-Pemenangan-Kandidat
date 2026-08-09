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
const TOTAL_TPS = 200
const state = {
  session: null, profile: null, page: 'dashboard', busy: false, realtime: null,
  voters: [], activities: [], reports: [], commands: [], opponents: [], profiles: [], teams: [], notifications: [], tpsResults: [], assistance: [], electionIncidents: [], candidates: [], territoryTargets: [], campaignSettings: null,
  filters: { voter: '', status: '', report: '', tpsVillage: '', tpsResult: '', tpsWitness: '', assistanceStatus: '', assistanceGroup: '', assistanceSearch: '', targetScope: '', targetTeam: '' }, strategy: null
}
let cameraStream = null
let cameraTarget = null
const capturedFiles = new Map()

const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]))
const rupiah = n => new Intl.NumberFormat('id-ID').format(Number(n || 0))
const dateId = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : '-'
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
const initials = name => String(name || 'U').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()
const title = s => ({ dashboard: 'Dasbor Komando', voters: 'Data Pemilih', field: 'Kegiatan Lapangan', commands: 'AI Strategy Advisor', realcount: 'Real Count TPS', mobilization: 'Bantuan & Keamanan TPS', targets: 'Target Wilayah', more: 'Menu Utama' }[s] || 'Dasbor Komando')
const roleName = r => ({ admin: 'Admin', owner: 'Owner', team: 'Tim Pemenangan' }[r] || r)
const voterStatus = s => ({ support: 'Siap Bergabung', swing: 'Swing Voter', refuse: 'Belum Bersedia', unknown: 'Belum Dipetakan' }[s] || s)
const statusChip = s => ({ support: 'ok', swing: 'warn', refuse: 'bad', unknown: 'info', active: 'ok', pending: 'warn', rejected: 'bad', done: 'ok', in_progress: 'info', planned: 'warn', urgent: 'bad' }[s] || 'info')
const can = (...roles) => state.profile && roles.includes(state.profile.role)
const clearCampaignData = () => { for (const key of ['voters', 'activities', 'reports', 'commands', 'opponents', 'profiles', 'teams', 'notifications', 'tpsResults', 'assistance', 'electionIncidents', 'candidates', 'territoryTargets']) state[key] = []; state.campaignSettings = null }
const ourCandidate = () => state.candidates.find(c => c.is_our_candidate && c.is_active) || state.candidates.find(c => c.is_active)
const campaignTarget = () => Number(state.campaignSettings?.total_target ?? CAMPAIGN_TARGET)
const campaignDpt = () => Number(state.campaignSettings?.total_dpt ?? TOTAL_DPT)
const campaignName = () => ourCandidate()?.candidate_name || state.campaignSettings?.candidate_name || 'Kandidat Kita'
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
    ,vote: '<path d="M6 3h12l2 7-8 4-8-4 2-7Z"/><path d="M4 10v10h16V10M8 20v-5h8v5"/>'
    ,chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
    ,check: '<path d="m5 12 4 4L19 6"/>'
    ,car: '<path d="M5 17h14M7 17l-2-5 2-5h10l2 5-2 5M7 12h10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'
    ,alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>'
    ,location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
  }
  return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`
}

function toast(message, type = '') {
  let stack = document.querySelector('.toast-stack')
  if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.append(stack) }
  const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message; stack.append(el)
  setTimeout(() => el.remove(), 3200)
}

const isSessionError = error => /auth session missing|session.*missing|jwt.*expired|refresh token/i.test(String(error?.message || error || ''))

function returnToLogin(message = 'Sesi Anda telah berakhir. Silakan masuk kembali.') {
  stopCamera(); capturedFiles.clear()
  if (state.realtime) { supabase.removeChannel(state.realtime); state.realtime = null }
  clearCampaignData(); state.strategy = null; state.session = null; state.profile = null
  document.querySelector('.modal-backdrop')?.remove(); closeMenuDrawer()
  authScreen('login', message)
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
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('tps_results').select('*, profiles!tps_results_reporter_id_fkey(full_name,phone)').order('created_at', { ascending: false }).limit(1000),
    supabase.from('voter_assistance').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('election_day_incidents').select('*, profiles!election_day_incidents_reporter_id_fkey(full_name,phone)').order('created_at', { ascending: false }).limit(500),
    supabase.from('candidates').select('*').order('ballot_number', { ascending: true, nullsFirst: false }),
    supabase.from('territory_targets').select('*, candidates(candidate_name,color,is_our_candidate), teams(name)').order('area_name').order('scope_type'),
    supabase.from('campaign_settings').select('*').eq('id', true)
  ]
  if (can('admin', 'owner')) queries.push(supabase.from('profiles').select('*').order('created_at', { ascending: false }))
  const results = await Promise.all(queries)
  const failed = results.find(x => x.error)
  if (failed) throw failed.error
  ;[state.voters, state.activities, state.reports, state.commands, state.opponents, state.teams, state.notifications, state.tpsResults, state.assistance, state.electionIncidents, state.candidates, state.territoryTargets] = results.slice(0, 12).map(x => x.data || [])
  state.campaignSettings = results[12]?.data?.[0] || null
  state.profiles = results[13]?.data || []
  if (!quiet) renderShell()
}

function subscribeRealtime() {
  if (state.realtime) supabase.removeChannel(state.realtime)
  const channel = supabase.channel(`campaign-${state.profile.id}`)
  for (const table of ['voters', 'activities', 'field_reports', 'commands', 'opponent_snapshots', 'profiles', 'notifications', 'tps_results', 'voter_assistance', 'election_day_incidents', 'candidates', 'territory_targets', 'campaign_settings']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, debounceReload)
  }
  state.realtime = channel.subscribe()
}
let reloadTimer
function debounceReload() { clearTimeout(reloadTimer); reloadTimer = setTimeout(async () => { try { await loadAll(true); renderPage(); updateBadge() } catch { /* transient realtime refresh */ } }, 350) }

function navButtons(cls = '', includeRealCount = false) {
  const items = [['dashboard', 'dashboard', 'Dasbor'], ['voters', 'users', 'Pemilih'], ['field', 'clipboard', 'Kegiatan'], ...(includeRealCount ? [['targets', 'chart', 'Target Wilayah'], ['realcount', 'vote', 'Real Count TPS'], ['mobilization', 'car', 'Bantuan & Keamanan TPS']] : []), ['commands', 'sparkle', 'AI Advisor'], ['more', 'menu', 'Menu']]
  return items.map(([id, iconName, label]) => `<button class="nav-btn ${cls} ${state.page === id ? 'active' : ''}" data-page="${id}">${icon(iconName)}<span>${label}</span></button>`).join('')
}

function renderShell() {
  app.innerHTML = `<div class="shell">
    <header class="topbar"><button class="icon-btn hamburger-button" data-action="open-menu" aria-label="Buka menu utama">${icon('hamburger')}</button><div class="top-profile"><div class="avatar">${initials(state.profile.full_name)}</div><div class="topbar-title"><strong>${esc(state.profile.full_name)}</strong><small>CANDIDATE COMMAND CENTER V2.0</small></div></div><div class="top-live"><i></i> REAL-TIME</div><button class="icon-btn bell-button" data-action="notifications" aria-label="Notifikasi">${icon('bell')}<b class="badge ${unreadCount() ? '' : 'hidden'}" id="notif-badge">${unreadCount()}</b></button><button class="exit-button" data-action="logout" aria-label="Keluar dari aplikasi">${icon('logout')}<span>Keluar</span></button></header>
    <main class="main layout" id="page"></main><button class="fab no-print" id="fab" data-action="add" aria-label="Tambah data">＋</button>
    <nav class="bottom-nav">${navButtons()}</nav><footer>BBR @ SYNERGY smart system</footer></div>`
  renderPage()
}

function closeMenuDrawer() {
  document.querySelector('.menu-drawer-backdrop')?.remove()
  document.body.classList.remove('drawer-open')
}

function openMenuDrawer() {
  closeMenuDrawer()
  const wrap = document.createElement('div')
  wrap.className = 'menu-drawer-backdrop'
  wrap.innerHTML = `<button class="drawer-scrim" data-action="close-menu" aria-label="Tutup menu"></button><aside class="menu-drawer" role="dialog" aria-modal="true" aria-label="Menu utama">
    <div class="drawer-head"><div class="side-brand"><span class="brand-mark">C</span><div><strong>Command Center</strong><small>${esc(roleName(state.profile.role))}</small></div></div><button class="close" data-action="close-menu" aria-label="Tutup">×</button></div>
    <div class="drawer-scroll">
      <section class="drawer-section"><span class="drawer-section-label">NAVIGASI UTAMA</span><nav class="drawer-nav">${navButtons('drawer-item', true)}</nav></section>
      <section class="drawer-section drawer-actions-section"><span class="drawer-section-label">AKSI CEPAT</span><div class="drawer-shortcuts">
        <button class="drawer-action camera" data-action="add-report"><span>${icon('camera')}</span><div><strong>Laporan Kamera</strong><small>Foto lapangan</small></div></button>
        <button class="drawer-action tps" data-action="add-tps-result"><span>${icon('vote')}</span><div><strong>Input Hasil TPS</strong><small>Rekap &amp; C1</small></div></button>
        <button class="drawer-action emergency" data-action="emergency-report"><span>${icon('alert')}</span><div><strong>Laporan Darurat</strong><small>Keselamatan tim</small></div></button>
        <button class="drawer-action assistance" data-page="mobilization"><span>${icon('car')}</span><div><strong>Bantuan TPS</strong><small>Armada &amp; akses</small></div></button>
      </div></section>
    </div>
    <div class="drawer-bottom"><div class="drawer-account"><div class="avatar">${initials(state.profile.full_name)}</div><div><strong>${esc(state.profile.full_name)}</strong><small>${esc(roleName(state.profile.role))}</small></div><i aria-label="Akun aktif"></i></div><button class="drawer-logout" data-action="logout">${icon('logout')} Keluar ke Login</button><footer>BBR @ SYNERGY smart system</footer></div>
  </aside>`
  document.body.append(wrap)
  document.body.classList.add('drawer-open')
}

function unreadCount() { return state.notifications.filter(n => !n.read_at).length }
function updateBadge() { const b = document.querySelector('#notif-badge'); if (b) { b.textContent = unreadCount(); b.classList.toggle('hidden', !unreadCount()) } }

function renderPage() {
  const page = document.querySelector('#page'); if (!page) return
  page.innerHTML = ({ dashboard: dashboardPage, voters: votersPage, field: fieldPage, commands: commandsPage, realcount: realCountPage, mobilization: mobilizationPage, targets: targetsPage, more: morePage }[state.page] || dashboardPage)()
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === state.page))
  const fab = document.querySelector('#fab'); if (fab) fab.classList.toggle('hidden', !['voters', 'field', 'commands', 'realcount', 'mobilization', 'targets'].includes(state.page) || (state.page === 'commands' && !can('admin', 'owner')) || (state.page === 'targets' && !can('admin')))
}

function dashboardPage() {
  const counts = Object.fromEntries(['support', 'swing', 'refuse', 'unknown'].map(s => [s, state.voters.filter(v => v.preference === s).length]))
  const target = campaignTarget(), dpt = campaignDpt(), total = state.voters.length || 1, pct = Math.min(100, Math.round(counts.support / Math.max(1, target) * 100))
  const done = state.activities.filter(a => a.status === 'done').length
  const fieldPct = state.activities.length ? Math.round(done / state.activities.length * 100) : 0
  return `<section class="command-banner"><div class="command-copy"><span class="eyebrow">CANDIDATE COMMAND CENTER V2.0</span><h1>${esc(campaignName())}</h1><p><strong>${rupiah(target)} Suara</strong> dari Total DPT ${rupiah(dpt)}</p></div><div class="hero-actions"><button class="btn action-amber" data-action="add-voter">${icon('plus')} Input Pemilih</button><button class="btn action-cyan" data-action="add-report">${icon('clipboard')} Lapor Kegiatan</button></div></section>
    <section class="card target-card"><div class="card-heading"><div><span>CAPAIAN RIIL TARGET SUARA</span><small>Data pendukung tervalidasi</small></div><b>${rupiah(counts.support)} / ${rupiah(target)} <em>(${pct}%)</em></b></div><div class="target-track"><i style="width:${Math.max(.4, pct)}%"></i></div></section>
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
  const rows = [[campaignName(), own], ...latest.entries()].slice(0, 6), max = Math.max(100, ...rows.map(x => x[1]))
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

function tpsTotals(rows = state.tpsResults) {
  return rows.reduce((a, r) => {
    a.ours += Number(r.our_votes || 0); a.opponent1 += Number(r.opponent1_votes || 0); a.opponent2 += Number(r.opponent2_votes || 0)
    a.invalid += Number(r.invalid_votes || 0); a.present += Number(r.voters_present || 0); a.dpt += Number(r.dpt_total || 0)
    return a
  }, { ours: 0, opponent1: 0, opponent2: 0, invalid: 0, present: 0, dpt: 0 })
}

const percentage = (value, total) => total ? (Number(value || 0) / total * 100).toFixed(1) : '0.0'
const tpsStatusLabel = status => ({ submitted: 'MASUK', verified: 'TERVERIFIKASI', disputed: 'SENGKETA' }[status] || status)
const tpsStatusClass = status => ({ submitted: 'info', verified: 'ok', disputed: 'bad' }[status] || 'info')

function realCountPage() {
  const all = state.tpsResults
  const totals = tpsTotals(all)
  const validVotes = totals.ours + totals.opponent1 + totals.opponent2
  const totalBallots = validVotes + totals.invalid
  const mainOpponent = Math.max(totals.opponent1, totals.opponent2)
  const leading = totals.ours > mainOpponent
  const villages = [...new Set(all.map(r => r.village).filter(Boolean))].sort()
  const witnessSearch = state.filters.tpsWitness.toLowerCase()
  const filtered = all.filter(r => {
    const margin = Number(r.our_votes) - Math.max(Number(r.opponent1_votes), Number(r.opponent2_votes))
    return (!state.filters.tpsVillage || r.village === state.filters.tpsVillage)
      && (!state.filters.tpsResult || (state.filters.tpsResult === 'lead' ? margin >= 0 : margin < 0))
      && (!witnessSearch || `${r.profiles?.full_name || ''} ${r.village} ${r.tps_number}`.toLowerCase().includes(witnessSearch))
  })
  const enteredPct = Math.min(100, all.length / TOTAL_TPS * 100)
  const alertRows = all.filter(r => Number(r.invalid_votes) / Math.max(1, Number(r.voters_present)) > .1 || (r.is_key_tps && Number(r.our_votes) < Math.max(Number(r.opponent1_votes), Number(r.opponent2_votes))))
  const inputCard = `<section class="quick-count-input card"><div><span class="live-badge">${icon('camera')} MODE SAKSI TPS</span><h2>Input C1 Cepat dari Lokasi TPS</h2><p>Pilih wilayah, isi hasil resmi, ambil foto C1 Plano dengan kamera belakang, lalu kirim ke pusat komando.</p></div><button class="btn action-amber" data-action="add-tps-result">${icon('vote')} Input Hasil TPS & Foto C1</button></section>`
  if (!can('admin', 'owner')) {
    return `<section class="realcount-head"><div><span class="live-badge">LIVE SYNC ACTIVE</span><h1>Pusat Pemantauan Real Count & Quick Count TPS</h1><p>Perangkat saksi terhubung langsung ke pusat komando melalui Supabase Realtime.</p></div></section>${inputCard}<div class="section-title"><h2>Data TPS yang Dapat Anda Akses</h2><span class="chip info">${all.length} masuk</span></div><section class="tps-mobile-list">${filtered.map(tpsMobileCard).join('') || empty('Belum ada data TPS. Gunakan tombol input untuk mulai mengirim hasil.')}</section><footer>BBR @ SYNERGY smart system</footer>`
  }
  return `<section class="realcount-head"><div><span class="live-badge"><i></i> LIVE REAL COUNT ACTIVE</span><h1>Pusat Pemantauan Real Count & Quick Count TPS</h1><p>Rekap terverifikasi, pemantauan anomali, foto C1, dan komando saksi dalam satu layar.</p></div><button class="btn action-cyan" data-action="refresh">${icon('refresh')} Sinkronkan</button></section>
    ${inputCard}
    <section class="card tps-progress-card"><div class="card-heading"><div><span>TPS MASUK</span><small>${all.length} dari estimasi ${TOTAL_TPS} TPS</small></div><b>${all.length} / ${TOTAL_TPS} <em>(${enteredPct.toFixed(1)}%)</em></b></div><div class="target-track cyan-track"><i style="width:${Math.max(.5, enteredPct)}%"></i></div></section>
    <section class="bento-grid quick-kpi-grid">
      ${quickMetric('ours', 'TOTAL SUARA PASLON KITA', totals.ours, percentage(totals.ours, validVotes), leading ? 'MEMIMPIN / UNGGUL' : 'PERLU PENGAWALAN')}
      ${quickMetric('opponent', 'SUARA LAWAN UTAMA', mainOpponent, percentage(mainOpponent, validVotes), totals.opponent1 >= totals.opponent2 ? 'Lawan 1' : 'Lawan 2')}
      ${quickMetric('other', 'SUARA PASLON LAIN', Math.min(totals.opponent1, totals.opponent2), percentage(Math.min(totals.opponent1, totals.opponent2), validVotes), 'Paslon lainnya')}
      ${quickMetric('invalid', 'TOTAL SUARA TIDAK SAH', totals.invalid, percentage(totals.invalid, totalBallots), 'Dari suara masuk')}
    </section>
    <section class="bento-grid realcount-charts"><article class="card real-chart-card"><div class="card-heading"><div><span>PERBANDINGAN REAL-TIME</span><small>Suara sah yang telah masuk</small></div>${icon('chart')}</div>${realCountBars(totals)}</article><article class="card real-chart-card"><div class="card-heading"><div><span>KOMPOSISI SUARA</span><small>Persentase antar paslon</small></div><span class="chip ok">LIVE</span></div>${realCountDonut(totals)}</article></section>
    <section class="card anomaly-card"><div class="card-heading"><div><span>SISTEM PERINGATAN TPS</span><small>Suara tidak sah &gt;10% atau kalah di TPS kunci</small></div><b class="alert-count">${alertRows.length}</b></div><div class="alert-tps-list">${alertRows.slice(0, 8).map(tpsAlert).join('') || `<div class="all-clear">${icon('check')} Tidak ada anomali aktif.</div>`}</div></section>
    <section class="card recap-card"><div class="card-heading"><div><span>REKAPITULASI PER DESA / TPS</span><small>${filtered.length} data terlihat</small></div><button class="mini-action" data-action="add-tps-result">＋ Data TPS</button></div><div class="tps-toolbar no-print"><select class="input" id="tps-village-filter"><option value="">Semua desa</option>${villages.map(v => `<option value="${esc(v)}" ${state.filters.tpsVillage === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select><select class="input" id="tps-result-filter"><option value="">Unggul & kalah</option><option value="lead" ${state.filters.tpsResult === 'lead' ? 'selected' : ''}>TPS unggul</option><option value="loss" ${state.filters.tpsResult === 'loss' ? 'selected' : ''}>TPS kalah</option></select><input class="input" id="tps-witness-search" value="${esc(state.filters.tpsWitness)}" placeholder="Cari saksi / TPS…"></div><div class="tps-table-wrap"><table class="tps-table"><thead><tr><th>Desa / TPS</th><th>Status</th><th>Kita</th><th>Lawan</th><th>Margin</th><th>Saksi</th><th>Foto C1</th><th>Aksi</th></tr></thead><tbody>${filtered.map(tpsTableRow).join('') || `<tr><td colspan="8">${empty('Belum ada data yang sesuai filter.')}</td></tr>`}</tbody></table></div></section><footer>BBR @ SYNERGY smart system</footer>`
}

function quickMetric(kind, label, value, pct, note) {
  return `<article class="card quick-metric ${kind}"><span>${esc(label)}</span><strong>${rupiah(value)}</strong><b>${esc(pct)}%</b><small>${esc(note)}</small></article>`
}

function realCountBars(t) {
  const rows = [['Paslon Kita', t.ours, 'ours'], ['Lawan 1', t.opponent1, 'rival-one'], ['Lawan 2', t.opponent2, 'rival-two']]
  const max = Math.max(1, ...rows.map(x => x[1]))
  return `<div class="real-bars">${rows.map(([label, value, cls]) => `<div class="real-bar-row"><div><span>${label}</span><b>${rupiah(value)}</b></div><div class="real-bar-track"><i class="${cls}" style="width:${Math.max(value ? 2 : 0, value / max * 100)}%"></i></div></div>`).join('')}</div>`
}

function realCountDonut(t) {
  const total = Math.max(1, t.ours + t.opponent1 + t.opponent2)
  const ours = t.ours / total * 100, op1 = t.opponent1 / total * 100
  return `<div class="quick-donut-layout"><div class="quick-donut" style="background:conic-gradient(#f59e0b 0 ${ours}%,#06b6d4 ${ours}% ${ours + op1}%,#64748b ${ours + op1}% 100%)"><div><strong>${rupiah(total)}</strong><small>suara sah</small></div></div><div class="legend"><div><span style="--c:#f59e0b">Paslon Kita</span><b>${percentage(t.ours, total)}%</b></div><div><span style="--c:#06b6d4">Lawan 1</span><b>${percentage(t.opponent1, total)}%</b></div><div><span style="--c:#64748b">Lawan 2</span><b>${percentage(t.opponent2, total)}%</b></div></div></div>`
}

function tpsAlert(r) {
  const invalidPct = Number(r.invalid_votes) / Math.max(1, Number(r.voters_present)) * 100
  const basisLoss = r.is_key_tps && Number(r.our_votes) < Math.max(Number(r.opponent1_votes), Number(r.opponent2_votes))
  return `<article class="tps-alert"><span class="severity ${basisLoss ? 'high' : 'medium'}">${basisLoss ? 'TINGGI' : 'SEDANG'}</span><div><strong>${esc(r.village)} · TPS ${esc(r.tps_number)}</strong><p>${basisLoss ? 'Paslon kita tertinggal di TPS basis/kunci.' : `Suara tidak sah mencapai ${invalidPct.toFixed(1)}%.`}</p></div><button class="mini-action" data-action="wa-witness" data-id="${r.id}">${icon('whatsapp')} Instruksi</button></article>`
}

function tpsTableRow(r) {
  const rival = Math.max(Number(r.opponent1_votes), Number(r.opponent2_votes)), margin = Number(r.our_votes) - rival
  return `<tr><td><strong>${esc(r.village)}</strong><small>TPS ${esc(r.tps_number)} · ${esc(r.district)}</small></td><td><span class="chip ${tpsStatusClass(r.verification_status)}">${tpsStatusLabel(r.verification_status)}</span></td><td class="vote-ours">${rupiah(r.our_votes)}</td><td>${rupiah(rival)}</td><td class="${margin >= 0 ? 'margin-win' : 'margin-loss'}">${margin >= 0 ? '+' : ''}${rupiah(margin)}</td><td><strong>${esc(r.profiles?.full_name || 'Saksi')}</strong><small>${esc(r.profiles?.phone || '-')}</small></td><td><button class="c1-thumb" data-action="open-c1" data-path="${esc(r.media_path)}">${icon('camera')} Lihat</button></td><td><div class="row-actions"><button class="mini-action" data-action="wa-witness" data-id="${r.id}" aria-label="WhatsApp saksi">${icon('whatsapp')}</button>${r.verification_status !== 'verified' ? `<button class="mini-action verify" data-action="verify-tps" data-id="${r.id}" aria-label="Verifikasi">${icon('check')}</button>` : ''}${r.verification_status !== 'disputed' ? `<button class="mini-action dispute" data-action="dispute-tps" data-id="${r.id}" aria-label="Tandai sengketa">!</button>` : ''}</div></td></tr>`
}

function tpsMobileCard(r) {
  const rival = Math.max(Number(r.opponent1_votes), Number(r.opponent2_votes)), margin = Number(r.our_votes) - rival
  return `<article class="card tps-mobile-card"><div><strong>${esc(r.village)} · TPS ${esc(r.tps_number)}</strong><span class="chip ${tpsStatusClass(r.verification_status)}">${tpsStatusLabel(r.verification_status)}</span></div><p>Kita <b>${rupiah(r.our_votes)}</b> · Lawan utama <b>${rupiah(rival)}</b> · Margin <b class="${margin >= 0 ? 'margin-win' : 'margin-loss'}">${margin >= 0 ? '+' : ''}${rupiah(margin)}</b></p><small>Dikirim ${dateId(r.created_at)}</small><button class="mini-action" data-action="open-c1" data-path="${esc(r.media_path)}">${icon('camera')} Lihat Foto C1</button></article>`
}

function cameraCaptureBlock(inputId, heading, note) {
  return `<div class="camera-field camera-live-module"><div class="camera-icon">${icon('camera')}</div><div><strong>${esc(heading)}</strong><p>${esc(note)}</p></div><div class="camera-buttons"><button class="btn action-cyan" type="button" data-action="start-camera" data-target="${inputId}">${icon('camera')} Aktifkan Kamera</button><label class="btn btn-ghost" for="${inputId}">Pilih Foto</label></div><input id="${inputId}" name="${inputId}" type="file" accept="image/*" capture="environment"><div class="live-camera hidden" id="camera-${inputId}"><video autoplay playsinline muted></video><div><button class="btn action-amber" type="button" data-action="capture-camera" data-target="${inputId}">${icon('camera')} Ambil Foto</button><button class="btn btn-ghost" type="button" data-action="stop-camera">Batal</button></div></div><div id="${inputId}-preview" class="camera-preview hidden"></div></div>`
}

function tpsResultModal() {
  const actualVillages = [...new Set(state.voters.map(v => v.village).filter(Boolean))]
  const villages = [...new Set([...actualVillages, 'Desa Sukamaju', 'Desa Kencana', 'Desa Murni'])]
  const districts = [...new Set(state.teams.map(t => t.area).filter(Boolean).map(x => String(x).split(/[,-]/)[0].trim()).filter(x => x.length > 1))]
  if (!districts.length) districts.push('Kecamatan Utama')
  openModal('Input Hasil TPS & Foto C1', `<div class="form-grid two">${selectField('district', 'Kecamatan / Wilayah', districts.map(x => [x, x]), districts[0])}${selectField('village', 'Desa / Kelurahan', villages.map(x => [x, x]), villages[0])}${selectField('tps_number', 'Nomor TPS', Array.from({ length: TOTAL_TPS }, (_, i) => [String(i + 1).padStart(2, '0'), `TPS ${String(i + 1).padStart(2, '0')}`]), '01')}${field('dpt_total', 'Total DPT TPS', '', 'type="number" min="1" max="5000" inputmode="numeric" required')}${field('voters_present', 'Pengguna Hak Pilih', '', 'type="number" min="0" max="5000" inputmode="numeric" required')}<div class="participation-box"><span>Partisipasi</span><strong id="participation-value">0%</strong></div></div><div class="section-title"><h2>Perolehan Suara Formulir C1</h2></div><div class="form-grid two">${field('our_votes', 'H. Ahmad Fauzi, S.E.', 0, 'type="number" min="0" max="5000" inputmode="numeric" required')}${field('opponent1_votes', 'Paslon Lawan 1', 0, 'type="number" min="0" max="5000" inputmode="numeric" required')}${field('opponent2_votes', 'Paslon Lawan 2', 0, 'type="number" min="0" max="5000" inputmode="numeric" required')}${field('invalid_votes', 'Suara Tidak Sah / Batal', 0, 'type="number" min="0" max="5000" inputmode="numeric" required')}</div><label class="key-tps-check"><input type="checkbox" name="is_key_tps"> <span><strong>TPS Basis / TPS Kunci</strong><small>Aktifkan agar pusat menerima peringatan saat paslon kita tertinggal.</small></span></label>${cameraCaptureBlock('c1_media', 'Foto C1 Plano Wajib', 'Aktifkan kamera belakang untuk mengambil bukti resmi. Foto otomatis dikompresi sebelum disimpan privat.')}<div class="sync-note"><i></i><span>Siap sinkron Realtime ke akun pusat</span></div><div class="actions"><button class="btn action-amber" type="submit">${icon('send')} Kirim Data Hasil TPS & Foto C1</button></div>`, 'tps-result-form')
}

async function startCamera(target) {
  stopCamera()
  const input = document.querySelector(`#${target}`), holder = document.querySelector(`#camera-${target}`)
  if (!input || !holder) return
  if (!navigator.mediaDevices?.getUserMedia) { input.click(); return toast('Mode kamera langsung tidak tersedia. Gunakan kamera perangkat dari pemilih foto.') }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
    cameraTarget = target
    const video = holder.querySelector('video'); video.srcObject = cameraStream
    holder.classList.remove('hidden'); await video.play()
  } catch (error) {
    input.click()
    toast(error?.name === 'NotAllowedError' ? 'Izin kamera belum diberikan. Izinkan kamera atau pilih foto dari perangkat.' : 'Kamera langsung tidak tersedia. Silakan gunakan pemilih foto.', 'error')
  }
}

function stopCamera() {
  cameraStream?.getTracks().forEach(track => track.stop())
  cameraStream = null; cameraTarget = null
  document.querySelectorAll('.live-camera').forEach(x => x.classList.add('hidden'))
}

async function captureCamera(target) {
  const holder = document.querySelector(`#camera-${target}`), video = holder?.querySelector('video'), input = document.querySelector(`#${target}`)
  if (!video?.videoWidth || !input) return toast('Kamera belum siap. Tunggu sebentar lalu coba lagi.', 'error')
  const canvas = document.createElement('canvas'), scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d', { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .84))
  if (!blob) return toast('Foto gagal diambil. Silakan coba lagi.', 'error')
  const file = new File([blob], `kamera-${target}-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  capturedFiles.set(target, file)
  try { const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files } catch { /* Safari lama: gunakan file dari memori */ }
  stopCamera(); updateImagePreview(input, file); toast('Foto berhasil diambil dan siap dikirim.')
}

function updateImagePreview(input, capturedFile = null) {
  const file = capturedFile || input.files?.[0], preview = document.querySelector(`#${input.id}-preview`)
  if (!preview) return
  if (!file) { preview.classList.add('hidden'); preview.innerHTML = ''; return }
  const url = URL.createObjectURL(file)
  preview.innerHTML = `<img src="${url}" alt="Pratinjau foto"><div><strong>${esc(file.name)}</strong><small>${(file.size / 1024 / 1024).toFixed(1)} MB · siap dikirim</small></div>`
  preview.classList.remove('hidden')
}

const assistanceStatusLabel = status => ({ waiting: 'Menunggu', pickup_requested: 'Minta Penjemputan', en_route: 'Dalam Perjalanan', arrived: 'Tiba di TPS', cancelled: 'Dibatalkan' }[status] || status)
const assistanceStatusClass = status => ({ waiting: 'warn', pickup_requested: 'warn', en_route: 'info', arrived: 'ok', cancelled: 'bad' }[status] || 'info')
const assistanceCategoryLabel = category => ({ general: 'Umum', elderly: 'Lansia', disability: 'Disabilitas', medical: 'Kebutuhan Medis' }[category] || category)

function mobilizationPage() {
  const rows = state.assistance
  const arrived = rows.filter(r => r.attendance_status === 'arrived').length
  const moving = rows.filter(r => ['pickup_requested', 'en_route'].includes(r.attendance_status)).length
  const waiting = rows.filter(r => r.attendance_status === 'waiting' || r.safety_concern).length
  const pct = percentage(arrived, rows.length)
  const q = state.filters.assistanceSearch.toLowerCase()
  const filtered = rows.filter(r => {
    const groupMatch = !state.filters.assistanceGroup
      || (state.filters.assistanceGroup === 'unarrived' && r.attendance_status !== 'arrived')
      || (state.filters.assistanceGroup === 'transport' && r.transport_needed)
      || (state.filters.assistanceGroup === 'accessibility' && ['elderly', 'disability', 'medical'].includes(r.assistance_category))
      || (state.filters.assistanceGroup === 'safety' && r.safety_concern)
    return groupMatch && (!state.filters.assistanceStatus || r.attendance_status === state.filters.assistanceStatus)
      && (!q || `${r.display_name} ${r.village} ${r.polling_station} ${r.address_hint || ''}`.toLowerCase().includes(q))
  })
  return `<section class="mobilization-hero"><div><span class="day-badge">${icon('car')} D-DAY ASSISTANCE CONTROL</span><h1>Pusat Bantuan Kehadiran & Keamanan TPS</h1><p>Koordinasi transportasi sukarela, aksesibilitas, kedatangan di TPS, dan laporan keselamatan tanpa menyimpan NIK atau bukti pilihan pemilih.</p></div><div class="hero-actions"><button class="btn action-amber" data-action="add-assistance">${icon('plus')} Tambah Peserta Bantuan</button><button class="btn emergency-button" data-action="emergency-report">${icon('alert')} Laporan Darurat</button></div></section>
    <section class="bento-grid mobilization-kpis">
      ${mobilizationMetric('target', 'TOTAL PESERTA BANTUAN', rows.length, 'Terdaftar secara sukarela', 'users')}
      ${mobilizationMetric('arrived', 'SUDAH TIBA DI TPS', arrived, `${pct}% terkonfirmasi tiba`, 'check')}
      ${mobilizationMetric('moving', 'PENJEMPUTAN / PERJALANAN', moving, 'Armada dan pendamping aktif', 'car')}
      ${mobilizationMetric('risk', 'MENUNGGU / PERLU PERHATIAN', waiting, 'Belum tiba atau ada risiko keselamatan', 'alert')}
    </section>
    <section class="card assistance-panel"><div class="card-heading"><div><span>DAFTAR PERIKSA BANTUAN PER TPS</span><small>${filtered.length} dari ${rows.length} peserta terlihat</small></div><span class="chip info">REAL-TIME</span></div><div class="assistance-toolbar"><select class="input" id="assistance-status-filter"><option value="">Semua status</option>${['waiting','pickup_requested','en_route','arrived'].map(x => `<option value="${x}" ${state.filters.assistanceStatus === x ? 'selected' : ''}>${assistanceStatusLabel(x)}</option>`).join('')}</select><select class="input" id="assistance-group-filter"><option value="">Semua kebutuhan</option><option value="unarrived" ${state.filters.assistanceGroup === 'unarrived' ? 'selected' : ''}>Belum tiba</option><option value="transport" ${state.filters.assistanceGroup === 'transport' ? 'selected' : ''}>Butuh armada</option><option value="accessibility" ${state.filters.assistanceGroup === 'accessibility' ? 'selected' : ''}>Lansia / disabilitas / medis</option><option value="safety" ${state.filters.assistanceGroup === 'safety' ? 'selected' : ''}>Perhatian keselamatan</option></select><input class="input" id="assistance-search" value="${esc(state.filters.assistanceSearch)}" placeholder="Cari nama, desa, atau TPS…"></div><div class="assistance-list">${filtered.map(assistanceItem).join('') || empty('Belum ada peserta bantuan yang sesuai filter.')}</div></section>
    <section class="mobilization-actions"><button class="card mobilization-action transport" data-action="add-assistance"><span>${icon('car')}</span><div><strong>Request Armada Penjemputan</strong><p>Catat permintaan transportasi sukarela dan kirim notifikasi ke pusat.</p></div></button><button class="card mobilization-action emergency" data-action="emergency-report"><span>${icon('alert')}</span><div><strong>Laporan Darurat / Intimidasi</strong><p>Ambil GPS, simpan laporan, lalu tinjau draf WhatsApp Tim Hukum/Satgas.</p></div></button></section>
    <section class="card safety-sop"><div class="card-heading"><div><span>SOP BANTUAN & KESELAMATAN DI JALAN</span><small>Panduan singkat relawan Hari-H</small></div>${icon('shield')}</div><div class="sop-accordion"><details open><summary><b>1</b><span><strong>Dampingi Secara Sukarela</strong><small>Tawarkan bantuan tanpa tekanan dan hormati keputusan pribadi.</small></span></summary><p>Pastikan peserta memahami bantuan bersifat sukarela. Dampingi rombongan dengan tertib, prioritaskan lansia, penyandang disabilitas, dan kebutuhan medis.</p></details><details><summary><b>2</b><span><strong>Amati, Jangan Berkonfrontasi</strong><small>Patuhi batas area TPS dan dokumentasikan dugaan pelanggaran.</small></span></summary><p>Jangan menghadang atau berdebat dengan pihak lain. Catat waktu, lokasi, saksi, dan laporkan dugaan intimidasi atau pelanggaran kepada petugas berwenang.</p></details><details><summary><b>3</b><span><strong>Lindungi Privasi Pemilih</strong><small>Jangan meminta bukti pilihan atau foto jari bertinta.</small></span></summary><p>Konfirmasi hanya bahwa peserta telah tiba dengan selamat. Pilihan di bilik suara bersifat rahasia dan tidak boleh diminta, direkam, atau diverifikasi oleh relawan.</p></details></div></section>
    <section class="card incident-monitor"><div class="card-heading"><div><span>LAPORAN KESELAMATAN TERBARU</span><small>${state.electionIncidents.length} laporan dapat diakses akun ini</small></div><button class="mini-action" data-action="emergency-report">＋ Lapor</button></div><div class="incident-day-list">${state.electionIncidents.slice(0, 8).map(electionIncidentItem).join('') || empty('Belum ada laporan keselamatan Hari-H.')}</div></section><footer>BBR @ SYNERGY smart system</footer>`
}

function mobilizationMetric(kind, label, value, note, iconName) {
  return `<article class="card mobilization-metric ${kind}"><div class="metric-icon">${icon(iconName)}</div><span>${esc(label)}</span><strong>${rupiah(value)}</strong><small>${esc(note)}</small></article>`
}

function assistanceItem(row) {
  const next = ({ waiting: 'pickup_requested', pickup_requested: 'en_route', en_route: 'arrived' }[row.attendance_status])
  const nextLabel = ({ waiting: 'Minta Jemput', pickup_requested: 'Mulai Perjalanan', en_route: 'Tandai Tiba' }[row.attendance_status])
  return `<article class="assistance-item"><div class="avatar">${initials(row.display_name)}</div><div class="assistance-main"><div><strong>${esc(row.display_name)}</strong><span class="chip ${assistanceStatusClass(row.attendance_status)}">${assistanceStatusLabel(row.attendance_status)}</span></div><p>${esc(row.village)} · TPS ${esc(row.polling_station)}${row.address_hint ? ` · ${esc(row.address_hint)}` : ''}</p><div class="meta"><span class="chip">${assistanceCategoryLabel(row.assistance_category)}</span>${row.transport_needed ? `<span class="chip warn">Butuh Armada</span>` : ''}${row.safety_concern ? `<span class="chip bad">Perhatian Keselamatan</span>` : ''}</div><div class="assistance-actions">${next ? `<button class="mini-action assistance-next" data-action="advance-assistance" data-id="${row.id}" data-status="${next}">${icon(next === 'arrived' ? 'check' : 'car')} ${nextLabel}</button>` : ''}${row.attendance_status !== 'arrived' && !row.transport_needed ? `<button class="mini-action" data-action="request-transport" data-id="${row.id}">${icon('car')} Armada</button>` : ''}<button class="mini-action whatsapp" data-action="wa-assistance" data-id="${row.id}">${icon('whatsapp')} Pengingat Netral</button></div></div></article>`
}

function electionIncidentItem(row) {
  const type = ({ obstruction: 'Hambatan Akses', intimidation: 'Intimidasi', suspected_violation: 'Dugaan Pelanggaran', medical: 'Darurat Medis', other: 'Lainnya' }[row.incident_type] || row.incident_type)
  const hasGps = row.latitude != null && row.longitude != null
  return `<article class="incident-day-item"><span class="severity ${row.incident_type === 'medical' ? 'medium' : 'high'}">${esc(type)}</span><div><strong>${esc(row.profiles?.full_name || 'Relawan')}</strong><p>${esc(row.description)}</p><small>${dateId(row.created_at)}${hasGps ? ` · GPS ${esc(row.latitude)}, ${esc(row.longitude)}` : ''}</small></div>${hasGps ? `<a class="mini-action" href="https://www.google.com/maps?q=${encodeURIComponent(`${row.latitude},${row.longitude}`)}" target="_blank" rel="noopener">${icon('location')} Peta</a>` : ''}</article>`
}

function assistanceModal() {
  const villages = [...new Set([...state.voters.map(v => v.village).filter(Boolean), 'Desa Sukamaju', 'Desa Kencana', 'Desa Murni'])]
  openModal('Tambah Peserta Bantuan TPS', `<div class="privacy-notice">${icon('shield')} Data hanya untuk layanan transportasi/aksesibilitas yang disetujui peserta. Jangan masukkan NIK atau preferensi politik.</div><div class="form-grid two">${field('display_name', 'Nama panggilan / nama tampilan', '', 'required maxlength="100" autocomplete="name"')}${field('phone', 'Nomor WhatsApp (opsional)', '', 'inputmode="tel" maxlength="18"')}${selectField('village', 'Desa / Kelurahan', villages.map(x => [x, x]), villages[0])}${field('polling_station', 'Nomor TPS', '', 'required maxlength="20" placeholder="01"')}${selectField('assistance_category', 'Kategori Bantuan', [['general','Umum'],['elderly','Lansia'],['disability','Disabilitas'],['medical','Kebutuhan Medis']], 'general')}${field('address_hint', 'Petunjuk alamat / RT-RW', '', 'maxlength="220"')}</div><div class="check-grid"><label><input type="checkbox" name="transport_needed"> Memerlukan transportasi</label><label><input type="checkbox" name="safety_concern"> Ada perhatian keselamatan</label></div><div class="field"><label for="notes">Catatan kebutuhan</label><textarea class="input" id="notes" name="notes" maxlength="500" placeholder="Contoh: menggunakan kursi roda, perlu pendamping keluarga…"></textarea></div><label class="consent-check"><input type="checkbox" name="consent_confirmed" required><span><strong>Persetujuan peserta telah dikonfirmasi</strong><small>Peserta bersedia datanya digunakan hanya untuk koordinasi bantuan TPS.</small></span></label><div class="actions"><button class="btn action-amber" type="submit">${icon('save')} Simpan Permintaan Bantuan</button></div>`, 'assistance-form')
}

function emergencyModal() {
  openModal('Laporan Keselamatan Hari-H', `<div class="emergency-notice">${icon('alert')} Jika ada bahaya langsung, utamakan keselamatan dan hubungi petugas berwenang. Jangan melakukan konfrontasi.</div>${selectField('incident_type', 'Jenis kejadian', [['obstruction','Hambatan akses menuju TPS'],['intimidation','Intimidasi / ancaman'],['suspected_violation','Dugaan pelanggaran pemilu'],['medical','Darurat medis'],['other','Lainnya']], 'obstruction')}<div class="field"><label for="incident_description">Kronologi singkat</label><textarea class="input" id="incident_description" name="description" required maxlength="1500" placeholder="Jelaskan waktu, lokasi, kejadian, dan pihak yang perlu dihubungi…"></textarea></div><input type="hidden" id="incident_latitude" name="latitude"><input type="hidden" id="incident_longitude" name="longitude"><input type="hidden" id="incident_accuracy" name="accuracy_m"><div class="gps-panel"><div>${icon('location')}<span><strong>Lokasi GPS</strong><small id="gps-status">Belum diambil</small></span></div><button class="btn action-cyan" type="button" data-action="get-gps">Ambil Lokasi</button></div><div class="actions"><button class="btn emergency-button" type="submit">${icon('send')} Simpan & Buka Draf WhatsApp</button></div><small class="engine-note">WhatsApp tidak dikirim otomatis. Relawan dapat meninjau dan memilih penerima sebelum mengirim.</small>`, 'incident-form')
}

const scopeName = scope => ({ area: 'Daerah', rw: 'RW', rt: 'RT', tps: 'TPS' }[scope] || scope)
const numberKey = value => String(value || '').replace(/^0+/, '') || '0'
function targetLocation(row) {
  return [row.area_name, row.rw_number && `RW ${row.rw_number}`, row.rt_number && `RT ${row.rt_number}`, row.tps_number && `TPS ${row.tps_number}`].filter(Boolean).join(' · ')
}
function territoryActual(row) {
  if (!row.candidates?.is_our_candidate) return Number(row.achieved_votes || 0)
  const matches = state.tpsResults.filter(t => t.verification_status !== 'disputed' && String(t.village || '').trim().toLowerCase() === String(row.area_name || '').trim().toLowerCase())
  const fromRealCount = row.scope_type === 'area'
    ? matches.reduce((sum, t) => sum + Number(t.our_votes || 0), 0)
    : row.scope_type === 'tps'
      ? matches.filter(t => numberKey(t.tps_number) === numberKey(row.tps_number)).reduce((sum, t) => sum + Number(t.our_votes || 0), 0)
      : 0
  return Math.max(Number(row.achieved_votes || 0), fromRealCount)
}

function targetsPage() {
  const scope = state.filters.targetScope, team = state.filters.targetTeam
  const rows = state.territoryTargets.filter(r => (!scope || r.scope_type === scope) && (!team || r.team_id === team))
  const configuredDpt = campaignDpt(), configuredTarget = campaignTarget(), actual = ourCandidate() ? state.tpsResults.filter(t => t.verification_status !== 'disputed').reduce((s, t) => s + Number(t.our_votes || 0), 0) : 0
  const pct = Number(percentage(actual, configuredTarget))
  return `<section class="target-command-head"><div><span class="target-live">${icon('chart')} TARGET CONTROL CENTER · REAL-TIME</span><h1>Konfigurasi Kandidat & Target Wilayah</h1><p>DPT, target suara, capaian, dan penanggung jawab tersusun dari daerah hingga TPS.</p></div>${can('admin') ? `<div class="hero-actions"><button class="btn btn-ghost" data-action="campaign-settings">${icon('save')} DPT & Target Utama</button><button class="btn action-amber" data-action="add-target">${icon('plus')} Target Wilayah</button></div>` : ''}</section>
    <section class="bento-grid target-summary-grid">
      <article class="card target-summary dpt"><span>TOTAL DPT</span><strong>${rupiah(configuredDpt)}</strong><small>Konfigurasi pemilihan</small></article>
      <article class="card target-summary goal"><span>TARGET SUARA</span><strong>${rupiah(configuredTarget)}</strong><small>${percentage(configuredTarget, configuredDpt)}% dari DPT</small></article>
      <article class="card target-summary actual"><span>REAL COUNT KITA</span><strong>${rupiah(actual)}</strong><small>${pct}% dari target</small></article>
      <article class="card target-summary coverage"><span>UNIT TARGET</span><strong>${rupiah(state.territoryTargets.length)}</strong><small>Daerah, RW, RT & TPS</small></article>
    </section>
    <section class="card candidate-panel"><div class="card-heading"><div><span>DAFTAR CALON KANDIDAT</span><small>${state.candidates.length} kandidat dikonfigurasi Admin</small></div>${can('admin') ? `<button class="mini-action" data-action="add-candidate">＋ Kandidat</button>` : ''}</div><div class="candidate-grid">${state.candidates.map(candidateCard).join('') || empty('Admin belum menambahkan kandidat.')}</div></section>
    <section class="card target-monitor"><div class="card-heading"><div><span>GRAFIK TARGET BERJENJANG</span><small>DPT vs target vs capaian suara per unit</small></div><span class="chip info">LIVE</span></div><div class="target-toolbar"><select class="input" id="target-scope-filter"><option value="">Semua tingkat</option>${['area','rw','rt','tps'].map(x => `<option value="${x}" ${scope === x ? 'selected' : ''}>${scopeName(x)}</option>`).join('')}</select><select class="input" id="target-team-filter"><option value="">Semua tim</option>${state.teams.map(t => `<option value="${t.id}" ${team === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>${can('admin') ? `<button class="btn action-cyan" data-action="add-target">${icon('plus')} Tambah Target</button>` : ''}</div><div class="scope-chart-grid">${['area','rw','rt','tps'].filter(x => !scope || scope === x).map(x => targetScopeChart(x, rows.filter(r => r.scope_type === x))).join('')}</div></section>
    <section class="card target-detail-panel"><div class="card-heading"><div><span>RINCIAN PENUGASAN TIM</span><small>${rows.length} target sesuai filter</small></div></div><div class="target-detail-list">${rows.map(targetDetailItem).join('') || empty('Belum ada target pada filter ini.')}</div></section><footer>BBR @ SYNERGY smart system</footer>`
}

function candidateCard(row) {
  return `<article class="candidate-card ${row.is_our_candidate ? 'ours' : ''}" style="--candidate:${esc(row.color)}"><div class="candidate-number">${row.ballot_number || '–'}</div><div><span>${row.is_our_candidate ? 'KANDIDAT KITA' : 'CALON KANDIDAT'}</span><strong>${esc(row.candidate_name)}</strong><small>${esc(row.deputy_name ? `Wakil: ${row.deputy_name}` : row.coalition || 'Keterangan belum diisi')}</small></div>${can('admin') ? `<button class="mini-action" data-action="edit-candidate" data-id="${row.id}">Ubah</button>` : ''}</article>`
}

function targetScopeChart(scope, rows) {
  const display = rows.slice().sort((a, b) => targetLocation(a).localeCompare(targetLocation(b), 'id')).slice(0, 20)
  return `<article class="scope-chart"><div class="scope-chart-head"><div><span>${scopeName(scope).toUpperCase()}</span><strong>${rows.length} Unit</strong></div><b>${rupiah(rows.reduce((s, r) => s + Number(r.vote_target || 0), 0))} target</b></div><div class="scope-bars">${display.map(r => { const actual = territoryActual(r), goalPct = Math.min(100, Number(percentage(r.vote_target, r.dpt_total))), actualPct = Math.min(100, Number(percentage(actual, r.dpt_total))); return `<div class="scope-bar-row"><div><span>${esc(targetLocation(r))}</span><b>${rupiah(actual)} / ${rupiah(r.vote_target)}</b></div><div class="scope-track"><i class="goal" style="width:${Math.max(1, goalPct)}%"></i><i class="actual" style="width:${Math.max(0, actualPct)}%"></i></div><small>DPT ${rupiah(r.dpt_total)} · ${esc(r.teams?.name || 'Belum ada tim')}</small></div>` }).join('') || empty(`Belum ada target tingkat ${scopeName(scope)}.`)}</div></article>`
}

function targetDetailItem(row) {
  const actual = territoryActual(row), progress = Math.min(100, Number(percentage(actual, row.vote_target)))
  return `<article class="target-detail-item"><div class="target-scope-icon">${scopeName(row.scope_type).slice(0, 3).toUpperCase()}</div><div class="target-detail-main"><div><strong>${esc(targetLocation(row))}</strong><span class="chip">${esc(row.candidates?.candidate_name || 'Kandidat')}</span></div><p>${esc(row.teams?.name || 'Belum ditugaskan')} · DPT ${rupiah(row.dpt_total)} · Target ${rupiah(row.vote_target)}</p><div class="assignment-track"><i style="width:${progress}%"></i></div><small>Capaian ${rupiah(actual)} suara (${progress}%)</small></div>${can('admin') ? `<button class="mini-action" data-action="edit-target" data-id="${row.id}">Ubah</button>` : ''}</article>`
}

function campaignSettingsModal() {
  const s = state.campaignSettings || {}
  openModal('DPT & Target Utama Pemilihan', `<div class="form-grid two">${field('candidate_name', 'Nama tampilan kandidat', campaignName(), 'required maxlength="120"')}${field('election_type', 'Jenis pemilihan', s.election_type || 'Pemilihan', 'required maxlength="100"')}${field('election_date', 'Tanggal pemilihan', s.election_date, 'type="date"')}${field('total_dpt', 'Total DPT seluruh wilayah', s.total_dpt || 0, 'type="number" min="0" required')}${field('total_target', 'Target suara keseluruhan', s.total_target || 0, 'type="number" min="0" required')}</div><div class="actions"><button class="btn action-amber" type="submit">${icon('save')} Simpan Konfigurasi</button></div>`, 'campaign-settings-form')
}

function candidateModal(row = {}) {
  openModal(row.id ? 'Ubah Calon Kandidat' : 'Tambah Calon Kandidat', `<input type="hidden" name="id" value="${row.id || ''}"><div class="form-grid two">${field('ballot_number', 'Nomor urut', row.ballot_number, 'type="number" min="1" max="99"')}${field('candidate_name', 'Nama kandidat', row.candidate_name, 'required maxlength="120"')}${field('deputy_name', 'Nama calon wakil', row.deputy_name, 'maxlength="120"')}${field('coalition', 'Partai / koalisi / keterangan', row.coalition, 'maxlength="240"')}${field('color', 'Warna grafik kandidat', row.color || '#f59e0b', 'type="color" required')}</div><label class="consent-check"><input type="checkbox" name="is_our_candidate" ${row.is_our_candidate ? 'checked' : ''}><span><strong>Tetapkan sebagai kandidat kita</strong><small>Hanya satu kandidat yang dapat menjadi kandidat utama tim.</small></span></label><div class="actions"><button class="btn action-amber" type="submit">${icon('save')} Simpan Kandidat</button></div>`, 'candidate-form')
}

function targetModal(row = {}) {
  const candidateOptions = state.candidates.map(c => [c.id, `${c.ballot_number ? `No. ${c.ballot_number} · ` : ''}${c.candidate_name}`])
  openModal(row.id ? 'Ubah Target Wilayah' : 'Tetapkan Target Wilayah', `<input type="hidden" name="id" value="${row.id || ''}"><div class="form-grid two">${selectField('candidate_id', 'Kandidat', candidateOptions, row.candidate_id || ourCandidate()?.id)}${selectField('scope_type', 'Tingkat target', [['area','Daerah / Desa'],['rw','RW'],['rt','RT'],['tps','TPS']], row.scope_type || 'area')}${field('area_name', 'Nama daerah / desa', row.area_name, 'required maxlength="120"')}${field('rw_number', 'Nomor RW', row.rw_number, 'maxlength="10" placeholder="01"')}${field('rt_number', 'Nomor RT', row.rt_number, 'maxlength="10" placeholder="01"')}${field('tps_number', 'Nomor TPS', row.tps_number, 'maxlength="20" placeholder="01"')}${field('dpt_total', 'Jumlah DPT unit', row.dpt_total || 0, 'type="number" min="1" required')}${field('vote_target', 'Target suara tim', row.vote_target || 0, 'type="number" min="0" required')}${field('achieved_votes', 'Capaian manual saat ini', row.achieved_votes || 0, 'type="number" min="0" required')}<div class="field"><label for="team_id">Tim penanggung jawab</label><select class="input" id="team_id" name="team_id">${teamOptions(row.team_id)}</select></div></div><div class="field"><label for="target_notes">Catatan target</label><textarea class="input" id="target_notes" name="notes" maxlength="500">${esc(row.notes || '')}</textarea></div><div class="target-form-help">Untuk tingkat RW isi nomor RW. Untuk RT isi RW dan RT. Untuk TPS, nomor TPS wajib diisi.</div><div class="actions"><button class="btn action-amber" type="submit">${icon('save')} Simpan Target Tim</button></div>`, 'target-form')
}

function morePage() {
  const pending = state.profiles.filter(p => p.approval_status === 'pending')
  return `<section class="card profile-card"><div class="avatar">${initials(state.profile.full_name)}</div><h2>${esc(state.profile.full_name)}</h2><p class="muted">${esc(roleName(state.profile.role))} • ${esc(state.session.user.email)}</p>${state.profile.phone ? `<a class="chip" href="https://wa.me/${phoneIntl(state.profile.phone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</section>
    <div class="section-title"><h2>Menu</h2></div><section class="list"><button class="list-item btn" data-page="targets"><span>▤</span><div class="list-main"><strong>Kandidat & Target Wilayah</strong><p>DPT, target daerah, RW, RT, TPS, tim dan grafik capaian</p></div></button><button class="list-item btn" data-page="realcount"><span>▥</span><div class="list-main"><strong>Real Count & Quick Count TPS</strong><p>Input C1, rekap suara, dan pemantauan anomali</p></div></button><button class="list-item btn" data-page="mobilization"><span>♧</span><div class="list-main"><strong>Bantuan & Keamanan TPS</strong><p>Transportasi sukarela, aksesibilitas, dan laporan keselamatan</p></div></button><button class="list-item btn" data-action="notifications"><span>♢</span><div class="list-main"><strong>Notifikasi</strong><p>${unreadCount()} belum dibaca</p></div></button>${can('admin', 'owner') ? `<button class="list-item btn" data-action="add-opponent"><span>◫</span><div class="list-main"><strong>Data Tim Lawan</strong><p>Input estimasi kondisi lapangan</p></div></button>` : ''}<button class="list-item btn" data-action="change-password"><span>⌘</span><div class="list-main"><strong>Ganti Password</strong><p>Perbarui keamanan akun</p></div></button><button class="list-item btn" data-action="logout"><span>↪</span><div class="list-main"><strong>Keluar</strong><p>Akhiri sesi aplikasi</p></div></button></section>
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
  openModal('Kirim Laporan ke Pusat', `${field('title', 'Judul laporan', '', 'required maxlength="160"')}<div class="field"><label for="summary">Ringkasan hasil</label><textarea class="input" id="summary" name="summary" required maxlength="1500" placeholder="Jelaskan kegiatan, lokasi, hasil, dan temuan penting…"></textarea></div><div class="form-grid two">${selectField('report_type', 'Jenis laporan', [['activity', 'Kegiatan'], ['incident', 'Kejadian penting'], ['survey', 'Kondisi lapangan']], 'activity')}${field('report_date', 'Tanggal kegiatan', today(), 'type="date" required')}</div>${cameraCaptureBlock('media', 'Foto Bukti Lapangan', 'Aktifkan kamera belakang untuk foto langsung. Bukti disimpan privat dan hanya dapat dibuka melalui tautan aman sementara.')}<div class="actions"><button class="btn btn-cyan" type="submit">${icon('send')} Kirim Laporan ke Pusat</button></div>`, 'report-form')
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
  stopCamera(); document.querySelector('.modal-backdrop')?.remove(); await loadAll(true); renderPage(); toast('Data berhasil disimpan.')
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action],[data-page],[data-auth-tab]'); if (!el) return
  if (el.dataset.authTab) return authScreen(el.dataset.authTab)
  if (el.dataset.page) { stopCamera(); capturedFiles.clear(); state.page = el.dataset.page; el.closest('.modal-backdrop')?.remove(); closeMenuDrawer(); renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const action = el.dataset.action
  try {
    if (action === 'close-modal') { stopCamera(); capturedFiles.clear(); el.closest('.modal-backdrop')?.remove() }
    if (action === 'open-menu') openMenuDrawer()
    if (action === 'close-menu') closeMenuDrawer()
    if (action === 'logout') {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error && !isSessionError(error)) throw error
      returnToLogin('Anda telah keluar dengan aman.'); return
    }
    if (action === 'refresh') { await loadAll(true); renderPage(); toast('Data sudah diperbarui.') }
    if (action === 'print') window.print()
    if (action === 'export-voters') exportCsv()
    if (action === 'add-voter') voterModal()
    if (action === 'add-report') { closeMenuDrawer(); reportModal() }
    if (action === 'add-tps-result') { closeMenuDrawer(); tpsResultModal() }
    if (action === 'add-assistance') { closeMenuDrawer(); assistanceModal() }
    if (action === 'emergency-report') { closeMenuDrawer(); emergencyModal() }
    if (action === 'get-gps') {
      const status = document.querySelector('#gps-status')
      if (!navigator.geolocation) return toast('GPS tidak tersedia pada perangkat ini.', 'error')
      el.disabled = true; if (status) status.textContent = 'Mengambil lokasi…'
      navigator.geolocation.getCurrentPosition(position => {
        document.querySelector('#incident_latitude').value = position.coords.latitude.toFixed(6)
        document.querySelector('#incident_longitude').value = position.coords.longitude.toFixed(6)
        document.querySelector('#incident_accuracy').value = position.coords.accuracy.toFixed(2)
        if (status) status.textContent = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} · akurasi ±${Math.round(position.coords.accuracy)} m`
        el.disabled = false; toast('Lokasi GPS berhasil ditambahkan.')
      }, error => {
        if (status) status.textContent = 'Lokasi belum diizinkan'
        el.disabled = false; toast(error.code === 1 ? 'Izinkan akses lokasi pada browser untuk menyertakan GPS.' : 'Lokasi belum berhasil diperoleh. Coba di area terbuka.', 'error')
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 })
    }
    if (action === 'start-camera') await startCamera(el.dataset.target)
    if (action === 'capture-camera') await captureCamera(el.dataset.target)
    if (action === 'stop-camera') stopCamera()
    if (action === 'send-command') { if (can('admin', 'owner')) commandModal(); else toast('Pembuatan komando hanya untuk Owner atau Admin.', 'error') }
    if (action === 'check-ai-data') {
      const counts = Object.fromEntries(['support', 'swing', 'refuse', 'unknown'].map(s => [s, state.voters.filter(v => v.preference === s).length]))
      openModal('Data Dasar AI Strategy', `<section class="ai-data-grid"><div><span>Total pemilih</span><strong>${rupiah(state.voters.length)}</strong></div><div><span>Pendukung</span><strong>${rupiah(counts.support)}</strong></div><div><span>Swing voter</span><strong>${rupiah(counts.swing)}</strong></div><div><span>Laporan lapangan</span><strong>${rupiah(state.reports.length)}</strong></div></section><div class="info-box">Analisis menggunakan data yang diizinkan oleh hak akses akun dan RLS Supabase. Data pribadi tidak dikirim ke layanan AI eksternal.</div><button class="btn action-cyan btn-block" data-page="voters">Buka Data Pemilih</button>`)
    }
    if (action === 'copy-strategy' && state.strategy) { await navigator.clipboard.writeText(state.strategy.draft); toast('Draf komando berhasil disalin.') }
    if (action === 'save-strategy' && state.strategy) await save('commands', { title: `Strategi: ${state.strategy.category}`, message: state.strategy.situation, priority: state.strategy.riskLevel === 'TINGGI' ? 'urgent' : 'normal', whatsapp_message: state.strategy.draft, created_by: state.profile.id }, null, el)
    if (action === 'whatsapp-strategy' && state.strategy) window.open(`https://wa.me/?text=${encodeURIComponent(state.strategy.draft)}`, '_blank', 'noopener')
    if (action === 'add') ({ voters: () => voterModal(), field: () => reportModal(), commands: commandModal, realcount: () => tpsResultModal(), mobilization: () => assistanceModal(), targets: () => state.candidates.length ? targetModal() : candidateModal() }[state.page]?.())
    if (action === 'edit-voter') voterModal(state.voters.find(v => v.id === el.dataset.id))
    if (action === 'delete-voter' && confirm('Hapus data pemilih ini? Tindakan tercatat dalam audit.')) { const { error } = await supabase.from('voters').delete().eq('id', el.dataset.id); if (error) throw error; el.closest('.modal-backdrop')?.remove(); await loadAll(true); renderPage(); toast('Data dihapus.') }
    if (action === 'add-activity') activityModal()
    if (action === 'edit-activity') activityModal(state.activities.find(a => a.id === el.dataset.id))
    if (action === 'campaign-settings' && can('admin')) campaignSettingsModal()
    if (action === 'add-candidate' && can('admin')) candidateModal()
    if (action === 'edit-candidate' && can('admin')) candidateModal(state.candidates.find(c => c.id === el.dataset.id))
    if (action === 'add-target' && can('admin')) state.candidates.length ? targetModal() : (toast('Tambahkan calon kandidat terlebih dahulu.', 'error'), candidateModal())
    if (action === 'edit-target' && can('admin')) targetModal(state.territoryTargets.find(t => t.id === el.dataset.id))
    if (action === 'add-opponent') openModal('Data Kondisi Lawan', `${field('opponent_name', 'Nama kandidat/tim lawan', '', 'required maxlength="120"')}${field('estimated_support', 'Estimasi dukungan (%)', '', 'type="number" min="0" max="100" required')}<div class="field"><label for="notes">Catatan sumber lapangan</label><textarea class="input" id="notes" name="notes" maxlength="600"></textarea></div><div class="actions"><button class="btn btn-primary">Simpan</button></div>`, 'opponent-form')
    if (action === 'add-team') openModal('Tambah Tim', `${field('name', 'Nama tim', '', 'required maxlength="100"')}${field('area', 'Wilayah kerja', '', 'maxlength="160"')}<div class="actions"><button class="btn btn-primary">Simpan Tim</button></div>`, 'team-form')
    if (action === 'approve-user') { const role = document.querySelector(`#role-${el.dataset.id}`).value, team_id = document.querySelector(`#team-${el.dataset.id}`).value || null; await save('profiles', { role, team_id, approval_status: 'active', approved_at: new Date().toISOString(), approved_by: state.profile.id }, el.dataset.id, el) }
    if (action === 'reject-user') { if (confirm('Tolak pendaftaran akun ini?')) await save('profiles', { approval_status: 'rejected', approved_at: new Date().toISOString(), approved_by: state.profile.id }, el.dataset.id, el) }
    if (action === 'open-media') { const { data, error } = await supabase.storage.from('field-evidence').createSignedUrl(el.dataset.path, 300); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener') }
    if (action === 'open-c1') { const { data, error } = await supabase.storage.from('c1-evidence').createSignedUrl(el.dataset.path, 300); if (error) throw error; openModal('Verifikasi Visual Foto C1', `<div class="c1-lightbox"><img src="${esc(data.signedUrl)}" alt="Foto C1 Plano"><p>Tautan aman ini berlaku selama 5 menit.</p></div>`) }
    if (action === 'wa-witness') {
      const row = state.tpsResults.find(r => r.id === el.dataset.id), phone = phoneIntl(row?.profiles?.phone)
      if (!phone) return toast('Nomor WhatsApp saksi belum tersedia.', 'error')
      const message = `KOMANDO PUSAT TPS\n\n${row.village} - TPS ${row.tps_number}\nMohon konfirmasi kembali hasil C1 dan pastikan berkas asli dikawal serta disimpan dengan aman. Segera laporkan jika ada selisih atau keberatan.\n\nBBR @ SYNERGY smart system`
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
    }
    if (action === 'verify-tps' || action === 'dispute-tps') {
      const verification_status = action === 'verify-tps' ? 'verified' : 'disputed'
      const { error } = await supabase.from('tps_results').update({ verification_status, verified_by: state.profile.id, verified_at: new Date().toISOString() }).eq('id', el.dataset.id)
      if (error) throw error
      await loadAll(true); renderPage(); toast(verification_status === 'verified' ? 'Data TPS telah diverifikasi.' : 'Data TPS ditandai untuk pemeriksaan sengketa.')
    }
    if (action === 'request-transport' || action === 'advance-assistance') {
      const payload = action === 'request-transport'
        ? { transport_needed: true, attendance_status: 'pickup_requested', updated_by: state.profile.id }
        : { attendance_status: el.dataset.status, updated_by: state.profile.id }
      const { error } = await supabase.from('voter_assistance').update(payload).eq('id', el.dataset.id)
      if (error) throw error
      await loadAll(true); renderPage(); toast(action === 'request-transport' ? 'Permintaan armada dikirim ke pusat.' : 'Status bantuan berhasil diperbarui.')
    }
    if (action === 'wa-assistance') {
      const row = state.assistance.find(x => x.id === el.dataset.id), phone = phoneIntl(row?.phone)
      if (!phone) return toast('Nomor WhatsApp peserta belum tersedia.', 'error')
      const message = `Halo ${row.display_name}, layanan bantuan transportasi menuju TPS ${row.polling_station} tersedia. Jika Anda memerlukannya, silakan balas pesan ini. Penggunaan layanan dan keputusan Anda di TPS sepenuhnya bersifat sukarela dan pribadi. Terima kasih.`
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
    }
    if (action === 'notifications') { openModal('Notifikasi', `<section class="list">${state.notifications.map(n => `<article class="list-item"><div class="list-main"><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><div class="meta"><span class="chip">${dateId(n.created_at)}</span></div></div></article>`).join('') || empty('Belum ada notifikasi.')}</section><button class="btn btn-ghost btn-block" data-action="read-notifications">Tandai semua dibaca</button>`); }
    if (action === 'read-notifications') { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null); await loadAll(true); document.querySelector('.modal-backdrop')?.remove(); renderPage() }
    if (action === 'change-password') openModal('Ganti Password', `${field('new_password', 'Password baru', '', 'type="password" minlength="8" required autocomplete="new-password"')}<div class="actions"><button class="btn btn-primary">Perbarui Password</button></div>`, 'password-form')
    if (action === 'forgot') { const email = document.querySelector('#email')?.value; if (!email) return toast('Isi email terlebih dahulu.', 'error'); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); if (error) throw error; toast('Tautan reset telah dikirim.') }
  } catch (err) { console.error(err); if (isSessionError(err)) return returnToLogin(); toast(err.message || 'Terjadi kesalahan.', 'error') }
})

document.addEventListener('input', e => {
  if (e.target.id === 'voter-search') { state.filters.voter = e.target.value; clearTimeout(reloadTimer); reloadTimer = setTimeout(renderPage, 180) }
  if (e.target.id === 'tps-witness-search') { state.filters.tpsWitness = e.target.value; clearTimeout(reloadTimer); reloadTimer = setTimeout(renderPage, 180) }
  if (e.target.id === 'assistance-search') { state.filters.assistanceSearch = e.target.value; clearTimeout(reloadTimer); reloadTimer = setTimeout(renderPage, 180) }
  if (e.target.id === 'dpt_total' || e.target.id === 'voters_present') {
    const dpt = Number(document.querySelector('#dpt_total')?.value || 0), present = Number(document.querySelector('#voters_present')?.value || 0)
    const output = document.querySelector('#participation-value'); if (output) output.textContent = `${Math.min(100, Number(percentage(present, dpt))).toFixed(1)}%`
  }
})
document.addEventListener('change', e => {
  if (e.target.id === 'voter-status') { state.filters.status = e.target.value; renderPage() }
  if (e.target.id === 'tps-village-filter') { state.filters.tpsVillage = e.target.value; renderPage() }
  if (e.target.id === 'tps-result-filter') { state.filters.tpsResult = e.target.value; renderPage() }
  if (e.target.id === 'assistance-status-filter') { state.filters.assistanceStatus = e.target.value; renderPage() }
  if (e.target.id === 'assistance-group-filter') { state.filters.assistanceGroup = e.target.value; renderPage() }
  if (e.target.id === 'target-scope-filter') { state.filters.targetScope = e.target.value; renderPage() }
  if (e.target.id === 'target-team-filter') { state.filters.targetTeam = e.target.value; renderPage() }
  if (e.target.id === 'media' || e.target.id === 'c1_media') { capturedFiles.delete(e.target.id); updateImagePreview(e.target) }
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
    if (form.id === 'campaign-settings-form') {
      const totalDpt = Number(fd.get('total_dpt')), totalTarget = Number(fd.get('total_target'))
      if (totalTarget > totalDpt) throw new Error('Target suara keseluruhan tidak boleh melebihi total DPT.')
      return save('campaign_settings', { candidate_name: String(fd.get('candidate_name')).trim(), election_type: String(fd.get('election_type')).trim(), election_date: fd.get('election_date') || null, total_dpt: totalDpt, total_target: totalTarget, updated_by: state.profile.id }, true, button)
    }
    if (form.id === 'candidate-form') {
      const id = fd.get('id') || null, isOurs = fd.get('is_our_candidate') === 'on'
      setBusy(button, true)
      const payload = { ballot_number: fd.get('ballot_number') ? Number(fd.get('ballot_number')) : null, candidate_name: String(fd.get('candidate_name')).trim(), deputy_name: String(fd.get('deputy_name')).trim() || null, coalition: String(fd.get('coalition')).trim() || null, color: String(fd.get('color')), is_our_candidate: isOurs, updated_by: state.profile.id }
      if (!id) payload.created_by = state.profile.id
      if (isOurs) {
        let clear = supabase.from('candidates').update({ is_our_candidate: false, updated_by: state.profile.id }).eq('is_our_candidate', true)
        if (id) clear = clear.neq('id', id)
        const { error: clearError } = await clear
        if (clearError) throw clearError
      }
      const { error } = id ? await supabase.from('candidates').update(payload).eq('id', id) : await supabase.from('candidates').insert(payload)
      if (error) throw error
      if (isOurs) {
        const { error: settingsError } = await supabase.from('campaign_settings').update({ candidate_name: payload.candidate_name, updated_by: state.profile.id }).eq('id', true)
        if (settingsError) throw settingsError
      }
      setBusy(button, false); form.closest('.modal-backdrop').remove(); await loadAll(true); renderPage(); toast('Data kandidat berhasil disimpan.'); return
    }
    if (form.id === 'target-form') {
      const id = fd.get('id') || null, scope = String(fd.get('scope_type')), dpt = Number(fd.get('dpt_total')), target = Number(fd.get('vote_target')), achieved = Number(fd.get('achieved_votes'))
      const rw = String(fd.get('rw_number')).trim() || null, rt = String(fd.get('rt_number')).trim() || null, tps = String(fd.get('tps_number')).trim() || null
      if ((scope === 'rw' || scope === 'rt') && !rw) throw new Error('Nomor RW wajib diisi untuk target RW/RT.')
      if (scope === 'rt' && !rt) throw new Error('Nomor RT wajib diisi untuk target RT.')
      if (scope === 'tps' && !tps) throw new Error('Nomor TPS wajib diisi untuk target TPS.')
      if (target > dpt || achieved > dpt) throw new Error('Target dan capaian tidak boleh melebihi DPT unit.')
      const payload = { candidate_id: fd.get('candidate_id'), scope_type: scope, area_name: String(fd.get('area_name')).trim(), rw_number: scope === 'area' ? null : rw, rt_number: ['area','rw'].includes(scope) ? null : rt, tps_number: scope === 'tps' ? tps : null, dpt_total: dpt, vote_target: target, achieved_votes: achieved, team_id: fd.get('team_id') || null, notes: String(fd.get('notes')).trim() || null, updated_by: state.profile.id }
      if (!id) payload.created_by = state.profile.id
      return save('territory_targets', payload, id, button)
    }
    if (form.id === 'voter-form') { const id = fd.get('id') || null; return save('voters', { full_name: fd.get('full_name').trim(), phone: fd.get('phone').trim() || null, village: fd.get('village').trim(), address: fd.get('address').trim() || null, polling_station: fd.get('polling_station').trim() || null, preference: fd.get('preference'), team_id: fd.get('team_id') || null, notes: fd.get('notes').trim() || null, updated_by: state.profile.id }, id, button) }
    if (form.id === 'activity-form') { const id = fd.get('id') || null; return save('activities', { title: fd.get('title').trim(), description: fd.get('description').trim() || null, team_id: fd.get('team_id') || null, status: fd.get('status'), progress: Number(fd.get('progress')), due_date: fd.get('due_date') || null, assignee_id: state.profile.id, updated_by: state.profile.id }, id, button) }
    if (form.id === 'report-form') {
      setBusy(button, true, 'Mengirim…'); let media_path = null; let file = capturedFiles.get('media') || fd.get('media')
      if (file?.size) { if (file.size > 20 * 1024 * 1024) throw new Error('Ukuran foto maksimal 20 MB.'); file = await optimizeImage(file); const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); media_path = `${state.profile.id}/${Date.now()}-${safe}`; const up = await supabase.storage.from('field-evidence').upload(media_path, file, { cacheControl: '3600', contentType: file.type, upsert: false }); if (up.error) throw up.error }
      const { error } = await supabase.from('field_reports').insert({ title: fd.get('title').trim(), summary: fd.get('summary').trim(), report_type: fd.get('report_type'), report_date: fd.get('report_date'), media_path, reporter_id: state.profile.id, team_id: state.profile.team_id })
      if (error) { if (media_path) await supabase.storage.from('field-evidence').remove([media_path]); throw error }
      setBusy(button, false); stopCamera(); capturedFiles.delete('media'); form.closest('.modal-backdrop').remove(); await loadAll(true); renderPage(); toast('Laporan berhasil dikirim.'); return
    }
    if (form.id === 'tps-result-form') {
      setBusy(button, true, 'Mengompresi & mengirim…')
      const payload = {
        district: String(fd.get('district')).trim(), village: String(fd.get('village')).trim(), tps_number: String(fd.get('tps_number')).trim(),
        dpt_total: Number(fd.get('dpt_total')), voters_present: Number(fd.get('voters_present')), our_votes: Number(fd.get('our_votes')),
        opponent1_votes: Number(fd.get('opponent1_votes')), opponent2_votes: Number(fd.get('opponent2_votes')), invalid_votes: Number(fd.get('invalid_votes')),
        is_key_tps: fd.get('is_key_tps') === 'on', reporter_id: state.profile.id, team_id: state.profile.team_id || null
      }
      const voteTotal = payload.our_votes + payload.opponent1_votes + payload.opponent2_votes + payload.invalid_votes
      if (payload.voters_present > payload.dpt_total) throw new Error('Pengguna hak pilih tidak boleh melebihi total DPT TPS.')
      if (voteTotal > payload.voters_present) throw new Error(`Jumlah seluruh suara (${voteTotal}) melebihi pengguna hak pilih (${payload.voters_present}).`)
      let file = capturedFiles.get('c1_media') || fd.get('c1_media')
      if (!file?.size) throw new Error('Foto C1 Plano wajib diambil atau dipilih sebelum mengirim data.')
      if (file.size > 20 * 1024 * 1024) throw new Error('Ukuran foto awal maksimal 20 MB.')
      file = await optimizeImage(file)
      if (file.size > 10 * 1024 * 1024) throw new Error('Foto C1 masih terlalu besar setelah kompresi. Gunakan foto maksimal 10 MB.')
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'), media_path = `${state.profile.id}/${Date.now()}-${safe}`
      const upload = await supabase.storage.from('c1-evidence').upload(media_path, file, { cacheControl: '3600', contentType: file.type, upsert: false })
      if (upload.error) throw upload.error
      const { error } = await supabase.from('tps_results').insert({ ...payload, media_path })
      if (error) {
        await supabase.storage.from('c1-evidence').remove([media_path])
        if (error.code === '23505') throw new Error(`${payload.village} TPS ${payload.tps_number} sudah pernah dikirim. Hubungi Owner untuk koreksi.`)
        throw error
      }
      setBusy(button, false); stopCamera(); capturedFiles.delete('c1_media'); form.closest('.modal-backdrop').remove(); await loadAll(true); state.page = 'realcount'; renderPage(); toast('Data TPS dan foto C1 berhasil dikirim ke pusat secara real-time.'); return
    }
    if (form.id === 'assistance-form') {
      const consent = fd.get('consent_confirmed') === 'on'
      if (!consent) throw new Error('Persetujuan peserta wajib dikonfirmasi sebelum menyimpan data.')
      const transport = fd.get('transport_needed') === 'on'
      return save('voter_assistance', {
        display_name: String(fd.get('display_name')).trim(), phone: String(fd.get('phone')).trim() || null,
        village: String(fd.get('village')).trim(), address_hint: String(fd.get('address_hint')).trim() || null,
        polling_station: String(fd.get('polling_station')).trim(), assistance_category: fd.get('assistance_category'),
        transport_needed: transport, safety_concern: fd.get('safety_concern') === 'on', attendance_status: transport ? 'pickup_requested' : 'waiting',
        consent_confirmed: consent, notes: String(fd.get('notes')).trim() || null, team_id: state.profile.team_id || null,
        created_by: state.profile.id, updated_by: state.profile.id
      }, null, button)
    }
    if (form.id === 'incident-form') {
      setBusy(button, true, 'Menyimpan laporan…')
      const latitude = String(fd.get('latitude') || ''), longitude = String(fd.get('longitude') || ''), accuracy = String(fd.get('accuracy_m') || '')
      const payload = { incident_type: fd.get('incident_type'), description: String(fd.get('description')).trim(), latitude: latitude ? Number(latitude) : null, longitude: longitude ? Number(longitude) : null, accuracy_m: accuracy ? Number(accuracy) : null, reporter_id: state.profile.id, team_id: state.profile.team_id || null }
      const { error } = await supabase.from('election_day_incidents').insert(payload)
      setBusy(button, false); if (error) throw error
      const locationText = latitude && longitude ? `\nLokasi GPS: https://www.google.com/maps?q=${latitude},${longitude}\nAkurasi: ±${Math.round(Number(accuracy || 0))} meter` : '\nLokasi GPS belum disertakan.'
      const typeLabel = ({ obstruction: 'Hambatan akses', intimidation: 'Intimidasi', suspected_violation: 'Dugaan pelanggaran', medical: 'Darurat medis', other: 'Lainnya' }[payload.incident_type] || payload.incident_type)
      const message = `LAPORAN KESELAMATAN HARI-H\n\nJenis: ${typeLabel}\nPelapor: ${state.profile.full_name}\nKronologi: ${payload.description}${locationText}\n\nMohon ditinjau oleh Tim Hukum/Satgas. Jangan melakukan konfrontasi dan utamakan keselamatan.`
      form.closest('.modal-backdrop').remove(); await loadAll(true); state.page = 'mobilization'; renderPage()
      openModal('Laporan Tersimpan · Tinjau WhatsApp', `<div class="info-box">Laporan sudah tersimpan dan pusat menerima notifikasi. Periksa kembali draf sebelum memilih penerima WhatsApp.</div><pre class="wa-review">${esc(message)}</pre><a class="btn whatsapp-button btn-block" href="https://wa.me/?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">${icon('whatsapp')} Buka WhatsApp & Pilih Penerima</a>`)
      toast('Laporan keselamatan berhasil dikirim ke pusat.'); return
    }
    if (form.id === 'command-form') return save('commands', { title: fd.get('title').trim(), message: fd.get('message').trim(), priority: fd.get('priority'), whatsapp_message: fd.get('whatsapp_message').trim() || null, created_by: state.profile.id }, null, button)
    if (form.id === 'opponent-form') return save('opponent_snapshots', { opponent_name: fd.get('opponent_name').trim(), estimated_support: Number(fd.get('estimated_support')), notes: fd.get('notes').trim() || null, snapshot_date: today(), created_by: state.profile.id }, null, button)
    if (form.id === 'team-form') return save('teams', { name: fd.get('name').trim(), area: fd.get('area').trim() || null, created_by: state.profile.id }, null, button)
    if (form.id === 'password-form') { setBusy(button, true); const { error } = await supabase.auth.updateUser({ password: fd.get('new_password') }); setBusy(button, false); if (error) throw error; form.closest('.modal-backdrop').remove(); toast('Password berhasil diperbarui.') }
  } catch (err) { setBusy(button, false); console.error(err); if (isSessionError(err)) return returnToLogin(); const box = form.querySelector('#auth-error'); if (box) box.innerHTML = `<div class="error-box">${esc(err.message)}</div>`; else toast(err.message || 'Gagal memproses data.', 'error') }
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
  } catch (err) { console.error(err); if (isSessionError(err)) return returnToLogin(); app.innerHTML = `<main class="auth-shell"><section class="auth-card"><div class="error-box">Gagal memuat aplikasi: ${esc(err.message)}</div><button class="btn btn-ghost btn-block" data-action="logout">Keluar</button></section></main>` }
}

start()
