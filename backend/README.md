# Backend do Nitivo

API do Nitivo, construída como um monólito modular com Node.js, TypeScript e NestJS.
O produto, o domínio e o escopo do MVP estão descritos no
[README principal](../README.md), e as escolhas da stack estão registradas no
[ADR 0001](../docs/adr/0001-stack-inicial.md).

## Requisitos

- Node.js 24 LTS;
- npm 11.

O PostgreSQL será executado com Docker Compose quando a persistência for
introduzida. O esqueleto atual ainda não depende de banco de dados.

## Instalação

```bash
npm ci
```

`npm ci` instala exatamente as versões resolvidas em `package-lock.json` e é o
comando indicado para reproduzir o ambiente a partir de um clone limpo.

## Execução local

```bash
npm run start:dev
```

A API fica disponível em `http://localhost:3000`. O endpoint inicial de saúde é:

```http
GET /health
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

## Verificações

```bash
npm run check
```

Esse comando executa, em sequência:

1. análise estática com Oxlint;
2. compilação do TypeScript;
3. testes unitários com Jest;
4. testes HTTP com Jest e Supertest.

Também é possível executar cada etapa separadamente pelos scripts declarados
em `package.json`.

## Nota sobre módulos

O backend permanece em CommonJS e usa Jest, conforme a stack escolhida. Os
pacotes centrais do NestJS 12 são publicados como ESM, por isso os scripts do
Jest ativam `--experimental-vm-modules` no Node.js. O aviso experimental exibido
durante os testes é esperado neste ambiente.
