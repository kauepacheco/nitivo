# Marco atual

Última atualização: 9 de setembro de 2026.

## Fase

Construção e validação do primeiro piloto comercial iniciadas. O primeiro
incremento vertical foi implementado; ainda não há ambiente publicado nem uso
de dados reais.

## Marco

Ticket 1 do piloto, [issue #2](https://github.com/kauepacheco/nitivo/issues/2):
provisionamento assistido, acesso do proprietário e cadastro/listagem de serviço
persistido pela interface, com isolamento entre lavações.

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

## Objetivo atual

O primeiro ticket está implementado localmente e validado com dados fictícios.
O produto ainda não está pronto para demonstração remota ou piloto: faltam os
incrementos seguintes, implantação e critérios operacionais e de privacidade.

## Próximo incremento proposto

Implementar em nova solicitação o ticket 2,
[issue #3](https://github.com/kauepacheco/nitivo/issues/3): convidar funcionários,
aceitar vínculos e revogá-los sem afetar vínculos da pessoa em outras lavações.

## Pendências de execução

- aguardar nova solicitação antes de iniciar o ticket 2;
- recrutar a lavação e combinar as condições dos 14 dias de piloto;
- conferir custo efetivo em reais antes de provisionar a infraestrutura;
- implementar e verificar os tickets 2 a 22 em sequência;
- ensaiar recuperação e cumprir os critérios operacionais e de privacidade antes
  de introduzir dados reais;
- preservar as alterações locais anteriores no backend, catálogo e skills.

## Orientação para uma nova sessão

Leia AGENTS.md, CONTEXT.md, este marco e o plano antes de implementar ou revisar
o piloto. Consulte o ADR 0001 para a stack já aceita e
[PILOT_INFRASTRUCTURE.md](PILOT_INFRASTRUCTURE.md) para a composição aprovada e
custos a conferir antes da contratação. Distinga plano aprovado de código entregue.
