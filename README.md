# VAULT — PostgreSQL Edition

Versão do VAULT migrada de Firebase para **PostgreSQL no Render**.  
Mesma interface, mesma lógica de controle de acesso por cargo — agora com backend Node.js/Express e banco relacional.

---

## Estrutura do Projeto

```
vault-postgres/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # requireAuth e requireAdmin (equivale às Security Rules)
│   ├── routes/
│   │   ├── auth.js          # POST /auth/register e /auth/login
│   │   └── data.js          # GET /api/profile, /api/public-data, /api/admin-data
│   ├── db.js                # Pool de conexão PostgreSQL
│   ├── schema.sql           # CREATE TABLE + dados de exemplo
│   ├── server.js            # Entry point — Express + serve frontend estático
│   ├── .env.example         # Variáveis de ambiente necessárias
│   └── package.json
├── frontend/
│   ├── index.html           # Mesmo HTML do Firebase (sem alterações visuais)
│   ├── app.js               # fetch() no lugar do Firebase SDK
│   └── style.css            # CSS idêntico ao original
├── render.yaml              # Deploy automático no Render
└── .gitignore
```

---

## Equivalência Firebase → PostgreSQL

| Firebase | PostgreSQL / Express |
|---|---|
| `createUserWithEmailAndPassword` | `POST /auth/register` + bcrypt |
| `signInWithEmailAndPassword` | `POST /auth/login` + JWT |
| `signOut` | `localStorage.removeItem` (token descartado) |
| `onAuthStateChanged` | `localStorage` verifica token na inicialização |
| `get(ref(db, "users/uid"))` | `GET /api/profile` (requireAuth) |
| `get(ref(db, "public-data/..."))` | `GET /api/public-data` (requireAuth) |
| `get(ref(db, "admin-data"))` | `GET /api/admin-data` (requireAuth + requireAdmin) |
| Security Rules (`role === 'admin'`) | Middleware `requireAdmin` no Express |
| `/users/{uid}` (nó JSON) | Tabela `users` |
| `/public-data/announcements` | Tabela `announcements` |
| `/admin-data/reports` | Tabela `reports` |
| `/admin-data/settings` | Tabela `settings` |

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado e rodando

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com sua DATABASE_URL e um JWT_SECRET forte
```

Gere um JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Criar o banco (apenas uma vez)

```bash
# O servidor já executa o schema.sql automaticamente ao iniciar.
# Mas se quiser rodar manualmente:
psql $DATABASE_URL -f schema.sql
```

### 4. Iniciar o servidor

```bash
npm run dev    # desenvolvimento (nodemon)
npm start      # produção
```

Acesse: `http://localhost:3000`

---

## Deploy no Render

### Opção A — Automático (render.yaml)

1. Suba o projeto para um repositório GitHub/GitLab
2. Acesse [render.com](https://render.com) → **New > Blueprint**
3. Conecte o repositório — o Render lê o `render.yaml` e cria:
   - Web Service (Node.js)
   - Banco PostgreSQL gratuito
4. Pronto. O `DATABASE_URL` e o `JWT_SECRET` são injetados automaticamente.

### Opção B — Manual

1. Crie um **PostgreSQL** no Render (New > PostgreSQL)
2. Crie um **Web Service** (New > Web Service)
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Em **Environment**, adicione:
   - `DATABASE_URL` — copie a "Internal Database URL" do banco criado
   - `JWT_SECRET` — string longa e aleatória
   - `NODE_ENV` — `production`

---

## Como Testar os Dois Cargos

1. Cadastre uma conta com cargo **Admin**
2. Abra uma aba anônima e acesse o mesmo endereço
3. Cadastre uma conta com cargo **User**
4. Compare as duas abas — o Admin acessa a área administrativa, o User recebe bloqueio com `PERMISSION_DENIED`

---

## Tecnologias

- **Backend:** Node.js, Express, pg, bcrypt, jsonwebtoken
- **Banco:** PostgreSQL (Render)
- **Frontend:** HTML, CSS e JavaScript puro (sem framework)
- **Deploy:** Render (Web Service + PostgreSQL)
