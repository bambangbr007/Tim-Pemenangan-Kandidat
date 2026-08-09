import { createClient } from '@supabase/supabase-js'
import './styles.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('PROJECT_REF'))
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 8 } }
}) : null

const app = document.querySelector('#app')
const state = {
  session: null, profile: null, page: 'dashboard', busy: false, realtime: null,
  voters: [], activities: [], reports: [], commands: [], opponents: [], profiles: [], teams: [], notifications: [],
  filters: { voter: '', status: '', report: '' }
}

const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]))
const rupiah = n => new Intl.NumberFormat('id-ID').format(Number(n || 0))
const dateId = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : '-'
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
const initials = name => String(name || 'U').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()
const title = s => ({ dashboard: 'Dashboard', voters: 'Data Pemilih', field: 'Kinerja Lapangan', commands: 'Komando', more: 'Menu Lainnya' }[s] || 'Dashboard')
const roleName = r => ({ admin: 'Admin', owner: 'Owner', team: 'Tim Pemenangan' }[r] || r)
const voterStatus = s => ({ support: 'Siap Bergabung', swing: 'Swing Voter', refuse: 'Belum Bersedia', unknown: 'Belum Dipetakan' }[s] || s)
const statusChip = s => ({ support: 'ok', swing: 'warn', refuse: 'bad', unknown: 'info', active: 'ok', pending: 'warn', rejected: 'bad', done: 'ok', in_progress: 'info', planned: 'warn', urgent: 'bad' }[s] || 'info')
const can = (...roles) => state.profile && roles.includes(state.profile.role)

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
  const items = [['dashboard', '⌂', 'Beranda'], ['voters', '♙', 'Pemilih'], ['field', '◫', 'Lapangan'], ['commands', '⚑', 'Komando'], ['more', '☰', 'Lainnya']]
  return items.map(([id, icon, label]) => `<button class="nav-btn ${cls} ${state.page === id ? 'active' : ''}" data-page="${id}"><span>${icon}</span>${label}</button>`).join('')
}

function renderShell() {
  app.innerHTML = `<div class="shell"><aside class="desktop-side"><div class="side-brand"><span class="brand-mark">P</span><strong>Pantauan<br>Pemenangan</strong></div><nav class="side-nav">${navButtons()}</nav></aside>
    <header class="topbar"><div class="avatar">${initials(state.profile.full_name)}</div><div class="topbar-title"><strong>${esc(title(state.page))}</strong><small>${esc(roleName(state.profile.role))}</small></div><button class="icon-btn" data-page="more" aria-label="Notifikasi">♢<b class="badge ${unreadCount() ? '' : 'hidden'}" id="notif-badge">${unreadCount()}</b></button></header>
    <main class="main layout" id="page"></main><button class="fab no-print" id="fab" data-action="add" aria-label="Tambah data">＋</button>
    <nav class="bottom-nav">${navButtons()}</nav><footer>BBR @ SYNERGY smart system</footer></div>`
  renderPage()
}

function unreadCount() { return state.notifications.filter(n => !n.read_at).length }
function updateBadge() { const b = document.querySelector('#notif-badge'); if (b) { b.textContent = unreadCount(); b.classList.toggle('hidden', !unreadCount()) } }

function renderPage() {
  const page = document.querySelector('#page'); if (!page) return
  page.innerHTML = ({ dashboard: dashboardPage, voters: votersPage, field: fieldPage, commands: commandsPage, more: morePage }[state.page] || dashboardPage)()
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === state.page))
  const fab = document.querySelector('#fab'); if (fab) fab.classList.toggle('hidden', !['voters', 'field', 'commands'].includes(state.page) || (state.page === 'commands' && !can('admin', 'owner')))
  const top = document.querySelector('.topbar-title strong'); if (top) top.textContent = title(state.page)
}

