# Primeiro piloto comercial do Nitivo

Especificação sintetizada do plano aprovado na resposta Q19, em 9 de setembro
de 2026. Destino: GitHub Issues de kauepacheco/nitivo, com o rótulo
ready-for-agent. A implementação continua aguardando nova solicitação do
proprietário do Nitivo.

## Problem Statement

Lavações e estéticas automotivas que trabalham com serviços de duração definida
precisam organizar a ocupação dos boxes e permitir que o cliente reserve um
horário sem depender de alguém respondendo no WhatsApp. O proprietário precisa
acompanhar a agenda e os resultados operacionais, e a equipe precisa executar
atendimentos e tratar alterações sem criar conflitos ou perder reservas.

O Nitivo ainda possui apenas a base técnica do backend e um endpoint de saúde.
Não há catálogo funcional, persistência, autenticação, isolamento multiempresa,
agenda, interface ou implantação do produto. A documentação de produto não deve
ser confundida com funcionalidades entregues.

O proprietário do Nitivo decidiu priorizar a construção e validação comercial,
retirando o aprendizado de programação como condição para avançar. O resultado
esperado é uma lavação usar o sistema na rotina e aceitar continuar pagando.
Ainda não há lavação recrutada nem preço validado pelo mercado.

## Solution

Entregar um SaaS responsivo no qual cada lavação possui uma página para
autoagendamento e uma área autenticada para sua equipe. O cliente escolhe um
serviço, data e horário, informa apenas nome, telefone e placa e recebe uma
reserva confirmada automaticamente. O sistema seleciona um box disponível e
preserva nome, preço e duração do serviço na reserva.

Após a confirmação, o cliente pode abrir uma conversa no WhatsApp da lavação
com o resumo preenchido. O envio é feito pelo cliente e é opcional: a reserva
permanece confirmada mesmo sem mensagem. A agenda no Nitivo é a referência
operacional da lavação.

Cancelamentos e reagendamentos são solicitados pelo WhatsApp e efetivados pela
equipe, após conferência. A equipe também registra encaixes, inicia e conclui
atendimentos e marca faltas. O proprietário administra recursos, políticas e
acessos e acompanha indicadores básicos. Os dados de cada lavação permanecem
isolados, inclusive quando uma pessoa possui vínculos com mais de uma empresa.

O primeiro piloto será acompanhado, com uma lavação e 14 dias gratuitos após
a preparação técnica e operacional. A hipótese de continuidade é R$ 49 por
lavação/mês, com cobrança manual pelo proprietário do Nitivo. O teto operacional
inicial é R$ 100/mês além do Codex. Esses valores não representam validação de
mercado ou garantia de custo de hospedagem.

## User Stories

