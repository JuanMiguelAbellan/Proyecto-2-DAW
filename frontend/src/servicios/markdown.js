import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

export function renderMarkdown(texto) {
  const html = marked.parse(texto || '')
  return DOMPurify.sanitize(html)
}
