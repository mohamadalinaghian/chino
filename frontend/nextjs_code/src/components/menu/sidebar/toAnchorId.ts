export function toAnchorId(title: string) {
  return encodeURIComponent(title.trim().replace(/\s+/g, "-"));
}
