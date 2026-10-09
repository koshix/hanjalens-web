// Hanja Lens conversion engine.
// Dictionary-driven, conservative, offline-first.
(function(root,factory){
  const isNode=typeof module!=='undefined' && module.exports;
  const data=isNode ? require('../data/generated-data.js') : root.HanjaLensData;
  const rules=isNode ? require('./engine-rules.js') : root.HanjaLensEngineRules;
  const romanizer=isNode ? require('./romanizer.js') : root.HanjaLensRomanizer;
  const dictionaryRegistry=isNode ? require('./dictionary-registry.js') : root.HanjaLensDictionaryRegistry;
  const morphologyVeto=isNode ? require('./morphology-veto.js') : root.HanjaLensMorphologyVeto;
  const api=factory(data,rules,romanizer,dictionaryRegistry,morphologyVeto);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.HanjaLensEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(DATA,RULES,ROMANIZER,DICTIONARY_REGISTRY,MORPHOLOGY_VETO){
  'use strict';
  if(!DATA) throw new Error('HanjaLensData is required');
  if(!RULES) throw new Error('HanjaLensEngineRules is required');
  if(!ROMANIZER) throw new Error('HanjaLensRomanizer is required');
  if(!DICTIONARY_REGISTRY) throw new Error('HanjaLensDictionaryRegistry is required');
  if(!MORPHOLOGY_VETO) throw new Error('HanjaLensMorphologyVeto is required');

  const HANJA=DATA.hanja;
  const LOAN=DATA.loanwords;
  const PROTECTED=new Set(Object.keys(DATA.protected));
  const MIXED=DATA.mixed;
  const HINTS=DATA.hints||{};
  const PHRASES=[...DATA.phrases].sort((a,b)=>b[0].length-a[0].length);

  const {
    CONTEXT_RULES,PARTICLES,COPULA_SUFFIXES,CONTRACTED_COPULA_SUFFIXES,
    VERBAL_EXACT,VERBAL_PREFIXES,DERIVATIONAL_SUFFIXES,RECEIVE_PASSIVE_BASES,
    FIREWALL_GRAMMATICAL_BASES,FIREWALL_PREDICATE_LEMMAS,
    REVIEWED_COMPOUND_PARTS,REVIEWED_COMPOUND_FORMS,COMPOUND_BLOCKED_PARTS,
    MIXED_PREFIX_RULES,JAPANESE_DISPLAY_OVERRIDES,SAFE_FORMS
  }=RULES;

  let ACTIVE_TRACE=null;
  function traceEvent(type,details={}){
    if(ACTIVE_TRACE) ACTIVE_TRACE.push({type,...details});
  }

  // Provenance-aware dictionary storage is isolated from conversion logic.
  const DICTIONARIES=DICTIONARY_REGISTRY.createRegistry(HANJA,{
    layerOrder:['mit','cc-kedict','stdict']
  });

  const getHanjaEntry=surface=>DICTIONARIES.get(surface);
  const allHanjaKeys=()=>DICTIONARIES.allKeys();
  const dictionarySize=()=>DICTIONARIES.size();

  function registerRuntimeDictionary(source,dict){
    const added=DICTIONARIES.register(source,dict);
    refreshDictionary();
    return added;
  }

  function clearRuntimeDictionaries(){
    DICTIONARIES.clear();
    refreshDictionary();
  }

  function inspectDictionaryEntry(surface){
    return DICTIONARIES.inspect(normalize(surface));
  }

  let CONVERTIBLE_KEYS=[
    ...new Set([
      ...allHanjaKeys(),
      ...Object.keys(HINTS)
    ])
  ].sort((a,b)=>b.length-a.length);

  function normalize(text){ return String(text??'').normalize('NFC'); }
  // v4.2: after the per-character shinjitai map, Korean-specific word forms whose Japanese standard form uses
  // other characters (data/ja-form-map.tsv, e.g. 労動→労働) are rewritten as whole sequences.
  const JA_FORMS=DATA.jaForms||[];
  function normalizeJapaneseGlyphs(text){
    const map=DATA.shinjitai||{};
    let out=[...String(text??'')].map(ch=>map[ch]||ch).join('');
    for(const [from,to] of JA_FORMS) if(out.includes(from)) out=out.replaceAll(from,to);
    return out;
  }
  function hasNoFinalConsonantHangul(s){
    if(!s) return false;
    const cp=s.codePointAt(s.length-1);
    return cp>=0xAC00 && cp<=0xD7A3 && ((cp-0xAC00)%28===0);
  }

  function getLexicalHint(surface){
    const key=normalize(surface);
    const row=HINTS[key];

    if(!row) return null;

    return {
      hanja:normalizeJapaneseGlyphs(row.hanja),
      jpHint:normalizeJapaneseGlyphs(row.jpHint),
      confidence:row.confidence
    };
  }

  function lexicalConvert(surface){
    if(!surface) return surface;
    if(isUnsafeFor(surface,SAFETY_ROLES.LEXICAL)){
      traceEvent('protected',{surface});
      return surface;
    }

    const hint=getLexicalHint(surface);
    if(hint){
      // v4.2: when glyph/word-form normalization makes both sides identical (労動→労働), show one form.
      const output=hint.hanja===hint.jpHint?hint.hanja:hint.hanja+'：'+hint.jpHint;
      traceEvent('lexical-hint',{surface,output});
      return output;
    }
    if(SAFE_FORMS[surface]){
      traceEvent('safe-form',{surface,output:SAFE_FORMS[surface]});
      return SAFE_FORMS[surface];
    }
    if(MIXED[surface]){
      traceEvent('mixed-exact',{surface,output:MIXED[surface]});
      return MIXED[surface];
    }
    if(JAPANESE_DISPLAY_OVERRIDES[surface]){
      traceEvent('display-override',{surface,output:JAPANESE_DISPLAY_OVERRIDES[surface]});
      return JAPANESE_DISPLAY_OVERRIDES[surface];
    }
    if(LOAN[surface]){
      traceEvent('loan-exact',{surface,output:LOAN[surface]});
      return LOAN[surface];
    }
    const hanjaEntry=getHanjaEntry(surface);
    if(hanjaEntry){
      traceEvent(
        hanjaEntry.source==='core'?'core-exact':'runtime-exact',
        {surface,output:hanjaEntry.output,source:hanjaEntry.source}
      );
      return hanjaEntry.output;
    }
    return surface;
  }

  // v3.7 centralized safety policy.
  //
  // Different engine roles intentionally have different safety semantics.
  // Centralizing those semantics prevents fallback paths from silently
  // inventing their own interpretation of "safe" while preserving v3.6
  // behavior exactly.
  const SAFETY_ROLES=Object.freeze({
    LEXICAL:'lexical',
    REVIEWED_COMPONENT:'reviewed-component',
    DERIVED_BASE:'derived-base',
    PARTICLE_STEM:'particle-stem',
    COMPOUND_COMPONENT:'compound-component'
  });

  function safetyReason(surface,role){
    if(!surface) return 'empty';

    switch(role){
      case SAFETY_ROLES.COMPOUND_COMPONENT:
        if(PROTECTED.has(surface)) return 'protected';
        if(HINTS[surface]) return 'lexical-hint';
        if(COMPOUND_BLOCKED_PARTS.has(surface)) return 'compound-blocked';
        if(JAPANESE_DISPLAY_OVERRIDES[surface]) return 'display-override';
        return null;

      case SAFETY_ROLES.LEXICAL:
      case SAFETY_ROLES.REVIEWED_COMPONENT:
      case SAFETY_ROLES.DERIVED_BASE:
      case SAFETY_ROLES.PARTICLE_STEM:
        return PROTECTED.has(surface) ? 'protected' : null;

      default:
        throw new Error('unknown safety role: '+role);
    }
  }

  function isUnsafeFor(surface,role){
    return Boolean(safetyReason(surface,role));
  }

  function isUnsafeCompoundPart(part){
    return isUnsafeFor(part,SAFETY_ROLES.COMPOUND_COMPONENT);
  }

  // v4.0 Stage 3 Batch 1 — external-candidate Morphological Firewall.
  //
  // These checks apply only when the winning whole-surface Hanja candidate
  // comes from a runtime dictionary layer. Reviewed core and higher lexical
  // layers keep their existing precedence.
  const FIREWALL_PARTICLES=[...PARTICLES].sort((a,b)=>b.length-a.length);
  const FIREWALL_SUBJECT_PARTICLES=new Set(['이','가']);
  const FIREWALL_PREDICATE_FORMS=new Map();

  for(const lemma of FIREWALL_PREDICATE_LEMMAS||[]){
    if(lemma.endsWith('하다') && lemma.length>2){
      const root=lemma.slice(0,-2);
      for(const form of [
        root+'해',root+'한',root+'하면',root+'하고',root+'해서',root+'하며',
        root+'하다',root+'하는',root+'했다',root+'합니다'
      ]){
        FIREWALL_PREDICATE_FORMS.set(form,lemma);
      }
      continue;
    }
    if(lemma.endsWith('다') && lemma.length>1){
      const stem=lemma.slice(0,-1);
      for(const form of [lemma,stem+'면',stem+'고',stem+'서',stem+'며']){
        FIREWALL_PREDICATE_FORMS.set(form,lemma);
      }
    }
  }

  function withoutTrace(fn){
    const saved=ACTIVE_TRACE;
    ACTIVE_TRACE=null;
    try{
      return fn();
    }finally{
      ACTIVE_TRACE=saved;
    }
  }

  function winningRuntimeEntry(surface){
    if(isUnsafeFor(surface,SAFETY_ROLES.LEXICAL)) return null;
    if(HINTS[surface]||SAFE_FORMS[surface]||MIXED[surface]) return null;
    if(JAPANESE_DISPLAY_OVERRIDES[surface]||LOAN[surface]) return null;
    const entry=getHanjaEntry(surface);
    return entry && entry.source!=='core' ? entry : null;
  }

  function particleDecompositions(surface,maxDepth=2){
    const out=[];
    function rec(current,parts,depth){
      if(depth>=maxDepth) return;
      for(const particle of FIREWALL_PARTICLES){
        if(current.length<=particle.length || !current.endsWith(particle)) continue;
        const base=current.slice(0,-particle.length);
        const nextParts=[particle,...parts];
        out.push({base,particles:nextParts,suffix:nextParts.join('')});
        rec(base,nextParts,depth+1);
      }
    }
    rec(surface,[],0);
    return out;
  }

  function validatedParticleBase(base){
    if(FIREWALL_GRAMMATICAL_BASES && FIREWALL_GRAMMATICAL_BASES.has(base)){
      return {output:base,proof:'grammatical-base',holdOnly:true};
    }
    if(isUnsafeFor(base,SAFETY_ROLES.PARTICLE_STEM)) return null;

    return withoutTrace(()=>{
      const derived=convertDerived(base);
      if(derived!==base) return {output:derived,proof:'derived',holdOnly:false};

      const partial=topLevelPartialCompose(base);
      if(partial!==base) return {output:partial,proof:'partial-composition',holdOnly:false};

      const headed=transparentHeadFallback(base);
      if(headed!==base) return {output:headed,proof:'semantic-head',holdOnly:false};

      return null;
    });
  }

  function resolveRuntimeExternalCandidate(surface){
    const entry=winningRuntimeEntry(surface);
    if(!entry) return null;

    // R2 — Predicate / adnominal inflection precedence.
    // Predicate legitimacy comes from a positive lemma registry; suffix shape
    // alone never suppresses an external candidate.
    const lemma=FIREWALL_PREDICATE_FORMS.get(surface);
    if(lemma){
      const decision={
        output:surface,
        type:'runtime-firewall-predicate',
        source:entry.source,
        candidate:entry.output,
        lemma,
        action:'hold'
      };
      traceEvent(decision.type,{
        surface,source:decision.source,candidate:decision.candidate,
        lemma,action:decision.action,output:decision.output
      });
      return decision;
    }

    // R1 — Grammatical boundary precedence.
    // Up to two particles may form one grammatical tail (e.g. 보다+는).
    // The left side must be independently validated. Subject particles are
    // conservative holds because the whole surface may also be a lexical
    // homograph (e.g. 투자+가 vs 투자가).
    for(const split of particleDecompositions(surface)){
      const proof=validatedParticleBase(split.base);
      if(!proof) continue;

      const finalParticle=split.particles[split.particles.length-1];
      const candidateOutput=normalizeJapaneseGlyphs(entry.output);
      const baseOutput=normalizeJapaneseGlyphs(proof.output);
      const candidatePreservesBase=
        Boolean(baseOutput) &&
        candidateOutput.startsWith(baseOutput);
      const candidateChars=[...candidateOutput];
      const baseChars=[...baseOutput];
      let sharedPrefixLength=0;
      while(
        sharedPrefixLength<candidateChars.length &&
        sharedPrefixLength<baseChars.length &&
        candidateChars[sharedPrefixLength]===baseChars[sharedPrefixLength]
      ){
        sharedPrefixLength++;
      }
      const candidateSharesStableStem=
        baseChars.length>=3 && sharedPrefixLength>=2;
      const candidateDegreeZeroOverlapHold=
        finalParticle==='도' &&
        candidateOutput.endsWith('度') &&
        sharedPrefixLength===0;

      // Only a direct derived-base proof is strong enough to authorize a
      // grammatical split. Partial composition / semantic-head proofs are too
      // weak for suffix disambiguation and remain conservative holds.
      //
      // Even with a direct proof, do not split when the external Hanja
      // candidate preserves the validated base or shares a stable leading
      // lexical stem with it. Phase F F04 showed that whole `高速道路` versus
      // derived base `高速度` must preserve the shared `高速` stem rather than
      // destructively producing `高速度로`.
      const strongSplitProof=proof.proof==='derived';
      const hold=
        proof.holdOnly ||
        FIREWALL_SUBJECT_PARTICLES.has(finalParticle) ||
        candidatePreservesBase ||
        candidateSharesStableStem ||
        candidateDegreeZeroOverlapHold ||
        !strongSplitProof;
      const output=hold ? surface : proof.output+split.suffix;
      const decision={
        output,
        type:'runtime-firewall-particle',
        source:entry.source,
        candidate:entry.output,
        base:split.base,
        particles:split.particles,
        proof:proof.proof,
        strongSplitProof,
        candidatePreservesBase,
        sharedPrefixLength,
        candidateSharesStableStem,
        candidateDegreeZeroOverlapHold,
        action:hold?'hold':'split'
      };
      traceEvent(decision.type,{
        surface,source:decision.source,candidate:decision.candidate,
        base:decision.base,particles:decision.particles,proof:decision.proof,
        strongSplitProof:decision.strongSplitProof,
        candidatePreservesBase:decision.candidatePreservesBase,
        sharedPrefixLength:decision.sharedPrefixLength,
        candidateSharesStableStem:decision.candidateSharesStableStem,
        candidateDegreeZeroOverlapHold:decision.candidateDegreeZeroOverlapHold,
        action:decision.action,output:decision.output
      });
      return decision;
    }

    return null;
  }


  // v4.0 Stage 3 Batch 2 — R3 copula conflict resolver.
  //
  // Do not reinterpret every copula-looking surface. Intervene only when a
  // competing runtime candidate demonstrates the structural collision.
  const FIREWALL_COPULA_SUFFIXES=[
    '이자',
    ...COPULA_SUFFIXES
  ].sort((a,b)=>b.length-a.length);

  function resolveRuntimeCopulaConflict(surface){
    // A reviewed/core whole-surface lexical item keeps precedence.
    const whole=getHanjaEntry(surface);
    if(whole && whole.source==='core') return null;

    for(const suffix of FIREWALL_COPULA_SUFFIXES){
      if(surface.length<=suffix.length || !surface.endsWith(suffix)) continue;
      const base=surface.slice(0,-suffix.length);

      // -이자 is ambiguous with lexical 이자=利子. If an external 이자
      // candidate exists and the whole surface itself is not a reviewed/core
      // lexical entry, prefer the grammatical interpretation conservatively.
      if(suffix==='이자'){
        const component=getHanjaEntry('이자');
        if(component && component.source!=='core'){
          const decision={
            output:surface,
            type:'runtime-firewall-copula',
            source:component.source,
            candidate:component.output,
            base,
            suffix,
            conflictSurface:'이자',
            action:'hold'
          };
          traceEvent(decision.type,{
            surface,source:decision.source,candidate:decision.candidate,
            base,suffix,conflictSurface:decision.conflictSurface,
            action:decision.action,output:decision.output
          });
          return decision;
        }
        continue;
      }

      // Prefer the longer explicit copula analysis over a shorter contracted
      // -다/-였다 analysis only when that shorter analysis would turn a
      // longer noun into an external runtime exact candidate.
      for(const contracted of CONTRACTED_COPULA_SUFFIXES){
        if(contracted.length>=suffix.length) continue;
        if(!surface.endsWith(contracted)) continue;
        const competingNoun=surface.slice(0,-contracted.length);
        const competing=getHanjaEntry(competingNoun);
        if(!competing || competing.source==='core') continue;

        const decision={
          output:surface,
          type:'runtime-firewall-copula',
          source:competing.source,
          candidate:competing.output,
          base,
          suffix,
          conflictSurface:competingNoun,
          contractedSuffix:contracted,
          action:'hold'
        };
        traceEvent(decision.type,{
          surface,source:decision.source,candidate:decision.candidate,
          base,suffix,conflictSurface:decision.conflictSurface,
          contractedSuffix:contracted,action:decision.action,output:decision.output
        });
        return decision;
      }
    }

    return null;
  }

  // v4.0 Stage 3 Batch 2 — R4 numeric unit/counter precedence.
  //
  // This validator is used only under direct Arabic-numeric context. It does
  // not globally reinterpret words that merely end in unit-like syllables.
  const FIREWALL_NUMERIC_MAGNITUDES=Object.freeze({
    '백':'百','천':'千','만':'万','억':'億','조':'兆'
  });
  const FIREWALL_NUMERIC_UNITS=Object.freeze({
    '원':'円','명':'名','개':'個','건':'件','회':'回',
    '년':'年','월':'月','일':'日','시':'時','분':'分','초':'秒',
    '개월':'個月'
  });
  const FIREWALL_NUMERIC_SUFFIXES=[
    ...FIREWALL_PARTICLES,
    ...COPULA_SUFFIXES,
    ...CONTRACTED_COPULA_SUFFIXES
  ].sort((a,b)=>b.length-a.length);

  function expectedNumericDisplay(surface){
    if(FIREWALL_NUMERIC_UNITS[surface]) return FIREWALL_NUMERIC_UNITS[surface];

    const chars=[...surface];
    for(let split=1;split<chars.length;split++){
      const left=chars.slice(0,split);
      const unit=chars.slice(split).join('');
      if(!FIREWALL_NUMERIC_UNITS[unit]) continue;
      if(!left.every(ch=>FIREWALL_NUMERIC_MAGNITUDES[ch])) continue;
      return left.map(ch=>FIREWALL_NUMERIC_MAGNITUDES[ch]).join('')+
        FIREWALL_NUMERIC_UNITS[unit];
    }
    return null;
  }

  function numericRootCandidates(surface){
    const rows=[{root:surface,suffix:''}];
    for(const suffix of FIREWALL_NUMERIC_SUFFIXES){
      if(surface.length<=suffix.length || !surface.endsWith(suffix)) continue;
      rows.push({root:surface.slice(0,-suffix.length),suffix});
    }
    return rows;
  }

  function resolveRuntimeNumericConflict(surface,context){
    if(!context || !context.numericBefore) return null;

    for(const row of numericRootCandidates(surface)){
      const expected=expectedNumericDisplay(row.root);
      if(!expected) continue;

      const entry=getHanjaEntry(row.root);
      if(!entry || entry.source==='core') continue;

      const candidate=normalizeJapaneseGlyphs(entry.output);
      const normalizedExpected=normalizeJapaneseGlyphs(expected);

      // Candidate already agrees with the structural numeric reading.
      if(candidate===normalizedExpected) return null;

      const decision={
        output:surface,
        type:'runtime-firewall-numeric',
        source:entry.source,
        candidate:entry.output,
        expected:normalizedExpected,
        root:row.root,
        suffix:row.suffix,
        action:'hold'
      };
      traceEvent(decision.type,{
        surface,source:decision.source,candidate:decision.candidate,
        expected:decision.expected,root:decision.root,suffix:decision.suffix,
        action:decision.action,output:decision.output
      });
      return decision;
    }

    return null;
  }


  // v4.2 composition guard. A composed surface must not end in a runtime-dictionary component that has
  // swallowed a particle: a two-syllable component whose last syllable is a particle syllable and whose first
  // syllable is either a particle (과의, 와의) or a one-syllable noun suffix (실로, 관은, 관이). Such components
  // are obscure homographs (果毅, 失路, 官銀, 貫耳); the composition is refused so the eojeol stays in Hangul or
  // is handled by particle stripping.
  const COMPOSE_TAIL_PARTICLE_SYLLABLES=new Set(['은','는','이','가','을','를','의','에','와','과','도','로']);
  const COMPOSE_TAIL_NOUN_SUFFIXES=new Set(['관','실','원','국','처','청','소','단','층','동','권','장','과']);
  // v4.2: partial composition must not end with an unknown tail of one syllable + particle when that syllable
  // continues the preceding runtime component into another dictionary word (法務+部長+관은, where 장관 is the
  // real word). Particle/copula tails (로는, 과는, 라는) and plural 들 are ordinary.
  const COPULA_TAILS=new Set([...COPULA_SUFFIXES,...CONTRACTED_COPULA_SUFFIXES,'라는','라도','라고','라면']);
  function unknownNounParticleTail(parts){
    const tail=parts[parts.length-1], prev=parts[parts.length-2];
    if(!tail || tail.type!=='unknown' || !prev || prev.type!=='runtime') return false;
    const syl=[...tail.surface];
    if(syl.length!==2 || !COMPOSE_TAIL_PARTICLE_SYLLABLES.has(syl[1])) return false;
    if(syl[0]==='들' || COMPOSE_TAIL_PARTICLE_SYLLABLES.has(syl[0]) || PARTICLE_RUNS_ALL.has(tail.surface) || COPULA_TAILS.has(tail.surface)) return false;
    const bridge=[...prev.surface].slice(-1)[0]+syl[0];
    return Boolean(getHanjaEntry(bridge));
  }
  const PARTICLE_RUNS_ALL=new Set(PARTICLES);
  function swallowsParticleTail(parts){
    const last=parts[parts.length-1];
    if(!last || last.type!=='runtime') return false;
    const syl=[...last.surface];
    if(syl.length!==2 || !COMPOSE_TAIL_PARTICLE_SYLLABLES.has(syl[1])) return false;
    return COMPOSE_TAIL_PARTICLE_SYLLABLES.has(syl[0]) || COMPOSE_TAIL_NOUN_SUFFIXES.has(syl[0]);
  }

  // v3.5 generic composition.
  //
  // This is deliberately below exact lexical layers and reviewed compounds.
  // It only composes already-known core / loanword components and refuses
  // ambiguous best segmentations. One-syllable core components are excluded;
  // one-syllable loanwords such as 팀 may participate.
  function genericCompose(surface){
    if(!surface || isUnsafeFor(surface,SAFETY_ROLES.DERIVED_BASE)) return surface;

    // v3.5 safety: do not segment an unknown surface while a Korean
    // particle may still be attached. Otherwise e.g. 가능성과 can be
    // misread as 가능+성과 instead of 가능성+과.
    // splitKnownParticleForm() gets the next chance and calls
    // convertDerived() again on the stripped stem.
    // Only defer to particle stripping when removing a particle-like
    // suffix actually exposes a convertible stem. A blanket suffix check is
    // too broad because lexical compounds may legitimately end in syllables
    // such as 과 (e.g. 결과).
    for(const p of PARTICLES){
      if(surface.length<=p.length || !surface.endsWith(p)) continue;
      const particleStem=surface.slice(0,-p.length);
      if(isUnsafeFor(particleStem,SAFETY_ROLES.PARTICLE_STEM)) continue;
      const convertedStem=convertDerived(particleStem);
      if(convertedStem!==particleStem) return surface;
    }

    const chars=[...surface];
    const n=chars.length;
    if(n<2) return surface;

    const memo=new Map();

    function component(part){
      if(isUnsafeCompoundPart(part)) return null;

      const hanjaEntry=getHanjaEntry(part);
      if(hanjaEntry){
        if([...part].length<2) return null;
        return {
          surface:part,
          output:hanjaEntry.output,
          type:hanjaEntry.source==='core'?'core':'runtime',
          source:hanjaEntry.source
        };
      }

      if(LOAN[part]){
        return {surface:part,output:LOAN[part],type:'loan'};
      }

      // A reviewed exact compound is already an explicitly approved lexical
      // surface. Reuse it as a component without promoting it to core.
      if(REVIEWED_COMPOUND_FORMS[part]){
        return {
          surface:part,
          output:REVIEWED_COMPOUND_FORMS[part],
          type:'reviewed'
        };
      }

      return null;
    }

    function rec(i){
      if(i===n) return [[]];
      if(memo.has(i)) return memo.get(i);

      const rows=[];

      for(let j=i+1;j<=n;j++){
        const part=chars.slice(i,j).join('');

        // The whole surface is not a "component"; exact lookup already ran.
        if(i===0 && j===n) continue;

        const c=component(part);
        if(!c) continue;

        for(const rest of rec(j)){
          rows.push([c,...rest]);
        }
      }

      memo.set(i,rows);
      return rows;
    }

    const candidates=rec(0).filter(parts=>parts.length>=2);
    if(!candidates.length) return surface;

    function score(parts){
      return {
        count:parts.length,
        square:parts.reduce(
          (sum,x)=>sum+([...x.surface].length ** 2),
          0
        )
      };
    }

    const ranked=candidates
      .map(parts=>({parts,score:score(parts)}))
      .sort((a,b)=>
        a.score.count-b.score.count ||
        b.score.square-a.score.square
      );

    const best=ranked[0];

    if(ranked.length>1){
      const tied=ranked.filter(row=>
        row.score.count===best.score.count &&
        row.score.square===best.score.square
      );

      if(tied.length>1){
        const outputs=new Set(
          tied.map(row=>row.parts.map(x=>x.output).join(''))
        );
        if(outputs.size>1) return surface;
      }
    }

    // v4.2 guard: refuse (never promote a lower-ranked segmentation).
    if(swallowsParticleTail(best.parts)){
      traceEvent('composition-guard',{surface,stage:'generic'});
      return surface;
    }

    const output=best.parts.map(x=>x.output).join('');
    traceEvent('generic-composition',{
      surface,
      output,
      parts:best.parts.map(x=>({
        surface:x.surface,
        type:x.type,
        source:x.source||x.type
      }))
    });
    return output;
  }

  function convertDerived(stem){
    const direct=lexicalConvert(stem);
    if(direct!==stem) return direct;

    // Reviewed surface-specific compounds for cases where at least one component
    // is ambiguous or unsafe as a standalone lexical item.
    if(REVIEWED_COMPOUND_FORMS[stem]){
      traceEvent('reviewed-exact',{surface:stem,output:REVIEWED_COMPOUND_FORMS[stem]});
      return REVIEWED_COMPOUND_FORMS[stem];
    }

    // Reviewed compound segmentation. Each surface is explicitly reviewed,
    // while the displayed parts are resolved through the existing lexical layers.
    const reviewedParts=REVIEWED_COMPOUND_PARTS[stem];
    if(reviewedParts){
      let out='';
      let safe=true;
      for(const part of reviewedParts){
        if(isUnsafeFor(part,SAFETY_ROLES.REVIEWED_COMPONENT)){ safe=false; break; }
        const c=lexicalConvert(part);
        if(c===part){ safe=false; break; }
        out+=c;
      }
      if(safe){
        traceEvent('reviewed-parts',{surface:stem,parts:reviewedParts,output:out});
        return out;
      }
    }

    // v3.5: generic composition from independently known safe components.
    // Exact / hint / override / reviewed compound layers above always win.
    const composed=genericCompose(stem);
    if(composed!==stem) return composed;

    // Productive Sino-Korean noun formation. Only applies when the base is already safe.
    if(stem.endsWith('들') && stem.length>1){
      const base=stem.slice(0,-1), c=convertDerived(base);
      if(c!==base){
        const output=c+'들';
        traceEvent('productive-plural',{surface:stem,base,output});
        return output;
      }
    }
    const productive=[['자','者'],['성','性'],['적','的'],['화','化']];
    for(const [suffix,out] of productive){
      if(stem.length<=suffix.length||!stem.endsWith(suffix)) continue;
      const base=stem.slice(0,-suffix.length);
      if(isUnsafeFor(base,SAFETY_ROLES.DERIVED_BASE)) continue;
      const c=lexicalConvert(base);
      if(c!==base){
        const output=c+out;
        traceEvent('productive-suffix',{surface:stem,base,suffix,output});
        return output;
      }
    }

    // v3.5: productive suffixes may attach to a compound base.
    // Require a base of at least two Hangul syllables and only reuse an
    // already-safe derived conversion of that base.
    const compositionalProductive=[
      ['별','別',2],
      ['량','量',2],
      ['률','率',3],
      ['율','率',3]
    ];
    for(const [suffix,out,minBaseLength] of compositionalProductive){
      if(stem.length<=suffix.length||!stem.endsWith(suffix)) continue;
      const base=stem.slice(0,-suffix.length);
      if([...base].length<minBaseLength || isUnsafeFor(base,SAFETY_ROLES.DERIVED_BASE)) continue;
      const c=convertDerived(base);
      if(c!==base){
        const output=c+out;
        traceEvent('compositional-productive-suffix',{surface:stem,base,suffix,output});
        return output;
      }

      // v3.6: one extra structural layer is allowed when the productive
      // suffix base itself has a stable semantic head. The unknown prefix
      // remains untouched; transparentHeadFallback() is non-recursive.
      const headedBase=transparentHeadFallback(base);
      if(headedBase!==base){
        const output=headedBase+out;
        traceEvent('semantic-head-plus-suffix',{surface:stem,base,suffix,output});
        return output;
      }
    }

    // v3.5: productive terminal forms. These operate on an already-safe
    // derived base. -표 is read as 表 in compound-final position; native
    // Korean -값 is preserved rather than translated.
    const terminalForms=[
      ['표','表',2]
    ];
    for(const [suffix,out,minBaseLength] of terminalForms){
      if(stem.length<=suffix.length||!stem.endsWith(suffix)) continue;
      const base=stem.slice(0,-suffix.length);
      if([...base].length<minBaseLength || isUnsafeFor(base,SAFETY_ROLES.DERIVED_BASE)) continue;
      const c=convertDerived(base);
      if(c!==base){
        const output=c+out;
        traceEvent('terminal-form',{surface:stem,base,suffix,output});
        return output;
      }
    }

    // Productive mixed form: safe Sino-Korean base + common loanword suffix.
    // e.g. 연구팀 -> 研究チーム, but only when the base itself is already safe.
    if(LOAN['팀'] && stem.endsWith('팀') && stem.length>1){
      const base=stem.slice(0,-1);
      if(!isUnsafeFor(base,SAFETY_ROLES.DERIVED_BASE)){
        const c=lexicalConvert(base);
        if(c!==base){
          const output=c+LOAN['팀'];
          traceEvent('mixed-loan-suffix',{surface:stem,base,suffix:'팀',output});
          return output;
        }
      }
    }

    for(const [prefix,out,rests] of MIXED_PREFIX_RULES){
      if(stem.startsWith(prefix)){
        const rest=stem.slice(prefix.length);
        if(rests.has(rest)){
          const output=out+rest;
          traceEvent('mixed-prefix',{surface:stem,prefix,rest,output});
          return output;
        }
      }
    }

    // Noun + copula. The noun must be a known safe lexeme.
    for(const suffix of COPULA_SUFFIXES){
      if(stem.length<=suffix.length || !stem.endsWith(suffix)) continue;
      const noun=stem.slice(0,-suffix.length);
      if(isUnsafeFor(noun,SAFETY_ROLES.DERIVED_BASE)) continue;
      const hanjaEntry=getHanjaEntry(noun);
      if(hanjaEntry){
        const output=hanjaEntry.output+suffix;
        traceEvent('copula',{surface:stem,noun,suffix,output,source:hanjaEntry.source});
        return output;
      }
      if(LOAN[noun]){
        const output=LOAN[noun]+suffix;
        traceEvent('copula',{surface:stem,noun,suffix,output});
        return output;
      }
    }

    // Contracted noun + copula after a vowel-final known safe noun.
    // e.g. 과제다 -> 課題다, 과제였다 -> 課題였다.
    // Keep this separate from COPULA_SUFFIXES because bare -다 is too broad.
    for(const suffix of CONTRACTED_COPULA_SUFFIXES){
      if(stem.length<=suffix.length || !stem.endsWith(suffix)) continue;
      const noun=stem.slice(0,-suffix.length);
      if(isUnsafeFor(noun,SAFETY_ROLES.DERIVED_BASE) || !hasNoFinalConsonantHangul(noun)) continue;
      const hanjaEntry=getHanjaEntry(noun);
      if(hanjaEntry){
        const output=hanjaEntry.output+suffix;
        traceEvent('contracted-copula',{surface:stem,noun,suffix,output,source:hanjaEntry.source});
        return output;
      }
      if(LOAN[noun]){
        const output=LOAN[noun]+suffix;
        traceEvent('contracted-copula',{surface:stem,noun,suffix,output});
        return output;
      }
    }

    // Productive noun + 받다, but only for explicitly reviewed safe bases.
    // This stays separate from VERBAL_PREFIXES so 받다 never becomes a global suffix.
    for(const base of RECEIVE_PASSIVE_BASES){
      if(!stem.startsWith(base)) continue;
      const rest=stem.slice(base.length);
      if(!rest.startsWith('받')) continue;
      if(isUnsafeFor(base,SAFETY_ROLES.DERIVED_BASE)) continue;
      const converted=lexicalConvert(base);
      if(converted!==base){
        const output=converted+rest;
        traceEvent('receive-passive',{surface:stem,base,rest,output});
        return output;
      }
    }

    // Hanja noun/root + highly constrained verbal or derivational suffix.
    for(const k of CONVERTIBLE_KEYS){
      if(isUnsafeFor(k,SAFETY_ROLES.DERIVED_BASE) || !stem.startsWith(k)) continue;
      const rest=stem.slice(k.length);
      if(!rest) continue;
      const safeVerb=VERBAL_EXACT.has(rest) || VERBAL_PREFIXES.some(p=>rest.startsWith(p));

      if(
        safeVerb ||
        DERIVATIONAL_SUFFIXES.has(rest)
      ){
        const converted=lexicalConvert(k);

        if(converted!==k){
          const output=converted+rest;
          traceEvent('verbal-or-derivational',{surface:stem,base:k,rest,output});
          return output;
        }
      }
    }
    return stem;
  }

  function splitKnownParticleForm(token){
    if(isUnsafeFor(token,SAFETY_ROLES.PARTICLE_STEM)) return null;
    // Crucial v0.9 rule: do not strip a particle merely because the remainder happens
    // to be a dictionary word. Known ambiguous stems can be protected in protected.tsv.
    for(const p of PARTICLES){
      if(token.length<=p.length || !token.endsWith(p)) continue;
      const stem=token.slice(0,-p.length);
      if(isUnsafeFor(stem,SAFETY_ROLES.PARTICLE_STEM)) continue;
      const converted=convertDerived(stem);
      if(converted!==stem){
        traceEvent('particle-strip',{surface:token,stem,particle:p,output:converted+p});
        return [converted,p];
      }
    }
    return null;
  }


  // v3.5 conservative partial composition.
  //
  // This is a top-level fallback only. It never participates in recursive
  // derivation. Exactly one unknown edge component may remain unchanged, and
  // at least two independently safe core/reviewed components must be present.
  // Loanword components are excluded because homographs such as 배치 can be
  // misread as the loanword "batch" inside an otherwise Korean compound.
  function topLevelPartialCompose(surface){
    if(!surface || isUnsafeFor(surface,SAFETY_ROLES.DERIVED_BASE)) return surface;

    const chars=[...surface];
    const n=chars.length;
    if(n<4) return surface;

    function component(part){
      if(isUnsafeCompoundPart(part)) return null;

      const hanjaEntry=getHanjaEntry(part);
      if(hanjaEntry){
        if([...part].length<2) return null;
        return {
          surface:part,
          output:hanjaEntry.output,
          type:hanjaEntry.source==='core'?'core':'runtime',
          source:hanjaEntry.source
        };
      }

      if(REVIEWED_COMPOUND_FORMS[part]){
        return {
          surface:part,
          output:REVIEWED_COMPOUND_FORMS[part],
          type:'reviewed'
        };
      }

      return null;
    }

    const rows=[];

    function rec(i,parts,unknowns){
      if(i===n){
        const unknownIndex=parts.findIndex(x=>x.type==='unknown');
        const knownCount=parts.filter(x=>x.type!=='unknown').length;

        if(
          unknowns===1 &&
          knownCount>=2 &&
          (unknownIndex===0 || unknownIndex===parts.length-1)
        ){
          rows.push([...parts]);
        }
        return;
      }

      for(let j=i+1;j<=n;j++){
        const part=chars.slice(i,j).join('');
        const c=component(part);

        if(c){
          parts.push(c);
          rec(j,parts,unknowns);
          parts.pop();
        }

        if(unknowns===0 && [...part].length>=2){
          if(!isUnsafeCompoundPart(part)){
            parts.push({surface:part,output:part,type:'unknown'});
            rec(j,parts,1);
            parts.pop();
          }
        }
      }
    }

    rec(0,[],0);
    if(!rows.length) return surface;

    function score(parts){
      return {
        count:parts.length,
        unknownLength:[...parts.find(x=>x.type==='unknown').surface].length,
        square:parts.reduce(
          (sum,x)=>sum+([...x.surface].length ** 2),
          0
        )
      };
    }

    const ranked=rows
      .map(parts=>({parts,score:score(parts)}))
      .sort((a,b)=>
        a.score.count-b.score.count ||
        a.score.unknownLength-b.score.unknownLength ||
        b.score.square-a.score.square
      );

    const best=ranked[0];

    if(ranked.length>1){
      const second=ranked[1];
      if(
        best.score.count===second.score.count &&
        best.score.unknownLength===second.score.unknownLength &&
        best.score.square===second.score.square
      ){
        return surface;
      }
    }

    // v4.2 guards refuse the chosen segmentation; they never promote a lower-ranked one.
    if(swallowsParticleTail(best.parts) || unknownNounParticleTail(best.parts)){
      traceEvent('composition-guard',{surface,stage:'partial'});
      return surface;
    }

    const output=best.parts.map(x=>x.output).join('');
    traceEvent('partial-composition',{
      surface,
      output,
      parts:best.parts.map(x=>({
        surface:x.surface,
        type:x.type,
        source:x.source||x.type
      }))
    });
    return output;
  }


  // v3.5 transparent semantic-head fallback.
  //
  // Apply only after exact, particle, and conservative partial composition
  // have all failed. Preserve the unresolved modifier/prefix exactly as Hangul
  // and expose only a small class of semantically transparent compound heads.
  // This must not participate in recursive derivation.
  function transparentHeadFallback(surface){
    if(!surface || isUnsafeFor(surface,SAFETY_ROLES.DERIVED_BASE)) return surface;

    // Lexicalized/native forms whose final syllables happen to match a
    // transparent Sino-Korean head must remain intact.
    const blockedSurfaces=new Set(['비밀번호','예매내역','출금예정일']);
    if(blockedSurfaces.has(surface)) return surface;

    const heads=[
      '기간','자료','기록','상태','기준','조건','변화','농도','사용량','창구','계약서','기능',
      '결과','계획','내역','예정일','예정','기한','수량','효율','제한','규정','번호','서류',
      '정보','위험','훈련','현황','잔액','시간'
    ];
    const reviewedHeads=['접수번호','측정소'];
    const reviewedHeadOutputs=Object.freeze({
      '진행률':'進行率',
      '발생률':'発生率',
      '내역서':'内訳書',
      '명세서':'明細書',
      '체계':'体系',
      '점검표':'点検表',
      '발전량':'発電量',
      '계좌':'口座',
      '목록':'目録',
      '변경안':'変更案',
      '허가서':'許可書',
      '수칙':'守則',
      '교체시기':'交替時期',
      '절차':'節次：手続',
      '주기':'周期',
      '일정':'日程',
      '지급일정':'支給日程',
      '발생시':'発生時'
    });
    const loanHeads=['시스템','파일','프로그램'];
    const semanticHeadGuards=Object.freeze({
      '시간':{
        minPrefixLength:2,
        blockedSurfaces:new Set(['막차시간','실시간'])
      },
      '예정':{
        minPrefixLength:2,
        blockedSurfaces:new Set()
      },
      '절차':{
        minPrefixLength:2,
        blockedSurfaces:new Set(['자동복구절차'])
      },
      '주기':{
        minPrefixLength:2,
        requireConvertiblePrefix:true,
        blockedSurfaces:new Set()
      },
      '일정':{
        minPrefixLength:2,
        requireConvertiblePrefix:true,
        blockedSurfaces:new Set(['문화행사일정'])
      }
    });

    const orderedHeads=[
      ...heads,
      ...reviewedHeads,
      ...Object.keys(reviewedHeadOutputs),
      ...loanHeads
    ].sort((a,b)=>[...b].length-[...a].length);

    for(const head of orderedHeads){
      if(surface.length<=head.length || !surface.endsWith(head)) continue;

      const prefix=surface.slice(0,-head.length);
      if(isUnsafeCompoundPart(prefix)) continue;

      const guard=semanticHeadGuards[head];
      if(guard){
        if([...prefix].length<guard.minPrefixLength) continue;
        if(guard.blockedSurfaces.has(surface)) continue;
        if(guard.requireConvertiblePrefix){
          const prefixConverted=convertDerived(prefix);
          if(prefixConverted===prefix) continue;
        }
      }

      const hanjaHead=getHanjaEntry(head);
      const output=
        reviewedHeadOutputs[head] ||
        (hanjaHead&&hanjaHead.output) ||
        LOAN[head] ||
        REVIEWED_COMPOUND_FORMS[head];
      if(!output) continue;
      const source=
        reviewedHeadOutputs[head] ? 'reviewed-head' :
        hanjaHead ? hanjaHead.source :
        LOAN[head] ? 'loan' :
        'reviewed';
      const result=prefix+output;
      traceEvent('semantic-head',{surface,prefix,head,output:result,source});
      return result;
    }

    return surface;
  }


  // v3.5 particle-aware fallback for conservative partial composition and
  // transparent semantic heads. This runs only after ordinary particle
  // stripping through convertDerived() has failed, so established lexical
  // conversions retain priority.
  function splitFallbackParticleForm(token){
    if(isUnsafeFor(token,SAFETY_ROLES.PARTICLE_STEM)) return null;

    for(const p of PARTICLES){
      if(token.length<=p.length || !token.endsWith(p)) continue;

      const stem=token.slice(0,-p.length);
      if(isUnsafeFor(stem,SAFETY_ROLES.PARTICLE_STEM)) continue;

      const partial=topLevelPartialCompose(stem);
      if(partial!==stem){
        traceEvent('fallback-particle-partial',{surface:token,stem,particle:p,output:partial+p});
        return [partial,p];
      }

      const headed=transparentHeadFallback(stem);
      if(headed!==stem){
        traceEvent('fallback-particle-semantic-head',{surface:token,stem,particle:p,output:headed+p});
        return [headed,p];
      }
    }

    return null;
  }

  // v4.2: a Hangul run that is only a particle and follows non-Hangul text inside the eojeol (e.g. the 와의 in
  // 라이너(Liner)와의) is grammar, never a word.
  const PARTICLE_RUNS=new Set(PARTICLES);
  function convertHangulRun(run,context=null){
    if(context && context.start>0 && PARTICLE_RUNS.has(run)){
      traceEvent('particle-run-guard',{surface:run});
      return run;
    }
    // v4.2: right after a converted magnitude (100万대가), 대 is a counter (台/代), never the start of a word.
    if(context && context.start>0 && /[千万億兆余]/u.test(context.raw[context.start-1]) && run.startsWith('대')){
      traceEvent('numeric-counter-guard',{surface:run});
      return run;
    }
    const numericConflict=resolveRuntimeNumericConflict(run,context);
    if(numericConflict) return numericConflict.output;

    const copulaConflict=resolveRuntimeCopulaConflict(run);
    if(copulaConflict) return copulaConflict.output;

    const firewalled=resolveRuntimeExternalCandidate(run);
    if(firewalled) return firewalled.output;

    const direct=convertDerived(run);
    if(direct!==run) return direct;

    const split=splitKnownParticleForm(run);
    if(split) return split[0]+split[1];

    const fallbackSplit=splitFallbackParticleForm(run);
    if(fallbackSplit) return fallbackSplit[0]+fallbackSplit[1];

    const partial=topLevelPartialCompose(run);
    if(partial!==run) return partial;

    const headed=transparentHeadFallback(run);
    if(headed!==run) return headed;

    traceEvent('no-conversion',{surface:run});
    return run;
  }

  function hanjaizeToken(raw){
    return raw.replace(/[가-힣]+/gu,(run,offset)=>{
      const before=offset>0 ? raw[offset-1] : '';
      return convertHangulRun(run,{
        raw,
        start:offset,
        numericBefore:/[0-9]/u.test(before)
      });
    });
  }
  // MV1 (docs/MV1-VETO-CYCLE-PREREGISTRATION.md): hold-only, whole-eojeol morphology veto applied
  // after every other conversion step. It can only restore input tokens; it never converts.
  function applyMorphologyVeto(input,output){
    const result=MORPHOLOGY_VETO.apply(input,output);
    for(const veto of result.vetoes){
      traceEvent('morphology-veto',{surface:veto.source,source:veto.source,candidate:veto.output,mask:veto.mask});
    }
    if(result.skipped&&result.skipped!=='disabled') traceEvent('morphology-veto-skipped',{reason:result.skipped});
    return result.output;
  }

  // v4.4 whitespace preservation: a context rule may change words, never the whitespace between them.
  // Rule templates write a single ' ' where the pattern matched \s+; the input's own whitespace runs are put
  // back in order. If the number of runs differs, the rule is not applied (hold-only).
  const WHITESPACE_RUN=/\s+/gu;
  function expandReplacement(rep,args){
    if(typeof rep==='function') return rep(...args);
    let groups=args.length-3;
    if(typeof args[args.length-1]==='object'&&args[args.length-1]!==null) groups--;
    return rep.replace(/\$(\$|&|\d{1,2})/gu,(token,ref)=>{
      if(ref==='$') return '$';
      if(ref==='&') return args[0];
      if(ref.length===2&&Number(ref)>=1&&Number(ref)<=groups) return args[Number(ref)]??'';
      const one=Number(ref[0]);
      if(one>=1&&one<=groups) return (args[one]??'')+ref.slice(1);
      return token;
    });
  }
  function keepWhitespace(match,replacement){
    const source=match.match(WHITESPACE_RUN)||[];
    const target=replacement.match(WHITESPACE_RUN)||[];
    if(source.length!==target.length) return match;
    let k=0;
    return replacement.replace(WHITESPACE_RUN,()=>source[k++]);
  }
  function applyContextRule(text,re,rep){
    return text.replace(re,(...args)=>keepWhitespace(args[0],expandReplacement(rep,args)));
  }

  function hanjaize(text){
    let prepared=normalize(text);
    const vetoInput=prepared;
    for(const [src,dst] of PHRASES){
      const next=prepared.replaceAll(src,dst);
      if(next!==prepared) traceEvent('phrase',{source:src,output:dst});
      prepared=next;
    }
    for(let i=0;i<CONTEXT_RULES.length;i++){
      const {re,rep}=CONTEXT_RULES[i];
      const next=applyContextRule(prepared,re,rep);
      if(next!==prepared) traceEvent('context',{index:i,pattern:String(re)});
      prepared=next;
    }
    const converted=prepared.split(/(\s+)/).map(x=>/[가-힣]/u.test(x)?hanjaizeToken(x):x).join('');
    // Final normalization is deliberately centralized here so every output path
    // (core dictionary, runtime dictionaries, phrases, mixed forms, context rules)
    // is guaranteed to use Japanese-standard glyphs.
    return applyMorphologyVeto(vetoInput,normalizeJapaneseGlyphs(converted));
  }

  function inspectSafety(surface){
    const normalized=normalize(surface);
    return Object.freeze({
      surface:normalized,
      lexical:safetyReason(normalized,SAFETY_ROLES.LEXICAL),
      reviewedComponent:safetyReason(normalized,SAFETY_ROLES.REVIEWED_COMPONENT),
      derivedBase:safetyReason(normalized,SAFETY_ROLES.DERIVED_BASE),
      particleStem:safetyReason(normalized,SAFETY_ROLES.PARTICLE_STEM),
      compoundComponent:safetyReason(normalized,SAFETY_ROLES.COMPOUND_COMPONENT)
    });
  }

  function traceHanjaize(text){
    if(ACTIVE_TRACE) throw new Error('traceHanjaize is not re-entrant');
    const events=[];
    ACTIVE_TRACE=events;
    try{
      const output=hanjaize(text);
      return {input:normalize(text),output,events};
    }finally{
      ACTIVE_TRACE=null;
    }
  }

  const {romanize}=ROMANIZER;
  function buildResult(text){const n=normalize(text);if(!n)return'';return[n,hanjaize(n),romanize(n)].join('\n');}

  function refreshDictionary(){
    CONVERTIBLE_KEYS=[
      ...new Set([
        ...allHanjaKeys(),
        ...Object.keys(HINTS)
      ])
    ].sort((a,b)=>b.length-a.length);
  }
  return {
    normalize,normalizeJapaneseGlyphs,hanjaize,traceHanjaize,inspectSafety,
    romanize,buildResult,convertHangulRun,getLexicalHint,refreshDictionary,
    registerRuntimeDictionary,clearRuntimeDictionaries,inspectDictionaryEntry,
    dictionarySize,morphologyVeto:MORPHOLOGY_VETO,_data:DATA
  };
});