1. Como cliente, quero abrir a página de uma lavação pelo link compartilhado por ela, para reservar no estabelecimento escolhido.
2. Como cliente, quero consultar os serviços ativos, seus preços e durações, para escolher o atendimento adequado.
3. Como cliente, quero consultar os horários disponíveis para o serviço escolhido, para reservar dentro da capacidade da lavação.
4. Como cliente, quero ver horários no fuso da lavação, para compreender corretamente quando devo comparecer.
5. Como cliente, quero agendar informando somente nome, telefone e placa, para concluir a reserva sem criar conta ou informar e-mail.
6. Como cliente, quero que o sistema escolha um box disponível, para não precisar conhecer a distribuição interna de recursos.
7. Como cliente, quero receber confirmação automática sem pagamento ou aprovação manual, para saber imediatamente que meu atendimento foi reservado.
8. Como cliente, quero receber uma indicação clara quando o horário deixar de estar disponível antes da confirmação, para escolher outro horário sem uma reserva conflitante.
9. Como cliente, quero que o reenvio da mesma tentativa de reserva não crie duplicatas, para não ocupar mais de um horário por engano.
10. Como cliente, quero ver um comprovante da reserva confirmada, para conferir o serviço e o horário escolhidos.
11. Como cliente, quero abrir o WhatsApp da lavação com o resumo da reserva preenchido, para enviar as informações se desejar.
12. Como cliente, quero manter minha reserva mesmo se não enviar a mensagem no WhatsApp, para não perder um agendamento já confirmado.
13. Como cliente, quero conhecer o prazo da lavação para solicitar cancelamento ou reagendamento, para planejar uma eventual alteração.
14. Como cliente, quero solicitar cancelamento pelo WhatsApp da lavação, para tratar a mudança com a equipe sem criar conta no Nitivo.
15. Como cliente, quero solicitar reagendamento pelo WhatsApp da lavação, para combinar outro horário com a equipe.
16. Como cliente, quero que um pedido enviado dentro do prazo seja considerado pela equipe mesmo se for lido depois, para não ser prejudicado pela demora no atendimento da mensagem.
17. Como cliente, quero preservar minha reserva original quando o novo horário solicitado estiver ocupado, para não ficar sem atendimento por uma troca malsucedida.
18. Como cliente, quero que o preço e a duração registrados na minha reserva sejam preservados, para que alterações posteriores no catálogo não mudem o combinado.
19. Como cliente, quero que meus dados e reservas não sejam consultáveis apenas por telefone, placa ou identificador, para manter minha privacidade.
20. Como cliente, quero que meu cadastro em uma lavação não exponha meus dados a outra, para preservar a separação entre os estabelecimentos.
21. Como cliente, quero completar o autoagendamento pelo celular, para reservar pelo dispositivo que utilizo no dia a dia.
22. Como funcionário, quero entrar com meu próprio acesso, para que minhas ações sejam identificadas individualmente.
23. Como funcionário, quero acessar somente lavações nas quais tenho vínculo ativo, para trabalhar dentro das minhas autorizações.
24. Como funcionário, quero consultar a agenda diária e os atendimentos previstos, para organizar a operação.
25. Como funcionário, quero que reservas confirmadas apareçam na agenda mesmo sem mensagem no WhatsApp, para acompanhar todos os atendimentos.
26. Como funcionário, quero consultar nome, telefone e placa necessários ao atendimento, para identificar o cliente e o veículo e fazer contato operacional quando necessário.
27. Como funcionário, quero registrar encaixes para início imediato quando houver capacidade, para atender clientes de balcão sem a antecedência exigida no autoagendamento.
28. Como funcionário, quero que encaixes respeitem boxes disponíveis, expediente e bloqueios, para não comprometer reservas existentes.
29. Como funcionário, quero atualizar os dados de cliente e veículo necessários à operação da minha lavação, para manter o atendimento correto.
30. Como funcionário, quero iniciar um atendimento confirmado, para indicar que sua execução começou.
31. Como funcionário, quero concluir um atendimento em andamento, para registrar sua realização.
32. Como funcionário, quero marcar falta em um agendamento confirmado, para distinguir ausência de atendimento concluído ou cancelado.
33. Como funcionário, quero cancelar um agendamento após conferir a solicitação do cliente, para liberar o horário de forma controlada.
34. Como funcionário, quero registrar o momento informado do pedido e o momento em que efetivei a alteração, para distinguir a solicitação da ação na agenda.
35. Como funcionário, quero poder cancelar fora do prazo do cliente com registro da ação e motivo opcional, para tratar exceções operacionais.
36. Como funcionário, quero conferir a disponibilidade ao reagendar, para não transferir o atendimento para um horário ocupado.
37. Como funcionário, quero que o reagendamento preserve a reserva original se a troca falhar, para não perder o compromisso anterior.
38. Como funcionário, quero que estados finais não possam ser reabertos, para manter coerência no histórico operacional.
39. Como funcionário, quero que todas as minhas alterações de estado registrem autoria e momento, para que a equipe possa conferir o que ocorreu.
40. Como funcionário, quero acompanhar atrasos sem que o sistema mova reservas futuras automaticamente, para negociar os ajustes com os clientes.
41. Como funcionário, quero encerrar minha sessão, para impedir uso indevido do meu acesso após sair do sistema.
42. Como integrante da equipe, quero recuperar meu acesso com assistência e um link temporário, para voltar a trabalhar sem compartilhar minha senha.
43. Como proprietário da lavação, quero executar as operações da agenda disponíveis aos funcionários, para também acompanhar e atender a rotina do negócio.
44. Como proprietário da lavação, quero cadastrar serviços com nome, preço, duração e situação, para representar meu catálogo.
45. Como proprietário da lavação, quero atualizar ou desativar serviços sem alterar reservas anteriores, para evoluir o catálogo preservando o histórico.
46. Como proprietário da lavação, quero cadastrar e administrar boxes ativos, para representar a capacidade disponível.
47. Como proprietário da lavação, quero definir dias e horários de funcionamento, para oferecer reservas apenas dentro do expediente.
48. Como proprietário da lavação, quero definir feriados, fechamentos e horários especiais, para ajustar a disponibilidade a exceções da operação.
49. Como proprietário da lavação, quero bloquear um box ou toda a operação em um período, para impedir novas reservas durante indisponibilidades.
50. Como proprietário da lavação, quero visualizar conflitos com reservas futuras antes de aplicar mudanças de capacidade ou disponibilidade, para não cancelar ou modificar compromissos silenciosamente.
51. Como proprietário da lavação, quero configurar o intervalo entre possíveis horários de início, para adequar a apresentação da agenda à minha operação.
52. Como proprietário da lavação, quero ajustar a antecedência mínima de autoagendamento, para controlar quanto tempo preciso para preparar o atendimento.
53. Como proprietário da lavação, quero ajustar quantos dias à frente podem ser reservados, para delimitar minha agenda futura.
54. Como proprietário da lavação, quero ajustar o prazo para solicitar cancelamento ou reagendamento, para definir uma política clara para os clientes.
55. Como proprietário da lavação, quero convidar funcionários com acessos individuais, para distribuir o trabalho sem compartilhar credenciais.
56. Como proprietário da lavação, quero revogar o vínculo de um funcionário apenas na minha lavação, para encerrar seu acesso sem interferir na identidade ou nos vínculos dele em outras empresas.
57. Como proprietário da lavação, quero restringir configurações, acessos e indicadores ao meu papel, para manter o controle administrativo.
58. Como proprietário da lavação, quero consultar a agenda do dia e os próximos atendimentos, para entender os compromissos da operação.
59. Como proprietário da lavação, quero visualizar concluídos, cancelamentos e faltas por período, para acompanhar resultados e perdas de atendimento.
60. Como proprietário da lavação, quero visualizar a soma dos valores históricos dos serviços concluídos, para acompanhar a produção sem confundi-la com recebimentos ou lucro.
61. Como proprietário da lavação, quero que o painel explicite o período e o critério usados nos indicadores, para interpretar os números corretamente.
62. Como proprietário da lavação, quero que nenhuma outra lavação possa consultar meus dados mesmo conhecendo seus identificadores, para preservar o isolamento do meu negócio.
63. Como proprietário da lavação, quero receber ajuda na configuração inicial do piloto, para começar com serviços, boxes e políticas compatíveis com minha operação.
64. Como proprietário da lavação, quero testar o produto por 14 dias sabendo previamente a hipótese de preço de continuidade, para avaliar se vale pagar R$ 49 mensais.
65. Como proprietário da lavação, quero ter um contato de suporte durante o piloto, para resolver dificuldades no uso diário.
66. Como operador do Nitivo, quero provisionar a primeira lavação e seu proprietário de forma assistida, para controlar a entrada do piloto.
67. Como operador do Nitivo, quero entregar convites e redefinições por links privados, temporários e de uso único após a conferência apropriada, para administrar acessos sem conhecer senhas.
68. Como operador do Nitivo, quero impedir que o formulário público conceda acesso a cadastros privados preexistentes, para não tratar telefone ou placa informados como prova de identidade.
69. Como operador do Nitivo, quero limitar tentativas indevidas de acesso e reserva e prevenir duplicatas, para proteger a operação do piloto.
70. Como operador do Nitivo, quero executar demonstrações e testes com dados fictícios separados do banco do piloto, para não comprometer dados reais durante desenvolvimento.
71. Como operador do Nitivo, quero implantar a aplicação de forma reproduzível e acompanhar sua disponibilidade e erros, para identificar falhas e manter o serviço.
72. Como operador do Nitivo, quero testar restauração e reconciliar a agenda antes de reabrir reservas após uma recuperação, para não operar com compromissos inconsistentes.
73. Como operador do Nitivo, quero conferir custos em reais antes da contratação e acompanhar o consumo, para respeitar o teto inicial de R$ 100 mensais além do Codex.
74. Como proprietário do Nitivo, quero conversar digitalmente com cinco potenciais compradores e recrutar uma lavação compatível, para validar o problema e viabilizar o piloto.
75. Como proprietário do Nitivo, quero acompanhar uso, dificuldades e disposição de continuar pagando, para distinguir validação comercial de interesse em um teste gratuito.
76. Como proprietário do Nitivo, quero acompanhar manualmente a mensalidade após o piloto, para testar a cobrança sem construir um sistema de assinaturas agora.
77. Como proprietário do Nitivo, quero preparar materiais e organizar acompanhamentos das primeiras vendas e do suporte, para automatizar depois as atividades repetitivas observadas.
78. Como operador do Nitivo, quero definir e cumprir os procedimentos de privacidade, retenção, atendimento a titulares e incidentes antes de dados reais, para preparar a operação do piloto com suas responsabilidades documentadas.

