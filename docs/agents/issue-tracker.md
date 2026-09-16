# Issue tracker: GitHub

Issues e specs ficam em kauepacheco/nitivo no GitHub.

## Operações

- Use o gh CLI quando disponível; o conector GitHub autenticado pode executar operações equivalentes. Confira a disponibilidade do gh na sessão; o conector GitHub é uma alternativa.
- Ao publicar uma spec, crie uma issue com o conteúdo completo e os rótulos definidos pela skill. Antes, procure publicação anterior para evitar duplicação.
- Ao consultar uma tarefa, leia título, corpo, comentários e rótulos.
- Preserve rótulos existentes ao adicionar um novo estado e remova estados conflitantes conforme o fluxo solicitado.
- Para textos multilinha, use argumentos estruturados do conector ou arquivo com --body-file no gh.
- Depois de publicar ou alterar uma issue, confira o conteúdo e os rótulos e registre sua URL.

## Pull requests as a triage surface

PRs as a request surface: no.

## Relações entre tarefas

Use sub-issues e dependências nativas quando disponíveis. Caso contrário, registre relações explícitas no corpo das issues, com referências às tarefas envolvidas.

## Identificação e estado das entregas

Use o número da issue como identificador principal: `issue #8 — WhatsApp`,
branch `feat/8-whatsapp-resumo-politica` e commit com `(#8)`.
“Ticket” é sinônimo de issue, sem uma segunda sequência numérica. A issue #1
contém a especificação, e as entregas do piloto estão nas issues #2–#23.
Preserve IDs das histórias, commits existentes e nomes de migrations já versionadas.

O [índice das issues](../specs/tickets-primeiro-piloto-saas.md) concentra o estado
por entrega. O [marco atual](../CURRENT_MILESTONE.md) resume a retomada e aponta
para esse índice; o README apresenta o produto. Ao concluir trabalho, atualize
os estados afetados juntos, usando as seguintes evidências:

| Estado | Evidência necessária |
| --- | --- |
| Implementado localmente | Commit e verificações dos critérios de aceite; registrar limitações. |
| Código publicado | Commit acessível no GitHub; publicar a especificação não publica código. |
| Integrado à main | Commit ancestral de `main`; distinguir a branch local da remota conferida. |
| Issue concluída | Critérios atendidos e código integrado à `main` remota; fechar como completed. |

As colunas do índice registram fatos independentes. Os snapshots usuais são:

| Situação comprovada | Implementado | Publicado | Main local / GitHub | Issue |
| --- | --- | --- | --- | --- |
| Commit revisado apenas local | Sim | Não | Não / Não | Aberta, sem `ready-for-agent` |
| Branch publicada | Sim | Sim | Não / Não | Aberta; aguarda integração |
| Merge local com push pendente | Sim | Sim | Sim / Não | Aberta; aguarda push da `main` |
| Integração remota conferida | Sim | Sim | Sim / Sim | Fechada como concluída |

Combinações diferentes exigem explicação baseada em evidência. A sequência e os
comandos pertencem somente a `docs/WORKFLOW.md`.

Para entregas comerciais ou operacionais, use as evidências dos critérios da
própria issue; publicação de código não comprova recrutamento, revisão ou uso real.

Ao reconciliar o GitHub, leia corpo, comentários e rótulos, preserve o escopo e
as dependências, marque somente critérios comprovados e registre commits e
pendências no corpo. Remova rótulos de triagem incompatíveis com a conclusão,
preservando os demais. Uma entrega implementada que aguarda publicação fica
aberta, com a pendência explícita e sem `ready-for-agent`, para evitar reimplementação.
Confira a gravação e atualize a tabela local com a data da consulta. Sem acesso,
registre estado remoto não verificado; não trate o cache de `origin/main` como
consulta atual. Alterações remotas exigem autorização na tarefa.

Antes de abrir outra branch, finalize a integração e confirme a sincronização
da `main`, conforme o [workflow](../WORKFLOW.md). Push depende de solicitação
explícita; atualizar uma issue não autoriza publicar código.
