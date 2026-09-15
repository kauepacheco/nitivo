# Nitivo

Nitivo é uma ferramenta de gerenciamento para lava-jatos e estéticas automotivas.

A solução permite que donos de lava-jatos gerenciem seus negócios de forma fácil e rápida. A plataforma também permite que os clientes reservem horários.

O objetivo atual é construir e validar um SaaS comercial. O aprendizado de
programação deixou de ser uma condição para o avanço do projeto.

Os nove primeiros incrementos do piloto já entregam acesso assistido do
proprietário, cadastro persistido de serviços, gestão dos vínculos da equipe e
recuperação assistida de acesso, além da página pública com serviços ativos e
contato operacional da lavação. Também incluem configuração de capacidade e
expediente, consulta de horários, confirmação de reserva pública com comprovante,
agenda diária da equipe e abertura do resumo no WhatsApp da lavação. O
proprietário também pode editar e desativar serviços sem alterar os dados
históricos preservados nas reservas existentes. Proprietários e funcionários
podem corrigir pela agenda o nome, o telefone e a placa usados na operação.
As funcionalidades abaixo descrevem o produto
planejado; o estado de implementação está no
[marco atual](docs/CURRENT_MILESTONE.md).

## Usuários do sistema

- Donos de lava-jatos
- Funcionários de lava-jatos
- Clientes

## Funcionalidades do MVP

O recorte do primeiro piloto está consolidado no
[planejamento do SaaS](docs/SAAS_PLAN.md), aprovado pelo proprietário com sua
proposta técnica e cronograma estimado. Os tickets são implementados em sequência;
as issues #2–#10 estão implementadas localmente e as seguintes aguardam novas
solicitações. O [índice das issues](docs/specs/tickets-primeiro-piloto-saas.md)
distingue implementação, publicação do código e integração à `main`.
As decisões confirmadas para o produto
incluem autoagendamento sem conta obrigatória, reserva por box e painel do
proprietário, sem pagamento online. Os demais itens abaixo descrevem o escopo
mais amplo previsto e ainda serão delimitados para o piloto.

### Para o cliente

- Visualizar a página e os serviços da lavação
- Reservar sem precisar criar uma conta no primeiro piloto
- Informar nome, telefone e placa do veículo
- Consultar a disponibilidade de horários
- Agendar atendimentos
- Abrir conversa no WhatsApp da lavação com o resumo da reserva
- Solicitar cancelamento e reagendamento pelo WhatsApp, conforme as regras da lavação; a equipe efetiva a alteração no Nitivo
- Acompanhar o status do atendimento (fora do recorte já confirmado do piloto)
- Consultar o histórico de atendimentos (fora do recorte já confirmado do piloto)

Conta de cliente e acesso a histórico consolidado serão reavaliados após o
primeiro piloto. Não há consulta pública de reservas por telefone, placa ou
identificador. O telefone informado não é verificado automaticamente; abrir o
WhatsApp não comprova envio de mensagem nem posse desse telefone.

A reserva permanece confirmada mesmo sem mensagem enviada. A equipe acompanha
a agenda no Nitivo e pode usar o telefone informado para contato operacional.
No cancelamento solicitado dentro do prazo, vale o horário de envio conferido
pela equipe, mesmo se a mensagem for lida depois. A vaga só é liberada após
registrar o cancelamento no Nitivo. Reagendamento malsucedido preserva a reserva
original.

### Para o proprietário e seus funcionários

- Visualizar a agenda diária
- Cadastrar encaixes
- Iniciar, concluir, cancelar, marcar faltas e reagendar atendimentos
- Administrar clientes e veículos

### Exclusivamente para o proprietário

- Configurar as regras da lavação
- Configurar horários, exceções e bloqueios
- Administrar boxes
- Cadastrar e desativar serviços
- Convidar e desativar funcionários
- Visualizar no painel inicial:
  - Agenda do dia e próximos atendimentos
  - Atendimentos concluídos
  - Cancelamentos
  - No-shows
  - Soma dos valores dos serviços concluídos

Essa soma não representa dinheiro recebido. Serviços mais realizados e ticket
médio permanecem no escopo mais amplo, fora do painel inicial confirmado.

## Fora do primeiro MVP