## Implementation Decisions

- **Arquitetura aceita:** manter monólito modular, Node.js 24, TypeScript estrito, NestJS 12 com Express, API REST, PostgreSQL 18, Prisma 7, npm, Jest e Supertest. Usar React/Vite responsivo, compilado e servido pelo Nest na mesma origem da API. Essa escolha substitui a previsão inicial de Next.js registrada no ADR 0001, cuja revisão preserva o contexto histórico. Não acrescentar servidor de renderização, microserviços, filas ou cache sem necessidade demonstrada.
- **Módulos:** evoluir os limites de identidade e acesso, configuração da lavação, catálogo e agenda. O painel consulta os dados desses módulos. Reaproveitar o esqueleto existente de catálogo, sem tratar seu teste de instanciação como implementação de negócio. Não criar módulo de cobrança automática ou plataforma de automação no piloto.
- **Interface pública:** permitir consultar informações públicas da lavação, serviços ativos e disponibilidade e criar uma reserva. O formulário exige somente nome, telefone e placa além das escolhas de serviço, data e horário. A resposta de sucesso confirma a reserva criada e fornece os dados do comprovante. Falhas de validação ou disponibilidade não produzem reservas parciais.
- **Interface da equipe:** exigir autenticação, vínculo ativo e permissão no tenant para consultar e alterar agenda, cadastros operacionais, configurações ou indicadores. Restrições de papel são verificadas no servidor e não dependem de esconder botões. Identificadores recebidos do navegador não são autorização de acesso.
- **Contratos da API:** definir operações pelos comportamentos públicos e administrativos descritos nesta especificação, mantendo documentação OpenAPI. Nomes exatos de rotas e detalhes internos ainda não foram fixados; não inventar esses contratos como se já estivessem aprovados. Reenvios da mesma tentativa de reserva devem ser reconhecidos sem gerar duplicatas.
- **Modelo de dados:** representar lavação, pessoa usuária com conta, vínculo com papel e situação ativa, cliente e veículo pertencentes à lavação, serviço, box, expediente, exceções, bloqueios, políticas, agendamento, registros de alteração, sessões e convites ou redefinições temporários. Cada agendamento relaciona um cliente, um veículo, um serviço e um único box. Reforçar a integridade dessas relações dentro do tenant no banco e na aplicação.
- **Conta e cliente:** a conta da equipe representa uma identidade da plataforma que pode ter vínculos em mais de uma lavação. Cliente sem conta é um conceito distinto e não recebe vínculo autenticado por reservar. Telefone ou placa informados publicamente não autorizam reutilizar ou expor um cadastro privado, nem associar pessoas ou veículos entre tenants. Contas de clientes serão reavaliadas após o piloto.
- **Papéis fixos:** OWNER administra configurações, catálogo, boxes, equipe e indicadores e também opera a agenda. EMPLOYEE consulta e opera a agenda, registra encaixes e atualiza os dados de clientes e veículos necessários ao atendimento. O funcionário não administra configurações, acessos ou indicadores exclusivos. Revogar um vínculo não transfere controle ou remove vínculos da pessoa em outra empresa.
- **Autenticação da equipe:** e-mail e senha, com sessão no servidor armazenada no PostgreSQL. Usar componentes mantidos, HTTPS, cookies Secure, HttpOnly e SameSite explícito, proteção CSRF, expiração por inatividade e absoluta e revogação. Renovar o identificador ao autenticar; invalidar sessões no logout e após redefinição de senha. Conferir vínculo ativo e papel em cada operação. Senhas usam hash adaptativo adequado, preferencialmente Argon2id calibrado no ambiente, sem criptografia própria ou armazenamento reversível.
- **Entrada e recuperação assistidas:** o operador do Nitivo provisiona a primeira lavação e seu proprietário. O proprietário convida funcionários por links privados de uso único, com validade, para cadastro ou aceitação do vínculo. Para contas existentes, convite não redefine senha. Recuperação da identidade é assistida pelo operador após conferência por canal previamente conhecido. Tokens aleatórios seguros têm finalidade e pessoa delimitadas, hash armazenado, consumo atômico, expiração e limite de tentativas; não aparecem em logs nem viram credenciais permanentes. Entrega é manual e não exige serviço automático de e-mail.
- **Serviços e histórico:** nome, preço inteiro em centavos, duração em minutos e situação ativa ou inativa. Capturar nome, preço e duração vigentes na reserva; alterações ou desativação do catálogo não reescrevem o passado. Reagendamento preserva esse serviço e seus valores históricos; troca de serviço exige cancelar e criar outra reserva.
- **Capacidade:** um box fica reservado por toda a duração do serviço, e todos os boxes podem executar qualquer serviço no piloto. A aplicação seleciona um box disponível. Uma reserva das 10h às 11h permite outra às 11h no mesmo box. Não acrescentar intervalo automático além da duração configurada do serviço.
- **Disponibilidade:** combinar duração, boxes ativos, expediente, exceções, bloqueios, políticas e agendamentos existentes. Não permitir reserva no passado, antes da abertura, terminando depois do fechamento ou sobrepondo outro atendimento no mesmo box ou um bloqueio. Usar o fuso da lavação, inicialmente America/Sao_Paulo, de forma consistente entre navegador, servidor e banco.
- **Padrões configuráveis:** uma hora de antecedência mínima para autoagendamento, horizonte de 30 dias, duas horas para solicitar cancelamento ou reagendamento e intervalo de 30 minutos entre possíveis horários de início. O proprietário pode ajustar esses valores. Encaixes da equipe podem começar imediatamente, com dispensa da antecedência mínima, mas respeitam capacidade, expediente e bloqueios.
- **Concorrência e persistência:** migrations versionadas e revisadas introduzem as estruturas necessárias. O banco reforça a ausência de sobreposição por box além da consulta prévia da aplicação. A implementação deve selecionar e testar a constraint ou estratégia transacional, inclusive diante de reservas públicas, encaixes, reagendamentos e mudanças de disponibilidade simultâneas. A consulta de um horário livre não constitui garantia até a reserva ser persistida com sucesso.
- **Estados:** reserva nasce CONFIRMED. A equipe pode passar de CONFIRMED para IN_PROGRESS e depois COMPLETED; também pode passar de CONFIRMED para CANCELED ou NO_SHOW. Estados finais não retornam. Cada mudança registra autoria e momento; o autoagendamento registra sua origem sem inventar uma identidade autenticada do cliente. Não incluir confirmação manual no primeiro piloto.
- **WhatsApp:** depois de persistir a reserva, mostrar o comprovante e a ação para abrir a conversa com o número da lavação e texto preenchido. O envio depende do cliente. Abrir o link não verifica telefone nem comprova envio, entrega ou leitura. Fechar a página, não ter WhatsApp ou não enviar mensagem não cancela a reserva. A equipe encontra o telefone na agenda para contato operacional. Nenhuma integração com API de mensagens é necessária nesse fluxo.
- **Conteúdo e acesso:** usar na comunicação apenas dados necessários ao atendimento; não incluir credenciais, dados de outras pessoas ou tokens de acesso. A referência do comprovante não permite consultar ou alterar reservas. Não oferecer pesquisa pública de reservas ou histórico por telefone, placa ou identificador. A composição exata do texto deve respeitar o recorte mínimo documentado para o piloto.
- **Cancelamento assistido:** conferir a solicitação no WhatsApp e efetivar no Nitivo. Para um pedido dentro do prazo, vale o horário de envio conferido pela equipe, mesmo quando a leitura ocorre depois. Registrar o momento informado da solicitação separado do momento da ação, sem copiar a conversa inteira. A vaga só é liberada quando o cancelamento é registrado. A equipe pode cancelar fora do prazo do cliente, com ação rastreável e motivo opcional.
- **Reagendamento assistido:** a equipe verifica novamente a disponibilidade; horário e box são trocados somente se a operação puder ser concluída. Falha ou conflito preserva a reserva original e não deixa uma liberação parcial. O pedido de alteração no WhatsApp não é a própria alteração na agenda.
- **Mudanças operacionais:** exibir conflitos com reservas futuras antes de aplicar bloqueios ou desativar boxes. Alterações de capacidade, expediente e catálogo não movem nem cancelam reservas silenciosamente. Atrasos e duração real acima da planejada são acompanhados pela equipe; não redistribuir automaticamente a agenda futura.
- **Painel:** agenda do dia no fuso da lavação, próximos atendimentos e indicadores por período selecionado. Contar concluídos, cancelamentos e faltas pela data prevista do atendimento e seu estado atual. Somar os preços históricos dos agendamentos concluídos desse período. Mostrar o filtro utilizado e apresentar essa soma como valor dos serviços concluídos, sem confundir com recebimentos, faturamento fiscal ou lucro.
- **Implantação aprovada:** um serviço pago Render para API e interface e PostgreSQL pago, inicialmente no endereço HTTPS fornecido pelo serviço. Desenvolvimento e testes locais, sem segundo ambiente remoto permanente. A estimativa de planejamento já levantada é US$ 13,30 antes de conversão e extras; conferir preços, termos, consumo, encargos, capacidade e margem de restauração antes de contratar e respeitar o teto de R$ 100 mensais além do Codex.
- **Operação:** implantação reproduzível, CI, logs sem dados pessoais desnecessários ou segredos, monitoramento de disponibilidade e erros, alertas ao operador, procedimentos de suporte e incidentes. Ensaiar exportação, restauração e recuperação de acesso. Definir cópia externa protegida e retenção antes de dados reais. Em recuperação do banco, suspender novas reservas, conferir a restauração e reconciliar alterações com a lavação antes de reabrir a agenda.
- **Privacidade e proteção:** usar dados fictícios em desenvolvimento, testes e demonstração; separar o banco do piloto. Antes do uso real, concluir inventário e finalidades, retenção e descarte, canal e processo para titulares, avaliação de fornecedores, documentos aplicáveis e revisão técnica, operacional e jurídica. Registrar o fluxo voluntário de dados para o WhatsApp. Limitar tentativas abusivas e acompanhar reservas indevidas; telefone informado não equivale a telefone verificado.
- **Entrega incremental:** construir interface, API, persistência e testes juntos. O primeiro incremento será o proprietário acessar sua lavação e cadastrar/listar um serviço persistido pela interface, com autorização e teste de isolamento usando uma segunda lavação. A presente especificação descreve o piloto completo e deve orientar incrementos sucessivos, não uma única alteração ampla.

