# Fluxo de trabalho em dois computadores

O repositório Git é a fonte de verdade compartilhada. O histórico de conversas do Codex pode ajudar, mas não substitui código, decisões e estado atual versionados.

## Configuração inicial em cada computador

1. Instale Git, VS Code e Codex.
2. Configure a mesma identidade do Git.
3. Clone o repositório pelo acesso autenticado da máquina.
4. Abra a raiz do repositório no VS Code.
5. Instale as versões de ferramentas declaradas pelo projeto quando elas forem definidas.
6. Mantenha segredos somente em arquivos locais ignorados pelo Git.

## Antes de começar uma sessão

```bash
git pull --ff-only
git status
```

Abra a raiz do projeto e peça ao Codex:

> Leia AGENTS.md, CONTEXT.md e docs/CURRENT_MILESTONE.md. Consulte os ADRs existentes e explique onde o projeto parou antes de realizar alterações.

Não comece a trabalhar se houver alterações locais inesperadas. Primeiro descubra de qual máquina ou tarefa elas vieram.

## Durante o trabalho

- faça mudanças pequenas e verificáveis;
- execute testes e outras verificações relacionadas ao que mudou;
- registre decisões duradouras em arquivos, não apenas no chat;
- atualize `docs/CURRENT_MILESTONE.md` quando o estado do projeto mudar;
- nunca versione arquivos de ambiente, credenciais, tokens ou dados pessoais reais.

## Antes de trocar de computador

1. Verifique o que mudou com `git status` e `git diff`.
2. Execute as verificações disponíveis.
3. Atualize o marco atual se uma etapa começou, terminou ou mudou de direção.
4. Faça um commit com uma mensagem que explique o resultado.
5. Envie o commit ao GitHub.
6. Confirme que `git status` mostra a branch sincronizada e sem alterações pendentes.

Exemplo:

```bash
git status
git diff
git add <arquivos-revisados>
git commit -m "docs: registra próximo marco técnico"
git push
git status
```

Commits podem ser escritos em português. Prefira mensagens objetivas que descrevam o resultado, como `feat: valida conflito de horários` ou `test: cobre cancelamento fora do prazo`.

## Arquivos que carregam o contexto

- `README.md`: visão pública e escopo;
- `AGENTS.md`: regras de colaboração com agentes;
- `CONTEXT.md`: linguagem do domínio;
- `docs/CURRENT_MILESTONE.md`: ponto de retomada;
- `docs/ROADMAP.md`: direção do produto;
- `docs/adr/`: decisões difíceis de reverter;
- `.agents/skills/`: workflows de agente compartilhados pelas duas máquinas.

## Skills

Skills instaladas apenas no diretório pessoal de uma máquina não aparecem automaticamente na outra. As skills específicas do Nitivo devem ser revisadas, colocadas em `.agents/skills/` e versionadas no repositório, respeitando suas licenças.
