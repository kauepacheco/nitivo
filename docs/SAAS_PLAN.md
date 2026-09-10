# Plano do primeiro piloto do Nitivo

Atualizado em 9 de setembro de 2026.

Status: planejamento concluído e aprovado pelo proprietário na resposta Q19,
em 9 de setembro de 2026. A aprovação inclui proposta técnica, cronograma,
acesso assistido da equipe e encaixes imediatos. Por instrução expressa do
proprietário, não iniciar implementação agora; aguardar nova solicitação.

## Objetivo e limites confirmados

Entregar um SaaS para uma lavação usar na rotina e demonstrar disposição de
pagar. Aprendizado de programação deixou de ser condição para avançar.

- Público inicial: lavações ou estéticas automotivas com serviços de duração
  definida que ocupam um box durante todo o atendimento.
- Problema: permitir que o cliente reserve sozinho, organizar horários, impedir
  conflitos e dar visibilidade ao proprietário.
- Prazo desejado: duas a quatro semanas para preparar a primeira versão.
- Orçamento operacional: até R$ 100/mês além do ChatGPT/Codex.
- Piloto proposto: uma lavação, entrada assistida e 14 dias gratuitos.
- Hipótese comercial aceita: R$ 49 por lavação/mês após o teste, com cobrança
  acompanhada manualmente pelo proprietário do Nitivo.
- Validação: ainda não há lavação recrutada nem preço validado. O proprietário
  se comprometeu a conversar com cinco potenciais compradores por canais digitais
  e dispõe de tempo para vendas e suporte.

Quatro semanas é a referência proposta para execução, sujeita às verificações
de cada entrega. Duas semanas é um ponto de demonstração do fluxo central, não
uma promessa de operação comercial pronta. Os 14 dias de teste começam depois
da preparação técnica e da entrada da lavação; não estão embutidos nesse prazo.

## Produto do piloto

### Cliente da lavação

1. Abre a página da lavação pelo link compartilhado por ela.
2. Escolhe um serviço, uma data e um horário disponível.
3. Informa somente nome, telefone e placa.
4. Confirma a reserva sem conta, senha, e-mail, pagamento ou aprovação da equipe.
5. Vê o comprovante e pode abrir o WhatsApp da lavação com o resumo preenchido.

A reserva permanece confirmada mesmo se o cliente não enviar a mensagem.
A agenda do Nitivo é a referência para a operação. O telefone fica disponível
à equipe, que pode fazer contato operacional ou conferir uma ausência.

