// ============================================================
// VAULT — app.js (versão PostgreSQL)
// Substitui Firebase SDK por chamadas fetch() para a API REST
// ============================================================

// Estado da sessão guardado em memória + localStorage
let sessao = carregarSessao();

// Se já tem sessão salva, vai direto pro dashboard
if (sessao) {
  mostrarDashboard();
}

// ── Autenticação ─────────────────────────────────────────────

// Equivale a: createUserWithEmailAndPassword + set(ref(db, `users/${uid}`), ...)
async function fazerCadastro() {
  const nome  = document.getElementById('cad-nome').value.trim();
  const email = document.getElementById('cad-email').value.trim();
  const senha = document.getElementById('cad-senha').value;
  const cargo = document.getElementById('cad-cargo').value;

  const res  = await api('/auth/register', 'POST', { name: nome, email, password: senha, role: cargo });
  const data = await res.json();

  if (!res.ok) {
    document.getElementById('auth-erro').textContent = data.error;
    return;
  }

  salvarSessao(data);
  mostrarDashboard();
}

// Equivale a: signInWithEmailAndPassword
async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  const res  = await api('/auth/login', 'POST', { email, password: senha });
  const data = await res.json();

  if (!res.ok) {
    document.getElementById('auth-erro').textContent = data.error;
    return;
  }

  salvarSessao(data);
  mostrarDashboard();
}

// Equivale a: signOut(auth)
function fazerLogout() {
  localStorage.removeItem('vault_sessao');
  sessao = null;
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('dashboard').style.display   = 'none';
}

// ── Dashboard ────────────────────────────────────────────────

async function mostrarDashboard() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('dashboard').style.display   = 'block';

  const { user } = sessao;

  document.getElementById('user-nome').textContent  = user.name;
  document.getElementById('user-badge').textContent = user.role.toUpperCase();
  document.getElementById('user-badge').className   = `cargo-tag ${user.role}`;

  await Promise.all([
    carregarPerfil(),
    carregarDadosPublicos(),
    carregarDadosAdmin(),
  ]);
}

// Equivale a: get(ref(db, `users/${uid}`))
async function carregarPerfil() {
  const res  = await apiAuth('/api/profile');
  const data = await res.json();

  if (!res.ok) {
    document.getElementById('dados-perfil').innerHTML = erro(data.error);
    return;
  }

  document.getElementById('dados-perfil').innerHTML = `
    <div class="row"><span class="row-label">Nome</span><span class="row-value">${data.name}</span></div>
    <div class="row"><span class="row-label">E-mail</span><span class="row-value">${data.email}</span></div>
    <div class="row"><span class="row-label">Cargo</span><span class="row-value">${data.role}</span></div>
    <div class="row"><span class="row-label">ID</span><span class="row-value mono">${data.id}</span></div>
  `;
}

// Equivale a: get(ref(db, "public-data/announcements"))
async function carregarDadosPublicos() {
  const res  = await apiAuth('/api/public-data');
  const data = await res.json();

  if (!res.ok) {
    document.getElementById('dados-publicos').innerHTML = erro(data.error);
    return;
  }

  let html = '';
  for (const aviso of data) {
    html += `<div class="row"><span class="row-label">Aviso</span><span class="row-value">${aviso.title} — ${aviso.body}</span></div>`;
  }
  document.getElementById('dados-publicos').innerHTML = html;
}

// Equivale a: get(ref(db, "admin-data"))
// A Security Rule "role === admin" é aplicada no backend
async function carregarDadosAdmin() {
  const res  = await apiAuth('/api/admin-data');
  const data = await res.json();

  // 403 = PERMISSION_DENIED (cargo user tentando acessar admin-data)
  if (res.status === 403) {
    document.getElementById('badge-admin').textContent = 'Bloqueado';
    document.getElementById('badge-admin').className   = 'status status-blocked';
    document.getElementById('dados-admin').innerHTML = `
      <div class="bloqueio">
        <span class="bloqueio-titulo">Acesso negado</span>
        <span class="bloqueio-desc">Seu cargo não tem permissão para esta área.</span>
        <span class="bloqueio-code">${data.error}</span>
      </div>
    `;
    return;
  }

  if (!res.ok) {
    document.getElementById('dados-admin').innerHTML = erro(data.error);
    return;
  }

  document.getElementById('badge-admin').textContent = 'Liberado';
  document.getElementById('badge-admin').className   = 'status status-ok';

  let reportsHtml = '';
  for (const r of data.reports) {
    reportsHtml += `<div class="row"><span class="row-label">${r.title}</span><span class="row-value">R$ ${Number(r.value).toLocaleString('pt-BR')}</span></div>`;
  }

  document.getElementById('dados-admin').innerHTML = `
    ${reportsHtml}
    <div class="row"><span class="row-label">Manutenção</span><span class="row-value">${data.settings.maintenanceMode ? 'Ativa' : 'Inativa'}</span></div>
    <div class="row"><span class="row-label">Usuários</span><span class="row-value">${data.settings.totalUsers}</span></div>
  `;
}

// ── Utilitários ──────────────────────────────────────────────

// Requisição sem autenticação (login/cadastro)
function api(path, method, body) {
  return fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

// Requisição autenticada — injeta Bearer token
function apiAuth(path, method = 'GET', body) {
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${sessao?.token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(path, opts);
}

function erro(msg) {
  return `<span style="color:var(--red);font-size:.82rem">${msg}</span>`;
}

function salvarSessao(data) {
  sessao = data;
  localStorage.setItem('vault_sessao', JSON.stringify(data));
}

function carregarSessao() {
  try {
    const raw = localStorage.getItem('vault_sessao');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function showTab(tab) {
  document.getElementById('tab-login').style.display    = tab === 'login'    ? 'flex' : 'none';
  document.getElementById('tab-cadastro').style.display = tab === 'cadastro' ? 'flex' : 'none';
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab:${tab === 'login' ? 'first' : 'last'}-child`).classList.add('active');
  document.getElementById('auth-erro').textContent = '';
}
