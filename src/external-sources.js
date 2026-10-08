// Hanja Lens external dictionary source registry
// v3.1: pin upstream revisions for reproducible runtime dictionary loading.

(function(){
  'use strict';

  function rawGitHub(repository,revision,path){
    return `https://raw.githubusercontent.com/${repository}/${revision}/${path}`;
  }

  function pinnedSource(repository,revision,paths){
    const source={repository,revision};
    for(const [key,path] of Object.entries(paths)){
      source[key]=rawGitHub(repository,revision,path);
    }
    return Object.freeze(source);
  }

  const sources = Object.freeze({
    hanjaWordlist:pinnedSource(
      'jemdiggity/hanja-wordlist',
      '11ab3d3f6d5205a810af980210d9de1dc0223717',
      {hanjaUrl:'hanja.tsv',nativeUrl:'native.tsv'}
    ),
    ccKedict:pinnedSource(
      'mhagiwara/cc-kedict',
      '625a7556e7579d415727358d5b6e873aa5a50338',
      {url:'kedict.yml'}
    ),
    gukhanmun:pinnedSource(
      'dahlia/gukhanmun',
      'fb9d665bef5aee48532111534912dbac20bc6a0c',
      {stdictUrl:'crates/gukhanmun-stdict/data/stdict.tsv'}
    ),
    jlptWordList:pinnedSource(
      'elzup/jlpt-word-list',
      '13aa3c54b27115be72d8a62cd4071077c68d2171',
      {url:'out/all.min.csv'}
    )
  });

  // Runtime policy revision is part of the cache namespace so a safety-policy
  // change cannot revive stale dictionary entries from an older localStorage cache.
  const runtimePolicyRevision='v4.0-stage1-provenance';
  function cacheKey(layer, revisions){
    return 'hanjalens:' + layer + ':' + runtimePolicyRevision + ':' + revisions.join(':');
  }

  const displayHold = Object.freeze([
    '감기','공부','계정','경우','당신','물건','실수',
    '용서','죄송','친구','피곤','식단',
    // v3.9 Phase E Batch 1: runtime dictionary homographs that collide with
    // productive grammar / particles in ordinary prose.
    '보면','중이','산업의'
  ]);

  const cacheKeys = Object.freeze({
    mit: cacheKey('mit-hanja', [
      sources.hanjaWordlist.revision
    ]),

    ccKedict: cacheKey('cc-kedict', [
      sources.ccKedict.revision
    ]),

    stdict: cacheKey('stdict', [
      sources.gukhanmun.revision,
      sources.jlptWordList.revision,
      sources.hanjaWordlist.revision
    ])
  });

  const registry = Object.freeze({
    sources,
    cacheKeys,
    displayHold,
    runtimePolicyRevision
  });

  globalThis.HanjaLensExternalSources = registry;

  if(typeof module!=='undefined' && module.exports){
    module.exports = registry;
  }
})();
