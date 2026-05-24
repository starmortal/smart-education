/** 演示用户纯色单字头像（SVG Data URL） */

const DEFAULT_COLORS = ['#2563eb', '#059669', '#e11d48', '#7c3aed', '#d97706', '#0891b2'];

/**
 * @param {string} char - 头像显示的单字，如「明」
 * @param {string} bgColor - 背景色，如 #2563eb
 * @param {number} [size=128]
 */
function buildDemoAvatar(char, bgColor, size = 128) {
  const text = String(char || '?').slice(0, 1);
  const fill = bgColor || DEFAULT_COLORS[0];
  const fontSize = Math.round(size * 0.46);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="${fill}"/>`,
    `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"`,
    ` fill="#ffffff" font-size="${fontSize}" font-weight="600"`,
    ` font-family="PingFang SC,Microsoft YaHei,SimHei,sans-serif">${text}</text>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 从昵称取最后一个汉字，如「演示-小明」→「明」 */
function extractAvatarChar(nickname) {
  if (!nickname) return '?';
  const chars = String(nickname).match(/[\u4e00-\u9fff]/g);
  return chars?.length ? chars[chars.length - 1] : nickname.charAt(0);
}

/** 根据 key 或昵称稳定分配背景色 */
function pickAvatarColor(seed, explicitColor) {
  if (explicitColor) return explicitColor;
  const str = String(seed || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_COLORS[hash % DEFAULT_COLORS.length];
}

/**
 * 解析演示用户头像字段
 * @param {{ nickname?: string, avatar?: string, avatarChar?: string, avatarColor?: string, key?: string, email?: string }} user
 */
function resolveDemoUserAvatar(user) {
  if (user.avatar) return user.avatar;
  const char = user.avatarChar || extractAvatarChar(user.nickname);
  const color = pickAvatarColor(user.key || user.email || user.nickname, user.avatarColor);
  return buildDemoAvatar(char, color);
}

module.exports = {
  buildDemoAvatar,
  extractAvatarChar,
  pickAvatarColor,
  resolveDemoUserAvatar,
  DEFAULT_COLORS,
};
