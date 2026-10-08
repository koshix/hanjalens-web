// Hanja Lens DOM view helpers.
(function(root,factory){
  const api=factory(root.document,root.navigator,root.setTimeout);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HanjaLensAppView=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(document,navigator,setTimeout){
  'use strict';

  function byId(id){return document.getElementById(id);}

  function initVersion(version){
    if(version.version) document.title=`Hanja Lens v${version.version}`;
    const el=byId('appVersion');
    if(el) el.textContent=version.label||'';
  }

  function initStats(data,examples){
    const stats=data.stats||{};
    const values={
      statExamples:examples.length,
      statHanja:stats.hanja??Object.keys(data.hanja||{}).length,
      statLoanwords:stats.loanwords??Object.keys(data.loanwords||{}).length,
      statProtected:stats.protected??Object.keys(data.protected||{}).length,
      statPhrases:stats.phrases??(data.phrases||[]).length,
      statMixed:stats.mixed??Object.keys(data.mixed||{}).length
    };
    for(const [id,value] of Object.entries(values)){
      const el=byId(id);
      if(el) el.textContent=String(value);
    }
  }

  function clearTranslation(){
    const box=byId('translationBox');
    const out=byId('translationOut');
    const note=byId('translationNote');
    if(box){box.hidden=true;box.open=false;}
    if(out) out.textContent='';
    if(note) note.textContent='';
  }

  function showTranslation(result){
    const box=byId('translationBox');
    const out=byId('translationOut');
    const note=byId('translationNote');
    if(out) out.textContent=result.text;
    if(note) note.textContent=result.reviewed?'収録例文の確認済み和訳':'自動生成された参考訳';
    if(box) box.hidden=false;
  }

  function getInput(){
    return byId('inputText').value.trim();
  }

  function clearLensDetail(){
    const panel=byId('lensDetail');
    if(panel) panel.hidden=true;
    const out=byId('resultOut');
    if(out&&out.children){
      for(const child of out.children){
        if(child&&child.children){
          for(const token of child.children){
            if(token&&token.setAttribute) token.setAttribute('aria-expanded','false');
          }
        }
      }
    }
  }

  function showLensDetail(detail,button=null){
    const panel=byId('lensDetail');
    if(!panel||!detail) return;
    const fields={
      lensHangul:detail.hangul,
      lensDisplay:detail.display,
      lensType:detail.lexicalType,
      lensSource:detail.provenance,
      lensCandidate:detail.candidate,
      lensRoute:detail.route,
      lensReason:detail.reason
    };
    for(const [id,value] of Object.entries(fields)){
      const el=byId(id);
      if(el) el.textContent=value||'—';
    }
    panel.hidden=false;

    const out=byId('resultOut');
    if(out&&out.children){
      for(const child of out.children){
        if(child&&child.children){
          for(const token of child.children){
            if(token&&token.setAttribute) token.setAttribute('aria-expanded',token===button?'true':'false');
          }
        }
      }
    }
  }

  function setResult(text){
    const out=byId('resultOut');
    out.textContent=text;
    if(out.dataset) out.dataset.copyText=text;
    clearLensDetail();
  }

  function setInteractiveResult(model){
    const out=byId('resultOut');
    out.textContent='';
    if(out.dataset) out.dataset.copyText=model.copyText;
    clearLensDetail();

    const line1=document.createElement('div');
    line1.className='result-line';
    line1.textContent=model.input;
    out.appendChild(line1);

    const line2=document.createElement('div');
    line2.className='result-line result-line-lens';
    line2.setAttribute&&line2.setAttribute('aria-label','漢字・カタカナ交じり。語を選ぶと説明を表示します。');
    for(const piece of model.secondLine.pieces){
      if(piece.whitespace||!piece.interactive){
        const span=document.createElement('span');
        span.textContent=piece.text;
        line2.appendChild(span);
        continue;
      }
      const button=document.createElement('button');
      button.type='button';
      button.className='lens-token';
      button.textContent=piece.text;
      button.setAttribute&&button.setAttribute('aria-expanded','false');
      button.addEventListener('click',()=>showLensDetail(piece.detail,button));
      line2.appendChild(button);
    }
    out.appendChild(line2);

    const line3=document.createElement('div');
    line3.className='result-line';
    line3.textContent=model.romanized;
    out.appendChild(line3);
  }

  function exampleLabel(example,index){
    const text=example.input.length>38?example.input.slice(0,38)+'…':example.input;
    return `${index+1}. ${text}`;
  }

  function initExamples(examples){
    const select=byId('exampleSelect');
    if(!select||!examples.length) return;
    examples.forEach((example,index)=>{
      const option=document.createElement('option');
      option.value=String(index);
      option.textContent=exampleLabel(example,index);
      select.appendChild(option);
    });
  }

  function insertExample(examples,index){
    if(!examples.length) return;
    const i=Math.max(0,Math.min(examples.length-1,index));
    const input=byId('inputText');
    input.value=examples[i].input;
    input.focus();
    byId('exampleSelect').value=String(i);
  }

  function selectedExampleIndex(){
    return Number(byId('exampleSelect').value||0);
  }

  async function copyResult(){
    const out=byId('resultOut');
    const text=(out.dataset&&out.dataset.copyText)||out.textContent;
    if(!text) return;
    await navigator.clipboard.writeText(text);
    const button=byId('copyAllBtn');
    const old=button.textContent;
    button.textContent='コピー済み';
    setTimeout(()=>{button.textContent=old;},900);
  }

  function on(id,event,handler){
    byId(id).addEventListener(event,handler);
  }

  return {
    initVersion,
    initStats,
    clearTranslation,
    showTranslation,
    clearLensDetail,
    showLensDetail,
    getInput,
    setResult,
    setInteractiveResult,
    initExamples,
    insertExample,
    selectedExampleIndex,
    copyResult,
    on
  };
});
