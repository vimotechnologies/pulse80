import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { File } from 'node:buffer';
import ts from 'typescript';
import vm from 'node:vm';
const file=new URL('../../pulse80-frontend/lib/roster/import.ts',import.meta.url);
const requireFrontend=createRequire(new URL('../../pulse80-frontend/package.json',import.meta.url));
const module={exports:{}};
const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
vm.runInThisContext('(function(require,module,exports){'+js+'\n})')(requireFrontend,module,module.exports);
const {parseRosterRows,readRosterFile}=module.exports;
const headers=['screening_reference','eligibility_status','registration_status'];
const row=['00042','Eligible','Registered'];

test('roster CSV preserves anonymous code and leading zeros without names',async()=>{
  const parsed=await readRosterFile(new File([headers.join(',')+'\n'+row.join(',')],'roster.csv'));
  assert.deepEqual(parsed,[{screeningReference:'00042',eligibilityStatus:'Eligible',registrationStatus:'Registered'}]);
});
for(const bookType of ['xls','xlsx']) test(`roster ${bookType.toUpperCase()} supports anonymous codes`,async()=>{
  const XLSX=requireFrontend('xlsx');
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([headers,row]),'Roster');
  const buffer=XLSX.write(workbook,{bookType,type:'buffer'});
  const parsed=await readRosterFile(new File([buffer],`roster.${bookType}`));
  assert.equal(parsed[0].screeningReference,'00042');
});
test('roster import rejects duplicates, identity columns, screening-result columns and invalid statuses',()=>{
  assert.throws(()=>parseRosterRows([headers,row,row]),/duplicate/);
  assert.throws(()=>parseRosterRows([[...headers,'name'],[...row,'Person']]),/Do not include names/);
  assert.throws(()=>parseRosterRows([[...headers,'systolic'],[...row,120]]),/screening results/);
  assert.throws(()=>parseRosterRows([headers,['CODE','Eligible','Attended']]),/valid eligibility/);
  assert.throws(()=>parseRosterRows([headers,[42,'Eligible','Registered']]),/format.*as text/);
  assert.throws(()=>parseRosterRows([headers,...Array.from({length:501},(_,i)=>[`CODE-${i}`,'Eligible','Registered'])]),/500/);
});
test('roster import rejects Excel formulas',async()=>{
  const XLSX=requireFrontend('xlsx'), workbook=XLSX.utils.book_new(),sheet=XLSX.utils.aoa_to_sheet([headers,row]);
  sheet.A2={t:'s',v:'00042',f:'"00042"'};
  XLSX.utils.book_append_sheet(workbook,sheet,'Roster');
  await assert.rejects(readRosterFile(new File([XLSX.write(workbook,{bookType:'xlsx',type:'buffer'})],'roster.xlsx')),/plain values/);
});
