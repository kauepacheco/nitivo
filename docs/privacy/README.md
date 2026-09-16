# Privacidade e proteção de dados

Esta pasta concentrará os artefatos de privacidade necessários à evolução do Nitivo. A documentação técnica auxilia a conformidade, mas não substitui revisão jurídica e operacional antes do piloto.

## Durante desenvolvimento e testes

- utilizar exclusivamente dados fictícios;
- impedir segredos e dados pessoais em commits e logs;
- exercitar isolamento entre tenants e controle de acesso;
- manter a coleta prevista no MVP no mínimo necessário.

## Antes da demonstração controlada

- confirmar que cadastro público real permanece desabilitado ou controlado;
- revisar telemetria, logs e serviços externos;
- separar configurações e bancos dos ambientes;
- documentar procedimentos de backup e acesso administrativo.

## Antes do piloto

Criar e revisar, no mínimo:

- inventário de dados pessoais e respectivos fluxos;
- finalidades e hipóteses legais aplicáveis;
- política de retenção e descarte;
- processo de consulta, correção, exportação e eliminação quando aplicável;
- canal para solicitações dos titulares;
- avaliação de operadores e fornecedores;
- política de privacidade e documentos contratuais necessários;
- procedimento de resposta a incidentes;
- registro da revisão jurídica e operacional.

Nenhum dado pessoal real deve ser introduzido apenas porque uma funcionalidade técnica ficou pronta.

## Recorte de dados definido para o primeiro piloto

O planejamento atual limita o formulário de autoagendamento a nome, telefone e
placa. As finalidades previstas são identificar o cliente no atendimento,
permitir contato operacional e identificar o veículo, respectivamente. Esse
recorte ainda deve integrar o inventário e a revisão anteriores ao piloto.

O cliente não precisa de conta nem informa e-mail. O telefone digitado não tem
posse verificada automaticamente; não autoriza consulta de histórico ou acesso
a outros cadastros. Solicitações de cancelamento e reagendamento chegam pelo
WhatsApp e são conferidas e executadas pela equipe autenticada no Nitivo.

O botão de contato abre o WhatsApp da lavação com texto preenchido, sujeito a
envio pelo próprio cliente. Delimitar os dados incluídos nesse texto e registrar
esse fluxo no inventário; não incluir senha, token de acesso ou dados de outros
clientes. A coleta e os canais de acesso da equipe são tratados separadamente
do formulário do cliente.

## Recuperação de acesso da equipe

A recuperação é iniciada somente pelo operador depois de conferir a identidade
em um canal previamente conhecido. Dados do autoagendamento, conhecimento de uma
reserva ou um novo contato apresentado pela pessoa não comprovam identidade. O
link é entregue privadamente, não é enviado pelo sistema e não deve aparecer em
logs, issues ou documentos permanentes.

Se o canal conhecido foi perdido, a emissão deve ser interrompida. A identidade e
o novo canal precisam ser revalidados com o responsável da lavação usando um
contato já registrado; se a solicitação vier do próprio responsável, a conferência
usa os registros da entrada assistida e contato direto. Sem evidência suficiente,
o acesso permanece bloqueado e o operador encaminha o caso ao suporte do Nitivo.

## Reserva pública e contato voluntário implementados (issues #7 e #8)

Nome, telefone informado e placa são coletados para organizar o atendimento e
permitir contato operacional da lavação. Não há verificação automática do telefone
nem reaproveitamento de cadastros privados por esses dados. A equipe com vínculo
ativo no tenant acessa esses dados na agenda; o comprovante público contém apenas
referência e informações do serviço/horário, sem dados de outros clientes.

A tentativa aleatória e seu conteúdo ficam em memória no navegador para reenvio
em até 15 minutos; o banco conserva hashes para impedir duplicação, sem guardar a
chave bruta. Não existe busca pública de reservas. Respostas da reserva e agenda
não devem ser armazenadas em cache. Erros de persistência da reserva são traduzidos
para uma resposta genérica, evitando argumentos pessoais do ORM nos logs HTTP.

