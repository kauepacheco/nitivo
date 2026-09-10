# Infraestrutura e acesso propostos para o piloto

Consulta a fontes oficiais em 9 de setembro de 2026. Proposta aprovada na resposta
Q19, sem provisionamento ou contratação. O proprietário pediu para não iniciar
implementação agora. O escopo está em [SAAS_PLAN.md](SAAS_PLAN.md).

## Hospedagem proposta

| Componente Render | Custo publicado | Limite inicial |
| --- | --- | --- |
| Workspace Hobby | US$ 0/mês | Computação cobrada separadamente. |
| Serviço web Starter | US$ 7/mês | 512 MB de RAM; API e interface no mesmo serviço. |
| PostgreSQL Basic | US$ 6/mês | 256 MB de RAM; 100 conexões. |

A página anuncia 1 GB SSD incluído, expansão a US$ 0,30/GB e 5 GB/mês de
tráfego no Hobby, com excedente a US$ 0,15/GB. Confirmar armazenamento cobrado no
painel: para planejamento conservador, reservar US$ 0,30 além da base de US$ 13.
Capacidade e memória precisam ser verificadas sob carga do piloto.
[Preços Render](https://render.com/pricing).

Não foi encontrada proibição específica de uso comercial no workspace Hobby.
A proposta é sustentada pelo artigo oficial que descreve essa composição para
pequenas empresas e pelos termos que contemplam contas comerciais. Conferir os
termos vigentes ao contratar. [Artigo oficial](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses),
[termos](https://render.com/terms).

PostgreSQL 18 é suportado, preservando a versão prevista no ADR 0001.
[Versões e criação](https://render.com/docs/postgresql-creating-connecting).

O frontend React/Vite seria compilado e entregue pelo Nest na mesma origem,
com rotas da API separadas do fallback da interface. Um site estático separado
também não exige servidor pago adicional, mas requer configurar a comunicação
entre origens. A proposta de serviço único prioriza uma implantação simples.
[Nest — Serve Static](https://docs.nestjs.com/recipes/serve-static).

## Fórmula e controle do teto

```text
custo mensal em reais =
  (13,30 + excedentes em dólar + instâncias temporárias em dólar)
  × câmbio efetivo da forma de pagamento
  + outros custos em reais
```

O câmbio efetivo deve incluir encargos e conversão realmente cobrados. Sem
outros custos, US$ 13,30 cabem em R$ 100 somente com câmbio efetivo de até
aproximadamente R$ 7,52/US$. Isso é um limite matemático, não uma cotação atual.

Proposta para o piloto: endereço HTTPS fornecido pelo Render, sem domínio pago,
worker, provedor de identidade ou API paga de mensagens; desenvolvimento local
e nenhum segundo ambiente remoto permanente. Acompanhar consumo e estimativa
de cobrança; alerta de gasto não é garantia de interrupção automática da fatura.

Antes de provisionar, conferir a estimativa em reais e reservar margem para
restauração e excedentes. Se a composição exceder R$ 100, revisar a hospedagem
antes de contratar, sem elevar silenciosamente o teto.

Railway foi considerado: Hobby custa no mínimo US$ 5/mês com uso incluído até
esse valor, cobrando excedentes. O mínimo não estima a aplicação, e a cobertura
de backups do plano ainda precisaria ser confirmada. A proposta Render facilita
o planejamento da base e a restauração documentada.
[Preços Railway](https://railway.com/pricing),
[referência de volumes](https://docs.railway.com/volumes/reference).

## Backup, recuperação e operação

O PostgreSQL pago no workspace Hobby oferece recuperação pontual dos últimos
três dias, excluindo os dez minutos mais recentes. A restauração cria outra
instância; validar os dados e trocar a conexão da aplicação exige intervenção.
Exportações lógicas ficam disponíveis por sete dias. Prever o custo temporário
da instância adicional e executar um ensaio antes do piloto.
[Backups Render](https://render.com/docs/postgresql-backups).

Proposta operacional: testar exportação e restauração, restringir acesso aos
arquivos, registrar o responsável e o procedimento. Definir o destino de uma
cópia externa protegida e sua retenção antes de dados reais; não presumir que
uma cópia no próprio provedor resolva perda de acesso à conta do provedor.
Durante recuperação, suspender novas reservas e reconciliar com a lavação as
alterações posteriores ao ponto restaurado antes de reabrir a agenda.

O primeiro monitoramento deve verificar disponibilidade e erros da aplicação,
com notificações ao operador do Nitivo, sem registrar nome, telefone, placa,
senhas ou tokens. Ensaiar uma falha e sua recuperação. Recursos gratuitos
eventualmente usados para alertas devem ter limites verificados antes da escolha.

## Contas da equipe

Proposta de engenharia: e-mail e senha para proprietário e funcionários, sessão
no servidor e armazenamento das sessões no PostgreSQL existente. Isso evita
outro serviço; PostgreSQL não é uma exigência do Nest. O armazenamento padrão
em memória da integração de sessão não é adequado para produção.
[Nest — Session](https://docs.nestjs.com/techniques/session).

Requisitos de implementação:

- Cookies Secure, HttpOnly e SameSite explícito, HTTPS e escopo restrito.
- Renovar sessão ao autenticar; impor expiração por inatividade e absoluta.
- Revogar sessões no logout e após redefinição de senha; revalidar vínculo ativo
  e papel a cada operação no tenant.
- Proteger operações autenticadas que mudam estado contra CSRF; SameSite
  sozinho não substitui essa proteção.
- Usar hash adaptativo de senha, preferencialmente Argon2id, com parâmetros
  calibrados no ambiente. Não armazenar senha reversível ou em logs.

Fontes: [OWASP — Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html),
[OWASP — CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
[OWASP — Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[Nest — Authorization](https://docs.nestjs.com/security/authorization).

## Convites e recuperação assistidos

O operador provisiona o primeiro proprietário; esse proprietário convida e
revoga funcionários somente na própria lavação. Para uma pessoa já cadastrada,
aceitar um vínculo não redefine sua senha nem transfere controle da conta.

Convite e redefinição usam tokens aleatórios seguros, com finalidade e pessoa
delimitadas, validade curta, consumo único e limite de tentativas. Guardar apenas
o hash e consumir atomicamente. O link serve para concluir aquela operação,
não como credencial permanente de acesso ao painel.

A recuperação de conta é assistida pelo operador após conferir identidade em
canal previamente conhecido. O link é entregue privadamente e não aparece em
logs; após redefinição, revogar sessões antigas e exigir login normal.
Conhecer um nome ou telefone digitado no formulário público não é comprovação
de identidade. Documentar como proceder se o canal de contato foi perdido.

Os requisitos de token e recuperação vêm de
[OWASP — Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
A entrega manual é uma adaptação proposta para o piloto, não uma prescrição da
fonte para uso de WhatsApp. Exige disponibilidade e cuidado do operador e foi
aceita pelo proprietário do Nitivo na confirmação do plano conjunto.
