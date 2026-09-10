# Roadmap do Nitivo

O produto evolui para uso comercial com critérios de saída verificáveis.
O escopo, a sequência semanal e o orçamento estão no [plano do piloto](SAAS_PLAN.md).
O plano foi aprovado na resposta Q19. O proprietário pediu para não implementar
agora; as etapas abaixo aguardam nova solicitação de execução.

## 1. Construção e descoberta comercial

Objetivo: preparar um fluxo completo de autoagendamento e gestão, enquanto o
proprietário conversa com potenciais compradores e seleciona uma lavação.

Resultados: acesso da equipe, configuração, persistência, isolamento multiempresa,
agenda consistente, interface do cliente sem conta, contato por WhatsApp e painel.
Desenvolvimento e testes usam dados fictícios.

Critério de saída: os fluxos essenciais funcionam pela interface, com testes de
isolamento e concorrência, e podem ser demonstrados a interessados.

## 2. Preparação do piloto

Objetivo: deixar a aplicação e a operação prontas para a primeira lavação.

Resultados: implantação reproduzível, custo conferido frente ao teto de R$ 100/mês,
autenticação e recuperação de acesso da equipe, monitoramento, restauração testada,
procedimentos operacionais e artefatos de privacidade.

Critério de saída: uma lavação aceita participar, suas regras estão configuradas,
a equipe conhece a agenda e o tratamento de alterações pelo WhatsApp, e os
[critérios para dados reais](privacy/README.md) estão atendidos.

## 3. Piloto acompanhado

Objetivo: verificar uso diário e disposição de pagar.

Proposta: uma lavação, entrada assistida e 14 dias gratuitos. Apresentar previamente
a hipótese aceita de R$ 49/mês para continuidade, com cobrança manual.

Resultados: registro do uso de autoagendamento e da agenda, problemas operacionais,
pedidos de alteração e manifestação comercial do proprietário da lavação.

Critério de saída: a lavação usa o fluxo na rotina e aceita continuar pagando,
com condição operacional de manter o serviço. Registrar primeiro pagamento
separadamente. Caso não haja adesão, revisar problema, experiência ou público
antes de ampliar.

## 4. Expansão comercial

Objetivo: atender outras lavações com operação sustentável.

Priorizar melhorias observadas no piloto, entrada de novas empresas, suporte e
cobrança. Automatizar atividades repetitivas já conhecidas. Pagamento antecipado
do atendimento, conta de cliente, integração automática com WhatsApp e relatórios
adicionais serão reavaliados conforme evidência de necessidade.

Critério de expansão: capacidade, recuperação, suporte e custos continuam
compatíveis com a quantidade de empresas atendidas. Crescimento não autoriza
antecipar infraestrutura sem necessidade demonstrada.
