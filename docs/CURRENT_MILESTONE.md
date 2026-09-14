# Marco atual

Última atualização: 14 de setembro de 2026.

## Fase

Construção e validação do primeiro piloto comercial iniciadas. Os oito primeiros
incrementos verticais foram implementados; ainda não há ambiente publicado nem
uso de dados reais.

## Marco

[Issue #9](https://github.com/kauepacheco/nitivo/issues/9): editar e desativar
serviços preservando os dados históricos das reservas.

## Concluído

- diagnóstico do código: endpoint GET /health funcional e catálogo ainda vazio;
- validação da base: dois testes unitários e um HTTP passaram; TypeScript passou;
  lint passou com aviso de importação não utilizada;
- objetivo definido: uso diário por uma lavação e disposição de pagar;
- escopo comercial e regras de reserva confirmados nas respostas Q1–Q18;
- autoagendamento com nome, telefone e placa, sem conta ou e-mail;
- reserva automática válida mesmo sem mensagem enviada no WhatsApp;
- equipe confere e efetiva alterações; falha de reagendamento preserva a reserva;
- painel inicial, permissões e padrões de antecedência definidos;
- hipótese comercial aceita: R$ 49 por lavação/mês com cobrança manual;
- teto operacional de R$ 100/mês e descoberta com cinco potenciais compradores;
- missão, glossário, README e roadmap alinhados à prioridade comercial;
- proposta técnica, critérios de aceite, cronograma e custos documentados;
- confirmação final do plano, incluindo React/Vite servido pelo Nest, acesso
  assistido da equipe, encaixes imediatos e implantação planejada no Render;
- [especificação do piloto](specs/primeiro-piloto-saas.md) sintetizada do plano
  aprovado, com histórias de usuário, decisões e critérios de teste;
- GitHub Issues de kauepacheco/nitivo, cinco rótulos padrão e contexto único
  configurados para as skills em docs/agents/ e referenciados no AGENTS.md;
- especificação com 78 histórias publicada e verificada na issue #1;
- divisão em 22 tickets aprovada e publicada nas issues #2 a #23, com corpos,
  títulos, rótulos ready-for-agent e 32 dependências por links conferidos;
  [índice dos tickets](specs/tickets-primeiro-piloto-saas.md) atualizado e issue #1 preservada;
- PostgreSQL 18 e Prisma 7 introduzidos com migration versionada, constraints de
  preço/duração e instantes armazenados com fuso explícito;
- provisionamento da lavação e do proprietário por CLI, com token armazenado no
  banco somente como hash, expirável e de uso único; o link bruto é gravado em
  arquivo temporário protegido para entrega manual e posterior remoção;
- autenticação por Argon2id, sessão no PostgreSQL, cookie protegido, expiração
  por inatividade e absoluta, logout, CSRF e limite persistido de tentativas;
- catálogo acessível somente por proprietário com vínculo ativo no tenant,
  incluindo validação e isolamento comprovado com uma segunda lavação;
- interface React/Vite responsiva servida pelo Nest na mesma origem, com jornada
  de ativação, login, cadastro e listagem verificada no navegador em tela móvel;
- contratos OpenAPI, ambiente PostgreSQL local por Docker Compose e instruções
  reproduzíveis registrados no README da aplicação;
- dependências auditadas sem vulnerabilidades conhecidas no registro npm.
- proprietário convida e revoga funcionários pela interface, com vínculo
  revalidado na operação seguinte e sem excluir a identidade global;
- convite de funcionário válido por 24 horas, armazenado somente como hash,
  limitado por tentativas e consumido atomicamente uma única vez;
- pessoa nova define a própria senha e pessoa com conta existente aceita após
  autenticar, sem redefinir senha ou perder vínculo com outra lavação;
- testes HTTP com PostgreSQL real cobrem dois tenants, restrição do funcionário,
  expiração, consumo concorrente e revogação; jornadas móveis cobrem convite,
  aceite, seleção do vínculo ativo, entrada e revogação.
- operador gera recuperação somente para conta ativa após conferência humana,
  com link de uma hora gravado em arquivo `0600` e sem envio automático;
- token de recuperação tem finalidade própria, segredo armazenado como hash,
  consumo atômico de uso único e limite persistido de tentativas;
- redefinição revoga todas as sessões anteriores da identidade e exige login
  normal; testes HTTP e de navegador cobrem expiração, reuso e concorrência;
- procedimento de entrega privada e perda do canal conhecido registrado sem usar
  dados do formulário público como prova de identidade.
- página pública móvel por slug exibe a lavação e somente seus serviços ativos,
  com preços e durações; endpoint público mantém o isolamento entre lavações.
- formulário do proprietário reinicia ao trocar de lavação e só permite editar
  o contato após carregar o perfil correspondente; regressões no navegador
  cobrem carregamento lento, falha de consulta e respostas atrasadas de leitura
  e salvamento, conferindo os contatos nas páginas públicas das duas lavações.
- proprietário cadastra boxes e configura expediente semanal, antecedência
  mínima, horizonte, prazo de alteração e intervalo entre inícios, preservando
  os padrões aprovados e o isolamento entre lavações;
- disponibilidade pública combina duração do serviço, fuso da lavação,
  expediente, boxes ativos, antecedência, horizonte e ocupações persistidas,
  permitindo término exato no fechamento;
- reduções de expediente ou capacidade exibem reservas futuras conflitantes e
  não alteram a configuração nem os compromissos; exceções e bloqueios
  permanecem reservados à issue #15;
- jornada móvel permite ao proprietário configurar capacidade e expediente e ao
  cliente consultar horários para o serviço e a data escolhidos.

- cliente confirma reserva pública com nome, telefone e placa, recebe comprovante
  e a equipe consulta a agenda diária e os próximos atendimentos no fuso local;
- confirmação escolhe box automaticamente, preserva nome/preço/duração do serviço
  e registra origem pública e instante, sem inventar identidade autenticada;
- transação grava cliente, veículo e reserva integralmente; chaves compostas e
  exclusion constraint PostgreSQL impedem relações cruzadas e sobreposição;
- reenvio idêntico em até 15 minutos retorna a mesma referência; limite atômico
  de 20 tentativas por IP em 15 minutos inclui erros e sucessos;
- mudanças de expediente ou desativação de box disputam a mesma trava da
  confirmação e não invalidam silenciosamente reservas existentes;
- agenda exige vínculo ativo OWNER/EMPLOYEE; formulário não consulta nem reutiliza
  cadastros privados e não oferece busca pública posterior;
- validação completa: lint, tipos e build passaram; 1 teste unitário, 40 HTTP com
  PostgreSQL e 10 de navegador passaram, incluindo perda de resposta após gravar
  reserva, reenvio, comprovante e agenda no celular;
- revisão local nos eixos Standards e Spec sem pendências: nenhuma violação
  documentada ou divergência de escopo; duplicação de fixture apontada e removida.
- comprovante oferece conversa no telefone operacional da lavação com nome da
  lavação, serviço, data, horário e referência, sem expor os dados informados do
  cliente no texto;
- interface deixa explícito que abrir a conversa não envia mensagem nem verifica
  o telefone e que a reserva só muda depois do registro feito pela equipe;
- reserva continua confirmada e visível na agenda sem abertura ou envio pelo
  WhatsApp; teste de navegador valida o destino e o texto usando dados fictícios,
  sem disparar mensagem real.
- proprietário edita nome, preço, duração e situação do serviço pela interface;
  serviços inativos deixam de aparecer e não aceitam novas reservas;
- novas reservas usam os dados vigentes do catálogo, enquanto nome, preço e
  duração de reservas existentes permanecem preservados no histórico;
- atualização do serviço usa a mesma trava transacional da confirmação pública;
  testes HTTP cobrem concorrência, validação monetária, isolamento e restrição
  do funcionário, e a jornada móvel cobre edição e desativação.

## Objetivo atual

Alinhamento das entregas concluído em 14 de setembro de 2026: identificação pelo
número da issue, índice reconciliado e issues #7 e #8 integradas à `main` local
por avanço direto, preservando os commits `a94a991a` e `585c88d1`.
As branches de trabalho integradas foram removidas localmente.

O [índice das issues](specs/tickets-primeiro-piloto-saas.md) concentra o estado de
implementação, publicação do código e integração local/remota por entrega.
O GitHub foi consultado pelo conector: `main` remota em `d76b1415`, com as
issues #2–#6 integradas. Checklists e estados das issues #2–#8 foram reconciliados, e a issue #1 recebeu
acompanhamento sem alterar o escopo da especificação.
As issues #7 e #8 ficam abertas até publicação e integração na `main` remota.

A issue #9 está implementada localmente na branch `feat/9-edicao-servicos` e
aguarda publicação, integração à `main` e reconciliação no GitHub.
Verificação da entrega: lint, tipos e build passaram; 1 teste unitário, 43 testes
HTTP com PostgreSQL real e 10 jornadas de navegador passaram.

O push permanece pendente de solicitação explícita e acesso Git autenticado;
a tentativa de fetch por SSH retornou `Permission denied (publickey)`.
O conector permite manter as issues atualizadas, mas não sincroniza o clone.
A próxima branch deve partir da `main` depois de confirmar a sincronização.

Verificação desta reconciliação: lint, tipos e build passaram; 1 teste unitário,
40 HTTP com PostgreSQL real e 10 de navegador passaram. Conferência documental
preservou as entregas, histórias e dependências das 22 issues.

A coleção de 37 skills permanece preservada conforme decisão do proprietário;
detalhes em [Skills do Nitivo](../.agents/skills/README.md).

O produto ainda não está pronto para demonstração remota ou piloto: faltam os
incrementos seguintes, implantação e critérios operacionais e de privacidade.
Somente dados fictícios foram utilizados. As bibliotecas que faltavam ao Chromium
foram extraídas em `/tmp` para a validação, sem instalação no sistema.

## Próximo incremento proposto

Implementar em nova solicitação a [issue #10](https://github.com/kauepacheco/nitivo/issues/10): corrigir os dados de
cliente e veículo pela agenda sem criar acesso público aos cadastros.

## Pendências de execução

- aguardar nova solicitação antes de iniciar a issue #10;
- recrutar a lavação e combinar as condições dos 14 dias de piloto;
- conferir custo efetivo em reais antes de provisionar a infraestrutura;
- implementar e verificar as issues #10 a #23 em sequência;
- ensaiar recuperação e cumprir os critérios operacionais e de privacidade antes
  de introduzir dados reais;
- sincronizar commits locais com o GitHub após solicitação explícita de push;
  acesso por SSH precisa ser restabelecido nesta máquina.

## Orientação para uma nova sessão

Leia AGENTS.md, CONTEXT.md, este marco e o plano antes de implementar ou revisar
o piloto. Consulte o ADR 0001 para a stack já aceita e
[PILOT_INFRASTRUCTURE.md](PILOT_INFRASTRUCTURE.md) para a composição aprovada e
custos a conferir antes da contratação. Distinga plano aprovado de código entregue.
