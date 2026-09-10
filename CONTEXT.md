# Contexto do domínio

Este documento define o vocabulário do Nitivo. Ele descreve conceitos do negócio, não decisões de implementação.

## Glossário

### Lavação

Empresa de lavação ou estética automotiva que utiliza o Nitivo. No modelo multiempresa, cada lavação corresponde a um tenant isolado.

### Tenant

Fronteira de isolamento dos dados e das operações de uma lavação. Nenhuma pessoa obtém acesso aos dados de um tenant apenas por conhecer seus identificadores.

### Pessoa usuária

Pessoa que possui uma única conta no Nitivo. A mesma pessoa pode se relacionar com mais de uma lavação; ser cliente de uma lavação não exige possuir essa conta.

### Vínculo

Relação entre uma pessoa usuária e uma lavação que determina seu papel naquele tenant. No primeiro piloto, os vínculos de acesso são de proprietário ou funcionário; clientes reservam sem conta.

### Proprietário (`OWNER`)

Pessoa responsável por administrar a lavação, seus usuários, recursos, serviços e regras operacionais.

### Funcionário (`EMPLOYEE`)

Pessoa vinculada à equipe da lavação e autorizada a acompanhar a agenda e executar operações de atendimento permitidas no MVP.

### Cliente

Pessoa que solicita ou recebe atendimentos em uma lavação, com ou sem conta no Nitivo. Seu cadastro de cliente pertence à lavação e não concede acesso aos dados de outras pessoas ou empresas.

### Papel de cliente (`CUSTOMER`)

Papel de uma pessoa usuária vinculada como cliente a uma lavação. Um cliente sem conta não possui esse vínculo; o uso do papel para contas de clientes será reavaliado após o primeiro piloto.

### Serviço

Oferta cadastrada pela lavação, definida no MVP por nome, preço em centavos, duração em minutos e situação ativa ou inativa.

### Box

Recurso físico no qual um veículo é atendido. Um box não pode receber agendamentos sobrepostos e, no primeiro MVP, pode executar qualquer serviço.

### Agendamento

Reserva de atendimento que relaciona cliente, veículo, serviço, horário e um único box. O agendamento preserva os dados históricos relevantes do serviço vigentes no momento da reserva.

### Encaixe

Agendamento criado pela equipe da lavação, inclusive para início imediato. Respeita capacidade, expediente e bloqueios, com dispensa da antecedência mínima exigida no autoagendamento.

### Autoagendamento

Agendamento feito pelo próprio cliente, que escolhe o serviço e um horário disponível sem precisar que a equipe faça a reserva por ele. A confirmação segue a regra da lavação.

### Solicitação de alteração

Pedido do cliente para cancelar ou reagendar um atendimento, recebido pela equipe da lavação. O pedido é distinto da alteração efetivada na agenda.

### Reagendamento

Troca do horário de uma reserva, sujeita à disponibilidade do novo período. A reserva original é preservada se a troca não puder ser concluída.

### Assinatura do Nitivo

Contratação do uso do Nitivo pela lavação mediante mensalidade. É distinta do pagamento feito pelo cliente por um atendimento.

### Disponibilidade

Resultado da combinação entre funcionamento, bloqueios, boxes ativos, duração do serviço, regras configuradas e agendamentos existentes.

### Bloqueio

Período em que um box específico ou toda a operação não pode receber novos agendamentos.

### Atendimento

Execução operacional de um agendamento confirmado, iniciada pela equipe e encerrada como concluída. Um cliente ausente pode ser registrado como `NO_SHOW` sem que o atendimento seja iniciado.

### Estado final

Estado do qual o agendamento não retorna no fluxo do primeiro MVP: `COMPLETED`, `CANCELED` ou `NO_SHOW`.
