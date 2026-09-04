# Marco atual

Última atualização: 4 de setembro de 2026.

## Fase

Ambiente educacional.

## Marco

Esqueleto técnico inicial do backend.

## Concluído

- nome e repositório do produto definidos;
- público e funcionalidades do primeiro MVP delimitados;
- regras principais de agendamento documentadas;
- modelo multiempresa e papéis iniciais definidos;
- fases educacional, demonstração, piloto e produção descritas;
- compromissos iniciais de privacidade e LGPD registrados;
- documentação permanente e fluxo entre computadores estruturados;
- stack inicial analisada, aceita e registrada no ADR `docs/adr/0001-stack-inicial.md`;
- Node.js 24 LTS e Docker Desktop com WSL 2 preparados e validados neste computador;
- esqueleto do backend criado com NestJS 12, TypeScript estrito, npm e CommonJS;
- endpoint `GET /health` implementado com testes unitário e HTTP;
- lint, build e testes reunidos no comando `npm run check`;
- particularidades de TypeScript 6 e da integração entre CommonJS, ESM e Jest
  configuradas e documentadas.

## Objetivo atual

Planejar o primeiro incremento vertical do domínio, preservando desde o início
o isolamento entre tenants e a execução com dados fictícios.

## Próximo passo recomendado

Revisar e versionar o esqueleto técnico. Depois, escolher o menor fluxo do
domínio que atravesse HTTP, regra de negócio e teste, antes de introduzir
PostgreSQL e Prisma.

## Pendências próximas

- reproduzir as versões das ferramentas no segundo computador;
- planejar o primeiro incremento vertical do domínio;
- introduzir PostgreSQL 18 e Prisma 7 somente quando o primeiro fluxo exigir
  persistência;
- revisar e adicionar apenas as skills de agente selecionadas para o Nitivo.

## Orientação para uma nova sessão

Antes de agir, leia `AGENTS.md`, `CONTEXT.md`, este documento e os ADRs existentes. Em seguida, apresente em poucas linhas a fase atual, o último resultado concluído e o próximo passo recomendado.