- Pagamento online e Pix, incluindo antecipação com desconto (reavaliar após o primeiro piloto)
- Envio automático de SMS ou WhatsApp; o primeiro piloto apenas abre a conversa para o cliente enviar a mensagem
- Múltiplas unidades
- Funcionário obrigatório por agendamento
- Permissões personalizadas
- Pacotes, assinaturas e programas de fidelidade
- Cupons
- Preço variável por tipo de veículo
- Comissões
- Controle financeiro ou fiscal
- Emissão de nota fiscal
- Avaliações
- Relatórios avançados
- Aplicativo móvel
- Cadastro de CPF

## Regras principais de agendamento

- Cada agendamento possui um cliente, um veículo e um serviço.
- Um agendamento ocupa um único box durante toda a duração do atendimento.
- O cliente escolhe o serviço, a data e o horário; o sistema seleciona automaticamente um box disponível.
- Todos os boxes podem receber qualquer serviço no primeiro MVP.
- Cada serviço possui preço em centavos e duração em minutos.
- O nome, o preço e a duração do serviço são registrados no agendamento. Dessa forma, mudanças futuras no catálogo não alteram o histórico.
- Um atendimento não pode começar antes da abertura, terminar depois do fechamento ou ocupar um período bloqueado.
- Não existe intervalo automático entre atendimentos no primeiro MVP. Se necessário, esse tempo deve fazer parte da duração configurada para o serviço.
- Agendamentos no passado ou em conflito com outro atendimento no mesmo box não são permitidos.
- Encaixes cadastrados pela equipe obedecem às mesmas regras de disponibilidade dos agendamentos feitos pelos clientes.
- A equipe pode registrar encaixe para início imediato, respeitando capacidade, expediente e bloqueios; a antecedência mínima para reservar aplica-se ao autoagendamento.
- Pedidos de cancelamento e reagendamento feitos pelo cliente via WhatsApp seguem a antecedência mínima configurada pela lavação. A equipe aplica essa política e efetiva a alteração; o sistema não lê as mensagens.
- Um reagendamento passa por uma nova verificação de disponibilidade.
- Proprietários e funcionários podem cancelar atendimentos fora do prazo definido para clientes e informar um motivo opcional.
- Novos agendamentos são confirmados automaticamente no primeiro piloto, sem aprovação do proprietário.

O fluxo de estados do primeiro piloto é:

```text
CONFIRMED -> IN_PROGRESS -> COMPLETED
CONFIRMED -> CANCELED
CONFIRMED -> NO_SHOW
```

Somente proprietários e funcionários podem iniciar, concluir ou marcar um atendimento como `NO_SHOW`. Estados finais não retornam para estados anteriores. Cada alteração de estado deve registrar quando ocorreu e quem realizou a ação.

O proprietário configura:

- quantidade de boxes ativos;
- dias e horários de funcionamento;
- intervalo entre possíveis horários de início;
- antecedência mínima para agendar (padrão: uma hora);
- quantidade máxima de dias disponíveis para agendamento futuro (padrão: 30 dias);
- prazo mínimo para solicitar cancelamento ou reagendamento (padrão: duas horas);
- bloqueios de boxes ou de toda a operação;
- feriados, fechamentos e horários especiais.

Alterações nessas configurações não modificam nem cancelam silenciosamente agendamentos existentes.

## Modelo multiempresa

Nitivo é um SaaS multiempresa. Várias lavações utilizam a mesma plataforma, mas cada uma funciona como um tenant isolado. Clientes, funcionários, serviços, boxes, configurações e agendamentos de uma lavação não podem ser acessados por outra.

Uma pessoa com conta possui uma única identidade na plataforma e pode se
relacionar com mais de uma lavação. Clientes podem reservar sem criar uma conta
no primeiro piloto; seu cadastro pertence à lavação e é distinto da conta de
acesso à plataforma. Para pessoas com conta, o modelo de papéis prevê:

- `OWNER`: administra a lavação, suas configurações e seus usuários;
- `EMPLOYEE`: acompanha a agenda e executa as operações permitidas à equipe;
- `CUSTOMER`: papel previsto para acesso de clientes com conta, a reavaliar após o primeiro piloto.

Os papéis possuem permissões fixas no primeiro MVP. Permissões personalizadas ficam fora do escopo inicial.

