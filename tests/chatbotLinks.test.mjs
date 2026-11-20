import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
const server = await createServer({ configFile:false, server:{middlewareMode:true,ws:false}, appType:'custom' });
const { relatedLinks } = await server.ssrLoadModule('/src/features/chatbot/api/relatedLinks.ts');
after(() => server.close());
test('links retain verified category and requested result', () => {
 assert.deepEqual(relatedLinks([{type_code:'wuku',name:'Sinta'}]), [{label:'Sinta · wuku',choice:'Saya maksud Sinta pada kategori wuku.',to:'/keterangan/wuku?q=Sinta'}]);
});
test('rejects unsafe and malformed paths', () => {
 assert.deepEqual(relatedLinks([{type_code:'../other',name:'X'},{type_code:'https://evil',name:'A'},{type_code:'wuku',name:null}]), []);
});
test('public Warta and Rubrik links use verified IDs only', () => {
 assert.deepEqual(relatedLinks([{kind:'warta',resource_id:'42',name:'Tradisi Bali'}]), [{label:'Tradisi Bali',choice:'Saya maksud Tradisi Bali.',to:'/warta/42'}]);
 assert.deepEqual(relatedLinks([{kind:'rubrik',resource_id:'7',name:'Upacara'}]), [{label:'Upacara',choice:'Saya maksud Upacara.',to:'/rubrik-dewasa/7'}]);
 assert.deepEqual(relatedLinks([{kind:'warta',resource_id:'../admin',name:'x'},{kind:'unknown',resource_id:'1',name:'x'}]), []);
});
