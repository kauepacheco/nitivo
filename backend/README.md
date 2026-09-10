# Aplicação do Nitivo

Monólito modular do Nitivo: API NestJS, interface React/Vite e PostgreSQL. Os
dois primeiros incrementos permitem ao operador provisionar uma lavação, ao
proprietário definir sua senha, administrar um catálogo persistido e convidar ou
revogar funcionários sem misturar identidades e vínculos entre tenants.

## Requisitos

- Node.js 24 LTS e npm 11;
- Docker com Compose para o banco local;
- Chromium do Playwright para o teste de navegador.

## Instalação

```bash
npm ci
npx playwright install --with-deps chromium
```

O `postinstall` gera o Prisma Client. O projeto autoriza scripts de instalação
somente para dependências que precisam compilar binários ou preparar ferramentas;
o script de telemetria de `@scarf/scarf` permanece negado.

## Banco e migrations

Inicie o PostgreSQL 18 local e aplique as migrations:

```bash
npm run db:local
```

A conexão local padrão está em `.env.example`. Em outro ambiente, defina
`DATABASE_URL` antes de executar `npm run db:migrate` ou iniciar a aplicação.
Os instantes persistidos usam `timestamptz` e o banco local opera em UTC.

Para encerrar o container sem apagar o volume:

```bash
npm run db:stop
```

## Provisionamento assistido

Não existe cadastro público de lavações. Com `DATABASE_URL` e `APP_URL`
configuradas, o operador cria a lavação e seu primeiro proprietário pela CLI:

```bash
npm run provision:owner -- \
  --car-wash-name "Lavação Horizonte" \
  --slug "lavacao-horizonte" \
  --owner-email "dona.horizonte@example.test" \
  --output-file ".local/owner-setup-link.txt"
```

O comando grava uma única vez o link privado de definição de senha, válido por
24 horas, em arquivo com permissão `0600`; a saída padrão nunca contém o token.
Entregue o conteúdo por um canal previamente conferido e remova o arquivo depois.
Não copie o link para logs, issues ou commits. Os exemplos acima são fictícios.

## Acesso de funcionários

O proprietário cria o convite na seção **Equipe da lavação** e entrega
manualmente o link por um canal previamente conferido. O link vale por 24 horas,
funciona uma única vez e seu segredo é armazenado somente como hash. Uma pessoa
nova cria a própria senha; uma pessoa que já possui conta precisa entrar nessa
conta para aceitar, sem redefinir a senha global.

Revogar o acesso encerra somente o vínculo com aquela lavação. A autorização
revalida os vínculos ativos em cada operação, de modo que a revogação vale para
uma sessão já aberta e não afeta o acesso da pessoa a outra lavação.

## Execução

Para gerar a interface e a API e servi-las na mesma origem:

```bash
npm run build
npm run start:prod
```

A aplicação fica em `http://127.0.0.1:3000`, a saúde em `GET /health` e a
documentação OpenAPI em `/docs`. Durante alterações, gere a interface com
`npm run build:client` e execute a API com `npm run start:dev`.

Em produção, a sessão usa cookie `Secure`, `HttpOnly` e `SameSite=Strict`.
Operações autenticadas que alteram estado também exigem o token CSRF devolvido
pelo login. Sessões têm expiração por 30 minutos de inatividade e limite absoluto
de 12 horas; logout e definição de uma nova senha revogam sessões persistidas.

## Verificações

```bash
npm run check
```

O comando executa lint, typecheck da API e da interface, builds, testes unitários,
integração HTTP com PostgreSQL 18 real e a jornada Playwright. Os testes criam
um PostgreSQL temporário embutido e usam somente dados fictícios; Docker não é
necessário para a suíte automatizada.

Também é possível executar cada etapa separadamente:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:browser
```

As decisões da stack estão no [ADR 0001](../docs/adr/0001-stack-inicial.md) e o
escopo dos incrementos está nas issues
[#2](https://github.com/kauepacheco/nitivo/issues/2) e
[#3](https://github.com/kauepacheco/nitivo/issues/3).