## Testing Decisions

- **Aprovação existente:** as fronteiras de teste foram apresentadas no plano e aceitas na Q19: testes HTTP e integração com PostgreSQL real, navegador para jornadas essenciais e testes unitários pontuais. Esta síntese preserva essas decisões; não introduz uma nova arquitetura de testes nem reabre a entrevista.
- **Fronteira principal existente:** aproveitar o teste HTTP que inicializa a aplicação Nest real com seu módulo principal e usa Supertest para verificar resposta observável, encerrando a aplicação ao final. Estender essa mesma fronteira com PostgreSQL real e dados fictícios para exercitar identidade e acesso, configuração da lavação, catálogo, agenda e consultas do painel. Evitar montar uma fronteira de teste independente para cada classe interna.
- **Fronteira de maior nível para jornadas:** usar Playwright no navegador sobre a aplicação real para verificar autoagendamento responsivo, comprovante, operação da agenda, alterações, painel e restrições de acesso. Essa fronteira ainda precisa ser criada porque não há frontend, mas já faz parte do plano aprovado. Não reproduzir cada combinação interna no navegador quando a API cobre o mesmo resultado de forma determinística.
- **O que faz um bom teste:** afirmar resultados observáveis, permissões, persistência e preservação de compromissos após uma ação. Testes devem continuar válidos ao reorganizar controllers ou serviços sem mudar o comportamento. Evitar verificar chamadas a métodos privados, ordem interna de funções ou formato acidental de classes e consultas. Não substituir o banco por mocks nos testes que precisam provar isolamento, atomicidade ou concorrência.
- **Unidade quando útil:** cobrir validação de preço e duração, transições de estado e cálculo de indicadores nas interfaces públicas das regras, sem tornar detalhes internos um contrato. Preferir observar pela fronteira HTTP quando isso já demonstrar o comportamento de forma suficiente.
- **Referência existente e limites:** o repositório possui um teste HTTP de saúde, um teste unitário da resposta de saúde e um teste de instanciação do serviço de catálogo. Eles dão referência para montagem e encerramento da aplicação, mas não comprovam regra de domínio. A inspeção anterior teve dois testes unitários e um HTTP aprovados, TypeScript aprovado e lint com uma importação não utilizada; nenhum desses resultados equivale a validação do piloto.

