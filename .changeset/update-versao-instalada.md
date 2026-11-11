---
"create-rubrica": patch
---

O `update` grava no `rubrica.json` a versão que acabou de instalar. Antes ele lia o caminho do pacote do cache do Node e registrava a versão anterior (e o `verificar` passava a pedir um `update` que já tinha sido feito).
