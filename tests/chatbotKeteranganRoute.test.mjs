import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createServer } from 'vite';
const server = await createServer({ configFile:false, resolve:{alias:{'@':`${process.cwd()}/src`}}, server:{middlewareMode:true,ws:false}, appType:'custom', plugins:[{name:'keterangan-fixture',enforce:'pre',resolveId(source){if(source.endsWith('/hooks/useKeterangan')||source.endsWith('/hooks/useKeterangan.ts'))return '\0keterangan-fixture';},load(id){if(id==='\0keterangan-fixture')return `export function useKeteranganTypes(){return {categories:[{code:'wuku',name:'Wuku',description:'',id:'1'}]}}; export function useKeteranganTypeDetail(){return {values:[{id:'1',name:'Sinta',description:'Satu'},{id:'2',name:'Landep',description:'Dua'}],isLoading:false,isError:false,isPending:false,refetch(){}}}`;}}] });
const { default: Detail } = await server.ssrLoadModule('/src/features/keterangan/pages/KeteranganDetailPage.tsx');
after(() => server.close());
test('chat link filters the actual Keterangan category by result name', () => {
 const tree = React.createElement(MemoryRouter,{initialEntries:['/keterangan/wuku?q=Sinta']},React.createElement(Routes,null,React.createElement(Route,{path:'/keterangan/:typeCode',element:React.createElement(Detail)})));
 const html=renderToStaticMarkup(tree); assert.match(html,/value="Sinta"/);assert.match(html,/>Sinta</);assert.doesNotMatch(html,/>Landep</);
});
