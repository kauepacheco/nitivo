# Skills do Nitivo

Este diretório é reservado às skills de agente específicas do projeto e compartilhadas por Git entre os computadores de desenvolvimento.

Conjunto revisado e versionado em 11 de setembro de 2026:

- `domain-modeling`: glossário e decisões de domínio;
- `grilling`: discussão de planos quando solicitada;
- `grill-with-docs`: combina `grilling` e `domain-modeling`;
- `tdd`: implementação orientada por testes quando solicitada;
- `diagnosing-bugs`: reprodução e diagnóstico de falhas;
- `code-review`: revisão de mudanças contra padrões e especificação;
- `writing-for-agents`: manutenção das instruções para agentes;
- `codebase-design`: referência de interfaces e testabilidade usada por `tdd`.

## Origem e revisão

Origem: [mattpocock/skills](https://github.com/mattpocock/skills), sob
[licença MIT](LICENSE). A seleção preserva as sete skills anteriormente previstas
e inclui a dependência `codebase-design`. Foram lidos os arquivos de instruções,
referências, metadados e o script `diagnosing-bugs/scripts/hitl-loop.template.sh`.
Esse script é um modelo interativo: não acessa serviços nem modifica o projeto;
suas entradas devem conter apenas observações sem segredos.

Adaptações locais: `grill-with-docs` e `tdd` usam links para as dependências em vez
de exigir uma ferramenta chamada `Skill`; `code-review` consulta o fluxo local
do issue tracker sem exigir a instalação da coleção de origem.
As regras de AGENTS.md e o escopo autorizado pelo usuário orientam a aplicação
dessas skills. `grill-with-docs` mantém sua invocação exclusivamente explícita em
`agents/openai.yaml`; o campo de frontmatter `disable-model-invocation`, não
aceito pelo validador do Codex, foi removido.

`skills-lock.json` na raiz contém somente a seleção ativa. Seus hashes registram
a origem instalada; as adaptações locais são controladas pelo histórico Git.
Atualizações devem preservar essas adaptações e passar por nova revisão.

## Backup da coleção anterior

As outras 29 skills foram movidas para
`.local/backups/skills-2026-09-11-vXYCRi/retiradas/`. No mesmo diretório de backup,
`colecao-original.tar.gz` preserva a coleção completa antes da seleção e o
`skills-lock.json` original. O arquivo compactado foi comparado com os originais
antes da movimentação.

O backup é local, ignorado pelo Git e não acompanha clones ou pushes. Para
recuperar uma skill, copie sua pasta de `retiradas/`, revise suas dependências e
reincorpore a entrada correspondente do lock original. Extraia o arquivo
compactado em um diretório separado para consultar versões anteriores sem
sobrescrever a seleção ativa.
