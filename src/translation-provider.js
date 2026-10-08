// Hanja Lens v3.0 translation provider registry.
// Current provider: reviewed translations attached to the 350 bundled examples.
// Production invariant: public Hanja Lens permits bundled/local deterministic
// providers only. Remote translation or LLM API providers are not production
// runtime functionality; M2 remote-LLM tooling is research/evaluation-only.
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HanjaLensTranslation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  'use strict';

  const providers=[];

  function normalize(text){
    return String(text??'').normalize('NFC').trim();
  }

  function registerProvider(provider){
    if(!provider||typeof provider.translate!=='function'){
      throw new TypeError('translation provider must define translate(text, context)');
    }
    providers.push(provider);
    providers.sort((a,b)=>(a.priority??100)-(b.priority??100));
    return provider;
  }

  async function translate(text,context={}){
    const source=normalize(text);
    if(!source)return null;
    for(const provider of providers){
      try{
        const result=await provider.translate(source,context);
        if(result&&typeof result.text==='string'&&result.text.trim()){
          return {
            provider:provider.id||'unknown',
            source:result.source||provider.id||'unknown',
            reviewed:Boolean(result.reviewed),
            text:result.text.trim()
          };
        }
      }catch(error){
        // A provider failure must never block the core Hanja Lens conversion.
        if(context&&typeof context.onProviderError==='function'){
          context.onProviderError(provider,error);
        }
      }
    }
    return null;
  }

  function createBundledExampleProvider(){
    const examples=(root.HanjaLensExamples&&root.HanjaLensExamples.examples)||[];
    const map=new Map();
    for(const example of examples){
      const key=normalize(example.input);
      const text=String(example.translation||'').trim();
      if(key&&text)map.set(key,text);
    }
    return {
      id:'bundled-example',
      priority:10,
      async translate(text){
        const value=map.get(normalize(text));
        return value?{text:value,source:'bundled-example',reviewed:true}:null;
      },
      size:map.size
    };
  }

  const bundledExampleProvider=registerProvider(createBundledExampleProvider());

  return {
    normalize,
    registerProvider,
    translate,
    providers,
    bundledExampleProvider
  };
});
