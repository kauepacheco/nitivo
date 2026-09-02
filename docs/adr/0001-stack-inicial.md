# Stack inicial do ambiente educacional

## Status

Aceita em 2 de setembro de 2026.

## Contexto

O Nitivo precisa de uma base técnica para construir, inicialmente em ambiente local, um SaaS multiempresa de agendamentos para lavações. O domínio é relacional, possui regras configuráveis e exigirá consistência diante de tentativas simultâneas de reservar o mesmo recurso.

Além de entregar o produto, o projeto deve ensinar fundamentos de backend, HTTP, SQL, modelagem, testes, autenticação, autorização, concorrência e operação. O desenvolvimento será inicialmente realizado por uma pessoa em dois computadores.

A escolha não deve maximizar apenas velocidade de entrega ou presença em vagas. Ela deve equilibrar:

- adequação ao domínio;
- aprendizado de fundamentos;
- produtividade individual;
- testabilidade;
- manutenção e operação progressivas;
- empregabilidade;
- ausência de complexidade sem necessidade atual.

## Alternativas consideradas

### Ecossistema de backend

- Java com Spring Boot: recursos maduros para aplicações corporativas, com o custo de aprender simultaneamente Java, ferramentas de build e o ecossistema Spring.
- Python com Django ou PHP com Laravel: maior quantidade de funcionalidades integradas e potencialmente menor tempo até um MVP, mas menor alinhamento com o objetivo de aprofundar TypeScript.
- Go: execução eficiente e linguagem simples, mas menos estrutura pronta para o domínio e menor reaproveitamento de linguagem com o frontend futuro.
- Node.js com Express ou Fastify diretamente: maior controle e menos abstrações, mas exige definir e manter manualmente mais convenções arquiteturais.
- Node.js com TypeScript e NestJS: estrutura opinativa para módulos, controllers, serviços, validação, autorização e testes, ao custo de mais conceitos e cerimônia.

### Banco de dados

- MySQL: banco relacional capaz de atender ao produto, mas com menos recursos nativos que o PostgreSQL para representar determinadas restrições de intervalos.
- MongoDB: adequado a dados naturalmente documentais, mas menos alinhado às relações e invariantes centrais do Nitivo.
- PostgreSQL: banco relacional com transações, chaves estrangeiras, constraints, índices, tipos de intervalo e exclusion constraints úteis para consistência de agenda.

### Acesso ao banco

- SQL direto: máximo controle e proximidade com o banco, com mais mapeamento e infraestrutura manual.
- Drizzle: camada TypeScript leve e próxima de SQL, favorável ao aprendizado direto da linguagem do banco.
- TypeORM: ORM tradicional com integração conhecida no ecossistema NestJS e uso extensivo de decorators.
- Prisma: modelo declarativo, cliente tipado e migrations versionadas, com o risco de ocultar SQL ou limitar recursos avançados se usado sem revisão.

### Testes

- Vitest: alternativa moderna e integrada ao fluxo ESM atual do NestJS.
- Jest: alinhado ao objetivo educacional definido para o projeto e adequado a testes unitários e de integração no backend.
- Playwright: apropriado para fluxos em navegador, mas prematuro enquanto não existir frontend.

### Arquitetura de implantação

- Microserviços: isolamento operacional entre componentes, mas introduzem comunicação distribuída, consistência eventual e múltiplos deploys sem necessidade atual.
- Funções serverless: podem reduzir administração de servidores, mas adicionam restrições operacionais e não resolvem um problema atual do ambiente educacional.
- Monólito modular: uma aplicação e um deploy, preservando separação por domínio e transações locais.

## Decisão

Adotar inicialmente:

- arquitetura de monólito modular;
- Node.js 24 LTS;
- TypeScript em modo estrito;
- NestJS 12;
- Express como adaptador HTTP padrão do NestJS;
- API REST;
- OpenAPI/Swagger para documentação da API;
- PostgreSQL 18;
- Prisma 7 para cliente de banco e migrations;
- Jest para testes unitários e de integração;
- Supertest para testes da API HTTP;
- npm e `package-lock.json` para gerenciamento reproduzível de dependências;
- Docker Compose inicialmente apenas para o PostgreSQL;
- GitHub Actions depois que as verificações funcionarem localmente.

Next.js e Playwright permanecem planejados para quando o frontend começar. AWS, filas, cache e outras tecnologias serão avaliados somente diante de necessidades concretas.

As versões principais devem ser registradas pelo projeto. Atualizações menores e de segurança continuam necessárias e não exigem um novo ADR. Uma troca de tecnologia ou atualização principal com consequências arquiteturais deve substituir ou complementar esta decisão.

## Consequências

### Benefícios

- TypeScript poderá ser utilizado no backend e no frontend futuro.
- NestJS fornece convenções úteis para manter um monólito modular consistente.
- PostgreSQL representa bem as relações do domínio e permite reforçar invariantes no banco.
- Prisma acelera operações comuns e mantém migrations versionadas.
- Jest e Supertest permitem exercitar regras isoladas e o comportamento HTTP.
- A aplicação poderá ser executada diretamente no Node durante o aprendizado, enquanto o banco permanece reproduzível em container.

### Custos e riscos

- Decorators e abstrações do NestJS podem esconder conceitos de HTTP e arquitetura.
- Prisma pode esconder SQL e não representar diretamente todos os recursos avançados do PostgreSQL.
- A integração CommonJS/ESM deve ser configurada conscientemente entre NestJS, Prisma e ferramentas de teste.
- O ambiente atual precisa substituir o Node.js 20, já inadequado para as versões escolhidas, e instalar Docker.
- A stack possui mais componentes do que um framework com funcionalidades integradas, como Django ou Laravel.

### Medidas adotadas

- explicar o conceito geral antes de apresentar sua implementação no NestJS;
- ler e discutir toda migration SQL relevante antes de aplicá-la;
- permitir SQL personalizado quando uma constraint, índice ou operação não for representada adequadamente pelo Prisma;
- manter regras de negócio testáveis sem depender diretamente de controllers ou do ORM;
- introduzir cada ferramenta somente no marco em que seu problema aparecer;
- evitar microserviços, filas, cache e infraestrutura adicional sem evidência de necessidade.

## Referências

- [Versões do Node.js](https://nodejs.org/en/about/previous-releases)
- [Primeiros passos e plataformas HTTP do NestJS](https://docs.nestjs.com/first-steps)
- [Integração entre NestJS e Prisma](https://docs.nestjs.com/recipes/prisma)
- [Constraints do PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Política de versões do PostgreSQL](https://www.postgresql.org/support/versioning/)
- [Prisma Migrate](https://www.prisma.io/docs/orm/v7/prisma-migrate)
