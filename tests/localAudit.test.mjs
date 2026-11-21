import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const server=await createServer({configFile:false,resolve:{alias:{'@':`${process.cwd()}/src`}},server:{middlewareMode:true,ws:false},appType:'custom'});
after(()=>server.close());
const {buildReminderCalendar}=await server.ssrLoadModule('/src/features/hari-raya/utils/reminderCalendar.ts');
const {matchPurasForDay,getTodayWITA}=await server.ssrLoadModule('/src/features/kalender/utils/calendarUtils.ts');
const {apiClient}=await server.ssrLoadModule('/src/lib/axios.ts');
const {CALENDAR_RULES_VERSION}=await server.ssrLoadModule('/src/lib/calendarCache.ts');
const {CalendarInspector}=await server.ssrLoadModule('/src/features/kalender/components/CalendarInspector.tsx');
const calendarPageModule=await server.ssrLoadModule('/src/features/kalender/pages/CalendarPage.tsx');
const {useDashboardData}=await server.ssrLoadModule('/src/features/dashboard/hooks/useDashboardData.ts');
const {default: DashboardPage}=await server.ssrLoadModule('/src/features/dashboard/pages/DashboardPage.tsx');
const {extractTopUpcomingPiodalan}=await server.ssrLoadModule('/src/features/dashboard/utils/dashboardUtils.ts');
const {fetchPuraObservances}=await server.ssrLoadModule('/src/features/piodalan/api/piodalanApi.ts');
const {RamalanSifatForm}=await server.ssrLoadModule('/src/features/ramalan-sifat/components/RamalanSifatForm.tsx');

test('pengingat kalender memasang alarm H-1 17.00 dan hari H 06.00 WITA',()=>{
  const text=buildReminderCalendar('2026-03-20','Ngembak Geni',{remindHMinus1:true,remindHariH:true});
  assert.match(text,/DTSTART:20260319T220000Z/);
  assert.match(text,/DTEND:20260319T223000Z/);
  assert.equal((text.match(/BEGIN:VALARM/g)||[]).length,2);
  assert.match(text,/TRIGGER:-PT13H/); assert.match(text,/TRIGGER:PT0S/);
  assert.throws(()=>buildReminderCalendar('2026-02-30','Invalid',{remindHMinus1:true}),/tidak valid/);
  assert.throws(()=>buildReminderCalendar('2026-03-20','Invalid',{}),/dipilih/);
});
test('pengingat meng-escape teks dan melipat baris UTF-8 tanpa memotong karakter',()=>{
  const name='Pura, Hindu; '+('é'.repeat(100))+'\nbaris kedua';
  const text=buildReminderCalendar('2024-03-01',name,{remindHariH:true});
  assert.match(text,/DTSTART:20240229T220000Z/);
  for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  const unfolded=text.replace(/\r\n /g,'');
  assert.ok(unfolded.includes('SUMMARY:Pura\\, Hindu\\; '+('é'.repeat(100))+'\\nbaris kedua'));
});

const day={tanggal:getTodayWITA(),wewaran:{saptawara:{nama:'Buda'},pancawara:{nama:'Paing'},wuku:{nama:'Landep'},neptu:16},sasih:{nama_sasih:'kadasa',tahun_saka:1948},pengalantaka:{pengalantaka:'Penanggal',penanggal_1:15,purnama_tilem:'Purnama'},hari_raya:[],padewasan:[{id:'1',nama:'Petunjuk Riil',keterangan:'Petunjuk dari API, bukan hash tanggal.'}]};
test('aturan Sasih lama tidak dianggap Pawukon dan aturan parsial mengikuti Go',()=>{
  const puras=[{id:1,name:'Sasih',benchmark:'Pawukon',sasih:'Kadasa',purnama_tilem:'Purnama'}, {id:2,name:'Wuku',benchmark:'Pawukon',wuku:'Landep'}, {id:3,name:'Kosong',benchmark:'Pawukon'}];
  assert.deepEqual(matchPurasForDay(day,puras).map(p=>p.id).sort(),[1,2]);
  const normalDay={...day,pengalantaka:{...day.pengalantaka,purnama_tilem:'-'}};
  assert.deepEqual(matchPurasForDay(normalDay,puras).map(p=>p.id),[2]);
});

test('agenda dashboard memakai matcher bersama untuk aturan parsial dan alias',()=>{
  const puras=[{id:1,name:'Pura parsial',benchmark:'Pawukon',wuku:'Landep'}, {id:2,name:'Pura Sasih',benchmark:'Sasih',sasih:'Kedasa',purnama_tilem:'Purnama'}];
  const agenda=extractTopUpcomingPiodalan([day],puras,day.tanggal,3);
  assert.equal(agenda.length,1);
  assert.deepEqual(agenda[0].topTemples.sort(),['Pura Sasih','Pura parsial']);
});

test('versi aturan menghindari cache browser lama tanpa mengubah body POST',async(t)=>{
  let observed;
  const previousAdapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = previousAdapter; });
  apiClient.defaults.adapter = async(config)=>{
    observed=config;return {data:{data:[]},status:200,statusText:'OK',headers:{},config};
  };
  const params={year:2026};await apiClient.get('/kalender',{params});
  assert.equal(observed.params.rules_version,CALENDAR_RULES_VERSION);assert.deepEqual(params,{year:2026});
  await apiClient.post('/search/jodoh',{diri:{}});
  assert.equal(observed.params,undefined);
});

