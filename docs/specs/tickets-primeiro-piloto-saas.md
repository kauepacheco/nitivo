# Issues do primeiro piloto

Atualizado em 15 de setembro de 2026. A issue #1 contém a especificação; as
issues #2 a #23 contêm as 22 entregas aprovadas em 9 de setembro de 2026.
O número do GitHub é o identificador principal em documentos, branches e commits.
A numeração ordinal antiga foi aposentada: antigo ticket 1 = issue #2, até
antigo ticket 22 = issue #23. Histórias da especificação mantêm seus próprios IDs.
Nomes de migrations e commits históricos são preservados.

## Estado das entregas

“Publicado” nesta tabela significa código disponível no GitHub, não aplicação
implantada. As especificações de todas as issues já estão publicadas. Critérios
de estado e fluxo de atualização: [issue tracker](../agents/issue-tracker.md).
Consulta remota em 15 de setembro de 2026 confirmou `main` em `847aee2b`, com as
issues #7–#10 integradas e fechadas. O clone não conseguiu atualizar a referência
por falta da chave SSH, mas a `main` local avançou até `e86405b3`, pai do merge
remoto e com a mesma árvore integrada. A issue #11 permanece somente local.

| Issue | Implementado localmente | Código publicado | Integrado à main (local / GitHub) | Issue no GitHub | Evidência local |
| --- | --- | --- | --- | --- | --- |
| [#2](https://github.com/kauepacheco/nitivo/issues/2) | Sim | Sim | Sim / Sim | Fechada | `e9c3fb0e`, `9cdb250c` |
| [#3](https://github.com/kauepacheco/nitivo/issues/3) | Sim | Sim | Sim / Sim | Fechada | `1917d5e0`, `de29ed38` |
| [#4](https://github.com/kauepacheco/nitivo/issues/4) | Sim | Sim | Sim / Sim | Fechada | `a4e2fa57`, `62690284` |
| [#5](https://github.com/kauepacheco/nitivo/issues/5) | Sim | Sim | Sim / Sim | Fechada | `abb83926`, `c1fb39bc` |
| [#6](https://github.com/kauepacheco/nitivo/issues/6) | Sim | Sim | Sim / Sim | Fechada | `58bab24f` |
| [#7](https://github.com/kauepacheco/nitivo/issues/7) | Sim | Sim | Sim / Sim | Fechada | `a94a991a` |
| [#8](https://github.com/kauepacheco/nitivo/issues/8) | Sim | Sim | Sim / Sim | Fechada | `585c88d1` |
| [#9](https://github.com/kauepacheco/nitivo/issues/9) | Sim | Sim | Sim / Sim | Fechada | `219b0074`, `f41726d6` |
| [#10](https://github.com/kauepacheco/nitivo/issues/10) | Sim | Sim | Sim / Sim | Fechada | `efd44a54`, `e86405b3` |
| [#11](https://github.com/kauepacheco/nitivo/issues/11) | Sim | Não | Não / Não | Aberta; aguarda publicação | branch `feat/11-encaixe` |
| [#12](https://github.com/kauepacheco/nitivo/issues/12) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#13](https://github.com/kauepacheco/nitivo/issues/13) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#14](https://github.com/kauepacheco/nitivo/issues/14) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#15](https://github.com/kauepacheco/nitivo/issues/15) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#16](https://github.com/kauepacheco/nitivo/issues/16) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#17](https://github.com/kauepacheco/nitivo/issues/17) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#18](https://github.com/kauepacheco/nitivo/issues/18) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#19](https://github.com/kauepacheco/nitivo/issues/19) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#20](https://github.com/kauepacheco/nitivo/issues/20) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#21](https://github.com/kauepacheco/nitivo/issues/21) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#22](https://github.com/kauepacheco/nitivo/issues/22) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |
| [#23](https://github.com/kauepacheco/nitivo/issues/23) | Não | Não | Não / Não | Aberta; aguarda solicitação | — |

Os critérios marcados abaixo refletem as entregas verificadas, sem substituir
publicação do código, integração remota ou prontidão para uso de dados reais.

Cada ticket de software entrega interface, API, persistência, documentação OpenAPI e testes proporcionais ao comportamento. Isolamento, autorização, privacidade e concorrência pertinente fazem parte do aceite de cada entrega. Usar dados fictícios, HTTP com PostgreSQL real e navegador nas jornadas essenciais. Manter React/Vite servido pelo Nest e a stack aceita.

As dependências representam entregas necessárias; dados fictícios permitem verificar papéis sem esperar o fluxo administrativo de convites. CI pode avançar após o primeiro incremento, e os testes continuam obrigatórios desde a issue #2. As issues #19 e #21 podem começar sem esperar código. Atividades comerciais e revisões profissionais dependem das pessoas responsáveis; não presumir execução autônoma por um agente. Publicação realizada com ready-for-agent conforme a skill, sem substituir esses responsáveis nem autorizar desenvolvimento.

## Issue #2 — Acessar a lavação e cadastrar o primeiro serviço

**GitHub:** [#2](https://github.com/kauepacheco/nitivo/issues/2).

**Bloqueado por:** nenhum.

**Entrega:** Operador provisiona uma lavação e o proprietário define sua senha por link privado, entra, cadastra e lista serviços persistidos.

**Histórias da especificação:** 41, 44, 62, 66, 69.

- [x] Sessões no PostgreSQL, hash de senha, CSRF, expiração, logout e limites de tentativas; link temporário de uso único sem segredo em logs.
- [x] Preço inteiro em centavos e duração válidos; duas lavações provam isolamento e papéis. Interface React/Vite, migrations e jornada de navegador executáveis a partir de clone limpo.

## Issue #3 — Convidar funcionários e revogar vínculos

**GitHub:** [#3](https://github.com/kauepacheco/nitivo/issues/3).

**Bloqueado por:** [issue #2](https://github.com/kauepacheco/nitivo/issues/2).

**Entrega:** Proprietário convida funcionários, que aceitam o vínculo e acessam apenas as áreas permitidas; a revogação vale na próxima operação.

**Histórias da especificação:** 22, 23, 55, 56, 57, 67.

- [x] Convite de uso único e com validade; aceitar com conta existente exige sua autenticação e não redefine senha.
- [x] Pessoa com vínculos em duas lavações mantém identidade e acesso à outra; catálogo nega mutações por funcionário. Configurações e agenda são cobertas pelas issues #6 e #7, respectivamente.

## Issue #4 — Recuperar acesso com assistência

**GitHub:** [#4](https://github.com/kauepacheco/nitivo/issues/4).

**Bloqueado por:** [issue #2](https://github.com/kauepacheco/nitivo/issues/2).

**Entrega:** Operador confere a identidade por canal conhecido e entrega link temporário para a pessoa redefinir sua própria senha.

**Histórias da especificação:** 42, 67.

- [x] Token com hash armazenado, finalidade delimitada, expiração, consumo atômico e limite de tentativas; sessões antigas revogadas.
- [x] Ensaiar link inválido, expirado e reutilizado; documentar entrega privada e perda do canal conhecido, sem envio automático.

## Issue #5 — Consultar a página pública e os serviços

**GitHub:** [#5](https://github.com/kauepacheco/nitivo/issues/5).

**Bloqueado por:** [issue #2](https://github.com/kauepacheco/nitivo/issues/2).

**Entrega:** Cliente abre o link de uma lavação no celular e consulta somente seus serviços ativos, preços e durações.

**Histórias da especificação:** 1, 2, 21.

- [x] Proprietário configura as informações públicas necessárias, incluindo contato operacional; API pública não expõe dados internos.
- [x] Separação entre lavações e serviços inativos coberta por HTTP; leitura responsiva verificada no navegador.

## Issue #6 — Configurar capacidade e consultar horários disponíveis

**GitHub:** [#6](https://github.com/kauepacheco/nitivo/issues/6).

**Bloqueado por:** [issue #5](https://github.com/kauepacheco/nitivo/issues/5).

**Entrega:** Proprietário cadastra boxes e expediente semanal, ajusta políticas e o cliente consulta horários calculados para um serviço.

**Histórias da especificação:** 3, 4, 46, 47, 51, 52, 53, 54.

- [x] Padrões: antecedência de uma hora, horizonte de 30 dias, prazo de alteração de duas horas e intervalo de início de 30 minutos; fuso America/Sao_Paulo.
- [x] Testar duração, abertura, fechamento exato, passado e capacidade ocupada com agendamentos fictícios persistidos. Mudanças mostram conflitos e preservam reservas; exceções e bloqueios ficam na issue #15.

## Issue #7 — Confirmar reserva pública e mostrá-la na agenda

**GitHub:** [#7](https://github.com/kauepacheco/nitivo/issues/7).

**Bloqueado por:** [issue #6](https://github.com/kauepacheco/nitivo/issues/6).

**Entrega:** Cliente reserva com nome, telefone e placa; recebe comprovante e a equipe encontra a reserva confirmada na agenda diária e nos próximos atendimentos.

**Histórias da especificação:** 5, 6, 7, 8, 9, 10, 12, 18, 19, 20, 21, 24, 25, 26, 43, 58, 68, 69.

- [x] Selecionar box e preservar nome, preço e duração históricos; concorrência no PostgreSQL impede exceder capacidade, inclusive contra mudanças de configuração. Reenvio não duplica e falhas não deixam gravações parciais.
- [x] Autorização OWNER/EMPLOYEE e isolamento na agenda; formulário não reutiliza cadastro privado por telefone/placa, nem permite consulta pública posterior. Limites de tentativas e jornada no celular com comprovante sem WhatsApp.

## Issue #8 — Abrir WhatsApp com resumo e política de alterações

**GitHub:** [#8](https://github.com/kauepacheco/nitivo/issues/8).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Comprovante oferece conversa no número da lavação com resumo mínimo e orienta pedidos de cancelamento e reagendamento.

**Histórias da especificação:** 11, 12, 13, 14, 15.

- [x] Reserva permanece confirmada sem abrir ou enviar mensagem; referência não concede acesso e telefone não é considerado verificado.
- [x] Exibir prazo configurado e responsabilidade da equipe; testar destino e texto com dados fictícios, sem disparar mensagens.

## Issue #9 — Editar e desativar serviços preservando reservas

**GitHub:** [#9](https://github.com/kauepacheco/nitivo/issues/9).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Proprietário altera o catálogo; futuras reservas usam os novos dados e reservas existentes mantêm o combinado.

**Histórias da especificação:** 18, 45.

- [x] Atualização de nome, preço e duração não reescreve histórico; desativação impede novas reservas do serviço.
- [x] Verificar concorrência com criação de reserva, validação monetária e proibição de alteração por funcionário ou outro tenant.

## Issue #10 — Corrigir cliente e veículo pela agenda

**GitHub:** [#10](https://github.com/kauepacheco/nitivo/issues/10).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Equipe consulta e corrige nome, telefone e placa necessários ao atendimento dentro da lavação.

**Histórias da especificação:** 26, 29.

- [x] Autorização e integridade das relações impedem consulta, edição ou associação entre tenants; formulário público não ganha acesso a esses cadastros.
- [x] Correção persiste e aparece na operação; coleta permanece mínima e dados não são registrados em logs desnecessariamente.

## Issue #11 — Registrar encaixe para início imediato

**GitHub:** [#11](https://github.com/kauepacheco/nitivo/issues/11).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Equipe registra um encaixe na agenda para agora ou outro horário disponível.

**Histórias da especificação:** 27, 28, 43.

- [x] Dispensar apenas antecedência do autoagendamento; respeitar expediente, capacidade e controles de disponibilidade existentes.
- [x] Testar disputa entre encaixe e reserva pública com PostgreSQL real; persistir histórico, autoria e origem da equipe.

## Issue #12 — Iniciar, concluir e marcar falta

**GitHub:** [#12](https://github.com/kauepacheco/nitivo/issues/12).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Equipe muda CONFIRMED para IN_PROGRESS ou NO_SHOW e IN_PROGRESS para COMPLETED, vendo o resultado na agenda.

**Histórias da especificação:** 30, 31, 32, 38, 39, 40, 43.

- [ ] Transições inválidas e retorno de estado final são recusados; mudança registra autoria e momento de forma consistente.
- [ ] Atrasos e duração real não deslocam reservas futuras; testar disputas de atualização, papéis e isolamento.

## Issue #13 — Cancelar após conferência da solicitação

**GitHub:** [#13](https://github.com/kauepacheco/nitivo/issues/13).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Equipe cancela uma reserva confirmada e libera o box apenas quando a ação é registrada.

**Histórias da especificação:** 16, 33, 34, 35, 38, 39, 43.

- [ ] Separar horário informado do pedido e horário da ação; pedido enviado no prazo continua elegível quando atendido depois. Exceção da equipe admite motivo opcional.
- [ ] Guardar autoria; estado final não reabre; cancelamento e liberação são atômicos, incluindo concorrência com outras ações sobre a reserva.

## Issue #14 — Reagendar sem perder a reserva original

**GitHub:** [#14](https://github.com/kauepacheco/nitivo/issues/14).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7).

**Entrega:** Equipe troca horário e box após conferir pedido e disponibilidade; falha mantém integralmente a reserva anterior.

**Histórias da especificação:** 17, 34, 36, 37, 43.

- [ ] Preservar serviço, nome, preço e duração históricos; registrar solicitação separada da ação e autoria. Troca de serviço exige cancelar e reservar novamente.
- [ ] Testar falha e concorrência com outra reserva ou reagendamento; sem ocupação duplicada ou liberação parcial. Exceções operacionais adicionais entram na issue #15.

## Issue #15 — Aplicar exceções, bloqueios e desativação de boxes

**GitHub:** [#15](https://github.com/kauepacheco/nitivo/issues/15).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7), [issue #11](https://github.com/kauepacheco/nitivo/issues/11), [issue #14](https://github.com/kauepacheco/nitivo/issues/14).

**Entrega:** Proprietário define feriados, horários especiais, bloqueios individuais ou gerais e desativa boxes com prévia visualização dos conflitos.

**Histórias da especificação:** 48, 49, 50.

- [ ] Consulta pública, confirmação, encaixe e reagendamento respeitam a mudança; nenhum compromisso existente é movido ou cancelado silenciosamente.
- [ ] Testar concorrência entre alterações operacionais e todos os caminhos de reserva, além dos conflitos de expediente já cobertos na issue #6.

## Issue #16 — Consultar indicadores operacionais

**GitHub:** [#16](https://github.com/kauepacheco/nitivo/issues/16).

**Bloqueado por:** [issue #12](https://github.com/kauepacheco/nitivo/issues/12), [issue #13](https://github.com/kauepacheco/nitivo/issues/13).

**Entrega:** Proprietário vê agenda, próximos atendimentos, concluídos, cancelamentos, faltas e valores dos serviços concluídos por período.

**Histórias da especificação:** 57, 58, 59, 60, 61.

- [ ] Usar data prevista, estado atual e preços históricos; exibir período e distinguir serviços concluídos de recebimentos ou lucro.
- [ ] Fixtures com datas, estados e preços diferentes comprovam cálculo no fuso local; funcionário e outro tenant não acessam indicadores.

## Issue #17 — Implantar demonstração reproduzível com monitoramento

**GitHub:** [#17](https://github.com/kauepacheco/nitivo/issues/17).

**Bloqueado por:** [issue #2](https://github.com/kauepacheco/nitivo/issues/2).

**Entrega:** Operador reproduz build e implantação da aplicação no Render, usa dados fictícios e recebe alertas de disponibilidade e erros.

**Histórias da especificação:** 70, 71, 73.

- [ ] CI executa verificações desde esta entrega e acompanha os testes de cada incremento; conferir custo efetivo em reais, margem de restauração e teto de R$ 100 antes de contratar.
- [ ] Um serviço para API/interface e PostgreSQL separado do local, HTTPS e cadastro real controlado; ensaiar alerta e recuperação, proteger segredos e acompanhar consumo. Não exige concluir toda a agenda para começar.

## Issue #18 — Restaurar backup e reconciliar a agenda

**GitHub:** [#18](https://github.com/kauepacheco/nitivo/issues/18).

**Bloqueado por:** [issue #7](https://github.com/kauepacheco/nitivo/issues/7), [issue #17](https://github.com/kauepacheco/nitivo/issues/17).

**Entrega:** Operador exporta e restaura cópia protegida, suspende novas reservas e reconcilia compromissos antes da reabertura.

**Histórias da especificação:** 72.

- [ ] Definir cópia externa, acesso, retenção e responsável; ensaiar com dados fictícios e conferir custo temporário.
- [ ] Modo de recuperação impede mutações que comprometam a reconciliação, inclusive pela equipe; registrar validação dos dados, recuperação do serviço e autorização operacional de reabertura.

## Issue #19 — Definir políticas e procedimentos de privacidade

**GitHub:** [#19](https://github.com/kauepacheco/nitivo/issues/19).

**Bloqueado por:** nenhum.

**Entrega:** Preparar inventário, finalidades, retenção, descarte, canal para titulares, fornecedores, documentos aplicáveis e resposta a incidentes.

**Histórias da especificação:** 78.

- [ ] Abranger dados da equipe, clientes, veículos, reservas e fluxo voluntário ao WhatsApp; registrar responsáveis e revisão técnica, operacional e jurídica necessária.
- [ ] Preparação pode começar pelo escopo aprovado; aprovação jurídica e aderência final à aplicação são critérios de entrada do piloto, não conclusões presumidas.

## Issue #20 — Executar solicitações de titulares e retenção

**GitHub:** [#20](https://github.com/kauepacheco/nitivo/issues/20).

**Bloqueado por:** [issue #10](https://github.com/kauepacheco/nitivo/issues/10), [issue #19](https://github.com/kauepacheco/nitivo/issues/19).

**Entrega:** Operador consegue cumprir consulta, correção, exportação e descarte aplicável segundo a política definida, com procedimento assistido ensaiado.

**Histórias da especificação:** 78.

- [ ] Conferir identidade e escopo do tenant; exportações protegidas não incluem terceiros ou segredos. Usar ferramentas mínimas, sem exigir novo portal.
- [ ] Ensaiar retenção e anonimização ou eliminação aplicável com dados fictícios, preservando compromissos e obrigações definidos; registrar evidência e alinhar cópias de segurança à política.

## Issue #21 — Recrutar a lavação e preparar vendas e suporte

**GitHub:** [#21](https://github.com/kauepacheco/nitivo/issues/21).

**Bloqueado por:** nenhum.

**Entrega:** Proprietário do Nitivo conduz cinco conversas digitais, seleciona uma lavação compatível e combina o piloto e o suporte.

**Histórias da especificação:** 64, 65, 74, 77.

- [ ] Preparar roteiro, material de apresentação e acompanhamento simples; contatos e mensagens são conduzidos pelo proprietário.
- [ ] Registrar concordância com 14 dias gratuitos e hipótese de R$ 49/mês, expectativas e responsável pelos pedidos no WhatsApp; interesse gratuito não valida preço.

## Issue #22 — Verificar prontidão e iniciar o piloto assistido

**GitHub:** [#22](https://github.com/kauepacheco/nitivo/issues/22).

**Bloqueado por:** [issue #3](https://github.com/kauepacheco/nitivo/issues/3), [issue #4](https://github.com/kauepacheco/nitivo/issues/4), [issue #8](https://github.com/kauepacheco/nitivo/issues/8), [issue #9](https://github.com/kauepacheco/nitivo/issues/9), [issue #15](https://github.com/kauepacheco/nitivo/issues/15), [issue #16](https://github.com/kauepacheco/nitivo/issues/16), [issue #18](https://github.com/kauepacheco/nitivo/issues/18), [issue #20](https://github.com/kauepacheco/nitivo/issues/20), [issue #21](https://github.com/kauepacheco/nitivo/issues/21).

**Entrega:** Concluir a revisão operacional, técnica e jurídica, configurar a lavação e treinar a equipe para iniciar os 14 dias.

**Histórias da especificação:** 63, 64, 65, 70, 71, 72, 73, 78.

- [ ] Conferir todas as jornadas já testadas na versão a implantar, acesso restrito, capacidade, custos, alertas, recuperação e aderência às políticas; resolver falhas antes de dados reais.
- [ ] Separar e remover dados de demonstração conforme procedimento, configurar acesso real, serviços, boxes e políticas; registrar início e suporte. Dependências listadas incluem as demais entregas transitivamente.

## Issue #23 — Acompanhar 14 dias e avaliar continuidade paga

**GitHub:** [#23](https://github.com/kauepacheco/nitivo/issues/23).

**Bloqueado por:** [issue #22](https://github.com/kauepacheco/nitivo/issues/22).

**Entrega:** Proprietário acompanha uso e dificuldades e registra decisão da lavação sobre continuar por R$ 49/mês.

**Histórias da especificação:** 75, 76, 77.

- [ ] Registrar dias de uso, reservas públicas e encaixes, faltas, alterações e suporte com coleta mínima; execução humana durante os 14 dias.
- [ ] Se aceitar, acompanhar período, valor e situação da cobrança manual e primeiro pagamento separadamente; se recusar ou atrasar, tratar acesso e reservas futuras sem apagamento automático.

## Histórico da publicação do planejamento — 9 de setembro de 2026

Divisão aprovada pelo proprietário com a resposta “aprovado”. Publicação concluída em ordem de dependência. Os 22 títulos e corpos foram relidos e comparados com os textos preparados; naquela data, todos os tickets estavam abertos e possuíam ready-for-agent. As 32 dependências usam links explícitos na seção Blocked by, pois o conector disponível não expõe relações nativas de bloqueio; gh não está instalado. Não foram criadas relações nativas de sub-issue nem alterada a issue de origem.

A divisão cobre as 78 histórias da especificação. A fronteira inicial sem bloqueadores é formada por acesso e primeiro serviço (#2), políticas de privacidade (#19) e recrutamento (#21). Isso representa dependências satisfeitas, não autorização para iniciar implementação ou executar contatos externos.

Esse registro descreve a publicação inicial do planejamento. O estado atual das entregas está na tabela acima; a aplicação ainda não foi implantada.
