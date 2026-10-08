// cc-kedict runtime dictionary layer (CC BY-SA 3.0)
// v2.4: explicit load() only; caller controls deterministic load order.
(function(){
  'use strict';
  const DATA=globalThis.HanjaLensData;
  const ENGINE=globalThis.HanjaLensEngine;
  const UTILS=(typeof module!=='undefined'&&module.exports)
    ? require('./runtime-dictionary-utils.js')
    : globalThis.HanjaLensRuntimeDictionaryUtils;
  const PARSER=globalThis.HanjaLensCCKedictParser;
  if(!DATA||!ENGINE||!PARSER||!UTILS) return;

  const SOURCES=globalThis.HanjaLensExternalSources;
  if(!SOURCES) return;

  const URL=SOURCES.sources.ccKedict.url;
  const CACHE_KEY=SOURCES.cacheKeys.ccKedict;
  const DISPLAY_HOLD=new Set(SOURCES.displayHold||[]);

  const normalizeHanja=s=>UTILS.normalizeHanja(s,DATA.shinjitai);
  function buildDictionary(text){
    const raw=PARSER.extractWordHanja(text);
    const out={};
    const protectedSet=new Set(Object.keys(DATA.protected||{}));
    for(const [surface,hanja] of Object.entries(raw)){
      if(!/^[가-힣]{2,}$/u.test(surface)) continue;
      if(protectedSet.has(surface)||DISPLAY_HOLD.has(surface)) continue;
      out[surface]=normalizeHanja(hanja);
    }
    return out;
  }
  const layer=UTILS.createRuntimeLayer({
    data:DATA,engine:ENGINE,cacheKey:CACHE_KEY,statusId:'ccDictionaryStatus',source:'cc-kedict',
    labels:{
      loading:'補助辞書 読込中…',
      ready:'補助辞書 読込済',
      cached:'補助辞書 読込済（キャッシュ）',
      offline:'補助辞書 オフライン',
      title:added=>`cc-kedict から ${added} 語を追加`
    }
  });
  async function fetchDictionary(){
    const res=await fetch(URL);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return buildDictionary(await res.text());
  }
  function load(){
    return UTILS.loadCachedRuntimeLayer({layer,fetchDictionary});
  }
  globalThis.HanjaLensCCKedict={load,buildDictionary,CACHE_KEY};
})();
