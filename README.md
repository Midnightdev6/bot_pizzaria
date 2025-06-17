# AI Agent Pizzaria

Sistema completo de atendimento automatizado para pizzaria com agente de IA especializado em vendas. O projeto implementa um chatbot inteligente que segue regras específicas de negócio, oferecendo uma experiência de pedido personalizada e eficiente.

## Tecnologias

### Backend

- **Node.js** + **TypeScript** - Runtime e tipagem estática
- **Express.js** - Framework web RESTful
- **Prisma ORM** - Gerenciamento de banco de dados
- **SQLite** - Banco de dados relacional
- **Google Gemini AI** - Processamento de linguagem natural
- **Zod** - Validação de schemas

### Frontend

- **React 18** + **TypeScript** - Interface de usuário
- **Vite** - Build tool e desenvolvimento
- **TailwindCSS** - Framework de estilização
- **Zustand** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificações

### DevOps

- **Docker** + **Docker Compose** - Containerização
- **Nginx** - Servidor web para produção
- **Jest** - Testes unitários

## Funcionalidades

### Agente de IA Especializado

- **Foco exclusivo em pizzas** - Não aceita pedidos fora do cardápio
- **Regras de negócio rigorosas** - Implementa estratégias de venda específicas
- **Ofertas condicionais** - Pizza → Bebida → Sobremesa
- **Sem descontos** - Política de preços fixos
- **Persistência educada** - Insiste nas vendas de forma respeitosa

### Interface de Chat

- **Tempo real** - Experiência de conversa fluida
- **Design responsivo** - Funciona em mobile e desktop
- **Sugestões inteligentes** - Produtos recomendados dinamicamente
- **Estado persistente** - Conversas salvas no localStorage
- **Novo chat** - Função para reiniciar conversa

### Sistema de Cardápio

- **Gestão completa** - Pizzas, bebidas e sobremesas
- **Preços atualizados** - Valores em tempo real
- **Categorização** - Organização por tipo de produto
- **Disponibilidade** - Controle de itens em estoque

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git

### 1. Instalação

```bash
git clone <repository-url>
cd ai_agent_pizzaria

# Instalar dependências
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configuração

```bash
cd backend

# Configurar variáveis de ambiente
cp env.example .env
# Adicionar GEMINI_API_KEY no .env

# Configurar banco de dados
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Execução

```bash
# Na raiz do projeto
npm run dev
```

**URLs de acesso:**

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/health

##Docker

### Desenvolvimento

```bash
docker-compose up --build
```

### Produção

```bash
docker-compose -f docker-compose.prod.yml up --build
```

### Pizzas

| Sabor              | Preço    |
| ------------------ | -------- |
| Margherita         | R$ 35,90 |
| Calabresa          | R$ 38,90 |
| Portuguesa         | R$ 42,90 |
| Quatro Queijos     | R$ 45,90 |
| Frango c/ Catupiry | R$ 41,90 |
| Pepperoni          | R$ 44,90 |

### 🥤 Bebidas

| Item               | Preço    |
| ------------------ | -------- |
| Coca-Cola 350ml    | R$ 5,50  |
| Coca-Cola 2L       | R$ 12,90 |
| Guaraná Antarctica | R$ 5,50  |
| Suco de Laranja    | R$ 8,90  |
| Suco de Uva        | R$ 8,90  |
| Água Mineral       | R$ 3,50  |

### 🍰 Sobremesas

| Item                      | Preço    |
| ------------------------- | -------- |
| Brownie com Calda         | R$ 15,90 |
| Pudim de Leite Condensado | R$ 12,90 |
| Tiramisù                  | R$ 18,90 |
| Petit Gateau              | R$ 16,90 |
| Mousse de Maracujá        | R$ 11,90 |

## API Endpoints

### Mensagens

- `POST /api/messages` - Enviar mensagem para IA
- `GET /api/messages` - Buscar histórico de conversas

### Cardápio

- `GET /api/menu` - Cardápio completo
- `GET /api/menu/pizzas` - Apenas pizzas
- `GET /api/menu/drinks` - Apenas bebidas
- `GET /api/menu/desserts` - Apenas sobremesas

### Sistema

- `GET /health` - Status do servidor
- `GET /` - Informações da API

## Testes

```bash
# Executar testes unitários
cd backend && npm test

# Testes com coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

## 📁 Estrutura do Projeto

```
ai_agent_pizzaria/
├── backend/                 # API Node.js + TypeScript
│   ├── src/
│   │   ├── index.ts        # Servidor Express
│   │   ├── aiService.ts    # Lógica da IA
│   │   └── types/          # Tipos TypeScript
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco
│   │   └── seed.ts         # Dados iniciais
│   └── Dockerfile
├── frontend/               # Interface React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # Clientes de API
│   │   └── types/          # Tipos compartilhados
│   └── Dockerfile
├── docker-compose.yml      # Orquestração local
└── README.md
```

## 🔧 Scripts Disponíveis

### Raiz do projeto

```bash
npm run dev          # Executar backend + frontend
npm run build        # Build completo
npm test            # Executar testes
```

### Backend

```bash
npm run dev          # Servidor desenvolvimento
npm run build        # Build TypeScript
npm test            # Testes unitários
npm run prisma:studio # Interface visual do banco
```

### Frontend

```bash
npm run dev          # Vite dev server
npm run build        # Build para produção
npm run preview      # Preview da build
```

```bash
npm install --legacy-peer-deps
```

### Recriar Banco de Dados

```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### Limpar Cache

```bash
# Backend
cd backend && rm -rf node_modules package-lock.json && npm install

# Frontend
cd frontend && rm -rf node_modules package-lock.json && npm install
```

## 📈 Monitoramento

### Logs do Sistema

- Backend: Console logs com timestamps
- Frontend: DevTools para debugging
- Banco: Prisma Studio para visualização

### Health Checks

```bash
# Verificar status do backend
curl http://localhost:3001/health

# Verificar menu
curl http://localhost:3001/api/menu
```

### Arquitetura

- **Separação de responsabilidades** - Camadas bem definidas
- **Tipagem completa** - TypeScript em todo projeto
- **Estado reativo** - Zustand para gerenciamento
- **Persistência inteligente** - LocalStorage com hidratação

### Performance

- **Build otimizado** - Vite para desenvolvimento rápido
- **Lazy loading** - Componentes carregados sob demanda
- **Cache eficiente** - Estratégias de cache no frontend
- **Bundle splitting** - Divisão inteligente do código

### Segurança

- **Validação rigorosa** - Zod para schemas
- **CORS configurado** - Proteção contra ataques
- **Sanitização** - Entrada de dados validada
- **Environment variables** - Configurações seguras

---
