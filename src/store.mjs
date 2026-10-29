import { DatabaseSync } from 'node:sqlite';
import { mkdirSync,openSync,writeFileSync,readFileSync,unlinkSync,closeSync } from 'node:fs';
import { join } from 'node:path';

export function createStore(directory) {
  mkdirSync(directory,{recursive:true});
  const lockPath=join(directory,'instance.lock');
  let lock;
  try{lock=openSync(lockPath,'wx');}catch(e){
    if(e.code!=='EEXIST')throw e;
    const pid=Number(readFileSync(lockPath,'utf8'));
    let alive=true;
    try{if(!Number.isInteger(pid)||pid<=0)throw new Error('invalid lock');process.kill(pid,0);}catch(error){if(error.code==='ESRCH')alive=false;}
    if(alive)throw new Error('This data directory is already open in another application process. Use its existing URL or set a different REVIEWER_DATA_DIR.');
    unlinkSync(lockPath);lock=openSync(lockPath,'wx');
  }
  writeFileSync(lock,String(process.pid));closeSync(lock);
  let db;
  try{db=new DatabaseSync(join(directory,'reviews.sqlite'));}catch(e){unlinkSync(lockPath);throw e;}
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, created TEXT NOT NULL, updated TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL)');
  const put=db.prepare('INSERT INTO reviews VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated,status=excluded.status,data=excluded.data');
  const store={
    save(review){review.updatedAt=new Date().toISOString();put.run(review.id,review.createdAt,review.updatedAt,review.status,JSON.stringify(review));return review;},
    get(id){const row=db.prepare('SELECT data FROM reviews WHERE id=?').get(id);return row?JSON.parse(row.data):null;},
    list(){return db.prepare('SELECT data FROM reviews ORDER BY created DESC LIMIT 100').all().map(row=>{const r=JSON.parse(row.data);return {id:r.id,url:r.url,profile:r.profile,status:r.status,createdAt:r.createdAt,message:r.message,score:r.report?.score,coverage:r.report?.coverage,repository:r.repository};});},
    close(){db.close();unlinkSync(lockPath);}
  };
  for(const row of db.prepare("SELECT data FROM reviews WHERE status IN ('queued','collecting','evaluating')").all()) {
    const r=JSON.parse(row.data);store.save({...r,status:'interrupted',message:'The application stopped during this review. Retry to use saved evidence and completed batches.'});
  }
  return store;
}
