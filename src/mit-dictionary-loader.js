// MIT hanja-wordlist runtime dictionary layer
// v2.4: explicit load() only; caller controls deterministic load order.
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

  const HANJA_URL=SOURCES.sources.hanjaWordlist.hanjaUrl;
  const NATIVE_URL=SOURCES.sources.hanjaWordlist.nativeUrl;
  const CACHE_KEY=SOURCES.cacheKeys.mit;
  const DISPLAY_HOLD=new Set(SOURCES.displayHold||[]);

  const normalizeHanja=s=>UTILS.normalizeHanja(s,DATA.shinjitai);
  function parseNative(text){
    const set=new Set();
    for(const line of text.split(/\r?\n/)){
      if(!line.trim()) continue;
      const f=line.split('\t');
      if(/^[가-힣]+$/u.test(f[1]||'')) set.add(f[1]);
    }
    return set;
  }
  function parseHanja(text,native){
    const out={};
    const protectedSet=new Set(Object.keys(DATA.protected||{}));
    for(const line of text.split(/\r?\n/)){
      if(!line.trim()) continue;
      const f=line.split('\t'), surface=f[1]||'';
      if(!/^[가-힣]{2,}$/u.test(surface)) continue;
      if(native.has(surface)||protectedSet.has(surface)||DISPLAY_HOLD.has(surface)) continue;
      const hs=[];
      for(let i=3;i<f.length;i+=2){
        const h=(f[i]||'').trim().normalize('NFKC');
        if(/^[\p{Script=Han}]+$/u.test(h)) hs.push(h);
      }
      const uniq=[...new Set(hs)];
      if(uniq.length!==1) continue;
      out[surface]=normalizeHanja(uniq[0]);
    }
    return out;
  }
  const layer=UTILS.createRuntimeLayer({
    data:DATA,engine:ENGINE,cacheKey:CACHE_KEY,statusId:'mitDictionaryStatus',source:'mit',
    labels:{
      loading:'MIT辞書 読込中…',
      ready:'MIT辞書 読込済',
      cached:'MIT辞書 読込済（キャッシュ）',
      offline:'MIT辞書 オフライン',
      title:added=>`MIT辞書レイヤーから ${added} 語を追加`
    }
  });
  async function fetchDictionary(){
    const [h,n]=await Promise.all([fetch(HANJA_URL),fetch(NATIVE_URL)]);
    if(!h.ok||!n.ok) throw new Error(`HTTP ${h.status}/${n.status}`);
    const [ht,nt]=await Promise.all([h.text(),n.text()]);
    return parseHanja(ht,parseNative(nt));
  }
  function load(){
    return UTILS.loadCachedRuntimeLayer({layer,fetchDictionary});
  }
  globalThis.HanjaLensMIT={load,parseHanja,parseNative,CACHE_KEY};
})();
