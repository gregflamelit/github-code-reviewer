import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {tmpdir} from 'node:os';
import {CodexClient} from '../src/codex.mjs';
import {rubric} from '../src/rubric.mjs';

function fakeProcess({failTurn=false}={}){
  const p=new EventEmitter();p.stdout=new PassThrough();p.stderr=new PassThrough();p.calls=[];
  const emit=m=>p.stdout.write(JSON.stringify(m)+'\n');
  p.stdin=new Writable({write(chunk,encoding,callback){
    const m=JSON.parse(chunk.toString());p.calls.push(m);
    if(m.id && m.method){
      const value=m.method==='account/read'?{account:{type:'chatgpt'}}:m.method==='model/list'?{data:[{model:'available-model',isDefault:true,defaultReasoningEffort:'medium'}]}:m.method==='thread/start'?{thread:{id:'thread1'}}:{};
      queueMicrotask(()=>{
        emit({id:m.id,result:value});
        if(m.method==='turn/start'){
          emit({method:'item/completed',params:{threadId:'thread1',item:{type:'agentMessage',text:JSON.stringify({summary:'evaluated',results:[]})}}});
          emit({method:'turn/completed',params:{threadId:'thread1',turn:{status:failTurn?'failed':'completed',error:failTurn?{message:'Quota unavailable'}:null}}});
        }
      });
    }
    callback();
  }});
  p.kill=()=>{p.emit('exit',0);p.stdout.end();p.stderr.end();};return p;
}
test('Codex handshake, schema output, restricted sandbox, and sign-in work over stdio',async()=>{
  const p=fakeProcess();let spawnOptions,args;
  const c=new CodexClient({cwd:tmpdir(),spawnProcess:(exe,a,o)=>{args=a;spawnOptions=o;return p;}});
  try{await c.initialize();assert.equal((await c.account()).authenticated,true);const result=await c.evaluate({domains:[rubric.domains[0]],evidence:[]});assert.equal(result.summary,'evaluated');assert.ok(args.includes('features.shell_tool=false'));assert.ok(args.includes('mcp_servers={}'));assert.ok(args.includes('permissions.evidence_only.filesystem={\":minimal\" = \"read\"}'));assert.equal(spawnOptions.windowsHide,true);const turn=p.calls.find(c=>c.method==='turn/start');assert.equal(turn.params.permissions,'evidence_only');assert.equal(turn.params.sandboxPolicy,undefined);assert.ok(turn.params.outputSchema);assert.equal(turn.params.approvalPolicy,'never');}finally{c.close();}
});
test('failed Codex turns do not become successful evaluations',async()=>{
  const c=new CodexClient({cwd:tmpdir(),spawnProcess:()=>fakeProcess({failTurn:true})});
  try{await c.initialize();await assert.rejects(c.evaluate({domains:[rubric.domains[0]],evidence:[]}),/Quota unavailable/);}finally{c.close();}
});
