# Nitivo

Nitivo é uma ferramenta de gerenciamento para lava-jatos e estéticas automotivas.

A solução permite que donos de lava-jatos gerenciem seus negócios de forma fácil e rápida. A plataforma também permite que os clientes reservem horários.

## Usuários do sistema

- Donos de lava-jatos
- Funcionários de lava-jatos
- Clientes

## Funcionalidades do MVP

### Para o cliente

- Visualizar a página e os serviços da lavação
- Criar uma conta
- Cadastrar veículos
- Consultar a disponibilidade de horários
- Agendar atendimentos
- Cancelar e reagendar atendimentos conforme as regras configuradas
- Acompanhar o status do atendimento
- Consultar o histórico de atendimentos

### Para o proprietário e seus funcionários

- Visualizar a agenda diária
- Cadastrar encaixes
- Confirmar, iniciar, concluir e cancelar atendimentos
- Administrar clientes e veículos
- Configurar horários, exceções e bloqueios
- Administrar boxes
- Cadastrar e desativar serviços
- Convidar e desativar funcionários

### Exclusivamente para o proprietário

- Configurar as regras da lavação
- Visualizar indicadores básicos:
  - Atendimentos concluídos
  - Cancelamentos
  - No-shows
  - Serviços mais realizados
  - Soma dos valores dos serviços concluídos
  - Ticket médio

## Fora do primeiro MVP

- Pagamento online e Pix
- Envio real de SMS ou WhatsApp
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
- Cancelamentos e reagendamentos feitos pelo cliente respeitam a antecedência mínima configurada pela lavação.
- Um reagendamento passa por uma nova verificação de disponibilidade.
- Proprietários e funcionários podem cancelar atendimentos fora do prazo definido para clientes e informar um motivo opcional.
- A lavação decide se novos agendamentos são confirmados automaticamente ou se precisam de confirmação manual.

O fluxo principal de estados de um agendamento é:

```text
PENDING_CONFIRMATION -> CONFIRMED -> IN_PROGRESS -> COMPLETED
PENDING_CONFIRMATION -> CANCELED
CONFIRMED -> CANCELED
CONFIRMED -> NO_SHOW
```

Somente proprietários e funcionários podem iniciar, concluir ou marcar um atendimento como `NO_SHOW`. Estados finais não retornam para estados anteriores. Cada alteração de estado deve registrar quando ocorreu e quem realizou a ação.

O proprietário configura:

- quantidade de boxes ativos;
- dias e horários de funcionamento;
- intervalo entre possíveis horários de início;
- antecedência mínima para agendar;
- quantidade máxima de dias disponíveis para agendamento futuro;
- prazo mínimo para cancelamento ou reagendamento;
- confirmação automática ou manual;
- bloqueios de boxes ou de toda a operação;
- feriados, fechamentos e horários especiais.

Alterações nessas configurações não modificam nem cancelam silenciosamente agendamentos existentes.

## Modelo multiempresa

Nitivo é um SaaS multiempresa. Várias lavações utilizam a mesma plataforma, mas cada uma funciona como um tenant isolado. Clientes, funcionários, serviços, boxes, configurações e agendamentos de uma lavação não podem ser acessados por outra.

Uma pessoa possui uma única conta na plataforma e pode se relacionar com mais de uma lavação. Seu acesso em cada tenant é determinado por um dos seguintes papéis:

- `OWNER`: administra a lavação, suas configurações e seus usuários;
- `EMPLOYEE`: acompanha a agenda e executa as operações permitidas à equipe;
- `CUSTOMER`: administra seus veículos e agendamentos.

Os papéis possuem permissões fixas no primeiro MVP. Permissões personalizadas ficam fora do escopo inicial.

O isolamento entre tenants é uma garantia obrigatória da plataforma e não pode ser desativado pelo proprietário. Toda operação sobre dados de uma lavação deve validar tanto a identidade do usuário quanto seu vínculo e sua permissão naquele tenant.

O primeiro MVP permite apenas uma unidade por lavação, mas a modelagem não deve misturar dados de empresas diferentes nem depender apenas de filtros enviados pelo cliente da API.

## Fases do produto

### Ambiente educacional

- Execução local e aprendizado progressivo dos fundamentos.
- Uso exclusivo de dados fictícios.
- PostgreSQL executado em container.
- Integrações externas, como SMS, substituídas por implementações falsas e testáveis.
- Prioridade para modelagem, APIs, regras de negócio e testes automatizados.

### Demonstração controlada

- Aplicação publicada na internet com dados fictícios.
- Cadastro público real desabilitado ou controlado.
- Banco e configurações separados do ambiente local.
- Introdução de CI/CD, logs, monitoramento e backups.
- Uso para demonstração técnica e portfólio, não para a operação de uma lavação real.

### Piloto

- Uso limitado por uma lavação real, com acompanhamento próximo.
- Autenticação, recuperação de conta e verificação de telefone reais.
- Backups e restauração testados.
- Monitoramento, alertas e procedimento de resposta a incidentes.
- Políticas de privacidade e retenção, canal para titulares e contratos necessários.
- Revisão técnica, operacional e jurídica antes do tratamento de dados reais.

### Produção SaaS

- Expansão progressiva para várias lavações.
- Cobrança de assinaturas e suporte operacional.
- Evolução de disponibilidade, segurança, observabilidade e processos com base no aprendizado do piloto.

O mesmo produto evoluirá entre essas fases. Não serão criadas arquiteturas complexas antecipadamente apenas para simular necessidades de produção.

## Privacidade e LGPD

O projeto adota privacidade por padrão e coleta mínima de dados. Durante a fase educacional e a demonstração serão utilizados somente dados fictícios.

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
