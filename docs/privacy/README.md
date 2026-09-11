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

## Reserva pública implementada (ticket 6)

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
