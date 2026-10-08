(function(root,factory){
  'use strict';
  const value=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=value;
  root.HanjaLensVersion=value;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  return Object.freeze({version:'4.2',label:'v4.2'});
});
