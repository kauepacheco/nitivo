# Tickets do primeiro piloto

Status: divisão aprovada pelo proprietário e 22 tickets publicados e verificados em 9 de setembro de 2026, nas issues #2 a #23, com o rótulo ready-for-agent. Os tickets 1 e 2 foram implementados e validados localmente; os demais aguardam solicitação. A aprovação desta publicação não autoriza contratação.

Fonte: especificação do primeiro piloto e issue https://github.com/kauepacheco/nitivo/issues/1, sem comentários na consulta. A numeração das seções preserva a proposta aprovada; os links GitHub identificam as issues publicadas. A issue de origem foi preservada, incluindo corpo, título, estado e rótulos.

Cada ticket de software entrega interface, API, persistência, documentação OpenAPI e testes proporcionais ao comportamento. Isolamento, autorização, privacidade e concorrência pertinente fazem parte do aceite de cada entrega. Usar dados fictícios, HTTP com PostgreSQL real e navegador nas jornadas essenciais. Manter React/Vite servido pelo Nest e a stack aceita. Não há refatoração prévia necessária no catálogo vazio.

As dependências representam entregas necessárias; dados fictícios permitem verificar papéis sem esperar o fluxo administrativo de convites. CI pode avançar após o primeiro incremento, e os testes continuam obrigatórios desde o ticket 1. Os tickets 18 e 20 podem começar sem esperar código. Atividades comerciais e revisões profissionais dependem das pessoas responsáveis; não presumir execução autônoma por um agente. Publicação realizada com ready-for-agent conforme a skill, sem substituir esses responsáveis nem autorizar desenvolvimento.

## 1. Acessar a lavação e cadastrar o primeiro serviço

