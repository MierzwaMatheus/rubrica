# Telemetria do CLI

O CLI do Rubrica manda, de forma anônima, as escolhas feitas nos comandos: qual tipo de site, qual tema, quais cores, quais plugins. É assim que dá para saber o que as pessoas mais usam e onde vale investir. Nada que identifique você ou o seu site sai do seu computador.

## O que vai

Cada comando manda um evento quando termina bem. Se ele falha ou você cancela, nada vai.

Todo evento leva:

- um **id aleatório do projeto**, criado na primeira vez e guardado no `rubrica.json` (ele serve para ligar os eventos do mesmo site: criou, configurou, publicou);
- a versão do CLI e a do `@rubrica/core` do projeto;
- o sistema operacional (`linux`, `darwin`, `win32`), a versão principal do Node e o gerenciador de pacotes (`pnpm` ou `npm`).

E mais, conforme o comando:

| Comando | O que vai |
|---|---|
| `create` | Tipo de site, tema, esquema de cores, modo, quantos idiomas e os plugins escolhidos |
| `setup` | Se veio do `create`, se criou o `root` e quais integrações foram ligadas (Telegram, e-mail, OpenRouter, Asaas, deploy hook), só os nomes |
| `publicar` | Se foi a primeira publicação ou uma republicação |
| `update` | De qual versão para qual, quantas migrações de dados e quantos ejetados tiveram o original mudado |
| `config` | Quais campos mudaram (nome dos campos, nunca os valores de identidade) e o tema |
| `ejetar` | Qual bloco e se o original era do tema ou do núcleo |
| `migrar` | O layout da v1, o tema, se houve dados, quantas personalizações e se o build passou |

## O que não vai

Nome, e-mail, endereço do site, nome da pasta, textos, posts, senhas, chaves e tokens das integrações, conteúdo do painel e endereço IP. Da identidade só vai que o campo mudou, nunca o que você escreveu. O coletor guarda o dia em que o evento chegou, sem a hora.

## Como desligar

| Jeito | Vale para |
|---|---|
| `npx create-rubrica telemetria desligar` | Este projeto, de vez (fica gravado no `rubrica.json`). Para religar: `telemetria ligar` |
| `npx create-rubrica@latest <pasta> --sem-telemetria` | O projeto novo já nasce com a telemetria desligada |
| `--sem-telemetria` em qualquer outro comando | Só aquela execução |
| `RUBRICA_TELEMETRIA=0` | Qualquer comando, enquanto a variável existir |
| `DO_NOT_TRACK=1` | O mesmo, seguindo o padrão [Console Do Not Track](https://consoledonottrack.com) |

Em CI (variável `CI` ligada) o CLI nunca manda nada. `npx create-rubrica telemetria`, sem mais nada, mostra se está ligada e por quê.

Na primeira vez em cada projeto, o CLI avisa que a telemetria existe e como desligar.

## Como funciona

O envio dura no máximo 2 segundos. Sem internet, ou com o coletor fora do ar, o comando segue normal e nada aparece na tela. O código que monta e manda os eventos é aberto: [`packages/create-rubrica/src/telemetry.ts`](https://github.com/MierzwaMatheus/rubrica/blob/v2/packages/create-rubrica/src/telemetry.ts).
