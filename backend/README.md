# Aplicação do Nitivo

Monólito modular do Nitivo: API NestJS, interface React/Vite e PostgreSQL. Os
sete primeiros incrementos permitem ao operador provisionar uma lavação, ao
proprietário definir sua senha, administrar um catálogo persistido, convidar ou
revogar funcionários, recuperar o acesso da equipe de forma assistida e publicar
os serviços ativos com preço, duração e contato operacional. O proprietário
também configura boxes, expediente semanal e políticas; o cliente consulta os
horários disponíveis para um serviço no fuso da lavação, confirma a reserva e
recebe um comprovante e pode abrir o resumo no WhatsApp da lavação. Proprietários
e funcionários consultam a agenda diária e os próximos atendimentos.

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

## Recuperação assistida de acesso

Não existe formulário público de “esqueci minha senha” nem envio automático. Antes
de emitir um link, o operador deve conferir a identidade da pessoa em um canal
registrado e previamente conhecido, independente dos dados informados em uma
reserva pública. Depois da conferência, execute:

```bash
npm run recover:access -- \
  --email "dona.horizonte@example.test" \
  --output-file ".local/password-recovery-link.txt"
```

O comando aceita somente uma conta com senha e ao menos um vínculo ativo. Ele
invalida links de recuperação anteriores e grava um novo link de uso único, válido
por uma hora, em arquivo `0600` sem exibir o segredo no terminal. Entregue o link
privadamente pelo canal conferido e remova o arquivo logo depois. A redefinição
revoga todas as sessões anteriores da pessoa, inclusive em outras lavações, e ela
deve entrar normalmente com a nova senha.

Se a pessoa perdeu o canal conhecido, não gere nem entregue o link. O operador
deve interromper a recuperação e revalidar a identidade com o responsável da
lavação por um contato já registrado; para o próprio responsável, use os registros
da entrada assistida e uma conferência direta. Um nome, telefone, placa, e-mail
novo ou conhecimento sobre reservas não bastam. Sem confirmação segura, o acesso
permanece bloqueado e o caso deve ser encaminhado ao suporte do Nitivo.

## Execução

Para gerar a interface e a API e servi-las na mesma origem:

```bash
npm run build
npm run start:prod
```

A aplicação fica em `http://127.0.0.1:3000`, a saúde em `GET /health` e a
documentação OpenAPI em `/docs`. Durante alterações, gere a interface com
`npm run build:client` e execute a API com `npm run start:dev`.

O proprietário configura o telefone operacional em **Informações públicas**.
A página compartilhável fica em `/lavacoes/<slug-da-lavacao>` e mostra somente
serviços ativos. O endpoint público correspondente é
`GET /api/public/car-washes/<slug-da-lavacao>`; ele não exige autenticação e não
expõe membros da equipe ou dados internos do tenant.

Em **Capacidade e agenda**, o proprietário cadastra e ativa ou desativa boxes,
define o expediente semanal e ajusta antecedência, horizonte, prazo para
alterações e intervalo entre possíveis inícios. Os valores iniciais são 60
minutos, 30 dias, 120 minutos e 30 minutos, respectivamente, no fuso
`America/Sao_Paulo`. Uma redução de expediente ou capacidade que conflite com
reservas futuras não é aplicada; a API devolve as reservas conflitantes para
conferência, sem alterá-las.

Na página pública, o cliente escolhe um serviço e uma data para consultar os
horários. O cálculo considera duração, expediente, boxes ativos, antecedência,
horizonte e reservas existentes. Exceções de calendário e bloqueios serão
acrescentados em um incremento posterior.

Em produção, a sessão usa cookie `Secure`, `HttpOnly` e `SameSite=Strict`.
Operações autenticadas que alteram estado também exigem o token CSRF devolvido
pelo login. Sessões têm expiração por 30 minutos de inatividade e limite absoluto
de 12 horas; logout e definição de uma nova senha revogam sessões persistidas.
Conforme a implantação aprovada, a API confia em exatamente um proxy reverso para
identificar a origem usada nos limites persistidos de tentativas.

## Reserva pública e agenda

O cliente seleciona um horário, informa nome, telefone com DDD e placa e confirma
sem conta. O comprovante aparece na mesma página e deve ser guardado antes de
fechá-la; não existe consulta pública posterior por identificador, telefone ou
placa. Quando a lavação possui telefone operacional, o comprovante oferece um
link `wa.me` com nome da lavação, serviço, data, horário e referência da reserva.
O navegador apenas abre a conversa: não envia mensagem, não verifica o telefone
informado e não altera a reserva. Pedidos de cancelamento ou reagendamento
dependem da conferência e do registro pela equipe no Nitivo.

- `POST /api/public/car-washes/:slug/appointments`: recebe `attemptId` (UUID v4),
  `serviceId`, `startsAt` (UTC retornado pela disponibilidade), `name`, `phone`
  (10–15 dígitos) e `plate` (padrão brasileiro antigo ou Mercosul).
- Cada tentativa usa um cliente e um veículo novos, isolados na lavação; dados
  não verificados nunca recuperam cadastros privados existentes.
- O mesmo corpo e UUID podem ser reenviados em até 15 minutos após a criação;
  retornam a mesma referência. Uma chave já usada com outro corpo ou após essa
  janela recebe 409. A interface mantém a tentativa apenas em memória e bloqueia
  sua edição em falha de rede, permitindo repetir sem duplicar a reserva.
- A API limita atomicamente a 20 tentativas por IP em 15 minutos, incluindo
  erros de validação e sucessos. Persiste somente hash do IP; registros dessa
  finalidade com mais de 24 horas são removidos na próxima tentativa.
- `GET /api/car-washes/:carWashId/appointments?date=AAAA-MM-DD`: exige sessão e
  vínculo ativo OWNER/EMPLOYEE. Retorna o dia local solicitado (hoje por padrão)
  e até 20 próximos confirmados a partir de agora, ordenados pelo início.
  Comprovante e agenda usam `Cache-Control: no-store`.

Confirmação e mudanças de expediente/desativação de box obtêm a mesma trava
`FOR UPDATE` na lavação antes de consultar disponibilidade/conflitos. Cliente,
veículo e reserva são gravados em uma transação. A migration instala `btree_gist`
e uma exclusion constraint de intervalos `[início, fim)` para reservas
CONFIRMED/IN_PROGRESS do mesmo box; término e início adjacentes são permitidos.
A conta que aplica migrations precisa poder criar essa extensão. Sobreposições
preexistentes fazem a migration falhar e exigem conferência, sem apagar reservas.

As chaves estrangeiras compostas impedem relações entre tenants e entre um
veículo e cliente incompatíveis. Nome/preço/duração do serviço ficam na reserva;
a criação registra `PUBLIC` e seu instante, sem atribuir identidade autenticada.
Ocupações anteriores do ticket 5 permanecem `LEGACY`, sem inventar cliente ou
veículo. Novas reservas públicas exigem ambos no banco. Futuras operações de
encaixe, reagendamento e alterações de catálogo devem respeitar o mesmo protocolo
de concorrência antes de serem disponibilizadas.

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
[#2](https://github.com/kauepacheco/nitivo/issues/2),
[#3](https://github.com/kauepacheco/nitivo/issues/3) e
[#4](https://github.com/kauepacheco/nitivo/issues/4),
[#5](https://github.com/kauepacheco/nitivo/issues/5) e
[#6](https://github.com/kauepacheco/nitivo/issues/6) e
[#7](https://github.com/kauepacheco/nitivo/issues/7).