Os seguintes comportamentos formam o conjunto mínimo de aceite automatizado e operacional:

| Área | Cenários e resultado esperado |
| --- | --- |
| Isolamento multiempresa | Usar duas lavações e pessoas com vínculos diferentes; IDs trocados em leituras e mutações não expõem nem alteram serviços, clientes, veículos, boxes, configurações, reservas ou indicadores da outra lavação. Uma pessoa com dois vínculos recebe somente as permissões do tenant acessado. |
| Papéis e vínculos | Proprietário administra e opera; funcionário opera a agenda, mas não altera configurações nem lê indicadores exclusivos. Revogação do vínculo bloqueia operações futuras nesse tenant sem afetar vínculos da pessoa em outras empresas. |
| Sessões e recuperação | Login, logout, expiração, revogação, proteção CSRF, tentativas inválidas, tokens expirados ou reutilizados e redefinição não permitem acesso indevido. Aceitar convite para pessoa existente não redefine sua senha ou transfere sua identidade global. |
| Catálogo e valores | Valores e durações inválidos são rejeitados; preço inteiro em centavos é preservado. Atualizar ou desativar serviço não altera nome, preço e duração históricos de uma reserva. |
| Disponibilidade | Cobrir abertura, fechamento, término exato no limite, boxes ativos, bloqueios individuais e gerais, exceções, intervalo de início, antecedência, horizonte e fuso da lavação. Reserva terminando às 11h permite outra começar às 11h; sobreposição no mesmo box é recusada. |
| Encaixe imediato | Equipe autorizada registra atendimento para início imediato quando houver capacidade e expediente; o cliente público continua sujeito à antecedência configurada. A exceção não ignora bloqueios ou conflitos. |
| Concorrência | Com um box, duas tentativas simultâneas para o mesmo intervalo resultam em apenas uma reserva válida. Com mais boxes, não ultrapassar a capacidade. Repetir contra encaixe, reagendamento e alteração de disponibilidade, observando o resultado persistido. |
| Duplicatas e validação pública | Reenvio da mesma tentativa não cria uma segunda reserva. Dados inválidos e tentativas limitadas não deixam reservas parciais. Telefone ou placa coincidentes não dão acesso a cadastro privado preexistente. |
| Autoagendamento | Cliente conclui com nome, telefone e placa, sem conta, e-mail, pagamento ou aprovação. A reserva fica confirmada e visível à equipe mesmo sem enviar mensagem no WhatsApp. |
| WhatsApp | Verificar destino da lavação e resumo preenchido sem enviar mensagens reais. Não tratar abertura do link como envio ou verificação de telefone. Falha ao abrir a conversa não remove a reserva persistida. |
| Estados e autoria | Confirmado pode iniciar, cancelar ou receber falta; em andamento pode concluir. Estados finais não retornam. Ações registram autoria e momento, e a criação pública registra a origem sem identidade autenticada inventada. |
| Cancelamento | Pedido enviado no prazo e atendido depois mantém os dois horários distintos. O box fica ocupado até o registro da ação e é liberado após o cancelamento. A exceção de prazo da equipe é rastreável. |
| Reagendamento | Troca bem-sucedida muda horário e box preservando o serviço histórico. Conflito ou falha mantém a reserva original, sem perder sua ocupação e sem criar duplicação. |
| Configurações e atrasos | Bloqueios, desativação de box e mudanças de horários exibem conflitos com reservas futuras; não movem nem cancelam compromissos silenciosamente. Atrasos não redistribuem automaticamente a agenda. |
| Painel | Fixtures fictícias com datas e estados distintos demonstram contagens pelo período e data prevista, soma dos preços históricos somente de concluídos e dia local correto. Funcionário não acessa indicadores exclusivos mesmo chamando a API diretamente. |
| Navegador | Completar reserva em tela de celular, visualizar comprovante sem WhatsApp, operar cancelamento e reagendamento, acompanhar agenda e testar acesso restrito de funcionário. |
| Operação e dados reais | Reproduzir instalação e implantação, restaurar uma cópia de teste, recuperar acesso, verificar alerta de falha e ensaiar reconciliação antes de reabrir reservas. Conferir ausência de segredos e dados pessoais desnecessários nos logs. |