O isolamento entre tenants é uma garantia obrigatória da plataforma e não pode
ser desativado pelo proprietário. Operações da equipe devem validar identidade,
vínculo e permissão naquele tenant. Clientes sem conta criam reservas na lavação
selecionada, mas não obtêm acesso a cadastros ou reservas existentes. Alterações
solicitadas pelo WhatsApp são executadas pela equipe autenticada e autorizada.
Informações públicas de serviços e disponibilidade não devem expor dados pessoais
de clientes nem informações internas da lavação.

O primeiro MVP permite apenas uma unidade por lavação, mas a modelagem não deve misturar dados de empresas diferentes nem depender apenas de filtros enviados pelo cliente da API.

## Fases do produto

### Construção e validação

- Construção em incrementos completos, com interface, API, persistência e testes.
- Uso exclusivo de dados fictícios.
- PostgreSQL executado em container.
- Descoberta digital com potenciais compradores em paralelo.
- Prioridade para o fluxo de autoagendamento e operação do primeiro piloto.

### Demonstração controlada

- Fluxo completo demonstrável com dados fictícios, localmente ou em ambiente remoto.
- Cadastro público real desabilitado ou controlado.
- Banco e configurações separados do ambiente local.
- Introdução de CI/CD, logs, monitoramento e backups.
- Uso para validar o fluxo com interessados antes da entrada em operação real.

### Piloto

- Uso limitado por uma lavação real, com acompanhamento próximo.
- Proposta de teste gratuito por 14 dias e continuidade por R$ 49/mês, hipótese de preço aceita para validação, com cobrança manual pelo proprietário do Nitivo.
- Autenticação e recuperação de acesso reais para a equipe. No recorte atual, clientes reservam sem conta e o telefone informado não é verificado automaticamente.
- Backups e restauração testados.
- Monitoramento, alertas e procedimento de resposta a incidentes.
- Políticas de privacidade e retenção, canal para titulares e contratos necessários.
- Revisão técnica, operacional e jurídica antes do tratamento de dados reais.

### Produção SaaS

- Expansão progressiva para várias lavações.
- Evolução da cobrança de assinaturas e do suporte a partir do piloto.
- Evolução de disponibilidade, segurança, observabilidade e processos com base no aprendizado do piloto.

O mesmo produto evoluirá entre essas fases. A referência proposta é preparar
o piloto em quatro semanas; seus 14 dias de uso começam após a entrada da
lavação e os critérios de prontidão. O teto operacional inicial é R$ 100/mês
além do Codex; a implantação depende da conferência dos custos em reais.

## Privacidade e LGPD

O projeto adota privacidade por padrão e coleta mínima de dados. Durante
desenvolvimento, testes e demonstração serão utilizados somente dados fictícios.

Compromissos iniciais:

- coletar apenas dados necessários para finalidades definidas;
- não coletar CPF, endereço residencial, RENAVAM ou outros documentos pessoais no primeiro MVP;
- documentar a finalidade de dados como nome, telefone e placa;
- proteger senhas com hash seguro e nunca armazená-las em texto puro;
- impedir acesso não autorizado e vazamento de dados entre tenants;
- evitar dados pessoais, senhas e tokens em logs;
- permitir consulta e correção de dados pessoais;
- planejar mecanismos de exportação, anonimização, bloqueio ou eliminação quando aplicáveis;
- definir uma política de retenção antes do piloto;
- separar comunicações operacionais de comunicações promocionais;
- avaliar fornecedores que processem dados, como serviços de hospedagem, SMS, WhatsApp e pagamentos;
- manter um canal para solicitações dos titulares antes do uso por clientes reais;
- preparar um procedimento de resposta a incidentes de segurança.

A conformidade com a LGPD não será considerada garantida apenas pela implementação técnica. Antes do piloto, o produto e os processos da empresa deverão passar por revisão jurídica e operacional adequada.

## Documentação do projeto

- [Contexto e glossário do domínio](CONTEXT.md)
- [Roadmap](docs/ROADMAP.md)
- [Marco atual](docs/CURRENT_MILESTONE.md)
- [Planejamento do SaaS e decisões do piloto](docs/SAAS_PLAN.md)
- [Especificação do primeiro piloto](docs/specs/primeiro-piloto-saas.md)
- [Issue do primeiro piloto no GitHub](https://github.com/kauepacheco/nitivo/issues/1)
- [Fluxo de trabalho em mais de um computador](docs/WORKFLOW.md)
- [Decisões arquiteturais](docs/adr/README.md)
- [Privacidade e proteção de dados](docs/privacy/README.md)
