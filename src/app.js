// Hanja Lens application controller.
(function(){
  'use strict';
  const E=globalThis.HanjaLensEngine;
  const D=globalThis.HanjaLensData||{};
  const EX=(globalThis.HanjaLensExamples&&globalThis.HanjaLensExamples.examples)||[];
  const T=globalThis.HanjaLensTranslation;
  const V=globalThis.HanjaLensVersion||{version:'',label:''};
  const LENS=globalThis.HanjaLensInteractiveLens||(
    typeof require==='function'?require('./interactive-lens.js'):null
  );
  const VIEW=globalThis.HanjaLensAppView||(
    typeof require==='function'?require('./app-view.js'):null
  );

  async function updateTranslation(input){
    VIEW.clearTranslation();
    if(!T||typeof T.translate!=='function'||!input) return;
    const result=await T.translate(input);
    if(result) VIEW.showTranslation(result);
  }

  async function convert(){
    const input=VIEW.getInput();
    if(!input){
      VIEW.setResult('');
      await updateTranslation(input);
      return;
    }
    const trace=E.traceHanjaize(input);
    const model=LENS.buildViewModel({
      input:trace.input,
      output:trace.output,
      romanized:E.romanize(trace.input),
      events:trace.events
    });
    VIEW.setInteractiveResult(model);
    await updateTranslation(input);
  }

  async function loadExternalDictionaries(){
    // Deterministic precedence for duplicate external surfaces:
    // core > MIT > cc-kedict > Standard Dictionary.
    // Registry precedence is core > MIT > cc-kedict > Standard Dictionary; sequential await also makes load/status behavior deterministic.
    const loaders=[
      globalThis.HanjaLensMIT,
      globalThis.HanjaLensCCKedict,
      globalThis.HanjaLensStdDict
    ];
    for(const loader of loaders){
      if(loader&&typeof loader.load==='function') await loader.load();
    }
  }

  VIEW.on('convertBtn','click',()=>{void convert();});
  VIEW.on('insertExampleBtn','click',()=>{
    VIEW.insertExample(EX,VIEW.selectedExampleIndex());
  });
  VIEW.on('randomExampleBtn','click',()=>{
    VIEW.insertExample(EX,Math.floor(Math.random()*EX.length));
  });
  VIEW.on('copyAllBtn','click',()=>{void VIEW.copyResult();});
  VIEW.on('lensDetailClose','click',()=>{VIEW.clearLensDetail();});

  VIEW.initVersion(V);
  VIEW.initStats(D,EX);
  VIEW.initExamples(EX);
  void loadExternalDictionaries();
})();
