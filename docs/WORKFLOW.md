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

## Entregar e integrar uma issue

1. Implemente somente o escopo solicitado, com dados fictícios e testes proporcionais.
2. Confira `git diff`, execute as verificações da aplicação e atualize o índice e o marco.
3. Crie um commit com a referência da issue, por exemplo:
   `feat: preserva reservas ao editar serviço (#9)`.
4. Após solicitação explícita de push, publique a branch pela primeira vez:
   `git push -u origin HEAD`. O `-u` configura o vínculo remoto; envios seguintes
   podem usar `git push`.
5. Integre a entrega validada à `main`. Quando a branch descende diretamente da
   `main`, use `git switch main` e `git merge --ff-only <branch-da-entrega>`.
   Isso preserva os commits. Se não for possível, examine a divergência.
6. Com push autorizado, atualize a referência remota, confira o histórico e execute
   `git push origin main`. Verifique que `main...origin/main` retorna `0 0`.
7. Confira a issue, marque os critérios atendidos e feche como concluída depois
   de verificar o código integrado à `main` remota. Atualize o índice e o marco;
   versione e sincronize também essa atualização documental.
8. Remova a branch local integrada com `git branch -d <branch-da-entrega>`.
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
