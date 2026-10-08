// Standard Korean Language Dictionary-derived runtime layer
// v2.4: explicit load() and localStorage cache for offline reuse.
(function(){
  'use strict';
  const DATA=globalThis.HanjaLensData;
  const ENGINE=globalThis.HanjaLensEngine;
  const UTILS=(typeof module!=='undefined'&&module.exports)
    ? require('./runtime-dictionary-utils.js')
    : globalThis.HanjaLensRuntimeDictionaryUtils;
  if(!DATA||!ENGINE||!UTILS) return;

  const SOURCES=globalThis.HanjaLensExternalSources;
  if(!SOURCES) return;

  const STDICT_URL=SOURCES.sources.gukhanmun.stdictUrl;
  const JP_URL=SOURCES.sources.jlptWordList.url;
  const NATIVE_URL=SOURCES.sources.hanjaWordlist.nativeUrl;
  const CACHE_KEY=SOURCES.cacheKeys.stdict;
  const DISPLAY_HOLD=new Set(SOURCES.displayHold||[]);

  // Ambiguous surfaces are never resolved merely because one Hanja spelling is also
  // common Japanese vocabulary. These overrides are explicitly reviewed exceptions.
  const SAFE_AMBIGUOUS_OVERRIDES={
    '논의':'論議','조치':'措置','강화':'強化','신속':'迅速','선행':'先行','체제':'体制',
    '유지':'維持','급변':'急変','실효성':'実効性','파급':'波及','면밀':'綿密','결론적':'結論的'
  };

  const normalizeHanja=s=>UTILS.normalizeHanja(s,DATA.shinjitai);
  function parseNative(text){const set=new Set();for(const line of text.split(/\r?\n/)){const f=line.split('\t');if(/^[가-힣]+$/u.test(f[1]||''))set.add(f[1]);}return set;}
  function parseJapanese(text){const set=new Set();for(const line of text.split(/\r?\n/).slice(1)){const i=line.indexOf(',');if(i>0)set.add(line.slice(0,i).trim());}return set;}
  function buildDictionary(tsv,jp,native){
    const protectedSet=new Set(Object.keys(DATA.protected||{}));
    const candidates=new Map();
    for(const line of tsv.split(/\r?\n/).slice(1)){
      const [hanja,hangul]=line.split('\t');
      if(!/^[가-힣]{2,}$/u.test(hangul||'')||!/^[\p{Script=Han}]+$/u.test(hanja||'')) continue;
      if(native.has(hangul)||protectedSet.has(hangul)||DISPLAY_HOLD.has(hangul)) continue;
      const ja=normalizeHanja(hanja);
      if(!candidates.has(hangul)) candidates.set(hangul,new Set());
      candidates.get(hangul).add(ja);
    }
    const out={};
    for(const [surface,set] of candidates){
      const all=[...set];
      if(all.length===1){out[surface]=all[0];continue;}
      const reviewed=SAFE_AMBIGUOUS_OVERRIDES[surface];
      if(reviewed && all.includes(reviewed) && jp.has(reviewed)) out[surface]=reviewed;
    }
    return out;
  }
  const layer=UTILS.createRuntimeLayer({
    data:DATA,engine:ENGINE,cacheKey:CACHE_KEY,statusId:'stdictStatus',source:'stdict',
    labels:{
      loading:'標準辞書 読込中…',
      ready:'標準辞書 読込済',
      cached:'標準辞書 読込済（キャッシュ）',
      offline:'標準辞書 オフライン',
      title:added=>`標準国語大辞典レイヤーから ${added} 語を追加`
    }
  });
  async function fetchDictionary(){
    const [a,b,c]=await Promise.all([fetch(STDICT_URL),fetch(JP_URL),fetch(NATIVE_URL)]);
    if(!a.ok||!b.ok||!c.ok) throw new Error(`HTTP ${a.status}/${b.status}/${c.status}`);
    const [st,jt,nt]=await Promise.all([a.text(),b.text(),c.text()]);
    return buildDictionary(st,parseJapanese(jt),parseNative(nt));
  }
  function load(){
    return UTILS.loadCachedRuntimeLayer({layer,fetchDictionary});
  }
  globalThis.HanjaLensStdDict={load,buildDictionary,parseJapanese,parseNative,CACHE_KEY};
})();