O limite de tentativas usa hash do IP e janela de 15 minutos; entradas dessa
finalidade com mais de 24 horas são descartadas oportunisticamente. Retenção dos
cadastros e reservas, atendimento a titulares e revisão jurídica/operacional
continuam pendentes dos tickets próprios antes de dados reais.

O link de WhatsApp usa somente o telefone operacional da lavação e um resumo com
nome da lavação, serviço, data, horário e referência do comprovante. Não inclui
nome, telefone ou placa do cliente, credenciais ou dados de terceiros. O Nitivo
não envia nem lê a mensagem e não trata a abertura da conversa como comprovação
de envio, entrega, leitura ou posse do telefone informado. A reserva permanece
confirmada até uma alteração ser registrada pela equipe.

## Correção operacional implementada (issue #10)

Proprietários e funcionários com vínculo ativo podem corrigir pela agenda apenas
nome, telefone e placa. A operação exige sessão, autorização no tenant e CSRF,
atualiza cliente e veículo na mesma transação e não aceita identificadores de
cadastros no corpo, evitando reassociação entre lavações. O formulário público
continua sem consulta ou edição desses dados.

Falhas de persistência retornam mensagem genérica para que argumentos pessoais
do ORM não cheguem ao logger HTTP. A resposta da correção contém somente nome,
telefone e placa; a interface descarta respostas atrasadas depois de uma troca
de lavação. Retenção e exercício de direitos continuam pendentes das issues
específicas antes do uso de dados reais.

## Encaixe da equipe implementado (issue #11)

O encaixe coleta o mesmo recorte mínimo de nome, telefone e placa necessário ao
atendimento. A operação exige sessão, vínculo ativo no tenant e CSRF; não cria
uma interface pública de busca ou reaproveitamento de clientes. Cliente, veículo
e agendamento são persistidos atomicamente e falhas do ORM recebem resposta
genérica, sem encaminhar os dados informados ao logger HTTP.

O agendamento registra origem `TEAM` e o vínculo autenticado que o criou para
rastreabilidade interna. Uma chave estrangeira composta impede atribuir autoria
de outra lavação. A agenda expõe essa autoria somente à equipe autorizada do
tenant. Os testes usam identidades e dados fictícios; retenção e
exercício de direitos permanecem pendentes das issues específicas antes do uso
de dados reais.

## Cancelamento assistido implementado (issue #13)

A equipe autenticada e vinculada à lavação confere a solicitação recebida fora
do Nitivo e registra apenas o instante informado do pedido, quando aplicável,
e um motivo opcional para exceções operacionais. A conversa do WhatsApp não é
copiada nem lida pelo sistema. O histórico também registra separadamente a
autoria e o instante em que a equipe efetivou o cancelamento. Esses dados ficam
restritos à agenda do tenant; não criam consulta pública da reserva nem são
encaminhados aos logs. Retenção e exercício de direitos continuam pendentes
antes do uso de dados reais.

## Reagendamento assistido implementado (issue #14)

A equipe autenticada e vinculada registra somente o instante informado do pedido
e a autoria e o instante em que efetiva o reagendamento. A conversa do WhatsApp
não é copiada nem lida. O histórico da reserva preserva nome, preço e duração
do serviço, e o histórico do reagendamento conserva o box e o período anterior
para rastreabilidade interna. Esses dados permanecem restritos à agenda do
tenant; não geram consulta pública nem são enviados aos logs. Retenção e
exercício de direitos continuam pendentes antes do uso de dados reais.

## Indicadores operacionais implementados (issue #16)

Somente o proprietário com vínculo ativo consulta os indicadores da própria
lavação; funcionários, visitantes e integrantes de outro tenant não acessam a
operação. A resposta agrega quantidades e o valor histórico em centavos dos
serviços concluídos por período, sem retornar nome, telefone, placa ou outros
dados pessoais dos clientes. O endpoint usa `Cache-Control: no-store`, filtra o
tenant no servidor e os testes utilizam somente fixtures fictícias.
