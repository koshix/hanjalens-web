// Hanja Lens v4.0 Interactive Lens presenter.
// Trace-only: this module never decides conversion behavior.
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HanjaLensInteractiveLens=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  'use strict';

  const EVENT_PRIORITY=Object.freeze({
    'morphology-veto':130,
    'runtime-firewall-particle':120,
    'runtime-firewall-predicate':120,
    'runtime-firewall-copula':120,
    'runtime-firewall-numeric':120,
    'particle-strip':112,
    'fallback-particle-partial':111,
    'fallback-particle-semantic-head':111,
    'copula':110,
    'contracted-copula':110,
    'generic-composition':108,
    'partial-composition':108,
    'semantic-head':108,
        'verbal-or-derivational':106,
    'runtime-exact':100,
    'core-exact':100,
    'lexical-hint':95,
    'safe-form':95,
    'mixed-exact':95,
    'display-override':95,
    'loan-exact':95,
    'reviewed-exact':90,
    'reviewed-parts':88,
    'productive-plural':75,
    'productive-suffix':75,
    'compositional-productive-suffix':75,
    'semantic-head-plus-suffix':75,
    'terminal-form':75,
    'mixed-loan-suffix':75,
    'mixed-prefix':75,
    'receive-passive':75,
    'protected':60,
    'no-conversion':10
  });

  const SOURCE_LABELS=Object.freeze({
    core:'reviewed core',
    mit:'MIT',
    'cc-kedict':'CC-KEDICT',
    stdict:'標準辞書'
  });

  function splitWhitespace(text){
    return String(text??'').split(/(\s+)/u).filter(x=>x!=='');
  }

  function lexicalType(event,changed){
    if(!event) return changed?'変換（詳細traceなし）':'未変換';
    if(event.type.startsWith('runtime-firewall-')) return '外部辞書候補を保留';
    if(event.type==='runtime-exact') return '漢字語（外部辞書）';
    if(event.type==='core-exact') return '漢字語（reviewed core）';
    if(event.type==='loan-exact'||event.type==='mixed-loan-suffix') return '外来語';
    if(event.type==='protected') return '保護語';
    if(event.type==='copula'||event.type==='contracted-copula') return '漢字語＋コピュラ';
    if(event.type.includes('particle')) return '漢字語＋助詞';
    if(
      event.type.includes('composition')||
      event.type==='reviewed-parts'||
      event.type==='semantic-head'||
      event.type==='semantic-head-plus-suffix'
    ) return '複合語';
    if(event.type==='no-conversion') return '未変換';
    return changed?'変換':'未変換';
  }

  function provenance(event,events=[]){
    if(!event) return '—';
    if(event.source) return SOURCE_LABELS[event.source]||event.source;

    const sourced=events.find(e=>
      e&&e.source&&(
        e.type==='core-exact'||
        e.type==='runtime-exact'||
        e.type==='copula'||
        e.type==='contracted-copula'
      )
    );
    if(sourced) return SOURCE_LABELS[sourced.source]||sourced.source;

    if(event.type==='reviewed-exact'||event.type==='reviewed-parts') return 'reviewed rule';
    if(event.type==='protected') return 'safety policy';
    if(event.type==='no-conversion') return '—';
    return 'structural rule';
  }

  function reason(event,changed){
    if(!event){
      return changed
        ? '表示は変換されましたが、この語節に対応する個別traceを特定できませんでした。'
        : 'この語節には採用・保留を説明する個別traceがありません。';
    }
    switch(event.type){
      case 'morphology-veto':
        return '形態素拒否表により、変換候補が助詞・語尾・用言にまたがるため、この語節全体を保留しました。';
      case 'runtime-firewall-particle':
        return event.action==='split'
          ? '外部辞書候補より、検証済みの語幹と韓国語助詞の境界を優先しました。'
          : '外部辞書候補と助詞境界が競合するため、安全側で候補を保留しました。';
      case 'runtime-firewall-predicate':
        return '外部辞書候補より、検証済み用言の活用形を優先して候補を保留しました。';
      case 'runtime-firewall-copula':
        return '外部辞書候補より、名詞＋コピュラの解析を優先して候補を保留しました。';
      case 'runtime-firewall-numeric':
        return '数値＋単位・助数詞の構造と辞書候補が一致しないため、候補を保留しました。';
      case 'runtime-exact':
        return '外部辞書候補を採用しました。';
      case 'core-exact':
        return 'reviewed core の登録語を採用しました。';
      case 'protected':
        return '安全規則により変換対象から除外しました。';
      case 'no-conversion':
        return '採用できる変換根拠がないため、そのまま表示しました。';
      case 'loan-exact':
        return '登録済み外来語表記を採用しました。';
      case 'copula':
      case 'contracted-copula':
        return '既知の名詞を変換し、韓国語のコピュラは保持しました。';
      case 'particle-strip':
      case 'fallback-particle-partial':
      case 'fallback-particle-semantic-head':
        return '既知の語幹を変換し、韓国語の助詞は保持しました。';
      default:
        return changed
          ? '既存の変換traceに基づく表示です。'
          : '既存の安全・構造traceに基づき、そのまま表示しました。';
    }
  }

  function eventSurface(event){
    if(!event) return '';
    return event.surface||event.source||'';
  }

  function matchingEvents(token,events){
    return (events||[]).filter(event=>{
      if(event.type==='context') return false;
      const surface=eventSurface(event);
      return Boolean(surface) && token.includes(surface);
    });
  }

  function choosePrimary(events){
    return [...events].sort((a,b)=>
      (EVENT_PRIORITY[b.type]||50)-(EVENT_PRIORITY[a.type]||50)
    )[0]||null;
  }

  function detailFor(inputToken,displayToken,events){
    const matches=matchingEvents(inputToken,events);
    const primary=choosePrimary(matches);
    const changed=inputToken!==displayToken;
    const supportingExact=matches.find(e=>
      e.type==='runtime-exact'||e.type==='core-exact'
    );
    const candidate=primary?.candidate||(
      primary?.type==='runtime-exact'||primary?.type==='core-exact'
        ? primary.output
        : ''
    )||supportingExact?.output||'—';
    return Object.freeze({
      hangul:inputToken,
      display:displayToken,
      lexicalType:lexicalType(primary,changed),
      provenance:provenance(primary,matches),
      candidate,
      reason:reason(primary,changed),
      route:primary?.type||'—',
      status:(primary?.type?.startsWith('runtime-firewall-')||primary?.type==='morphology-veto')
        ? 'hold'
        : (changed?'converted':'unchanged'),
      eventCount:matches.length
    });
  }

  function makeSecondLine(input,output,events){
    const inParts=splitWhitespace(input);
    const outParts=splitWhitespace(output);
    const inWords=inParts.filter(x=>!/^\s+$/u.test(x));
    const outWords=outParts.filter(x=>!/^\s+$/u.test(x));

    if(inWords.length!==outWords.length){
      return {
        alignment:'fallback',
        pieces:[{
          text:output,
          whitespace:false,
          interactive:/[가-힣]/u.test(input),
          detail:detailFor(input,output,events)
        }]
      };
    }

    let wordIndex=0;
    const pieces=[];
    for(const part of outParts){
      if(/^\s+$/u.test(part)){
        pieces.push({text:part,whitespace:true,interactive:false,detail:null});
        continue;
      }
      const original=inWords[wordIndex++]||part;
      pieces.push({
        text:part,
        whitespace:false,
        interactive:/[가-힣]/u.test(original),
        detail:detailFor(original,part,events)
      });
    }
    return {alignment:'word',pieces};
  }

  function buildViewModel({input,output,romanized,events}){
    const normalized=String(input??'').normalize('NFC');
    const converted=String(output??'');
    const roman=String(romanized??'');
    const second=makeSecondLine(normalized,converted,events||[]);
    return Object.freeze({
      input:normalized,
      output:converted,
      romanized:roman,
      secondLine:second,
      copyText:[normalized,converted,roman].join('\n')
    });
  }

  return {buildViewModel};
});
