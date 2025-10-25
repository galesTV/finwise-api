# 📊 FinWise API

A **FinWise API** é uma API REST robusta desenvolvida em Node.js para gerenciamento financeiro pessoal. Oferece controle completo sobre finanças, incluindo categorias, transações, lembretes e análises detalhadas.

## 🚀 Características

- ✅ **Autenticação segura** com JWT e Firebase Auth
- ✅ **Gestão financeira completa** (receitas e despesas)
- ✅ **Categorias personalizáveis** por usuário
- ✅ **Sistema de lembretes** para pagamentos
- ✅ **Estatísticas e relatórios** detalhados
- ✅ **API RESTful** com documentação clara
- ✅ **TypeScript** para maior confiabilidade
- ✅ **Firebase Firestore** como banco de dados

## 🛠️ Tecnologias

- **Runtime:** Node.js
- **Framework:** Express.js
- **Banco de Dados:** Firebase Firestore
- **Autenticação:** Firebase Auth + JWT
- **Linguagem:** TypeScript
- **Segurança:** Helmet, CORS, Bcrypt
- **Monitoramento:** Morgan, Winston

## 📚 Documentação da API

### 🔐 Autenticação

| Método | Endpoint                       | Descrição              |
| ------ | ------------------------------ | ---------------------- |
| `POST` | `/backend/auth/register`       | Cadastrar novo usuário |
| `POST` | `/backend/auth/login`          | Fazer login do usuário |
| `POST` | `/backend/auth/logout`         | Logout do usuário      |
| `POST` | `/backend/auth/refresh`        | Refresh token          |
| `POST` | `/backend/auth/validate-token` | Validar token          |

### 👤 Usuário

| Método   | Endpoint                         | Descrição               |
| -------- | -------------------------------- | ----------------------- |
| `GET`    | `/backend/user/profile`          | Buscar dados do usuário |
| `PATCH`  | `/backend/user/profile`          | Atualizar dados básicos |
| `PUT`    | `/backend/user/complete-profile` | Completar perfil        |
| `GET`    | `/backend/user/complete-profile` | Buscar perfil completo  |
| `PATCH`  | `/backend/user/saldo`            | Atualizar saldo         |
| `GET`    | `/backend/user/saldo`            | Buscar saldo            |
| `DELETE` | `/backend/user/profile`          | Excluir conta           |

### 💸 Transações Financeiras

| Método   | Endpoint                                    | Descrição                   |
| -------- | ------------------------------------------- | --------------------------- |
| `POST`   | `/backend/finance/createT`                  | Criar transação             |
| `GET`    | `/backend/finance/getAT`                    | Listar todas transações     |
| `GET`    | `/backend/finance/:id`                      | Buscar transação específica |
| `PATCH`  | `/backend/finance/:id`                      | Editar transação            |
| `DELETE` | `/backend/finance/:id`                      | Deletar transação           |
| `POST`   | `/backend/finance/search`                   | Pesquisar transações        |
| `GET`    | `/backend/finance/balance`                  | Obter saldo                 |
| `POST`   | `/backend/finance/objetivo/adicionar-valor` | Adicionar valor a objetivo  |

### 🏷️ Categorias

| Método  | Endpoint                                       | Descrição                      |
| ------- | ---------------------------------------------- | ------------------------------ |
| `GET`   | `/backend/user-categories`                     | Listar categorias do usuário   |
| `POST`  | `/backend/user-categories/save`                | Salvar categorias              |
| `GET`   | `/backend/user-categories/check-salary`        | Verificar pagamento de salário |
| `POST`  | `/backend/user-categories/update-last-payment` | Atualizar último pagamento     |
| `PATCH` | `/backend/user-categories/update-subcategory`  | Atualizar subcategoria         |

### 📆 Lembretes

| Método   | Endpoint                     | Descrição                  |
| -------- | ---------------------------- | -------------------------- |
| `POST`   | `/backend/reminders/createR` | Criar lembrete             |
| `GET`    | `/backend/reminders/getR`    | Listar lembretes           |
| `GET`    | `/backend/reminders/:id`     | Buscar lembrete específico |
| `PUT`    | `/backend/reminders/:id`     | Atualizar lembrete         |
| `DELETE` | `/backend/reminders/:id`     | Deletar lembrete           |

### 📊 Estatísticas

| Método | Endpoint                 | Descrição            |
| ------ | ------------------------ | -------------------- |
| `GET`  | `/backend/stats/monthly` | Estatísticas mensais |
| `GET`  | `/backend/stats/summary` | Resumo financeiro    |

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Firebase

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/finwise-api.git
cd finwise-api
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo .env com suas configurações do Firebase.

4. **Execute em desenvolvimento**

```bash
npm run dev
```

5. **Build para produção**

```bash
npm run build
npm start
```

### Exemplo de Autenticação

```bash
# Registrar usuário
curl -X POST http://localhost:3002/backend/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"senha123"}'

# Fazer login
curl -X POST http://localhost:3002/backend/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"senha123"}'
```

## 📦 Estrutura do Projeto

```text
src/
├── controllers/     # Lógica das rotas
├── routes/         # Definição de rotas
├── services/       # Serviços externos (Firebase)
├── middlewares/    # Middlewares customizados
├── utils/          # Utilitários e helpers
└── types/          # Definições TypeScript
```

## 🔐 Autenticação

Todas as rotas (exceto auth) requerem autenticação via token JWT no header:

```text
Authorization: Bearer <seu_token_jwt>
```

## 🆘 Suporte

Encontrou um problema? Abra uma issue no GitHub.

FinWise API - Organize suas finanças de forma inteligente 💰
