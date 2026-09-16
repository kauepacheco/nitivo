# Fluxo de trabalho e sincronização

O Git compartilha código e documentos entre computadores. As issues identificam
as entregas; o [índice](specs/tickets-primeiro-piloto-saas.md) registra seu estado.
Regras de identificação e conclusão: [issue tracker](agents/issue-tracker.md).

## Antes de começar uma sessão

```bash
git status --short --branch
git branch -vv
git fetch origin
```

Confira alterações locais, branch atual e commits pendentes antes de trocar de
branch. Se o fetch falhar, a referência `origin/main` pode estar desatualizada;
resolva o acesso antes de declarar sincronização. Nunca descarte trabalho de
outra sessão ou máquina para resolver divergência.

Leia AGENTS.md, CONTEXT.md e docs/CURRENT_MILESTONE.md antes de implementar.
Para continuar uma entrega, use a branch existente. Para uma nova entrega já
solicitada, finalize a integração anterior e atualize a `main`:

```bash
git switch main
git pull --ff-only origin main
git rev-list --left-right --count main...origin/main
```

O resultado deve ser `0 0` antes de abrir a próxima branch. Exemplo para a issue #9:

```bash
git switch -c feat/9-edicao-servicos
```

Se houver divergência, examine os commits antes de escolher como reconciliar.
A opção `--ff-only` interrompe a operação quando não é possível avançar diretamente.

## Gate de alinhamento por issue

O [índice](specs/tickets-primeiro-piloto-saas.md) é a fonte única do estado por
issue. O marco resume somente a entrega atual; o README descreve capacidades sem
repetir contagens ou faixas de issues. Execute este gate antes de iniciar, depois
do commit de implementação, depois de publicar a branch e ao integrar. Use os
hashes registrados no índice: eles continuam verificáveis mesmo depois do merge
ou da remoção da branch.

```bash
ISSUE_NUMBER=12
git status --short --branch
git branch --show-current
git log --all --oneline --fixed-strings --grep="(#$ISSUE_NUMBER)"
rg -n "^\| \[#$ISSUE_NUMBER\]" docs/specs/tickets-primeiro-piloto-saas.md
rg -n "[Ii]ssue #$ISSUE_NUMBER" docs/CURRENT_MILESTONE.md
gh issue view "$ISSUE_NUMBER" --repo kauepacheco/nitivo \
  --json number,title,body,comments,labels,state,url
git fetch origin
git ls-remote origin refs/heads/main
```

Depois que existir um commit de implementação, verifique cada hash de evidência
conforme o estágio declarado:

```bash
EVIDENCE_COMMIT=b049ba38
git cat-file -e "$EVIDENCE_COMMIT^{commit}"
git merge-base --is-ancestor "$EVIDENCE_COMMIT" main
git merge-base --is-ancestor "$EVIDENCE_COMMIT" origin/main
```

Os dois últimos comandos retornam `0` somente quando o hash é ancestral da
referência testada; antes da integração, o retorno diferente de zero é esperado.
Use o conector GitHub para consultar issue e `main` quando `gh`, fetch ou SSH não
estiverem disponíveis. Uma referência `origin/main` sem fetch bem-sucedido não
substitui a consulta remota.
O gate termina somente quando branch, commits, linha do índice, marco e GitHub
descrevem o mesmo estágio e cada afirmação possui a evidência exigida pelo
[issue tracker](agents/issue-tracker.md).

As skills não exigem que o proprietário execute esses comandos manualmente: o
agente que usa `implement` executa o gate e o que usa `code-review` confere o
snapshot. O proprietário precisa apenas autorizar publicação quando desejar.
Se a autenticação do GitHub estiver indisponível também para o conector, o agente
deve parar a reconciliação remota e informar o comando necessário (`gh auth login`
para HTTPS/CLI ou a correção da chave SSH), sem declarar o estado remoto.

## Entregar e integrar uma issue

1. Implemente somente o escopo solicitado, com dados fictícios e testes proporcionais.
2. Confira `git diff`, execute as verificações e faça `code-review` do trabalho local.
3. Crie o commit de implementação com a referência da issue, por exemplo:
   `feat: preserva reservas ao editar serviço (#9)`.
4. Execute o gate, atualize índice e marco com o hash imutável do passo anterior
   e crie um commit documental com `(#N)`. Remova `ready-for-agent` da issue
   implementada quando a alteração remota estiver autorizada; mantenha-a aberta
   e registre que publicação e integração estão pendentes.
5. Após solicitação explícita de push, publique a branch pela primeira vez:
   `git push -u origin HEAD`. O `-u` configura o vínculo remoto; envios seguintes
   podem usar `git push`. Execute o gate, marque “Código publicado” no índice,
   versione a reconciliação e publique também esse commit na mesma branch.
6. Integre a entrega validada à `main`. Quando a branch descende diretamente da
   `main`, use `git switch main` e `git merge --ff-only <branch-da-entrega>`.
   Isso preserva os commits. Se não for possível, examine a divergência. Execute
   o gate, confirme a ancestralidade local dos hashes, registre `Sim / Não` para
   integração local/remota no índice e no marco e versione essa reconciliação
   antes de continuar.
7. Com push autorizado, atualize a referência remota, confira o histórico e execute
   `git push origin main`. Verifique que `main...origin/main` retorna `0 0`.
8. Execute o gate novamente e confirme a ancestralidade dos hashes na `main`
   remota. Atualize índice e marco para `Sim / Sim`, marque os critérios e feche
   a issue. Versione e publique essa reconciliação final. Se o push do passo 7
   falhar, preserve `Sim / Não` e registre a falha antes de encerrar a sessão.
9. Remova a branch local integrada com `git branch -d <branch-da-entrega>`.
   A branch remota, quando existir, deve ser tratada separadamente.

Integração local e publicação são passos separados. Se o push ainda não foi
solicitado ou não funcionar, registre a pendência e mantenha a issue aberta.
Uma árvore limpa significa arquivos sem edição pendente; não garante publicação.

## Antes de trocar de computador

Confirme que todos os commits necessários, inclusive a atualização documental,
estão no GitHub. Para trabalho em andamento, publique a branch autorizada e
registre no marco qual branch retomar. No outro computador, faça fetch e use
essa mesma branch. Segredos permanecem em arquivos locais ignorados.

## Fontes de contexto

- `README.md`: produto e escopo, com links para o andamento;
- `CONTEXT.md` e `docs/adr/`: vocabulário e decisões;
- `docs/CURRENT_MILESTONE.md`: retomada e próximo passo;
- `docs/specs/tickets-primeiro-piloto-saas.md`: estado por issue e evidências;
- `.agents/skills/`: skills versionadas para as duas máquinas.
