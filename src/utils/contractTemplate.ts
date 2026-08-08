export function interpolateTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key]
    if (value == null) return match
    return value
  })
}

export function formatArrayAsList(items: string[]): string {
  return items.map(i => `• ${i}`).join('\n')
}

export function formatArrayAsText(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return items.slice(0, -1).join(', ') + ' e ' + items[items.length - 1]
}
