import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../src/store.mjs';
test('SQLite persists evidence and marks unfinished reviews interrupted',()=>{
  const dir=mkdtempSync(join(tmpdir(),'reviewer-test-'));let store=createStore(dir);
  try{store.save({id:'1',createdAt:new Date().toISOString(),status:'evaluating',evidence:[{id:'E1',content:'example'}]});store.close();store=createStore(dir);assert.equal(store.get('1').status,'interrupted');assert.equal(store.get('1').evidence[0].content,'example');assert.equal(store.list().length,1);assert.equal(store.get('missing'),null);}finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
test('two application instances cannot share one review database',()=>{
  const dir=mkdtempSync(join(tmpdir(),'reviewer-lock-'));const store=createStore(dir);
  try{assert.throws(()=>createStore(dir),/already open/);}finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
