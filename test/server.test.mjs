import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createApplication} from '../server.mjs';
test('loopback interface serves app, rejects cross-origin writes, and validates repository URLs',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'reviewer-http-'));
  const app=createApplication({dataDir:dir,clientFactory:()=>({initialize:async()=>{},account:async()=>({authenticated:true,method:'chatgpt'}),close(){}})});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.server.address().port;
  try{
    const home=await fetch(base);assert.equal(home.status,200);assert.ok((await home.text()).includes('Start a repository evaluation'));
    assert.equal((await (await fetch(base+'/api/health')).json()).ready,true);
    assert.equal((await fetch(base+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.test'},body:JSON.stringify({url:'https://github.com/a/b'})})).status,403);
    assert.equal((await fetch(base+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"url":"http://localhost/a/b"}'})).status,400);
    assert.equal((await fetch(base+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:'not json'})).status,400);
    assert.equal((await fetch(base+'/evaluation-rubric.json')).status,404);
    assert.deepEqual(await (await fetch(base+'/api/reviews')).json(),[]);
  }finally{await new Promise(resolve=>app.server.close(resolve));app.store.close();rmSync(dir,{recursive:true,force:true});}
});
