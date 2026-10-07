// Header/footer for /vep-global/<lang>[/<market>]/… pages: the market copy wins,
// then the language copy (the localized-navigation pattern from aem.live).
export default function localizedChrome(pagePath, name) {
  const [, root, lang, market] = pagePath.split('/');
  if (root !== 'vep-global' || !lang) return [];
  const paths = [`/vep-global/${lang}/${name}`];
  if (/^[a-z]{2}$/.test(market)) paths.unshift(`/vep-global/${lang}/${market}/${name}`);
  return paths;
}
