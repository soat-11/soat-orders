# 🍔 SOAT Order Service (Tech Challenge)

> Microsserviço responsável pela gestão do ciclo de vida dos pedidos, desde o checkout até a atualização de status via mensageria.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS SQS](https://img.shields.io/badge/AWS_SQS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/sqs/)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Arquitetura (Clean Arch)](#-arquitetura-clean-arch)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Como Rodar (Passo a Passo)](#-como-rodar-passo-a-passo)
- [Variáveis de Ambiente (.env)](#-variáveis-de-ambiente-env)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)
- [Mensageria e Eventos (SQS)](#-mensageria-e-eventos-sqs)
- [Estrutura de Pastas](#-estrutura-de-pastas)

---

## 📖 Sobre o Projeto

O **Order Service** é o coração das operações de venda. Ele foi desenhado para ser resiliente e desacoplado, utilizando comunicação assíncrona para falar com outros domínios (como Pagamento e Cozinha).

### Funcionalidades Principais:

1.  **Checkout de Pedidos:** Recebe os itens, calcula totais e persiste o pedido inicial (`RECEIVED`).
2.  **Fila de Cozinha Inteligente:** Lista pedidos ativos ordenados por prioridade de atendimento (Pronto > Em Preparação > Recebido) e tempo de espera.
3.  **Publicação de Eventos:** Após criar o pedido, publica uma mensagem na fila `orders-queue` (AWS SQS) para processamento assíncrono.
4.  **Gestão de Status:** Controla a máquina de estados do pedido (Recebido -> Em Preparação -> Pronto -> Finalizado).

---

## 🏛 Arquitetura (Clean Arch)

Este projeto segue rigorosamente a **Clean Architecture**, garantindo que as regras de negócio (Domínio) não dependam de frameworks, banco de dados ou bibliotecas externas.

### O Fluxo de Dados:

O fluxo segue uma linha única de entrada, processamento no núcleo e saída para infraestrutura:

1.  🌐 **Entrada (API):** O Cliente chama o `OrderController` (REST).
2.  🧠 **Core (Regras):** O Controller chama o `CreateOrderUseCase`. Aqui vivem as regras de negócio e Entidades.
3.  💾 **Saída (Persistência):** O UseCase pede para salvar. O `TypeOrmRepository` grava no PostgreSQL.
4.  📨 **Saída (Eventos):** O UseCase pede para avisar outros sistemas. O `SqsEventPublisher` envia para a AWS SQS.

**Resumo Visual:**
`Request HTTP` ➡️ `Controller` ➡️ `UseCase (Core)` ➡️ `Repository/Publisher` ➡️ `Banco de Dados / Fila SQS`

---

## 🛠 Tecnologias Utilizadas

- **Linguagem:** TypeScript
- **Framework:** NestJS (Modularização e Injeção de Dependência)
- **Banco de Dados:** PostgreSQL 15
- **ORM:** TypeORM (Data Mapper Pattern)
- **Mensageria:** AWS SQS (Simulado via Localstack)
- **Validação:** Class-validator & Class-transformer
- **Documentação:** Swagger (OpenAPI 3.0)
- **Containerização:** Docker & Docker Compose

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Docker](https://www.docker.com/) e Docker Compose
- [Git](https://git-scm.com/)

---

## 🚀 Como Rodar (Passo a Passo)

### 1. Clone o repositório

```bash
git clone [https://github.com/seu-usuario/soat-order-service.git](https://github.com/seu-usuario/soat-order-service.git)
cd soat-order-service
```

Claro, aqui está o conteúdo do README.md sem os identificadores de linguagem (como bash, json, ini) nos blocos de código:

Markdown

### 2. Configure as Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto copiando o exemplo abaixo:

API
PORT=3000

Database (Postgres)
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=user DB_PASSWORD=password DB_NAME=orders_db

AWS / Localstack (Mensageria)
AWS_REGION=us-east-1 SQS_ENDPOINT=http://localhost:4566 SQS_ORDER_CREATED_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/orders-queue

### 3. Suba a Infraestrutura (Docker)

Este comando sobe o PostgreSQL e o Localstack (SQS).

npm run docker:up

> **Nota:** Aguarde alguns segundos para o Localstack inicializar as filas.

### 4. Instale as Dependências

npm install

### 5. Inicie a Aplicação

npm run start:dev

Se tudo der certo, você verá no terminal:
`[NestApplication] Nest application successfully started`

---

## 📡 Documentação da API (Swagger)

Com a aplicação rodando, acesse a documentação interativa:
👉 [http://localhost:3000/docs](http://localhost:3000/docs)

### Endpoint Principal: Checkout

**POST** /orders/checkout

**Exemplo de Payload:**
{ "items": [ { "sku": "HAMBURGER-01", "quantity": 2, "unitPrice": 25.50 } ], "totalValue": 51.00 }

### Listar Pedidos Ativos (Cozinha)

**GET** /orders
Retorna a lista ordenada para o monitor da cozinha, calculando o tempo de espera formatado.

**Exemplo de Payload:**
Exemplo de Resposta:

```
{
  "data": [
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "status": "READY",
      "createdAt": "2026-01-07T13:22:52.354Z",
      "waitingTime": "33m 39s"
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "status": "IN_PREPARATION",
      "createdAt": "2026-01-07T13:37:56.291Z",
      "waitingTime": "18m 35s"
    },
    {
      "id": "44444444-4444-4444-4444-444444444444",
      "status": "RECEIVED",
      "createdAt": "2026-01-07T13:07:59.843Z",
      "waitingTime": "48m 31s"
    }
  ]
}
```

#### 3. Atualizar Status do Pedido

**PATCH** /orders/:id/status
Permite a atualização manual do status do pedido. Valida as regras de transição de domínio (ex: não permite voltar de PRONTO para PREPARAÇÃO).

**Exemplo de Payload:**

```
{ "status": "IN_PREPARATION" }
```

**Exemplo de Resposta (Sucesso):**

```
{ "message": "Status atualizado com sucesso" }
```

**Exemplo de Resposta (Erro de Regra de Negócio):**

```
{ "statusCode": 400, "message": "O pedido já está pronto, não pode voltar para preparação.", "error": "Bad Request" }
```

---

## 📨 Mensageria e Eventos (SQS)

O sistema utiliza arquitetura orientada a eventos. Ao criar um pedido com sucesso:

1. O pedido é salvo no PostgreSQL com status RECEIVED.
2. Um evento order.created é publicado na fila SQS.

### Como visualizar as mensagens (Localstack)?

Você pode usar o script facilitador que criamos no package.json:

Lista as filas ativas
npm run sqs:list

Para ler o conteúdo da mensagem enviada para a fila:

docker exec soat-localstack awslocal sqs receive-message

--queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-created-queue

---

## 📂 Estrutura de Pastas

src/
├── core/ # 🧠 CAMADA DE DOMÍNIO (Pura)
│ ├── domain/
│ │ ├── entities/ # Entidades ricas (Order, OrderItem)
│ │ ├── enum/ # Enums (OrderStatus)
│ │ ├── events/ # Interfaces de Eventos (IEventPublisher)
│ │ └── repositories/ # Contratos de Repositório (IOrderRepository)
│ └── use-cases/ # Casos de Uso (Regras de Aplicação)
│
├── infrastructure/ # 🏗 CAMADA DE INFRAESTRUTURA (Frameworks/Libs)
│ ├── database/ # Implementação de Banco
│ │ ├── entities/ # Tabelas do TypeORM (@Entity)
│ │ ├── mappers/ # Conversores (Domain <-> ORM)
│ │ └── repositories/ # Implementação concreta dos Repositórios
│ │
│ ├── http/ # Camada Web
│ │ ├── controllers/ # Controllers NestJS
│ │ ├── dto/ # Data Transfer Objects (Input/Output)
│ │ └── filters/ # Tratamento Global de Erros
│ │
│ ├── messaging/ # Implementação de Mensageria
│ │ └── producers/ # Publicador SQS (SqsEventPublisher)
│ │
│ └── modules/ # Módulos do NestJS (OrderModule, etc.)
│
├── main.ts # Ponto de entrada
└── app.module.ts # Módulo Raiz

---

## 🧪 Testes

(Seção futura para testes unitários e e2e)

Rodar testes unitários
npm run test

Rodar testes de cobertura
npm run test:cov
