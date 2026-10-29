import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRepository,collectRepository,priority,github} from '../src/github.mjs';
test('repository URLs are constrained to public GitHub repository roots',()=>{
  assert.equal(parseRepository('https://github.com/owner/repo.git/').url,'https://github.com/owner/repo');
  for(const url of ['http://github.com/a/b','https://evil.test/a/b','https://github.com.evil.test/a/b','https://github.com/a/b/tree/main','https://github.com/a/b?q=x','https://github.com/a/b#x','https://user:pass@github.com/a/b','file:///etc/passwd','https://github.com/a/%2e%2e'])assert.throws(()=>parseRepository(url));
});
test('generated and binary assets are not selected',()=>{
  assert.equal(priority('node_modules/a/index.js'),-1);assert.equal(priority('photo.png'),-1);assert.ok(priority('README.md')>priority('src/index.js'));
});
test('collector pins blobs, normalizes lines, limits excerpts, and records scope',async()=>{
  const sha='a'.repeat(40);const calls=[];
  const request=async path=>{calls.push(path);if(path==='/repos/a/b')return {private:false,default_branch:'main',full_name:'a/b'};
    if(path.includes('/commits/'))return {sha};if(path.includes('/git/trees/'))return {tree:[{type:'blob',path:'README.md',size:20000,sha:'blob1'}]};
    if(path.includes('/git/blobs/'))return {encoding:'base64',content:Buffer.from('line1\r\n'+'x'.repeat(20000)).toString('base64')};if(path.includes('/pulls?'))return [];throw Error(path);};
  const collected=await collectRepository('https://github.com/a/b',{request});
  assert.equal(collected.repository.sha,sha);const file=collected.evidence.find(e=>e.type==='file');assert.ok(file.url.includes('/blob/'+sha+'/'));assert.equal(file.truncated,true);assert.ok(!file.content.includes('\r'));assert.ok(collected.warnings.length);assert.ok(calls.some(p=>p.includes('/git/trees/'+sha)));
});
test('private repositories are refused',async()=>{
  await assert.rejects(collectRepository('https://github.com/a/b',{request:async()=>({private:true})}),/public repositories/);
});
test('GitHub redirects and rate limits are not silently followed',async()=>{
  await assert.rejects(github('/repos/a/b',{fetcher:async(url,options)=>{assert.equal(options.redirect,'error');assert.equal(new URL(url).hostname,'api.github.com');return {ok:false,status:403};}}),/rate limit/);
});
