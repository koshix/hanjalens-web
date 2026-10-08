// Shared helpers for runtime dictionary layers.
(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.HanjaLensRuntimeDictionaryUtils=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  function normalizeHanja(text,shinjitai){
    const map=shinjitai||{};
    return [...String(text).normalize('NFKC')].map(c=>map[c]||c).join('');
  }

  function loadCache(key){
    try{
      const raw=root.localStorage?.getItem(key);
      if(!raw) return null;
      const obj=JSON.parse(raw);
      return obj&&obj.dict&&typeof obj.dict==='object'?obj.dict:null;
    }catch{
      return null;
    }
  }

  function saveCache(key,dict){
    try{
      root.localStorage?.setItem(key,JSON.stringify({savedAt:new Date().toISOString(),dict}));
    }catch{}
  }

  function createRuntimeLayer({data,engine,cacheKey,statusId,labels,source,document=root.document}){
    const status=()=>document?.getElementById?.(statusId)||null;

    function merge(dict){
      if(!engine || typeof engine.registerRuntimeDictionary!=='function'){
        throw new Error('runtime dictionary engine API unavailable: '+source);
      }
      return engine.registerRuntimeDictionary(source,dict);
    }

    function setLoading(){
      const el=status();
      if(el) el.textContent=labels.loading;
    }

    function finish(origin,added){
      const count=document?.getElementById?.('statHanja');
      if(count){
        const total=typeof engine.dictionarySize==='function'
          ? engine.dictionarySize()
          : Object.keys(data.hanja||{}).length;
        count.textContent=String(total);
      }
      const el=status();
      if(el){
        el.textContent=origin==='cache'?labels.cached:labels.ready;
        el.title=labels.title(added);
      }
    }

    function fail(error){
      const el=status();
      if(el){
        el.textContent=labels.offline;
        el.title=String(error);
      }
      return {ok:false,source:'offline',added:0,error:String(error)};
    }

    return {
      merge,
      loadCache:()=>loadCache(cacheKey),
      saveCache:dict=>saveCache(cacheKey,dict),
      setLoading,
      finish,
      fail
    };
  }

  async function loadCachedRuntimeLayer({layer,fetchDictionary}){
    const cached=layer.loadCache();
    if(cached){
      const added=layer.merge(cached);
      layer.finish('cache',added);
      return {ok:true,source:'cache',added};
    }

    layer.setLoading();
    try{
      const dict=await fetchDictionary();
      const added=layer.merge(dict);
      layer.saveCache(dict);
      layer.finish('network',added);
      return {ok:true,source:'network',added};
    }catch(error){
      return layer.fail(error);
    }
  }

  return {
    normalizeHanja,
    loadCache,
    saveCache,
    createRuntimeLayer,
    loadCachedRuntimeLayer
  };
});
