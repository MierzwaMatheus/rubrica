/**
 * Textos de interface do tema desktop (os "nomes de arquivo" das janelas, colunas das
 * listas, rótulos da área de trabalho). Vindos do `COPY` do layout desktop da v1, com
 * espanhol acrescentado. O site pode sobrescrever qualquer um em "Textos".
 */
const t = (pt: string, en: string, es: string) => ({ pt, en, es });

export const DESKTOP_TEXTS: Record<string, Record<string, string>> = {
  "desktop.os": t("OS", "OS", "OS"),
  "desktop.desktop": t("Área de trabalho", "Desktop", "Escritorio"),
  "desktop.trash": t("Lixeira", "Trash", "Papelera"),
  "desktop.readme": t("Leia-me.txt", "ReadMe.txt", "Léame.txt"),
  "desktop.hello": t("Olá! Aqui é", "Hi! This is", "¡Hola! Soy"),
  "desktop.numbers": t("Números.app", "Numbers.app", "Números.app"),
  "desktop.items.one": t("{count} item", "{count} item", "{count} elemento"),
  "desktop.items.other": t("{count} itens", "{count} items", "{count} elementos"),
  "desktop.openCase": t("Abrir case", "Open case", "Abrir caso"),
  "desktop.colName": t("Nome", "Name", "Nombre"),
  "desktop.colDescription": t("Descrição", "Description", "Descripción"),
  "desktop.colTags": t("Etiquetas", "Tags", "Etiquetas"),
  "desktop.colAction": t("Ação", "Action", "Acción"),
  "desktop.colPeriod": t("Período", "Period", "Período"),
  "desktop.colRole": t("Cargo", "Role", "Cargo"),
  "desktop.colCompany": t("Empresa", "Company", "Empresa"),
  "desktop.colDays": t("Dias", "Days", "Días"),
  "desktop.inbox": t("Caixa de entrada ({count})", "Inbox ({count})", "Bandeja de entrada ({count})"),
  "desktop.inboxEmpty": t("Caixa de entrada vazia por enquanto.", "Inbox is empty for now.", "La bandeja de entrada está vacía por ahora."),
  "desktop.messages": t("Mensagens", "Messages", "Mensajes"),
  "desktop.from": t("De", "From", "De"),
  "desktop.dialog": t("Novo projeto?", "New project?", "¿Nuevo proyecto?"),
  "desktop.controlPanel": t("Painel de Controle", "Control Panel", "Panel de control"),
  "desktop.preferences": t("Preferências do Sistema", "System Preferences", "Preferencias del sistema"),
  "desktop.photos": t("Fotos", "Photos", "Fotos"),
  "desktop.help": t("Ajuda", "Help", "Ayuda"),
  "desktop.notes": t("Notas", "Notes", "Notas"),
  "desktop.open": t("Aberto", "Open", "Abierto"),
  "desktop.readNow": t("Ler agora", "Read now", "Leer ahora"),
  "desktop.featured": t("Destaque", "Featured", "Destacado"),
  "desktop.empty": t("Esta pasta está vazia.", "This folder is empty.", "Esta carpeta está vacía."),
  "desktop.people": t("Contatos", "Contacts", "Contactos"),
  "desktop.places": t("Locais", "Places", "Lugares"),
  "desktop.file.post": t("Post.txt", "Post.txt", "Post.txt"),
  "desktop.file.case": t("Case.doc", "Case.doc", "Caso.doc"),
  "desktop.error": t("Erro", "Error", "Error"),
};
