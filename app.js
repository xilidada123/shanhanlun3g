'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='shanghan-wengu-v1';let store={progress:{},edits:{},drafts:{}};try{Object.assign(store,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}let mode='practice',index=0,list=[],revealed=false;const base=window.ARTICLES;const merged=a=>a;const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){alert('浏览器未能保存数据，请使用“备份学习数据”保存。')}};
const fields={chapter:'章节',grade:'等级（1、2、3）',number:'原书条号',summary:'提要',text:'原文',terms:'词解',explanation:'释义',formula:'附方与煎服法'};
function chapters(){let old=$('#chapter').value;$('#chapter').innerHTML='<option value="">全部章节</option>'+[...new Set(base.map(merged).map(a=>a.chapter))].map(c=>`<option>${esc(c)}</option>`).join('');$('#chapter').value=old}
function filter(){const c=$('#chapter').value,g=$('#grade').value,s=$('#status').value,q=$('#search').value.trim();list=base.map(merged).filter(a=>{let p=store.progress[a.id]||{};return(!c||a.chapter===c)&&(!g||String(a.grade||0)===g)&&(!q||[a.summary,a.text,a.number,a.chapter].some(x=>String(x).includes(q)))&&(!s||(s==='star'?p.star:s==='new'?!p.state:p.state===s))});index=0;render()}
function scan(a){return `<div class="scan"><div class="scan-title">原图校对 · PDF 第 ${a.pages.join('、')} 页</div><p class="notice">点击图片放大，可与左侧文字对照。</p>${a.pages.map(p=>`<a href="assets/p${p}.jpg" target="_blank" rel="noopener"><img loading="lazy" src="assets/p${p}.jpg" alt="PDF 第 ${p} 页原文扫描"></a>`).join('')}</div>`}
function reference(a){return `<div class="caption">原文 · ${esc(a.number?'第 '+a.number+' 条':'条号待校对')}</div><div class="original">${esc(a.text)}</div><div class="caption">词解</div><div class="text">${esc(a.terms||'本条无词解或未识别到，请核对原图。')}</div><div class="caption">释义</div><div class="text">${esc(a.explanation)}</div>${a.formula?'<div class="caption">附方与煎服法</div><div class="text">'+esc(a.formula)+'</div>':''}`}
function render(){revealed=false;$('#modeTitle').textContent=mode==='practice'?'提要默写 / 从回想开始':'条文查看 / 读懂每一条';$('#counter').textContent=list.length?`${index+1} / ${list.length} 条`:'0 条';$('#empty').hidden=!!list.length;$('#card').hidden=!list.length;$('#prev').disabled=!list.length||index===0;$('#next').disabled=!list.length||index===list.length-1;$('#random').disabled=!list.length;$('#stats').textContent=`共 ${base.length} 条 · 已掌握 ${Object.values(store.progress).filter(p=>p.state==='known').length} 条`;if(!list.length)return;let a=list[index],p=store.progress[a.id]||{};$('#card').classList.toggle('practice-card',mode==='practice');$('#card').innerHTML=`<div class="reading-layout"><div class="reading-text"><div class="meta"><span class="badge">${a.grade?esc(a.grade)+' 级条文':'等级待校对'}</span><span>${esc(a.chapter)}</span><span>${a.number?'第 '+esc(a.number)+' 条':''}</span></div><div class="caption">提要</div><h2 class="prompt">${esc(a.summary||'提要待校对，请查看原图。')}</h2><p class="notice">${a.correctedAt?'已校订 · '+esc(a.correctedAt.slice(0,10)):'扫描识别稿 · 尚未经逐字人工校对'}</p>${mode==='practice'?`<label for="inputAnswer">根据提要默写原文（不必填写条号）</label><textarea id="inputAnswer" placeholder="静心回想，在这里默写…">${esc(store.drafts[a.id]||'')}</textarea><div class="actions"><button class="primary" id="check">对照答案</button><button id="hint">提示首句</button><label style="margin:8px 0"><input id="punct" type="checkbox" checked style="width:auto"> 忽略标点与空格</label></div><div id="hintText" class="notice"></div><div id="result" hidden class="answer"></div>`:reference(a)}<div class="actions"><button data-state="review" ${p.state==='review'?'class="primary"':''}>还需复习</button><button data-state="known" ${p.state==='known'?'class="primary"':''}>已经掌握</button><button id="star">${p.star?'★ 已收藏':'☆ 收藏'}</button><button id="edit">校订文字</button></div></div><div class="reading-image" ${mode==='practice'?'hidden':''}>${scan(a)}</div></div>`;
if(mode==='practice'){$('#inputAnswer').oninput=e=>{store.drafts[a.id]=e.target.value;$('#result').hidden=true;save()};$('#check').onclick=()=>check(a);$('#hint').onclick=()=>{$('#hintText').textContent='首句提示：'+a.text.split(/[，。；！？]/)[0]};}
document.querySelectorAll('[data-state]').forEach(b=>b.onclick=()=>{store.progress[a.id]={...p,state:b.dataset.state};save();render()});$('#star').onclick=()=>{store.progress[a.id]={...p,star:!p.star};save();render()};$('#edit').onclick=()=>edit(a)}
function diff(a,b){if(a.length*b.length>2000000)return '原文较长，请对照下方完整答案校对。';let dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,out='';while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){out+=esc(a[i]);i++;j++}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j])){out+='<ins>'+esc(b[j++])+'</ins>'}else{out+='<del>'+esc(a[i++])+'</del>'}}return out}
function check(a){let raw=$('#inputAnswer').value;if(!raw.trim()){alert('请先输入默写内容。');return}let norm=s=>$('#punct').checked?s.replace(/[\p{P}\p{Z}\s]/gu,''):s.replace(/\s/g,'');let typed=norm(raw),expected=norm(a.text);$('#result').hidden=false;$('#result').innerHTML=`<div class="caption">${typed===expected?'与当前文字答案一致':'对照结果'}</div><p class="notice">红色：多写或写错；绿色：答案中缺少的字。此对照仅比较文字，请结合原图判断。</p><div class="diff">${diff(typed,expected)}</div>${reference(a)}`;$('.reading-image').hidden=false;revealed=true}
let directory=null,dataHandle=null,diskSnapshot=JSON.stringify(base),writing=false;
function parseData(source){const match=source.replace(/^\uFEFF/,'').match(/^\s*window\.ARTICLES\s*=\s*([\s\S]*?);?\s*$/);if(!match)throw Error('不是有效的本程序 data.js 文件。');return JSON.parse(match[1].replace(/;\s*$/,''))}
function fileSource(records){return 'window.ARTICLES = '+JSON.stringify(records,null,2)+';\n'}
async function connectFolder(){
 if(!window.showDirectoryPicker)throw Error('当前浏览器不支持直接写回文件，请用电脑版 Edge 或 Chrome 打开。也可以使用“导出完整题库”，手动替换 data.js。');
 const dir=await window.showDirectoryPicker({mode:'readwrite'});
 const handle=await dir.getFileHandle('data.js');
 const records=parseData(await (await handle.getFile()).text());
 if(JSON.stringify(records)!==diskSnapshot)throw Error('所选文件夹的题库与当前页面不一致。请从该文件夹重新打开 index.html，以免覆盖已有校订。');
 directory=dir;dataHandle=handle;$('#fileStatus').textContent='已连接：'+dir.name+' / data.js';
}
async function persistRecords(records){
 if(writing)throw Error('正在保存，请稍候。');writing=true;
 let writer;
 try{
  if(!dataHandle)await connectFolder();
  const current=parseData(await (await dataHandle.getFile()).text());
  if(JSON.stringify(current)!==diskSnapshot)throw Error('data.js 已被其他页面或程序修改。本次未覆盖，请先备份当前输入，再重新打开页面。');
  writer=await dataHandle.createWritable();await writer.write(fileSource(records));await writer.close();writer=null;
  diskSnapshot=JSON.stringify(records);base.splice(0,base.length,...records);
 }catch(e){if(writer)try{await writer.abort()}catch(_){}throw e}finally{writing=false}
}
function downloadData(records){const u=URL.createObjectURL(new Blob([fileSource(records)],{type:'text/javascript;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='data.js';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function editorValues(){let values={};document.querySelectorAll('[data-field]').forEach(t=>values[t.dataset.field]=t.value.trim());if(!['1','2','3'].includes(values.grade)||!values.text||!values.chapter||!values.summary||!values.number)throw Error('请填写章节、提要、条号和原文，等级应为 1、2 或 3。');values.grade=Number(values.grade);values.correctedAt=new Date().toISOString();return values}
function candidate(a){return base.map(b=>b.id===a.id?{...b,...editorValues()}:b)}
function edit(a){
 $('#editFields').innerHTML=Object.entries(fields).map(([k,v])=>`<label>${v}<textarea data-field="${k}" rows="${['text','terms','explanation','formula'].includes(k)?5:1}">${esc(a[k]||'')}</textarea></label>`).join('');
 $('#editScan').innerHTML=scan(a);$('#editStatus').textContent='保存会直接更新程序文件夹中的 data.js；刷新或部署后仍会使用校订后的文字。';$('#editor').showModal();
 $('#saveEdit').onclick=async e=>{e.preventDefault();const button=e.currentTarget;button.disabled=true;try{const records=candidate(a);await persistRecords(records);list[index]=base.find(b=>b.id===a.id);chapters();render();$('#editor').close();$('#fileStatus').textContent='已写入本地 data.js · '+new Date().toLocaleTimeString()}catch(err){$('#editStatus').textContent=err.name==='AbortError'?'已取消文件授权，文字尚未保存。':('未保存：'+err.message)}finally{button.disabled=false}};
 $('#downloadEdit').onclick=e=>{e.preventDefault();try{downloadData(candidate(a));$('#editStatus').textContent='已导出完整 data.js，请用下载文件替换程序文件夹中的同名文件，然后刷新。当前源文件尚未直接更新。'}catch(err){$('#editStatus').textContent=err.message}};
}
$('#connect').onclick=async()=>{try{await connectFolder()}catch(e){$('#fileStatus').textContent=e.name==='AbortError'?'未选择文件夹。':e.message}};
$('#downloadData').onclick=()=>downloadData(base);
$('#migrate').hidden=!Object.keys(store.edits).length;
$('#migrate').onclick=async()=>{try{const records=base.map(a=>store.edits[a.id]?{...a,...store.edits[a.id],correctedAt:new Date().toISOString()}:a);await persistRecords(records);store.edits={};save();$('#migrate').hidden=true;chapters();filter();$('#fileStatus').textContent='旧版校订已写入本地 data.js。'}catch(e){$('#fileStatus').textContent='未迁移：'+e.message}};
$('#prev').onclick=()=>{if(index>0){index--;render()}};$('#next').onclick=()=>{if(index<list.length-1){index++;render()}};$('#random').onclick=()=>{if(list.length>1)index=(index+1+Math.floor(Math.random()*(list.length-1)))%list.length;render()};['chapter','grade','status'].forEach(id=>$('#'+id).onchange=filter);$('#search').oninput=filter;['practice','browse'].forEach(id=>$('#'+id).onclick=()=>{mode=id;$('#practice').classList.toggle('active',id==='practice');$('#browse').classList.toggle('active',id==='browse');render()});
$('#export').onclick=()=>{let u=URL.createObjectURL(new Blob([JSON.stringify({version:1,...store},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='伤寒论学习备份-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
$('#import').onchange=async e=>{try{let v=JSON.parse(await e.target.files[0].text());if(v.version!==1||!v.progress||!v.edits||!v.drafts)throw Error();for(let k of ['progress','edits','drafts']){if(typeof v[k]!=='object'||Array.isArray(v[k])||v[k]===null)throw Error()}for(let [id,x] of Object.entries(v.edits)){if(!base.some(a=>a.id===id)||typeof x.text!=='string'||typeof x.chapter!=='string'||!['1','2','3'].includes(String(x.grade)))throw Error()}if(!confirm('导入会合并备份，同一条目的本地数据将被备份中的内容替换。继续吗？'))return;for(let k of ['progress','edits','drafts'])Object.assign(store[k],v[k]);save();$('#migrate').hidden=!Object.keys(store.edits).length;chapters();filter();alert('学习进度已导入。若含旧版文字校订，请点击“写入旧版校订”保存到题库文件。')}catch(err){alert('无法读取备份，请选择本程序导出的有效 JSON 文件。')}e.target.value=''};
chapters();filter();


$('#support').onclick=()=>$('#supportDialog').showModal();
