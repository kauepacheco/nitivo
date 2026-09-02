# Instruções para agentes

## Missão

Nitivo é um projeto educacional e de portfólio que evoluirá progressivamente para demonstração, piloto e, se validado, produção. O objetivo não é apenas entregar software: o proprietário do repositório deve compreender as decisões e desenvolver competência técnica durante a construção.

## Fontes de contexto

Antes de propor ou alterar código:

1. Leia `README.md` para entender produto, escopo e compromissos.
2. Leia `CONTEXT.md` para empregar o vocabulário do domínio.
3. Leia `docs/CURRENT_MILESTONE.md` para identificar o ponto atual e o próximo passo.
4. Consulte `docs/adr/` antes de questionar ou contrariar uma decisão arquitetural registrada.
5. Consulte `docs/privacy/` quando a alteração envolver dados pessoais, autenticação, logs, integrações ou retenção.

Se os documentos e o código divergirem, não escolha silenciosamente um deles. Mostre a divergência e ajude o usuário a decidir qual representa o comportamento correto.

## Forma de colaboração

- Converse em português do Brasil, salvo pedido diferente do usuário.
- Explique conceitos novos de maneira curta antes de aplicá-los.
- Divida o trabalho em incrementos pequenos, verificáveis e adequados ao nível atual do projeto.
- Preserve o papel educacional do projeto: não implemente uma funcionalidade completa no lugar do usuário sem autorização explícita.
- Quando o usuário estiver programando, proponha o próximo exercício, revise o resultado e explique os ajustes.
- Não introduza ferramentas, abstrações ou infraestrutura sem uma necessidade atual demonstrável.
- Registre decisões duradouras nos documentos apropriados, evitando depender apenas do histórico da conversa.

## Regras técnicas permanentes

- Preserve o isolamento entre tenants em todas as operações de dados.
- Considere autorização no tenant separadamente da autenticação da pessoa.
- Represente valores monetários em centavos, usando números inteiros.
- Preserve no agendamento os dados históricos do serviço necessários para que mudanças futuras no catálogo não alterem o passado.
- Use dados fictícios nos ambientes educacional e de demonstração.
- Nunca registre senhas, tokens ou dados pessoais desnecessários em código, fixtures, commits ou logs.
- Trate requisitos de privacidade e segurança como critérios da funcionalidade, não como uma etapa opcional ao final.

## Qualidade e versionamento

- Antes de editar, verifique o estado do Git e preserve alterações que não pertencem à tarefa.
- Adicione ou atualize testes quando houver comportamento executável.
- Execute as verificações proporcionais à alteração e relate o resultado.
- Mantenha `docs/CURRENT_MILESTONE.md` atualizado quando uma etapa relevante começar ou terminar.
- Crie ADRs apenas para decisões difíceis de reverter, não óbvias e que envolvam uma escolha real entre alternativas.
- Não faça commit nem push sem solicitação explícita do usuário.

## Skills do repositório

Skills específicas do Nitivo devem ficar em `.agents/skills/` e ser versionadas. Revise instruções, referências e scripts de terceiros antes de adicioná-los. Não instale coleções completas quando apenas algumas skills forem necessárias.
