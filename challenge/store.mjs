import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {challenge,timing} from './challenge.mjs';
export const secret=()=>randomBytes(32).toString('base64url');
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function openStore(directory){
  mkdirSync(directory,{recursive:true});
  const db=new DatabaseSync(join(directory,'challenge.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, repository TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS deliveries(id TEXT PRIMARY KEY, received TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, attempt TEXT UNIQUE NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, at TEXT NOT NULL, attempt TEXT, action TEXT NOT NULL, detail TEXT NOT NULL);`);
  const api={db,
    transaction(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}},
    save(a){db.prepare('INSERT INTO attempts VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(a.id,a.token,a.repository.toLowerCase(),JSON.stringify(a));return a;},
    get(id){const r=db.prepare('SELECT data FROM attempts WHERE id=?').get(id);return r?JSON.parse(r.data):null;},
    invite(token){const r=db.prepare('SELECT data FROM attempts WHERE token=?').get(hash(token));return r?JSON.parse(r.data):null;},
    list(){return db.prepare('SELECT data FROM attempts ORDER BY rowid DESC').all().map(r=>JSON.parse(r.data));},
    create({repository,label='',githubLogin='',demo=false}){
      const invitation=secret(),id=randomUUID();
      const a={id,token:hash(invitation),label:label.slice(0,100),githubLogin,repository,branch:'main',demo,status:'invited',createdAt:new Date().toISOString(),pushes:[],challenge:structuredClone(challenge),notes:[]};
      api.save(a);api.audit(id,'invited',demo?'Demo invitation':'Private repository invitation');return {attempt:a,invitation};
    },
    start(id,login,now=Date.now()){
      return api.transaction(()=>{const a=api.get(id);if(!a)throw new Error('Attempt not found.');if(a.status!=='invited')return a;
        a.status='active';a.login=login;a.startedAt=new Date(now).toISOString();a.deadlineAt=new Date(now+3600000).toISOString();api.save(a);api.audit(id,'started','Repository access verified');return a;});
    },
    push({delivery,repository,sha,ref,sender,now=Date.now()}){
      return api.transaction(()=>{
        if(db.prepare('SELECT id FROM deliveries WHERE id=?').get(delivery))return {duplicate:true};
        db.prepare('INSERT INTO deliveries VALUES(?,?)').run(delivery,new Date(now).toISOString());
        const row=db.prepare('SELECT data FROM attempts WHERE repository=?').get(repository.toLowerCase());
        if(!row)return {ignored:true};const a=JSON.parse(row.data);
        if(a.status!=='active'||ref!=='refs/heads/'+a.branch||sender?.toLowerCase()!==a.login?.toLowerCase()||! /^[a-f0-9]{40}$/i.test(sha)||/^0+$/.test(sha)||now<Date.parse(a.startedAt)||now>Date.parse(a.deadlineAt)){
          api.audit(a.id,'push_ignored','Wrong branch, sender, invalid SHA, or outside active window');return {ignored:true};
        }
        a.lastPushAt=new Date(now).toISOString();a.commitSha=sha.toLowerCase();a.pushes.push({sha:a.commitSha,at:a.lastPushAt});api.save(a);api.audit(a.id,'push',a.commitSha);return {accepted:true};
      });
    },
    freeze(id,now=Date.now(),reason='finished'){
      return api.transaction(()=>{const a=api.get(id);if(a.status!=='active')return a;
        a.status=a.commitSha?'submitted':'no_submission';a.frozenAt=new Date(now).toISOString();a.receipt={...timing(a,now),reason,commitSha:a.commitSha||null};api.save(a);api.audit(id,'frozen',reason);return a;});
    },
    expire(now=Date.now()){for(const a of api.list())if(a.status==='active'&&Date.parse(a.deadlineAt)<=now)api.freeze(a.id,now,'deadline');},
    session(data,ttl=86400000){db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());const token=secret();db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),JSON.stringify(data),Date.now()+ttl);return token;},
    readSession(token){if(!token)return null;const r=db.prepare('SELECT * FROM sessions WHERE token=?').get(hash(token));return r&&r.expires>Date.now()?JSON.parse(r.data):null;},
    deleteSession(token){if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));},
    audit(attempt,action,detail){db.prepare('INSERT INTO audit(at,attempt,action,detail) VALUES(?,?,?,?)').run(new Date().toISOString(),attempt,action,detail);},
    events(id){return db.prepare('SELECT at,action,detail FROM audit WHERE attempt=? ORDER BY id DESC LIMIT 100').all(id);},
    queue(id){return api.transaction(()=>{const a=api.get(id);if(!a||a.status!=='submitted'||a.demo)throw new Error('Only a frozen live submission can be evaluated.');
      const old=api.job(id);if(old&&old.status!=='failed')throw new Error('Evaluation already queued or completed.');
      const j={...(old?.reviewId?{reviewId:old.reviewId}:{}),id:old?.id||randomUUID(),attemptId:id,repository:a.repository,commitSha:a.commitSha,challenge:a.challenge,receipt:a.receipt,createdAt:old?.createdAt||new Date().toISOString()};
      db.prepare('INSERT INTO jobs VALUES(?,?,?,?) ON CONFLICT(attempt) DO UPDATE SET status=excluded.status,data=excluded.data').run(j.id,id,'queued',JSON.stringify(j));api.audit(id,'evaluation_queued',j.commitSha);return {...j,status:'queued'};});},
    job(id){const r=db.prepare('SELECT * FROM jobs WHERE attempt=?').get(id);return r?{...JSON.parse(r.data),status:r.status}:null;},
    updateJob(j,status){db.prepare('UPDATE jobs SET status=?,data=? WHERE id=?').run(status,JSON.stringify(j),j.id);},
    claim(){return api.transaction(()=>{const row=db.prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY rowid LIMIT 1").get();if(!row)return null;const j=JSON.parse(row.data);api.updateJob(j,'running');return j;});},
    close(){db.close();}
  };return api;
}
