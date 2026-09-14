// Sync Instagram feed: latest posts from Graph API -> src/data/instagram.json + images
// Requires IG_ACCESS_TOKEN (long-lived Instagram token, instagram_business_basic scope)
// If refreshed, writes the new token to .ig-token-new for the workflow to persist
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TOKEN = process.env.IG_ACCESS_TOKEN;
const LIMIT = 10;
const OUT_JSON = 'src/data/instagram.json';
const IMG_DIR = 'public/images';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

if (!TOKEN) {
  console.log('IG_ACCESS_TOKEN not set — skipping sync');
  process.exit(0);
}

const api = (path_, params = {}) => {
  const q = new URLSearchParams({ access_token: TOKEN, ...params });
  return `https://graph.instagram.com${path_}?${q}`;
};

async function getJSON(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`IG API ${res.status}: ${data.error?.message || res.statusText}`);
  }
  return data;
}

function shortcodeFromPermalink(permalink) {
  const m = permalink.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
  return m ? m[2] : null;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

// For carousels, use the first child's image
async function firstChildImage(id) {
  try {
    const data = await getJSON(api(`/${id}/children`, { fields: 'media_type,media_url' }));
    const first = (data.data || []).find((c) => c.media_type === 'IMAGE');
    return first?.media_url || null;
  } catch {
    return null;
  }
}

(async () => {
  const media = await getJSON(api('/me/media', {
    fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
    limit: String(LIMIT * 2), // extra por si hay filtrados
  }));

  const posts = [];
  for (const item of media.data || []) {
    if (posts.length >= LIMIT) break;
    const shortcode = shortcodeFromPermalink(item.permalink);
    if (!shortcode) continue;

    const isVideo = item.media_type === 'VIDEO';
    // Para videos, media_url es el .mp4 — usar el thumbnail
    let imgSrc = isVideo
      ? item.thumbnail_url || item.media_url
      : item.media_url || item.thumbnail_url;
    if (!imgSrc && item.media_type === 'CAROUSEL_ALBUM') {
      imgSrc = await firstChildImage(item.id);
    }
    if (!imgSrc) continue;

    // Descargar y re-encodear a jpg
    const fname = `ig-${shortcode}.jpg`;
    const dest = path.join(IMG_DIR, fname);
    try {
      const res = await fetch(imgSrc);
      if (!res.ok) throw new Error(`img HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf).resize(800, null, { withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest);
    } catch (e) {
      console.log(`img fail ${shortcode}: ${e.message}`);
      continue;
    }

    posts.push({
      shortcode,
      date: formatDate(item.timestamp),
      isVideo,
      caption: (item.caption || '').split('\n')[0].slice(0, 200),
    });
  }

  if (!posts.length) throw new Error('No posts fetched');

  // Mantener traducciones EN existentes
  const existing = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : [];
  const captionEnMap = Object.fromEntries(existing.filter((p) => p.captionEn).map((p) => [p.shortcode, p.captionEn]));
  posts.forEach((p) => {
    if (captionEnMap[p.shortcode]) p.captionEn = captionEnMap[p.shortcode];
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(posts, null, 2) + '\n');
  console.log(`Synced ${posts.length} posts -> ${OUT_JSON}`);

  // Refrescar token (válido 60 días; se renueva en cada corrida)
  try {
    const refresh = await getJSON(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`
    );
    if (refresh.access_token && refresh.access_token !== TOKEN) {
      fs.writeFileSync('.ig-token-new', refresh.access_token);
      console.log('Token refreshed -> .ig-token-new (workflow persists it as secret)');
    }
  } catch (e) {
    console.log(`Token refresh failed (non-fatal): ${e.message}`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