function dashboardPage() {
  const counts = Object.fromEntries(['support', 'swing', 'refuse', 'unknown'].map(s => [s, state.voters.filter(v => v.preference === s).length]))
  const total = state.voters.length || 1, pct = Math.round(counts.support / total * 100)
  const done = state.activities.filter(a => a.status === 'done').length
  const fieldPct = state.activities.length ? Math.round(done / state.activities.length * 100) : 0
  return `<div class="page-head"><div><h1>Selamat datang, ${esc(state.profile.full_name.split(' ')[0])}</h1><p>Data lapangan diperbarui otomatis.</p></div><button class="btn btn-ghost no-print" data-action="refresh">↻</button></div>
    <section class="grid kpi-grid"><article class="card card-pad kpi"><i class="kpi-dot" style="color:var(--ok);background:var(--ok)"></i><small>Siap Bergabung</small><strong>${rupiah(counts.support)}</strong><em>${pct}% dari data terpetakan</em></article><article class="card card-pad kpi"><i class="kpi-dot" style="color:var(--warn);background:var(--warn)"></i><small>Swing Voter</small><strong>${rupiah(counts.swing)}</strong><em>Perlu pendekatan lanjutan</em></article><article class="card card-pad kpi"><i class="kpi-dot" style="color:var(--cyan);background:var(--cyan)"></i><small>Kinerja Selesai</small><strong>${fieldPct}%</strong><em>${done} dari ${state.activities.length} tugas</em></article><article class="card card-pad kpi"><i class="kpi-dot" style="color:var(--primary);background:var(--primary)"></i><small>Laporan Hari Ini</small><strong>${state.reports.filter(r => r.report_date === today()).length}</strong><em>${state.reports.length} total laporan</em></article></section>
    <div class="section-title"><h2>Peta Dukungan</h2><button class="link" data-page="voters">Lihat data</button></div><section class="card chart-card"><div class="ring-row"><div class="ring" style="background:conic-gradient(var(--ok) 0 ${counts.support / total * 100}%,var(--warn) 0 ${(counts.support + counts.swing) / total * 100}%,var(--bad) 0 ${(counts.support + counts.swing + counts.refuse) / total * 100}%,var(--cyan) 0)"><strong>${state.voters.length}</strong></div><div class="legend">${[['support', 'var(--ok)'], ['swing', 'var(--warn)'], ['refuse', 'var(--bad)'], ['unknown', 'var(--cyan)']].map(([s, c]) => `<div><span style="--c:${c}">${voterStatus(s)}</span><b>${counts[s]}</b></div>`).join('')}</div></div></section>
    <div class="section-title"><h2>Perbandingan Lapangan</h2></div><section class="card chart-card">${opponentChart()}</section>
    ${can('admin', 'owner') ? `<div class="section-title"><h2>Asisten Strategi</h2></div><section class="card card-pad"><div class="list-item"><span style="font-size:27px">✦</span><div class="list-main"><strong>Analisis berbasis data terkini</strong><p>${esc(advisorText(counts, fieldPct))}</p></div></div></section>` : ''}
    <div class="section-title"><h2>Aktivitas Terbaru</h2></div><section class="list">${state.reports.slice(0, 4).map(reportItem).join('') || empty('Belum ada laporan lapangan.')}</section>`
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
  return `<div class="page-head"><div><h1>Kinerja Lapangan</h1><p>Tugas, progres, dan bukti kegiatan tim.</p></div></div><section class="grid quick-grid"><button class="card card-pad quick btn" data-action="add-activity"><span>✓</span><strong>Tambah Tugas</strong><small class="muted">Rencana dan progres</small></button><button class="card card-pad quick btn" data-action="add-report"><span>▣</span><strong>Kirim Laporan</strong><small class="muted">Foto/video singkat</small></button></section><div class="section-title"><h2>Daftar Tugas</h2></div><section class="list">${state.activities.map(activityItem).join('') || empty('Belum ada tugas lapangan.')}</section><div class="section-title"><h2>Laporan Lapangan</h2></div><section class="list">${state.reports.map(reportItem).join('') || empty('Belum ada laporan lapangan.')}</section>`
}

function activityItem(a) {
  return `<article class="list-item"><div class="list-main"><strong>${esc(a.title)}</strong><p>${esc(a.description || '')}</p><div class="progress"><i style="width:${Math.min(100, a.progress || 0)}%"></i></div><div class="meta"><span class="chip ${statusChip(a.status)}">${a.progress || 0}% • ${esc(a.status)}</span>${a.teams?.name ? `<span class="chip">${esc(a.teams.name)}</span>` : ''}${a.due_date ? `<span class="chip">Target ${esc(a.due_date)}</span>` : ''}</div></div><button class="icon-btn no-print" data-action="edit-activity" data-id="${a.id}">⋮</button></article>`
}

function reportItem(r) {
  return `<article class="list-item"><div class="list-main"><strong>${esc(r.title)}</strong><p>${esc(r.summary)}</p><div class="meta"><span class="chip info">${esc(r.report_type)}</span><span class="chip">${esc(r.profiles?.full_name || '')}</span><span class="chip">${dateId(r.created_at)}</span>${r.media_path ? `<button class="chip btn" data-action="open-media" data-path="${esc(r.media_path)}">Lihat bukti</button>` : ''}</div></div></article>`
}