O aceite do piloto exige essas verificações e os critérios operacionais; não
reduzir segurança, isolamento ou consistência para cumprir uma data. Nenhum
teste ou fixture deve usar cliente real ou disparar mensagem real no WhatsApp.

## Out of Scope

- Conta, login, histórico consolidado e acompanhamento público de status para clientes.
- Consulta de reservas existentes por telefone, placa ou identificador público; associação automática de identidade entre lavações por esses dados.
- Cancelamento ou reagendamento automático pelo cliente e leitura automática de mensagens do WhatsApp.
- Verificação automática do telefone, e-mail de reserva, bot, SMS e integração com API de WhatsApp.
- Pagamento do atendimento, antecipação com desconto, Pix integrado, cupons e controle de recebimentos.
- Cobrança automática da assinatura, portal financeiro, cadastro público de lavações e plano gratuito permanente.
- Múltiplas unidades, múltiplos serviços por reserva, preço por porte de veículo, recursos especializados, atribuição obrigatória de funcionário e filas por etapas.
- Alteração automática da agenda por atraso ou duração real acima da prevista e reabertura de estados finais.
- Permissões personalizadas, comissões, financeiro, fiscal, notas fiscais, fidelidade, pacotes, avaliações e aplicativo móvel.
- Relatórios avançados, serviços mais realizados e ticket médio no painel inicial.
- CPF, endereço residencial, RENAVAM e outros documentos pessoais no cadastro do piloto.
- Infraestrutura distribuída, serviços adicionais sem necessidade demonstrada, domínio pago obrigatório e automação de vendas ou suporte antes de observar atividades repetitivas.
- Implementar código, contratar serviços, publicar ambientes, fazer commit ou push como parte da criação desta especificação. Essas ações continuam fora da autorização atual.

