# Contexto do domínio

Este documento define o vocabulário do Nitivo. Ele descreve conceitos do negócio, não decisões de implementação.

## Glossário

### Lavação

Empresa de lavação ou estética automotiva que utiliza o Nitivo. No modelo multiempresa, cada lavação corresponde a um tenant isolado.

### Tenant

Fronteira de isolamento dos dados e das operações de uma lavação. Nenhuma pessoa obtém acesso aos dados de um tenant apenas por conhecer seus identificadores.

### Pessoa usuária

Pessoa que possui uma única conta no Nitivo. A mesma pessoa pode se relacionar com mais de uma lavação e exercer papéis diferentes em cada uma.

### Vínculo

Relação entre uma pessoa usuária e uma lavação. O vínculo determina o papel exercido naquele tenant: `OWNER`, `EMPLOYEE` ou `CUSTOMER`.

### Proprietário (`OWNER`)

Pessoa responsável por administrar a lavação, seus usuários, recursos, serviços e regras operacionais.

### Funcionário (`EMPLOYEE`)

Pessoa vinculada à equipe da lavação e autorizada a acompanhar a agenda e executar operações de atendimento permitidas no MVP.

### Cliente (`CUSTOMER`)

Pessoa que administra seus veículos e solicita atendimentos em uma lavação.

### Serviço

Oferta cadastrada pela lavação, definida no MVP por nome, preço em centavos, duração em minutos e situação ativa ou inativa.

### Box

Recurso físico no qual um veículo é atendido. Um box não pode receber agendamentos sobrepostos e, no primeiro MVP, pode executar qualquer serviço.

### Agendamento

Reserva de atendimento que relaciona cliente, veículo, serviço, horário e um único box. O agendamento preserva os dados históricos relevantes do serviço vigentes no momento da reserva.

### Encaixe

Agendamento criado pela equipe da lavação. Está sujeito às mesmas regras de disponibilidade e conflito aplicadas ao agendamento criado pelo cliente.

### Disponibilidade

Resultado da combinação entre funcionamento, bloqueios, boxes ativos, duração do serviço, regras configuradas e agendamentos existentes.

### Bloqueio

Período em que um box específico ou toda a operação não pode receber novos agendamentos.

### Atendimento

Execução operacional de um agendamento confirmado, iniciada pela equipe e encerrada como concluída. Um cliente ausente pode ser registrado como `NO_SHOW` sem que o atendimento seja iniciado.

### Estado final

Estado do qual o agendamento não retorna no fluxo do primeiro MVP: `COMPLETED`, `CANCELED` ou `NO_SHOW`.
