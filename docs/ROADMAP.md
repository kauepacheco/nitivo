# Roadmap do Nitivo

O roadmap organiza a evolução do mesmo produto. A passagem de fase depende dos critérios de saída, não apenas da quantidade de funcionalidades implementadas.

## 1. Ambiente educacional

Objetivo: aprender os fundamentos construindo localmente o núcleo do MVP com dados fictícios.

Resultados esperados:

- ambiente de desenvolvimento reproduzível;
- modelo inicial do domínio e isolamento multiempresa;
- regras de disponibilidade e agendamento cobertas por testes;
- autenticação e autorização exercitadas sem dados pessoais reais;
- API documentada e verificável;
- decisões técnicas relevantes registradas em ADRs.

Critério de saída: o fluxo principal funciona localmente, possui testes automatizados e pode ser explicado pelo autor do projeto.

## 2. Demonstração controlada

Objetivo: disponibilizar uma versão pública de portfólio sem operação comercial nem dados pessoais reais.

Resultados esperados:

- ambientes local e remoto separados;
- implantação automatizada e configuração segura;
- CI, logs, monitoramento e backups iniciais;
- dados fictícios de demonstração;
- documentação suficiente para avaliação técnica do projeto.

Critério de saída: a demonstração pode ser acessada e restaurada com segurança, sem cadastro público real.

## 3. Piloto

Objetivo: validar o produto com uma lavação real e um grupo limitado de pessoas.

Resultados esperados:

- autenticação, recuperação de conta e contatos reais;
- inventário de dados pessoais, finalidades e prazos de retenção;
- canal para solicitações de titulares;
- contratos e fornecedores avaliados;
- backups e restauração testados;
- monitoramento, alertas e resposta a incidentes;
- revisão técnica, operacional e jurídica.

Critério de saída: o piloto demonstra valor e condições operacionais para uma expansão consciente.

## 4. Produção SaaS

Objetivo: atender progressivamente várias lavações com operação sustentável.

Possíveis evoluções:

- cobrança de assinaturas;
- suporte operacional;
- metas de disponibilidade e desempenho;
- observabilidade e segurança ampliadas;
- funcionalidades priorizadas a partir do uso real.

Essa fase não autoriza antecipar complexidade durante o ambiente educacional.
