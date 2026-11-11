// Read-only live comparison. Save aggregate counts/IDs, never user contact data.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const base = process.env.AUDIT_API_BASE || 'http://localhost:8080/api/v1';
const year = Number(process.argv[2] || 2026);
const output = process.argv[3] || '/tmp/kalender-piodalan-live-parity.json';
const server = await createServer({ configFile:false, resolve:{alias:{'@':`${process.cwd()}/src`}}, server:{middlewareMode:true,ws:false}, appType:'custom' });
try {
  const { matchPurasForDay } = await server.ssrLoadModule('/src/features/kalender/utils/calendarUtils.ts');
  async function get(path) {
    const response = await fetch(base+path);
    if(!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    return (await response.json()).data;
  }
  const puras = await get('/puras');
  const days = await get(`/kalender?year=${year}`);
  const search = await get(`/search/piodalan?mode=rentang&start_date=${year}-01-01&end_date=${year}-12-31`);
  const go = new Map(search.schedules.map(day=>[day.tanggal,day.puras.map(p=>{
    if(p.id == null)throw new Error('Pura ID missing in Go schedule');
    return String(p.id);
  }).sort()]));
  let pairs=0;
  const differences=[];
  for (const day of days) {
    const react = matchPurasForDay(day,puras).map(p=>String(p.id)).sort();
    const backend = go.get(day.tanggal)||[];
    pairs += react.length;
    if(JSON.stringify(react)!==JSON.stringify(backend)) differences.push({date:day.tanggal,react,go:backend});
  }
  const result={base,year,puras:puras.length,days:days.length,matched_pairs:pairs,different_days:differences.length,differences};
  await writeFile(output,JSON.stringify(result,null,2));
  console.log(JSON.stringify({...result,differences:undefined}));
  if(differences.length)process.exitCode=1;
} finally { await server.close(); }
