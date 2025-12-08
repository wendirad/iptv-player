export function groupBy(channels, key = 'group') {
  return channels.reduce((acc, ch) => {
    const group = ch[key] || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ch);
    return acc;
  }, {});
}
