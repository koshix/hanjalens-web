// Hanja Lens v1.8 — minimal cc-kedict parser
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.HanjaLensCCKedictParser=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function unquote(s){
    const t=String(s??'').trim();
    if((t.startsWith('"')&&t.endsWith('"'))||(t.startsWith("'")&&t.endsWith("'"))) return t.slice(1,-1);
    return t;
  }
  function extractWordHanja(text){
    const byWord=new Map();
    let word='';
    for(const line of String(text??'').split(/\r?\n/)){
      let m=line.match(/^- word:\s*(.+?)\s*$/);
      if(m){ word=unquote(m[1]); continue; }
      if(!word) continue;
      m=line.match(/^\s+hanja:\s*(.+?)\s*$/);
      if(!m) continue;
      const hanja=unquote(m[1]).normalize('NFKC');
      if(!/^[\p{Script=Han}]+$/u.test(hanja)) continue;
      if(!byWord.has(word)) byWord.set(word,new Set());
      byWord.get(word).add(hanja);
    }
    const out={};
    for(const [word,set] of byWord){
      if(set.size===1) out[word]=[...set][0];
    }
    return out;
  }
  return {extractWordHanja};
});
