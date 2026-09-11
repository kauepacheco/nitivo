# Skills do Nitivo

As 37 skills da coleção local são mantidas e versionadas por decisão expressa
do proprietário em 11 de setembro de 2026, inclusive as ainda não utilizadas.
Essa decisão substitui a seleção anterior de oito. Incorporar a coleção não
executa seus workflows nem instala as ferramentas citadas por eles.

## Inventário e uso

As regras compartilhadas de escopo, autorização e Git estão no
[AGENTS.md](../../AGENTS.md). A invocação preserva as políticas existentes em
`agents/openai.yaml`; skills de uso explícito continuam disponíveis por nome.

| Skill | Invocação |
| --- | --- |
| [ask-matt](ask-matt/SKILL.md) | Somente explícita |
| [claude-handoff](claude-handoff/SKILL.md) | Somente explícita |
| [code-review](code-review/SKILL.md) | Automática quando pertinente |
| [codebase-design](codebase-design/SKILL.md) | Automática quando pertinente |
| [diagnosing-bugs](diagnosing-bugs/SKILL.md) | Automática quando pertinente |
| [domain-modeling](domain-modeling/SKILL.md) | Automática quando pertinente |
| [git-guardrails-claude-code](git-guardrails-claude-code/SKILL.md) | Automática quando pertinente |
| [grill-me](grill-me/SKILL.md) | Somente explícita |
| [grill-with-docs](grill-with-docs/SKILL.md) | Somente explícita |
| [grilling](grilling/SKILL.md) | Automática quando pertinente |
| [handoff](handoff/SKILL.md) | Somente explícita |
| [implement](implement/SKILL.md) | Somente explícita |
| [implement-spec](implement-spec/SKILL.md) | Somente explícita |
| [improve-codebase-architecture](improve-codebase-architecture/SKILL.md) | Somente explícita |
| [loop-me](loop-me/SKILL.md) | Somente explícita |
| [migrate-to-shoehorn](migrate-to-shoehorn/SKILL.md) | Automática quando pertinente |
| [prototype](prototype/SKILL.md) | Automática quando pertinente |
| [research](research/SKILL.md) | Automática quando pertinente |
| [resolving-merge-conflicts](resolving-merge-conflicts/SKILL.md) | Automática quando pertinente |
| [retro](retro/SKILL.md) | Somente explícita |
| [scaffold-exercises](scaffold-exercises/SKILL.md) | Automática quando pertinente |
| [setup-matt-pocock-skills](setup-matt-pocock-skills/SKILL.md) | Somente explícita |
| [setup-pre-commit](setup-pre-commit/SKILL.md) | Automática quando pertinente |
| [setup-ts-deep-modules](setup-ts-deep-modules/SKILL.md) | Somente explícita |
| [tdd](tdd/SKILL.md) | Automática quando pertinente |
| [teach](teach/SKILL.md) | Somente explícita |
| [to-questionnaire](to-questionnaire/SKILL.md) | Somente explícita |
| [to-spec](to-spec/SKILL.md) | Somente explícita |
| [to-tickets](to-tickets/SKILL.md) | Somente explícita |
| [triage](triage/SKILL.md) | Somente explícita |
| [wait-what](wait-what/SKILL.md) | Somente explícita |
| [wayfinder](wayfinder/SKILL.md) | Somente explícita |
| [wizard](wizard/SKILL.md) | Automática quando pertinente |
| [writing-beats](writing-beats/SKILL.md) | Somente explícita |
| [writing-for-agents](writing-for-agents/SKILL.md) | Automática quando pertinente |
| [writing-fragments](writing-fragments/SKILL.md) | Somente explícita |
| [writing-shape](writing-shape/SKILL.md) | Somente explícita |

## Origem e adaptações

Origem: mattpocock/skills, sob [licença MIT](LICENSE). As 29 entradas ausentes do
`skills-lock.json` foram recuperadas do lock preservado no arquivo
`.local/backups/skills-2026-09-11-vXYCRi/colecao-original.tar.gz`, mantendo as oito
já existentes. Os hashes registram a origem instalada, não o conteúdo adaptado;
as adaptações locais são preservadas pelo Git. Nenhuma versão remota nova foi baixada.

Foram revisados os SKILL.md, metadados, referências, scripts e configuração da
coleção incorporada. Ajustes locais:

- frontmatter compatível com o validador local do Codex e políticas de invocação preservadas;
- dependências de skills por leitura de arquivos, sem exigir uma ferramenta `Skill`;
- escopo de implementação, staging e publicação subordinados ao AGENTS.md;
- revisão de trabalho local incluindo staged, unstaged e arquivos novos;
- configuração existente de tracker/domínio reutilizada, com templates identificados como exemplos;
- linguagem do usuário, dados fictícios e espaços próprios para aprendizado e workflows pessoais;
- exemplos de arquitetura e ferramentas opcionais sem instalação automática;
- hook Git sem exposição do comando recebido, com falha explícita de parsing;
- wizard distribuído inerte, sem coleta ou publicação de credenciais de exemplo.

O hook Git exige Bash/Python 3 e usa regex limitada: não cobre todas as formas de
comando. Ele é auxílio opcional do Claude Code, não substitui autorização nem foi
instalado nesta incorporação. O wizard exige adaptar e validar seus estágios e a
serialização dos valores antes de uso real. A configuração dependency-cruiser é
um exemplo não ativado. As CLIs e contas externas devem ser verificadas quando
o workflow correspondente for solicitado.

## Manutenção e verificação

Ao atualizar uma skill, revisar também referências e scripts, preservar licença,
adaptações e política de invocação, e manter diretórios e lock correspondentes.
Usar o validador de skills disponível no ambiente; conferir links relativos e
sintaxe dos scripts. Regressões dos scripts adaptados podem ser executadas com:

```bash
python3 .agents/skills/tests/test_script_safety.py
```

Um clone recebe todas as skills deste inventário. Backups em `.local/` permanecem
locais e ignorados pelo Git, como registro histórico; não são requisito para
usar ou recuperar a coleção atual, que está versionada.
