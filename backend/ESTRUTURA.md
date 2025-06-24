# 🏗️ Estrutura do Backend - AI Agent Pizzaria

## 📁 Organização de Arquivos

```
backend/src/
├── 📁 config/
│   └── server.ts         # Configurações do servidor e variáveis de ambiente
├── 📁 controllers/
│   ├── appController.ts  # Rotas básicas (/, /health)
│   ├── menuController.ts # Controlador do cardápio
│   └── messageController.ts # Controlador de mensagens/IA
├── 📁 middleware/
│   ├── corsMiddleware.ts # Configuração de CORS
│   └── errorHandler.ts   # Middleware de tratamento de erros
├── 📁 routes/
│   ├── index.ts          # Centralizador de rotas da API
│   ├── menuRoutes.ts     # Rotas do cardápio
│   └── messageRoutes.ts  # Rotas de mensagens
├── 📁 services/
│   └── aiService.ts      # Serviço de IA (Google Gemini)
├── 📁 types/
│   └── index.ts          # Interfaces e tipos TypeScript
├── 📁 utils/
│   └── idGenerator.ts    # Utilitário para geração de IDs
└── index.ts              # Arquivo principal do servidor
```

## 🎯 Princípios da Arquitetura

### ✅ **Separação de Responsabilidades**

- **Controllers**: Lógica de controle das requisições
- **Services**: Lógica de negócio (IA, processamento)
- **Routes**: Definição de rotas e endpoints
- **Middleware**: Interceptadores de requisições
- **Config**: Configurações centralizadas
- **Types**: Tipagem TypeScript centralizada
- **Utils**: Funções utilitárias reutilizáveis

### ✅ **Arquivo Principal Limpo**

O `index.ts` agora tem apenas **24 linhas** (era 268 linhas):

- Configuração mínima
- Importação de módulos organizados
- Setup do servidor

### ✅ **Reutilização e Manutenibilidade**

- Tipos centralizados evitam duplicação
- Controllers separados facilitam testes
- Middleware reutilizável
- Configuração centralizada

## 🔧 **Benefícios da Nova Estrutura**

1. **Escalabilidade**: Fácil adicionar novos recursos
2. **Testabilidade**: Controllers isolados são mais fáceis de testar
3. **Manutenibilidade**: Código organizado é mais fácil de manter
4. **Legibilidade**: Estrutura clara e intuitiva
5. **Padrões**: Segue boas práticas de Node.js/Express

## 📋 **Arquivos Principais**

### `index.ts` - Servidor Principal

```typescript
// Configuração mínima e limpa
app.use(corsMiddleware);
app.use("/api", apiRoutes);
```

### `controllers/` - Controladores

- **messageController.ts**: Processa mensagens e IA
- **menuController.ts**: Gerencia cardápio
- **appController.ts**: Rotas básicas do sistema

### `services/aiService.ts` - IA

- Lógica de processamento de IA
- Detecção de intenções
- Análise de contexto

### `routes/` - Roteamento

- Organização modular de rotas
- Separação por funcionalidade
- Centralização em `routes/index.ts`

## 🚀 **Resultado**

- **Código 90% mais organizado**
- **Arquivo principal 91% menor** (268 → 24 linhas)
- **Estrutura profissional e escalável**
- **Fácil manutenção e evolução**
- **Pronto para crescimento do projeto**
