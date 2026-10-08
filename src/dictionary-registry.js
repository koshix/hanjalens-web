// Provenance-aware Hanja dictionary registry.
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.HanjaLensDictionaryRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function hasOwn(obj,key){
    return Boolean(obj)&&Object.prototype.hasOwnProperty.call(obj,key);
  }

  function createRegistry(core,{layerOrder=['mit','cc-kedict','stdict']}={}){
    if(!core||typeof core!=='object'||Array.isArray(core)){
      throw new TypeError('core dictionary must be an object');
    }

    const order=Object.freeze([...layerOrder]);
    const layers=Object.create(null);

    function get(surface){
      if(hasOwn(core,surface)){
        return {surface,output:core[surface],source:'core'};
      }
      for(const source of order){
        const dict=layers[source];
        if(dict&&hasOwn(dict,surface)){
          return {surface,output:dict[surface],source};
        }
      }
      return null;
    }

    function allKeys(){
      const keys=new Set(Object.keys(core));
      for(const source of order){
        const dict=layers[source];
        if(!dict) continue;
        for(const key of Object.keys(dict)) keys.add(key);
      }
      return [...keys];
    }

    function size(){
      return allKeys().length;
    }

    function register(source,dict){
      if(!order.includes(source)){
        throw new Error('unknown runtime dictionary source: '+source);
      }
      if(!dict||typeof dict!=='object'||Array.isArray(dict)){
        throw new TypeError('runtime dictionary must be an object: '+source);
      }

      const before=size();
      const copy=Object.create(null);
      for(const [surface,value] of Object.entries(dict)){
        if(typeof value==='string'&&value) copy[surface]=value;
      }
      layers[source]=copy;
      return Math.max(0,size()-before);
    }

    function clear(){
      for(const source of order) delete layers[source];
    }

    function inspect(surface){
      const entry=get(surface);
      return entry?Object.freeze({...entry}):null;
    }

    return Object.freeze({
      layerOrder:order,
      get,
      allKeys,
      size,
      register,
      clear,
      inspect
    });
  }

  return Object.freeze({createRegistry});
});
