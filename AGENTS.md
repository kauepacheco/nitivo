# Instruções para agentes

## Missão

Nitivo é um SaaS de agendamento e gestão para lavações e estéticas automotivas. A prioridade é entregar e validar um produto comercial com um primeiro piloto, mantendo custo e complexidade proporcionais ao estágio do negócio. Aprendizado de programação deixou de ser uma condição para avançar.

## Fontes de contexto

Antes de propor ou alterar código:

1. Leia `README.md` para entender produto, escopo e compromissos.
2. Leia `CONTEXT.md` para empregar o vocabulário do domínio.
3. Leia `docs/CURRENT_MILESTONE.md` para identificar o ponto atual e o próximo passo.
   Para implementar ou revisar o piloto, consulte também `docs/SAAS_PLAN.md` para escopo, critérios de aceite e propostas ainda não confirmadas.
4. Consulte `docs/adr/` antes de questionar ou contrariar uma decisão arquitetural registrada.
5. Consulte `docs/privacy/` quando a alteração envolver dados pessoais, autenticação, logs, integrações ou retenção.

Se os documentos e o código divergirem, não escolha silenciosamente um deles. Mostre a divergência e ajude o usuário a decidir qual representa o comportamento correto.

## Forma de colaboração

- Converse em português do Brasil, salvo pedido diferente do usuário.
- Explique decisões, custos e limitações que afetem o produto de maneira curta.
- Divida o trabalho em incrementos pequenos, verificáveis e adequados ao nível atual do projeto.
- Quando a tarefa for implementar, entregue o incremento completo dentro do escopo solicitado, com testes e documentação proporcionais.
- Quando a tarefa for planejar, torne a proposta concreta e revisável; distinga decisões confirmadas de recomendações pendentes.
- Não introduza ferramentas, abstrações ou infraestrutura sem uma necessidade atual demonstrável.
- Registre decisões duradouras nos documentos apropriados, evitando depender apenas do histórico da conversa.

## Regras técnicas permanentes

- Preserve o isolamento entre tenants em todas as operações de dados.
- Considere autorização no tenant separadamente da autenticação da pessoa.
- Represente valores monetários em centavos, usando números inteiros.
- Preserve no agendamento os dados históricos do serviço necessários para que mudanças futuras no catálogo não alterem o passado.
- Use dados fictícios no desenvolvimento, nos testes e na demonstração.
- Nunca registre senhas, tokens ou dados pessoais desnecessários em código, fixtures, commits ou logs.
- Trate requisitos de privacidade e segurança como critérios da funcionalidade, não como uma etapa opcional ao final.

## Qualidade e versionamento

- Antes de editar, verifique o estado do Git e preserve alterações que não pertencem à tarefa.
- Adicione ou atualize testes quando houver comportamento executável.
- Execute as verificações proporcionais à alteração e relate o resultado.
- Mantenha `docs/CURRENT_MILESTONE.md` atualizado quando uma etapa relevante começar ou terminar.
- Use o número da issue em documentos, branches e novos commits. Ao concluir
  uma entrega ou integrar branches, siga `docs/WORKFLOW.md` e reconcilie o índice
  conforme `docs/agents/issue-tracker.md`, distinguindo estado local e remoto.
- Crie ADRs apenas para decisões difíceis de reverter, não óbvias e que envolvam uma escolha real entre alternativas.
- Ao concluir uma implementação solicitada, crie um commit apenas com as mudanças
  pertencentes à tarefa e informe seu hash. Faça push somente após solicitação
  explícita do usuário.

## Skills do repositório

Skills do Nitivo ficam em `.agents/skills/` e são versionadas. Por decisão
expressa do proprietário em 11 de setembro de 2026, manter as 37 skills da
coleção local, mesmo as que ainda não são utilizadas. Revise instruções,
referências e scripts de terceiros antes de incorporar ou atualizar skills.
O inventário e as adaptações estão em [.agents/skills/README.md](.agents/skills/README.md).

Ao usar uma skill, aplique as regras deste arquivo e o escopo autorizado na
sessão; exemplos genéricos da coleção não substituem decisões do Nitivo.
Disponibilidade de uma skill não autoriza executar seu workflow, instalar suas
dependências ou iniciar outros tickets. Preserve acordos já confirmados ao
aplicar etapas de entrevista ou aprovação. Aprendizado e escrita continuam
disponíveis quando solicitados, sem virar condição para entregar o produto.

Referências a outras skills significam ler o `SKILL.md` correspondente nesta
coleção, usando os recursos disponíveis na sessão; não dependem de uma ferramenta
chamada `Skill`. Confira a disponibilidade de CLIs antes de usá-las. Fluxos de
issues seguem `docs/agents/issue-tracker.md` e `docs/agents/triage-labels.md`;
instalação de skills não autoriza publicar issues, comentários, PRs ou mensagens.

## Agent skills

### Issue tracker

Issues e specs no GitHub: kauepacheco/nitivo. Consulte docs/agents/issue-tracker.md.

### Triage labels

Cinco rótulos padrão de triagem. Consulte docs/agents/triage-labels.md.

### Domain docs

Contexto único: CONTEXT.md e docs/adr/. Consulte docs/agents/domain.md.
