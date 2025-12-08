import { parse } from 'iptv-playlist-parser';

const DEFAULT_GROUP = 'Uncategorized';

export function parseM3U(content) {
  const { items } = parse(content);
  return items.map((item, idx) => {
    let group = item.group ? item.group : DEFAULT_GROUP;
    // Normalize group to plain string to avoid rendering objects (some parsers return { title })
    if (group && typeof group === 'object' && group.title) group = group.title;
    if (typeof group === 'string' && group.includes(';')) group = group.split(';')[0];
    if (!group || typeof group !== 'string') group = DEFAULT_GROUP;
    return {
      index: idx,
      name: item.name,
      url: item.url,
      logo: item.tvg && item.tvg.logo ? item.tvg.logo : '',
      group,
      raw: item,
    };
  });
}