O link abre o campo de mensagem; o envio depende de ação do cliente.
Não comprova envio, entrega ou posse do telefone informado. Fonte:
[WhatsApp — click to chat](https://faq.whatsapp.com/5913398998672934).

O cliente solicita cancelamento ou reagendamento pelo WhatsApp. Não existe
consulta pública de histórico ou alteração de reservas por telefone, placa
ou identificador. A referência do comprovante não é uma credencial.

### Equipe da lavação

- Proprietário: configura serviços, preços, durações, boxes, expediente,
  exceções, bloqueios, políticas e acessos da equipe; acompanha indicadores
  e também pode executar as operações da agenda.
- Funcionário: acessa a agenda, registra encaixes e atualiza atendimentos e os
  dados de clientes e veículos necessários à operação; não administra
  configurações, acessos ou indicadores exclusivos do proprietário.
- Cada integrante utiliza acesso individual com vínculo ativo à lavação.
- A equipe confere pedidos no WhatsApp e registra a alteração no Nitivo.

Se o cliente pedir cancelamento dentro do prazo e a equipe ler depois, vale o
horário de envio conferido pela equipe. O box só é liberado quando o cancelamento
é registrado. Registrar separadamente o momento informado do pedido e o da ação,
sem copiar a conversa inteira. No reagendamento, a troca só ocorre se o novo
horário estiver disponível; uma falha preserva a reserva original.

### Painel do proprietário

Agenda do dia, próximos atendimentos, concluídos, cancelamentos, faltas e soma
dos valores dos serviços concluídos. A soma representa serviços realizados,
não recebimentos, faturamento fiscal ou lucro.

Cálculo aceito no plano: indicadores por período selecionado, usando
a data prevista do atendimento e o estado atual; concluídos somam o preço
histórico das reservas concluídas desse período. O painel explicita o filtro.
Agenda do dia usa o dia local da lavação.

## Regras de agenda

Confirmadas na entrevista ou preservadas do escopo documentado:

- Uma reserva tem um cliente, um veículo, um serviço e um box.
- Serviço tem preço inteiro em centavos e duração em minutos.
- Nome, preço e duração do serviço ficam preservados na reserva.
- Todos os boxes executam qualquer serviço. O sistema escolhe um disponível.
- Um atendimento de 60 minutos às 10h ocupa o box até as 11h; outro pode começar
  às 11h. Não há intervalo automático além da duração do serviço.
- Impedir horários passados, sobreposição no mesmo box, bloqueios e atendimento
  fora do expediente. Reservas simultâneas não podem ultrapassar a capacidade.
- Antecedência mínima padrão: uma hora. Horizonte padrão: 30 dias.
- Prazo padrão para solicitar cancelamento ou reagendamento: duas horas.
- Esses três valores são ajustáveis pelo proprietário. A equipe pode cancelar
  fora do prazo, registrando a ação; pedidos por WhatsApp são conferidos por ela.
- Confirmação automática no piloto. Fluxo: CONFIRMED → IN_PROGRESS → COMPLETED;
  CONFIRMED também pode ir a CANCELED ou NO_SHOW. Estados finais não retrocedem.
- Cada mudança registra quando ocorreu e quem a executou. A reserva criada pelo
  cliente sem conta registra essa origem sem inventar identidade autenticada.
- Alterações de serviços, expediente ou capacidade não modificam nem cancelam
  silenciosamente reservas existentes.
- Encaixes seguem capacidade, expediente e bloqueios, como as demais reservas.

Detalhes operacionais aceitos na revisão final do plano:

- Usar o fuso da lavação; padrão inicial America/Sao_Paulo. Instantes devem ser
  consistentes entre navegador, servidor e banco. Intervalo inicial entre
  horários oferecidos: 30 minutos, ajustável pelo proprietário.
- Permitir encaixe para início imediato, limitado pela capacidade e expediente;
  a antecedência mínima de uma hora vale para autoagendamento. Essa exceção
  evita impedir o atendimento de balcão e fica explícita na interface.
- Reagendamento altera horário e box preservando o serviço e seus valores
  históricos. Troca de serviço exige cancelar e criar outra reserva.
- Para atraso e duração real maior que a planejada, a equipe acompanha e negocia
  a operação; o sistema não move reservas futuras automaticamente.
- Conferir bloqueios ou desativação de box contra reservas futuras e mostrar
  conflitos antes de aplicar a mudança, sem resolver conflitos silenciosamente.

## Fora do primeiro piloto

- Conta, login, histórico consolidado e acompanhamento público de status pelo cliente.
- Cancelamento ou reagendamento automático pelo cliente.
- Verificação automática do telefone, e-mail de reserva, bot e API de WhatsApp.
- Pagamento do atendimento, antecipação com desconto, Pix integrado e cupons.
- Cobrança automática da assinatura, cadastro público de lavações e plano gratuito permanente.
- Múltiplas unidades, preço por porte do veículo, múltiplos serviços por reserva,
  recursos especializados, atribuição obrigatória de funcionário, fila por etapas.
- Financeiro, fiscal, comissões, fidelidade, aplicativo móvel e relatórios avançados.

## Proposta técnica aprovada

### Aplicação e dados

Preservar Node.js 24, TypeScript estrito, NestJS 12, REST, PostgreSQL 18,
Prisma 7, npm, Jest e Supertest previstos no ADR 0001. Continuar como monólito
modular. Não há implementação de domínio que justifique uma reescrita agora.

Propor React com Vite para a interface responsiva, servida como arquivos
estáticos pelo Nest na mesma origem da API. Next.js estava planejado para o
frontend, mas ainda não foi instalado. Esta proposta evita acrescentar um
servidor de renderização para páginas cujo fluxo cabe na interface estática.
Aceita menor investimento inicial em renderização para mecanismos de busca;
reavaliar se aquisição orgânica exigir páginas renderizadas no servidor.
O Nest documenta esse tipo de entrega em
[Serve Static](https://docs.nestjs.com/recipes/serve-static).

Módulos de negócio previstos: identidade e acesso, configuração da lavação,
catálogo e agenda. O painel consulta os dados desses módulos. Preservar o
carWashId já usado no catálogo como identificação da fronteira de dados.
Não criar serviço separado de cobrança ou plataforma de automação no piloto.

Cliente e veículo pertencem à lavação. Nome, telefone ou placa não autorizam
consulta de cadastros anteriores e não provocam associação entre tenants.
Não reaproveitar um cadastro privado com base apenas em dados não verificados
enviados pelo formulário público.

O banco deve reforçar a ausência de sobreposição de reservas ativas por box,
além das verificações da aplicação. A implementação deve decidir e testar a
constraint ou estratégia transacional com migrations revisadas. Reenvio da mesma
tentativa de reserva não deve criar duplicatas. Testar também concorrência entre
reserva pública, encaixe, reagendamento e alterações de disponibilidade.

### Acesso da equipe

Proposta: e-mail e senha para as contas da equipe, com sessão no servidor
armazenada no PostgreSQL. O formulário público do cliente continua sem e-mail.
Usar componentes mantidos, hash de senha adequado, HTTPS, cookie protegido,
proteção CSRF, expiração e revogação de sessões; não criar criptografia própria.

Entrada assistida: o operador do Nitivo provisiona a primeira lavação e o acesso
do proprietário. O proprietário convida funcionários e pode revogar o vínculo
deles na própria lavação. Não ganha poder de redefinir a identidade global de
uma pessoa vinculada a outras empresas.

Convites usam links privados de uso único para cadastro ou aceitação do vínculo,
com prazo de validade. A equipe responsável compartilha o link por canal
previamente conferido. Recuperação de conta é assistida pelo operador do Nitivo,
após conferir identidade, com link temporário para redefinição; não se pede a
senha da pessoa. Nenhum envio automático de e-mail é necessário nessa proposta.
Esse processo exige disponibilidade humana e procedimento documentado.

Requisitos técnicos e fontes estão em
[infraestrutura e acesso da equipe](PILOT_INFRASTRUCTURE.md).
Essas escolhas foram aprovadas no planejamento e ainda não estão implementadas.

## Entregas e critérios de aceite

A sequência integra interface, API, dados e testes em cada incremento. O
calendário é uma estimativa de planejamento, não um compromisso independente
do escopo e dos resultados. Não adiar todos os testes para a última semana.

| Janela proposta | Entrega verificável | Critério de aceite |
| --- | --- | --- |
| Semana 1 | Acesso da equipe, primeira lavação e configuração pela interface; banco e migrations; CI. | Proprietário entra, cadastra serviço e box; funcionário tem permissões restritas; testes com duas lavações negam acesso cruzado. Clone limpo consegue executar e verificar o projeto. |
| Semana 2 | Agenda da equipe e primeiro fluxo de reserva pública funcionando de ponta a ponta. | Nome, telefone e placa bastam; capacidade, expediente e políticas são respeitados; reserva aparece confirmada na agenda; conflito simultâneo é impedido pelo banco; comprovante e WhatsApp funcionam. Demonstração com dados fictícios. |
| Semana 3 | Cancelamentos, reagendamentos, estados, configurações completas e painel. | Falha no reagendamento preserva reserva anterior; ação fora do prazo é rastreável; mudanças de catálogo preservam histórico; painel bate com dados de teste; funcionário não acessa indicadores exclusivos. |
| Semana 4 | Implantação, revisão do fluxo em celular, recuperação e preparação operacional do piloto. | Testes de navegador dos fluxos essenciais; recuperação de conta e restauração do banco ensaiadas; monitoramento e procedimento de incidentes prontos; orçamento conferido; critérios de dados reais atendidos. |
| Após entrada da lavação | 14 dias de piloto e avaliação comercial. | Uso acompanhado, problemas registrados e manifestação explícita sobre continuar por R$ 49/mês; cobrança manual se aceitar. |

Primeiro incremento quando a implementação for solicitada: proprietário acessa sua lavação
e cadastra/lista um serviço persistido pela interface; incluir teste com segunda
lavação e autorização no mesmo incremento. Integrar o esqueleto local de
service-catalog, preservando o trabalho já existente.

Se prazo ou orçamento estourarem, reduzir apresentação visual ou adiar a entrada
do piloto. Não considerar concluída uma entrega com falha de isolamento,
concorrência, recuperação ou proteção dos dados.

## Matriz mínima de validação

- Unitários: preço e duração válidos, transições de estado e cálculo dos indicadores.
- Integração com PostgreSQL real: isolamento, constraints, reservas simultâneas,
  reagendamento atômico, migrations e alterações de configurações.
- HTTP: permissões de cada papel, acesso público limitado, validação de entrada,
  limites de tentativas, sessões e proteção de operações autenticadas.
- Navegador: autoagendamento no celular, comprovante sem enviar WhatsApp,
  operação da agenda, cancelamento/reagendamento e acesso restrito do funcionário.
- Operação: implantação reproduzível, revogação e recuperação de acesso, backup
  restaurado e reconciliação da agenda após restauração.

Não disparar WhatsApp ou qualquer mensagem real nos testes. Validar o destino
e o conteúdo mínimo do link com dados fictícios.

## Implantação e teto de custo

Proposta preferida: um serviço pago Render para API e interface, mais PostgreSQL
pago, inicialmente usando o endereço HTTPS fornecido pelo serviço.
Base publicada: US$ 13/mês; planejar US$ 13,30 por cautela com armazenamento,
antes de conversão, excedentes e restauração. Fontes e condições em
[PILOT_INFRASTRUCTURE.md](PILOT_INFRASTRUCTURE.md).

Não há cotação atual assumida. Verificar estimativa do provedor e custo efetivo
em reais antes de contratar. A fórmula e os limites não são garantia de fatura
fixa de R$ 100. Não foram contratados serviços, adquiridos domínios ou publicados
ambientes nesta tarefa.

Desenvolvimento e testes locais; demonstração com dados fictícios. Antes de
migrar o ambiente remoto para o piloto, remover os dados de demonstração,
configurar acesso real e verificar os critérios operacionais. Não usar o banco
do piloto como ambiente de desenvolvimento.

## Preparação comercial e suporte

O proprietário do Nitivo conduz a descoberta digital em paralelo à construção.
Buscar cinco conversas, registrar o funcionamento atual e selecionar uma
lavação que aceite o modelo de horário e box e acompanhe o teste.

Perguntas de descoberta: como chegam os pedidos; como evitam conflitos; como
definem duração; quem atenderá pedidos de alteração; qual problema ocorreu
recentemente; se testariam e se continuariam por R$ 49/mês caso resolvesse o problema.

Rascunho de abordagem para o proprietário adaptar e enviar:

> Olá! Estou desenvolvendo uma ferramenta para clientes reservarem horários sem
> depender de uma conversa no WhatsApp. Quero entender como vocês organizam isso
> hoje. Você teria dez minutos para contar como funciona a agenda e o que mais
> dá trabalho? Estou preparando a primeira versão.

Automação proposta: materiais e roteiro, planilha simples de contatos e tarefas,
resumos sem dados pessoais desnecessários, documentação de dúvidas frequentes,
CI e implantação reproduzível. Depois das primeiras conversas, automatizar apenas
atividades repetidas observadas. Mensagens, vendas e suporte iniciais são
conduzidos pelo proprietário; não há envio externo autorizado ao agente.

Proposta de avaliação ao final dos 14 dias: acompanhar dias de uso, quantidade
de reservas feitas pelo cliente e pela equipe, dificuldades, faltas e pedidos
de alteração. Evidência comercial é aceitar continuar pelo preço combinado;
registrar o primeiro pagamento separadamente. Elogio ou interesse em teste
gratuito não substituem essa evidência.

Cobrança manual não integra o produto: registrar fora da aplicação período,
valor e situação da mensalidade e enviar lembrete individual quando necessário.
Inadimplência ou fim do teste exigem contato antes de alterar acesso, sem apagar
dados nem abandonar reservas futuras. Confirmar condições comerciais antes do
piloto, com os documentos previstos para essa fase.

## Prontidão para dados reais

Cumprir os critérios de [privacidade](privacy/README.md): inventário e finalidades,
retenção e descarte, canal para titulares, fornecedores e documentos aplicáveis,
revisão técnica, operacional e jurídica. Registrar o fluxo de dados enviado
voluntariamente pelo cliente ao WhatsApp da lavação.

Também exigir restauração testada, alertas de indisponibilidade e erros sem
dados pessoais desnecessários, procedimento de suporte e resposta a incidentes.
O formulário público deve ter limites de tentativas e proteção contra duplicatas.
Telefone informado não é telefone verificado. A equipe confere pedidos antes de
alterar reservas, e o piloto acompanha reservas indevidas e contatos inválidos.

O prazo de código não substitui recrutamento nem preparação operacional e
jurídica. Custos externos dessa preparação ainda não estão orçados; obter
condições compatíveis ou adiar o tratamento real, sem declarar conformidade pronta.

## Diagnóstico da base e trabalho preservado

A inspeção encontrou apenas GET /health funcional, controller e serviço de
catálogo vazios e a interface ServiceOffering. Não existem banco, autenticação,
isolamento, agenda, frontend ou implantação implementados. O README descreve
o produto planejado, não funcionalidade já disponível.

Validação realizada durante a inspeção: dois testes unitários e um HTTP passaram;
TypeScript sem emissão passou; lint passou com aviso de importação não utilizada
no service-catalog. Isso não valida domínio nem prontidão comercial.

Alterações anteriores em app.module.ts, app.controller.spec.ts, service-catalog
e skills foram preservadas. Esta tarefa alterou documentação; não implementou,
fez commit, push ou implantação.

## Fechamento da entrevista

As respostas Q1–Q18 definiram o produto. Na Q19, o proprietário confirmou o
conjunto: proposta técnica, acesso assistido da equipe, detalhes operacionais,
calendário estimado e composição de custo. A entrevista e o planejamento estão
concluídos. Essa aprovação não transforma a estimativa em garantia de prazo ou
fatura, nem substitui os critérios de entrada em operação.

Pendências externas para execução: recrutar a lavação, conferir custo real antes
de provisionar e preparar operação e privacidade. Elas têm responsáveis e
critérios no plano, e não exigem inventar respostas dos futuros compradores.

O proprietário pediu expressamente para não implementar nada agora. A aceitação
está registrada no marco atual; a implementação depende de nova solicitação.