function client(){return new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0,staleTime:Infinity}}});}

test('daftar pura ringan menghasilkan empat tanggal piodalan dashboard hingga tahun berikutnya', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-12-29T04:00:00Z') });
  const qc = client();
  t.after(() => qc.clear());
  qc.setQueryData(['kalender', 2026], ['2026-12-29', '2026-12-30', '2026-12-31'].map(tanggal => ({ ...day, tanggal })));
  qc.setQueryData(['kalender', 2027], ['2027-01-01', '2027-01-02'].map(tanggal => ({ ...day, tanggal })));
  const previousAdapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = previousAdapter; });
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.url, '/puras/observances');
    return {
      data: { data: [{ id: 1, name: 'Pura Uji', type: 'Kawitan', benchmark: 'Pawukon', wuku: 'Landep' }] },
      status: 200,
      headers: {},
      config,
    };
  };
  await qc.fetchQuery({ queryKey: ['piodalan', 'puras', 'observances'], queryFn: fetchPuraObservances });

  const html = renderToStaticMarkup(React.createElement(
    QueryClientProvider, { client: qc },
    React.createElement(MemoryRouter, null, React.createElement(DashboardPage)),
  ));

  assert.equal((html.match(/Pura Uji/g) ?? []).length, 4);
  assert.match(html, /4 Piodalan Terdekat/);
  assert.match(html, /1 Januari 2027/);
  assert.doesNotMatch(html, /2 Januari 2027/);
});

test('inspektur kalender menyediakan tombol untuk membuka rincian hari',()=>{
  const qc=client();
  const render=(selectedData)=>renderToStaticMarkup(React.createElement(QueryClientProvider,{client:qc},React.createElement(CalendarInspector,{selectedDate:day.tanggal,selectedData,isToday:true,onOpenDetailModal(){}})));
  assert.match(render(day),/Lihat detail hari/);
  qc.clear();
});

test('kalender menampilkan jumlah piodalan saat baru aturan ringan yang tersedia', (t) => {
  const qc = client();
  t.after(() => qc.clear());
  qc.setQueryData(['kalender', Number(day.tanggal.slice(0, 4))], [day]);
  qc.setQueryData(['piodalan', 'puras', 'observances'], [
    { id: 1, name: 'Pura Uji', type: 'Kawitan', benchmark: 'Pawukon', wuku: 'Landep' },
  ]);
  const { default: CalendarPage } = calendarPageModule;
  const html = renderToStaticMarkup(React.createElement(
    QueryClientProvider, { client: qc },
    React.createElement(MemoryRouter, { initialEntries: [`/kalender?date=${day.tanggal}`] }, React.createElement(CalendarPage)),
  ));
  assert.match(html, /0 Rahina · 1 Piodalan/);
  assert.match(html, /Piodalan hari ini<\/span><span[^>]*>1 lokasi/);
});

test('dashboard memakai total dan pratinjau padewasan dari API', (t) => {
  const qc = client();
  t.after(() => qc.clear());
  const year = Number(day.tanggal.slice(0, 4));
  qc.setQueryData(['kalender', year], [day]);
  qc.setQueryData(['kalender', year + 1], []);
  qc.setQueryData(['piodalan', 'puras', 'observances'], []);
  qc.setQueryData(['ala-ayuning-dewasa', 'today', day.tanggal], {
    tanggal: day.tanggal,
    status_label: 'PER KEGIATAN',
    headline: 'Pilih kegiatan dan periksa rinciannya.',
    total: 5,
    activity_guidance: [],
    items: [
      { id: '1', nama: 'Data API', keterangan: 'Uraian API' },
      { id: '2', nama: 'Unsur kedua dari API', keterangan: 'Uraian kedua' },
      { id: '3', nama: 'Unsur ketiga dari API', keterangan: 'Uraian ketiga' },
    ],
  });

  let dashboard;
  function Snapshot() {
    dashboard = useDashboardData();
    return null;
  }
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client: qc }, React.createElement(Snapshot)));

  // Go mengirim total lengkap dan daftar pratinjau secara terpisah.
  assert.equal(dashboard.dewasaAyu.total, 5);
  assert.match(dashboard.dewasaAyu.headline, /5 padewasan aktif hari ini/);
  assert.equal(dashboard.heroData.quoteHariIni, dashboard.dewasaAyu.headline);
  assert.deepEqual(dashboard.dewasaAyu.items.map((item) => item.nama), [
    'Data API', 'Unsur kedua dari API', 'Unsur ketiga dari API',
  ]);
  assert.equal(dashboard.dewasaAyu.items[0].keterangan, 'Uraian API');
});

test('form tanggal dapat dirender dengan nilai awal setelah sinkronisasi state diperbaiki',()=>{
  const html=renderToStaticMarkup(React.createElement(RamalanSifatForm,{initialBirthDate:'1998-01-10',initialTime:'before_06',onSubmit(){}}));
  assert.match(html,/10\/01\/1998/);
});