function commandsPage() {
  return `<div class="page-head"><div><h1>Komando Tim</h1><p>Instruksi owner/admin tersampaikan real-time.</p></div></div><section class="list">${state.commands.map(c => `<article class="list-item"><span style="font-size:25px">${c.priority === 'urgent' ? '⚠' : '⚑'}</span><div class="list-main"><strong>${esc(c.title)}</strong><p>${esc(c.message)}</p><div class="meta"><span class="chip ${statusChip(c.priority)}">${esc(c.priority)}</span><span class="chip">${dateId(c.created_at)}</span>${c.whatsapp_message ? `<a class="chip" href="https://wa.me/?text=${encodeURIComponent(c.whatsapp_message)}" target="_blank" rel="noopener">Bagikan WhatsApp</a>` : ''}</div></div></article>`).join('') || empty('Belum ada komando.')}</section>`
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
  openModal('Kirim Laporan Lapangan', `${field('title', 'Judul laporan', '', 'required maxlength="160"')}<div class="field"><label for="summary">Ringkasan hasil</label><textarea class="input" id="summary" name="summary" required maxlength="1500"></textarea></div><div class="form-grid two">${selectField('report_type', 'Jenis laporan', [['activity', 'Kegiatan'], ['incident', 'Kejadian penting'], ['survey', 'Kondisi lapangan']], 'activity')}${field('report_date', 'Tanggal kegiatan', today(), 'type="date" required')}</div><div class="field"><label for="media">Bukti foto/video (maks. 20 MB)</label><input class="input" id="media" name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"></div><div class="actions"><button class="btn btn-cyan" type="submit">Kirim Laporan</button></div>`, 'report-form')
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
  if (el.dataset.page) { state.page = el.dataset.page; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const action = el.dataset.action
  try {
    if (action === 'close-modal') el.closest('.modal-backdrop')?.remove()
    if (action === 'logout') await supabase.auth.signOut()
    if (action === 'refresh') { await loadAll(true); renderPage(); toast('Data sudah diperbarui.') }
    if (action === 'print') window.print()
    if (action === 'export-voters') exportCsv()
    if (action === 'add') ({ voters: () => voterModal(), field: () => reportModal(), commands: commandModal }[state.page]?.())
    if (action === 'edit-voter') voterModal(state.voters.find(v => v.id === el.dataset.id))
    if (action === 'delete-voter' && confirm('Hapus data pemilih ini? Tindakan tercatat dalam audit.')) { const { error } = await supabase.from('voters').delete().eq('id', el.dataset.id); if (error) throw error; el.closest('.modal-backdrop')?.remove(); await loadAll(true); renderPage(); toast('Data dihapus.') }
    if (action === 'add-activity') activityModal()
    if (action === 'edit-activity') activityModal(state.activities.find(a => a.id === el.dataset.id))
    if (action === 'add-report') reportModal()
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
document.addEventListener('change', e => { if (e.target.id === 'voter-status') { state.filters.status = e.target.value; renderPage() } })

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
    if (form.id === 'voter-form') { const id = fd.get('id') || null; return save('voters', { full_name: fd.get('full_name').trim(), phone: fd.get('phone').trim() || null, village: fd.get('village').trim(), address: fd.get('address').trim() || null, polling_station: fd.get('polling_station').trim() || null, preference: fd.get('preference'), team_id: fd.get('team_id') || null, notes: fd.get('notes').trim() || null, updated_by: state.profile.id }, id, button) }
    if (form.id === 'activity-form') { const id = fd.get('id') || null; return save('activities', { title: fd.get('title').trim(), description: fd.get('description').trim() || null, team_id: fd.get('team_id') || null, status: fd.get('status'), progress: Number(fd.get('progress')), due_date: fd.get('due_date') || null, assignee_id: state.profile.id, updated_by: state.profile.id }, id, button) }
    if (form.id === 'report-form') {
      setBusy(button, true, 'Mengunggah…'); let media_path = null; const file = fd.get('media')
      if (file?.size) { if (file.size > 20 * 1024 * 1024) throw new Error('Ukuran media maksimal 20 MB.'); const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); media_path = `${state.profile.id}/${Date.now()}-${safe}`; const up = await supabase.storage.from('field-evidence').upload(media_path, file, { cacheControl: '3600', upsert: false }); if (up.error) throw up.error }
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
  try { await loadProfile(); if (state.profile.approval_status !== 'active') return pendingScreen(); await loadAll(); subscribeRealtime() } catch (err) { console.error(err); app.innerHTML = `<main class="auth-shell"><section class="auth-card"><div class="error-box">Gagal memuat aplikasi: ${esc(err.message)}</div><button class="btn btn-ghost btn-block" data-action="logout">Keluar</button></section></main>` }
}

start()
