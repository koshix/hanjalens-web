// Hanja Lens MV1 hold-only morphology veto.
// Frozen design: docs/MV1-VETO-CYCLE-PREREGISTRATION.md (option b, whole-eojeol hold).
//
// Offline-built oracle (data/morphology-veto-oracle.js) marks grammar/predicate characters per eojeol.
// After v4.0 conversion, any eojeol whose converted characters overlap a marked character is displayed
// exactly as input. The veto never creates, re-segments or re-spells a conversion.
// The rules mask below must stay identical to scripts/mveto/oracle_mask.py::Rules.mask.
(function(root,factory){
  const isNode=typeof module!=='undefined'&&module.exports;
  const oracle=isNode ? require('../data/morphology-veto-oracle.js') : root.HanjaLensMorphologyVetoOracle;
  const api=factory(oracle);
  if(isNode) module.exports=api;
  root.HanjaLensMorphologyVeto=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(ORACLE){
  'use strict';

  const cps=text=>Array.from(String(text??''));

  function compile(oracle){
    if(!oracle) return null;
    // Amendment 1 (v2): Kiwi-checked top-1 entries only; unlisted eojeols are never vetoed.
    if(oracle.entries) return Object.freeze({meta:oracle.meta||{},entries:oracle.entries,version:2});
    if(!oracle.rules||!oracle.exceptions) return null;
    const r=oracle.rules;
    return Object.freeze({
      meta:oracle.meta||{},
      gchain:new Set(r.gchain),
      nounh:new Set(r.nounh),
      vstem:new Set(r.vstem),
      vend:new Set(r.vend),
      exceptions:oracle.exceptions
    });
  }

  let ACTIVE=compile(ORACLE);
  // Enabled by default from MV1 Amendment 1 (docs/MV1-AMENDMENT-1.md; UD development gate PASS).
  // The MV1-as-frozen design stayed disabled after its development audit (docs/MV1-DEVELOPMENT-AUDIT.md §1-4).
  let ENABLED=true;

  function rulesMask(word,o=ACTIVE){
    const w=cps(word); const n=w.length; const m=new Array(n).fill('0');
    const slice=(a,b)=>w.slice(a,b).join('');
    for(let k=1;k<n;k++){
      if(!o.gchain.has(slice(k,n))) continue;
      let head=false;
      for(let j=0;j<k&&!head;j++) head=o.nounh.has(slice(j,k));
      if(head){ for(let i=k;i<n;i++) m[i]='1'; break; }
    }
    for(let k=1;k<=n;k++){
      if(o.vstem.has(slice(0,k))&&o.vend.has(slice(k,n))) return '1'.repeat(n);
    }
    return m.join('');
  }

  function maskFor(word,o=ACTIVE){
    if(!o) return null;
    if(o.version===2) return Object.prototype.hasOwnProperty.call(o.entries,word) ? o.entries[word] : null;
    return Object.prototype.hasOwnProperty.call(o.exceptions,word) ? o.exceptions[word] : rulesMask(word,o);
  }

  // Code-point positions of `source` that are not preserved in a longest common subsequence with `output`.
  function changedPositions(source,output){
    const a=cps(source),b=cps(output),n=a.length,m=b.length;
    const dp=Array.from({length:n+1},()=>new Int32Array(m+1));
    for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--){
      dp[i][j]=a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j],dp[i][j+1]);
    }
    const changed=[];
    let i=0,j=0;
    while(i<n&&j<m){
      if(a[i]===b[j]){ i++; j++; }
      else if(dp[i+1][j]>=dp[i][j+1]){ changed.push(i); i++; }
      else j++;
    }
    while(i<n){ changed.push(i); i++; }
    return changed;
  }

  // Returns {output, vetoes, skipped}. `input` must be the normalized engine input.
  function apply(input,output){
    if(!ENABLED||!ACTIVE) return {output,vetoes:[],skipped:ENABLED?'no-oracle':'disabled'};
    const inParts=String(input).split(/(\s+)/u);
    const outParts=String(output).split(/(\s+)/u);
    const aligned=inParts.length===outParts.length &&
      inParts.every((p,i)=>/^\s+$/u.test(p)===/^\s+$/u.test(outParts[i]) && (!/^\s+$/u.test(p)||p===outParts[i]));
    if(!aligned) return {output,vetoes:[],skipped:'misaligned'};
    const vetoes=[];
    for(let i=0;i<inParts.length;i++){
      const src=inParts[i],out=outParts[i];
      if(!src||src===out||/^\s+$/u.test(src)) continue;
      const mask=maskFor(src);
      if(!mask) continue;
      const changed=changedPositions(src,out);
      if(changed.some(p=>mask[p]==='1')){
        vetoes.push(Object.freeze({source:src,output:out,mask}));
        outParts[i]=src;
      }
    }
    return {output:outParts.join(''),vetoes,skipped:null};
  }

  return Object.freeze({
    apply,maskFor,rulesMask,changedPositions,
    meta:()=>ACTIVE?ACTIVE.meta:null,
    setEnabled(value){ ENABLED=Boolean(value); },
    isEnabled:()=>ENABLED,
    // Test/research hook: replace the active oracle (null restores the shipped data).
    useOracle(oracle){ ACTIVE=oracle===null?compile(ORACLE):compile(oracle); }
  });
});
