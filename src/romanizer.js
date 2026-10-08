// Hanja Lens lightweight romanization module.
(function(root,factory){
  const isNode=typeof module!=='undefined' && module.exports;
  const data=isNode ? require('../data/generated-data.js') : root.HanjaLensData;
  const rules=isNode ? require('./engine-rules.js') : root.HanjaLensEngineRules;
  const api=factory(data,rules);
  if(isNode) module.exports=api;
  root.HanjaLensRomanizer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(DATA,RULES){
  'use strict';
  if(!DATA) throw new Error('HanjaLensData is required');
  if(!RULES) throw new Error('HanjaLensEngineRules is required');

  const HANJA=DATA.hanja;
  const {
    PARTICLES,COPULA_SUFFIXES,INITIAL,MEDIAL,FINAL,
    ROMANIZATION_OVERRIDES,ROMANIZATION_COMPOUNDS
  }=RULES;

  function normalize(text){return String(text??'').normalize('NFC');}
  function romanizeSyllable(ch){
    const c=ch.charCodeAt(0);
    if(c<0xAC00||c>0xD7A3) return ch;
    const s=c-0xAC00;
    return INITIAL[Math.floor(s/588)]+MEDIAL[Math.floor((s%588)/28)]+FINAL[s%28];
  }
  function romanizeWord(word){return [...word].map(romanizeSyllable).join('');}
  function romanizeLexical(stem){
    if(ROMANIZATION_OVERRIDES[stem]) return ROMANIZATION_OVERRIDES[stem];
    if(ROMANIZATION_COMPOUNDS[stem]) return ROMANIZATION_COMPOUNDS[stem].map(romanizeLexical).join(' ');
    return romanizeWord(stem);
  }
  function splitParticle(token){
    for(const particle of PARTICLES){
      if(token.length>particle.length&&token.endsWith(particle)) return [token.slice(0,-particle.length),particle];
    }
    return [token,''];
  }
  function splitCopula(token){
    for(const suffix of COPULA_SUFFIXES){
      if(token.length<=suffix.length||!token.endsWith(suffix)) continue;
      const noun=token.slice(0,-suffix.length);
      if(HANJA[noun]||ROMANIZATION_COMPOUNDS[noun]||ROMANIZATION_OVERRIDES[noun]) return [noun,suffix];
    }
    return [token,''];
  }
  function romanizeToken(raw){
    return raw.replace(/[가-힣]+/gu,hangul=>{
      const [stem,particle]=splitParticle(hangul);
      if(particle) return romanizeLexical(stem)+'-'+romanizeWord(particle);
      const [noun,copula]=splitCopula(hangul);
      if(copula) return romanizeLexical(noun)+'-'+romanizeWord(copula);
      return romanizeLexical(hangul);
    });
  }
  function romanize(text){
    const normalized=normalize(text);
    return normalized.split(/(\s+)/).map(part=>/[가-힣]/u.test(part)?romanizeToken(part):part).join('');
  }

  return {romanize};
});