**GitHub:** [#2](https://github.com/kauepacheco/nitivo/issues/2).

**Bloqueado por:** nenhum.

**Entrega:** Operador provisiona uma lavação e o proprietário define sua senha por link privado, entra, cadastra e lista serviços persistidos.

**Histórias da especificação:** 41, 44, 62, 66, 69.

- [x] Sessões no PostgreSQL, hash de senha, CSRF, expiração, logout e limites de tentativas; link temporário de uso único sem segredo em logs.
- [x] Preço inteiro em centavos e duração válidos; duas lavações provam isolamento e papéis. Interface React/Vite, migrations e jornada de navegador executáveis a partir de clone limpo.

## 2. Convidar funcionários e revogar vínculos

**GitHub:** [#3](https://github.com/kauepacheco/nitivo/issues/3).

**Bloqueado por:** ticket 1 ([#2](https://github.com/kauepacheco/nitivo/issues/2)).

**Entrega:** Proprietário convida funcionários, que aceitam o vínculo e acessam apenas as áreas permitidas; a revogação vale na próxima operação.

**Histórias da especificação:** 22, 23, 55, 56, 57, 67.

- [x] Convite de uso único e com validade; aceitar com conta existente exige sua autenticação e não redefine senha.
- [x] Pessoa com vínculos em duas lavações mantém identidade e acesso à outra; catálogo nega mutações por funcionário. Configurações serão acrescentadas no ticket 5 e agenda no ticket 6.

## 3. Recuperar acesso com assistência

**GitHub:** [#4](https://github.com/kauepacheco/nitivo/issues/4).

**Bloqueado por:** ticket 1 ([#2](https://github.com/kauepacheco/nitivo/issues/2)).

**Entrega:** Operador confere a identidade por canal conhecido e entrega link temporário para a pessoa redefinir sua própria senha.

**Histórias da especificação:** 42, 67.

- [ ] Token com hash armazenado, finalidade delimitada, expiração, consumo atômico e limite de tentativas; sessões antigas revogadas.
- [ ] Ensaiar link inválido, expirado e reutilizado; documentar entrega privada e perda do canal conhecido, sem envio automático.

## 4. Consultar a página pública e os serviços

**GitHub:** [#5](https://github.com/kauepacheco/nitivo/issues/5).

**Bloqueado por:** ticket 1 ([#2](https://github.com/kauepacheco/nitivo/issues/2)).

**Entrega:** Cliente abre o link de uma lavação no celular e consulta somente seus serviços ativos, preços e durações.

**Histórias da especificação:** 1, 2, 21.

- [ ] Proprietário configura as informações públicas necessárias, incluindo contato operacional; API pública não expõe dados internos.
- [ ] Separação entre lavações e serviços inativos coberta por HTTP; leitura responsiva verificada no navegador.

## 5. Configurar capacidade e consultar horários disponíveis

**GitHub:** [#6](https://github.com/kauepacheco/nitivo/issues/6).

**Bloqueado por:** ticket 4 ([#5](https://github.com/kauepacheco/nitivo/issues/5)).

**Entrega:** Proprietário cadastra boxes e expediente semanal, ajusta políticas e o cliente consulta horários calculados para um serviço.

**Histórias da especificação:** 3, 4, 46, 47, 51, 52, 53, 54.

- [ ] Padrões: antecedência de uma hora, horizonte de 30 dias, prazo de alteração de duas horas e intervalo de início de 30 minutos; fuso America/Sao_Paulo.
- [ ] Testar duração, abertura, fechamento exato, passado e capacidade ocupada com agendamentos fictícios persistidos. Mudanças mostram conflitos e preservam reservas; exceções e bloqueios ficam no ticket 14.

## 6. Confirmar reserva pública e mostrá-la na agenda

**GitHub:** [#7](https://github.com/kauepacheco/nitivo/issues/7).

**Bloqueado por:** ticket 5 ([#6](https://github.com/kauepacheco/nitivo/issues/6)).

**Entrega:** Cliente reserva com nome, telefone e placa; recebe comprovante e a equipe encontra a reserva confirmada na agenda diária e nos próximos atendimentos.

**Histórias da especificação:** 5, 6, 7, 8, 9, 10, 12, 18, 19, 20, 21, 24, 25, 26, 43, 58, 68, 69.

- [ ] Selecionar box e preservar nome, preço e duração históricos; concorrência no PostgreSQL impede exceder capacidade, inclusive contra mudanças de configuração. Reenvio não duplica e falhas não deixam gravações parciais.
- [ ] Autorização OWNER/EMPLOYEE e isolamento na agenda; formulário não reutiliza cadastro privado por telefone/placa, nem permite consulta pública posterior. Limites de tentativas e jornada no celular com comprovante sem WhatsApp.

## 7. Abrir WhatsApp com resumo e política de alterações

**GitHub:** [#8](https://github.com/kauepacheco/nitivo/issues/8).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Comprovante oferece conversa no número da lavação com resumo mínimo e orienta pedidos de cancelamento e reagendamento.

**Histórias da especificação:** 11, 12, 13, 14, 15.

- [ ] Reserva permanece confirmada sem abrir ou enviar mensagem; referência não concede acesso e telefone não é considerado verificado.
- [ ] Exibir prazo configurado e responsabilidade da equipe; testar destino e texto com dados fictícios, sem disparar mensagens.

## 8. Editar e desativar serviços preservando reservas

**GitHub:** [#9](https://github.com/kauepacheco/nitivo/issues/9).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Proprietário altera o catálogo; futuras reservas usam os novos dados e reservas existentes mantêm o combinado.

**Histórias da especificação:** 18, 45.

- [ ] Atualização de nome, preço e duração não reescreve histórico; desativação impede novas reservas do serviço.
- [ ] Verificar concorrência com criação de reserva, validação monetária e proibição de alteração por funcionário ou outro tenant.

## 9. Corrigir cliente e veículo pela agenda

**GitHub:** [#10](https://github.com/kauepacheco/nitivo/issues/10).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Equipe consulta e corrige nome, telefone e placa necessários ao atendimento dentro da lavação.

**Histórias da especificação:** 26, 29.

- [ ] Autorização e integridade das relações impedem consulta, edição ou associação entre tenants; formulário público não ganha acesso a esses cadastros.
- [ ] Correção persiste e aparece na operação; coleta permanece mínima e dados não são registrados em logs desnecessariamente.

## 10. Registrar encaixe para início imediato

**GitHub:** [#11](https://github.com/kauepacheco/nitivo/issues/11).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Equipe registra um encaixe na agenda para agora ou outro horário disponível.

**Histórias da especificação:** 27, 28, 43.

- [ ] Dispensar apenas antecedência do autoagendamento; respeitar expediente, capacidade e controles de disponibilidade existentes.
- [ ] Testar disputa entre encaixe e reserva pública com PostgreSQL real; persistir histórico, autoria e origem da equipe.

## 11. Iniciar, concluir e marcar falta

**GitHub:** [#12](https://github.com/kauepacheco/nitivo/issues/12).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Equipe muda CONFIRMED para IN_PROGRESS ou NO_SHOW e IN_PROGRESS para COMPLETED, vendo o resultado na agenda.

**Histórias da especificação:** 30, 31, 32, 38, 39, 40, 43.

- [ ] Transições inválidas e retorno de estado final são recusados; mudança registra autoria e momento de forma consistente.
- [ ] Atrasos e duração real não deslocam reservas futuras; testar disputas de atualização, papéis e isolamento.

## 12. Cancelar após conferência da solicitação

**GitHub:** [#13](https://github.com/kauepacheco/nitivo/issues/13).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Equipe cancela uma reserva confirmada e libera o box apenas quando a ação é registrada.

**Histórias da especificação:** 16, 33, 34, 35, 38, 39, 43.

- [ ] Separar horário informado do pedido e horário da ação; pedido enviado no prazo continua elegível quando atendido depois. Exceção da equipe admite motivo opcional.
- [ ] Guardar autoria; estado final não reabre; cancelamento e liberação são atômicos, incluindo concorrência com outras ações sobre a reserva.

## 13. Reagendar sem perder a reserva original

**GitHub:** [#14](https://github.com/kauepacheco/nitivo/issues/14).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)).

**Entrega:** Equipe troca horário e box após conferir pedido e disponibilidade; falha mantém integralmente a reserva anterior.

**Histórias da especificação:** 17, 34, 36, 37, 43.

- [ ] Preservar serviço, nome, preço e duração históricos; registrar solicitação separada da ação e autoria. Troca de serviço exige cancelar e reservar novamente.
- [ ] Testar falha e concorrência com outra reserva ou reagendamento; sem ocupação duplicada ou liberação parcial. Exceções operacionais adicionais entram no ticket 14.

## 14. Aplicar exceções, bloqueios e desativação de boxes

**GitHub:** [#15](https://github.com/kauepacheco/nitivo/issues/15).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)), ticket 10 ([#11](https://github.com/kauepacheco/nitivo/issues/11)), ticket 13 ([#14](https://github.com/kauepacheco/nitivo/issues/14)).

**Entrega:** Proprietário define feriados, horários especiais, bloqueios individuais ou gerais e desativa boxes com prévia visualização dos conflitos.

**Histórias da especificação:** 48, 49, 50.

- [ ] Consulta pública, confirmação, encaixe e reagendamento respeitam a mudança; nenhum compromisso existente é movido ou cancelado silenciosamente.
- [ ] Testar concorrência entre alterações operacionais e todos os caminhos de reserva, além dos conflitos de expediente já cobertos no ticket 5.

## 15. Consultar indicadores operacionais

**GitHub:** [#16](https://github.com/kauepacheco/nitivo/issues/16).

**Bloqueado por:** ticket 11 ([#12](https://github.com/kauepacheco/nitivo/issues/12)), ticket 12 ([#13](https://github.com/kauepacheco/nitivo/issues/13)).

**Entrega:** Proprietário vê agenda, próximos atendimentos, concluídos, cancelamentos, faltas e valores dos serviços concluídos por período.

**Histórias da especificação:** 57, 58, 59, 60, 61.

- [ ] Usar data prevista, estado atual e preços históricos; exibir período e distinguir serviços concluídos de recebimentos ou lucro.
- [ ] Fixtures com datas, estados e preços diferentes comprovam cálculo no fuso local; funcionário e outro tenant não acessam indicadores.

## 16. Implantar demonstração reproduzível com monitoramento

**GitHub:** [#17](https://github.com/kauepacheco/nitivo/issues/17).

**Bloqueado por:** ticket 1 ([#2](https://github.com/kauepacheco/nitivo/issues/2)).

**Entrega:** Operador reproduz build e implantação da aplicação no Render, usa dados fictícios e recebe alertas de disponibilidade e erros.

**Histórias da especificação:** 70, 71, 73.

- [ ] CI executa verificações desde esta entrega e acompanha os testes de cada incremento; conferir custo efetivo em reais, margem de restauração e teto de R$ 100 antes de contratar.
- [ ] Um serviço para API/interface e PostgreSQL separado do local, HTTPS e cadastro real controlado; ensaiar alerta e recuperação, proteger segredos e acompanhar consumo. Não exige concluir toda a agenda para começar.

## 17. Restaurar backup e reconciliar a agenda

**GitHub:** [#18](https://github.com/kauepacheco/nitivo/issues/18).

**Bloqueado por:** ticket 6 ([#7](https://github.com/kauepacheco/nitivo/issues/7)), ticket 16 ([#17](https://github.com/kauepacheco/nitivo/issues/17)).

**Entrega:** Operador exporta e restaura cópia protegida, suspende novas reservas e reconcilia compromissos antes da reabertura.

**Histórias da especificação:** 72.

- [ ] Definir cópia externa, acesso, retenção e responsável; ensaiar com dados fictícios e conferir custo temporário.
- [ ] Modo de recuperação impede mutações que comprometam a reconciliação, inclusive pela equipe; registrar validação dos dados, recuperação do serviço e autorização operacional de reabertura.

## 18. Definir políticas e procedimentos de privacidade

**GitHub:** [#19](https://github.com/kauepacheco/nitivo/issues/19).

**Bloqueado por:** nenhum.

**Entrega:** Preparar inventário, finalidades, retenção, descarte, canal para titulares, fornecedores, documentos aplicáveis e resposta a incidentes.

**Histórias da especificação:** 78.

- [ ] Abranger dados da equipe, clientes, veículos, reservas e fluxo voluntário ao WhatsApp; registrar responsáveis e revisão técnica, operacional e jurídica necessária.
- [ ] Preparação pode começar pelo escopo aprovado; aprovação jurídica e aderência final à aplicação são critérios de entrada do piloto, não conclusões presumidas.

## 19. Executar solicitações de titulares e retenção

**GitHub:** [#20](https://github.com/kauepacheco/nitivo/issues/20).

**Bloqueado por:** ticket 9 ([#10](https://github.com/kauepacheco/nitivo/issues/10)), ticket 18 ([#19](https://github.com/kauepacheco/nitivo/issues/19)).

**Entrega:** Operador consegue cumprir consulta, correção, exportação e descarte aplicável segundo a política definida, com procedimento assistido ensaiado.

**Histórias da especificação:** 78.

- [ ] Conferir identidade e escopo do tenant; exportações protegidas não incluem terceiros ou segredos. Usar ferramentas mínimas, sem exigir novo portal.
- [ ] Ensaiar retenção e anonimização ou eliminação aplicável com dados fictícios, preservando compromissos e obrigações definidos; registrar evidência e alinhar cópias de segurança à política.

## 20. Recrutar a lavação e preparar vendas e suporte

**GitHub:** [#21](https://github.com/kauepacheco/nitivo/issues/21).

**Bloqueado por:** nenhum.

**Entrega:** Proprietário do Nitivo conduz cinco conversas digitais, seleciona uma lavação compatível e combina o piloto e o suporte.

**Histórias da especificação:** 64, 65, 74, 77.

- [ ] Preparar roteiro, material de apresentação e acompanhamento simples; contatos e mensagens são conduzidos pelo proprietário.
- [ ] Registrar concordância com 14 dias gratuitos e hipótese de R$ 49/mês, expectativas e responsável pelos pedidos no WhatsApp; interesse gratuito não valida preço.

## 21. Verificar prontidão e iniciar o piloto assistido

**GitHub:** [#22](https://github.com/kauepacheco/nitivo/issues/22).

**Bloqueado por:** ticket 2 ([#3](https://github.com/kauepacheco/nitivo/issues/3)), ticket 3 ([#4](https://github.com/kauepacheco/nitivo/issues/4)), ticket 7 ([#8](https://github.com/kauepacheco/nitivo/issues/8)), ticket 8 ([#9](https://github.com/kauepacheco/nitivo/issues/9)), ticket 14 ([#15](https://github.com/kauepacheco/nitivo/issues/15)), ticket 15 ([#16](https://github.com/kauepacheco/nitivo/issues/16)), ticket 17 ([#18](https://github.com/kauepacheco/nitivo/issues/18)), ticket 19 ([#20](https://github.com/kauepacheco/nitivo/issues/20)), ticket 20 ([#21](https://github.com/kauepacheco/nitivo/issues/21)).

**Entrega:** Concluir a revisão operacional, técnica e jurídica, configurar a lavação e treinar a equipe para iniciar os 14 dias.

**Histórias da especificação:** 63, 64, 65, 70, 71, 72, 73, 78.

- [ ] Conferir todas as jornadas já testadas na versão a implantar, acesso restrito, capacidade, custos, alertas, recuperação e aderência às políticas; resolver falhas antes de dados reais.
- [ ] Separar e remover dados de demonstração conforme procedimento, configurar acesso real, serviços, boxes e políticas; registrar início e suporte. Dependências listadas incluem as demais entregas transitivamente.

## 22. Acompanhar 14 dias e avaliar continuidade paga

**GitHub:** [#23](https://github.com/kauepacheco/nitivo/issues/23).

**Bloqueado por:** ticket 21 ([#22](https://github.com/kauepacheco/nitivo/issues/22)).

**Entrega:** Proprietário acompanha uso e dificuldades e registra decisão da lavação sobre continuar por R$ 49/mês.

**Histórias da especificação:** 75, 76, 77.

- [ ] Registrar dias de uso, reservas públicas e encaixes, faltas, alterações e suporte com coleta mínima; execução humana durante os 14 dias.
- [ ] Se aceitar, acompanhar período, valor e situação da cobrança manual e primeiro pagamento separadamente; se recusar ou atrasar, tratar acesso e reservas futuras sem apagamento automático.

## Publicação e verificação

Divisão aprovada pelo proprietário com a resposta “aprovado”. Publicação concluída em ordem de dependência. Os 22 títulos e corpos foram relidos e comparados com os textos preparados; todos os tickets estão abertos e possuem ready-for-agent. As 32 dependências usam links explícitos na seção Blocked by, pois o conector disponível não expõe relações nativas de bloqueio; gh não está instalado. Não foram criadas relações nativas de sub-issue nem alterada a issue de origem.

A divisão cobre as 78 histórias da especificação. A fronteira inicial sem bloqueadores é formada por acesso e primeiro serviço (#2), políticas de privacidade (#19) e recrutamento (#21). Isso representa dependências satisfeitas, não autorização para iniciar implementação ou executar contatos externos.

O marco atual registra a conclusão desta tarefa. Nenhum código executável foi alterado, e não houve commit, push, contratação ou implantação.