## Further Notes

- **Origem e aprovação:** síntese das respostas Q1–Q19, do plano aprovado, do glossário do domínio e da revisão do ADR 0001. O objetivo de aprendizado de programação foi substituído pela prioridade comercial. A especificação não reabre decisões nem transforma recomendações técnicas já aceitas em funcionalidades entregues.
- **Escala da especificação:** descreve o primeiro piloto completo. Quando a implementação for solicitada, dividir a execução em incrementos verificáveis que atravessem interface, API, persistência e testes, começando por acesso do proprietário e catálogo persistido com isolamento. Não implementar o piloto inteiro nesta tarefa documental.
- **Sequência estimada:** semana 1 para acesso, configuração, persistência e CI; semana 2 para agenda e autoagendamento completo demonstrável; semana 3 para alterações, estados, configurações completas e painel; semana 4 para implantação, testes de navegador, recuperação e preparação operacional. O prazo desejado de duas a quatro semanas não é garantia; duas semanas representam um ponto de demonstração do fluxo central.
- **Início do piloto:** os 14 dias gratuitos começam depois de recrutamento, preparação e entrada da lavação; não estão embutidos nas quatro semanas de construção. É necessário que a equipe conheça a agenda e o tratamento de pedidos por WhatsApp e que os critérios para dados reais estejam atendidos.
- **Validação comercial:** o proprietário do Nitivo conduz cinco conversas digitais e busca uma lavação compatível com o modelo de box. Acompanhar dias de uso, reservas feitas pelo cliente e pela equipe, dificuldades, faltas e pedidos de alteração. Evidência comercial é aceitar continuar por R$ 49 mensais; registrar o primeiro pagamento separadamente. Interesse no teste gratuito não valida o preço.
- **Cobrança e suporte:** mensalidade acompanhada manualmente fora do produto. Registrar período, valor e situação da cobrança, fazer contato individual e tratar fim de teste ou inadimplência sem apagar dados ou abandonar reservas futuras. Materiais, organização de contatos e acompanhamentos podem apoiar a rotina; mensagens e atendimento inicial são conduzidos pelo proprietário do Nitivo.
- **Dependências operacionais:** recrutar a lavação, confirmar custos efetivos antes do provisionamento, definir cópia externa e retenção, preparar recuperação, suporte, privacidade e documentos aplicáveis. Custos externos de preparação jurídica ou operacional ainda não estão orçados. Esses critérios não são satisfeitos apenas porque o código funciona.
- **Trabalho existente:** preservar alterações locais anteriores do backend e do catálogo e as skills não versionadas. A inspeção mais recente confirma que o catálogo continua vazio. Nenhum comportamento de negócio foi implementado nesta tarefa.
- **Publicação e execução:** o rastreador confirmado é GitHub Issues de kauepacheco/nitivo, com ready-for-agent como rótulo de especificação pronta, sem triagem adicional. A configuração das skills foi aprovada pelo proprietário. Publicar esta especificação não autoriza iniciar implementação, contratar serviços, fazer commit ou push.
