(function app(){
'use strict'
const $=s=>document.querySelector(s)
const {runs,questions,caseNames,version}=dossier
const q=questions[1]
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const shapes={file:'<path d="M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',layers:'<path d="m3 8 9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5"/>',book:'<path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3z M12 6v15"/>',link:'<path d="m10 14 4-4 M8 16l-1 1a3.5 3.5 0 0 1-5-5l5-5a3.5 3.5 0 0 1 5 0 M16 8l1-1a3.5 3.5 0 0 1 5 5l-5 5a3.5 3.5 0 0 1-5 0" transform="translate(0 -1)"/>',shield:'<path d="m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5z M8 12l3 3 5-6"/>',branch:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10 M18 9c0 5-7 3-12 7"/>',check:'<path d="m4 11 5 5L20 5"/>',folder:'<path d="M3 6h7l2 2h9v12H3z"/>',copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',chev:'<path d="m9 5 7 7-7 7"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'}
const icon=name=>`<svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${shapes[name]||''}</svg>`
const ids=['overview','questions','evidence','retest','package','contact']
const labels=['成果物','課題整理','根拠確認','再テスト','提出用一式','相談']
const titles=['受け取る成果物','回答が止まる理由を整理する','権限の確認結果をたどる','同じ条件で、修正前後を比べる','承認後に提出する一式','自社の質問票で相談する','更新後に、何を確認し直すか']
const english=['DELIVERABLES','QUESTIONNAIRE','EVIDENCE','RETEST','SUBMISSION','CONSULTATION','MONITORING']
let current=0
let selectedCase='N01', selectedVersion='1.0'
let contactOpen=false
let session
try{session=sessionStorage.getItem('ap-session')||crypto.randomUUID();sessionStorage.setItem('ap-session',session)}catch{session=globalThis.crypto?.randomUUID?.()}
const sent=new Set()
async function track(name){
  const key=`ap-${version}-${name}`
  if(!session||sent.has(key))return
  try{if(sessionStorage.getItem(key))return}catch{}
  sent.add(key)
  try{
    if(location.hostname==='mao925.github.io'){
      const url='https://github.com/Mao925/agentproof-sales-demo/releases/download/demo-v'+version+'/'+name+'.gif'
      await fetch(url+'?visit='+crypto.randomUUID(),{mode:'no-cors',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',keepalive:true})
      try{sessionStorage.setItem(key,'1')}catch{}
      return
    }
    if(location.protocol==='file:')return
    const res=await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:name,session,version}),keepalive:true})
    if(!res.ok)throw Error()
    try{sessionStorage.setItem(key,'1')}catch{}
  }catch{sent.delete(key)}
}
const id=x=>`<span class="id">${esc(x)}</span>`
const status=(s,warn=false)=>`<span class="status${warn?' amber':''}">${esc(s)}</span>`
const facts=items=>`<dl class="facts">${items.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
const date=t=>new Intl.DateTimeFormat('ja-JP',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Tokyo'}).format(new Date(t))+' JST'
const list=arr=>arr.length?arr.join('、'):'なし'
const resource=(i,title,desc,href)=>`<a class="resource" href="${href}"><span class="iconbox">${icon(i)}</span><span><strong>${title}</strong><small>${desc}</small></span></a>`
const pdfLink=(label,cls='btn primary')=>`<a class="${cls}" target="_blank" rel="noopener" href="agentproof-sample.pdf" data-event="sample_download">${icon('file')}${label}</a>`
function overview(){return `<div class="grid"><article class="panel"><div class="question-label">${id('Q02')} 取引先の質問票より</div><h3 class="question">${q.question}</h3><div class="answer"><h4>回答案</h4><p>${q.answer}</p></div><a class="evidence-ref" href="#evidence">${icon('link')}根拠を読む · ${q.source}</a></article><aside class="panel"><div class="resource-head"><h3>回答に添えるもの</h3><span class="resource-code">PACK / 01</span></div>${resource('file','回答案と根拠資料','設問ごとの回答と、参照する検証記録','#questions')}${resource('branch','修正方針と再テスト結果','同じ利用者・要求で比較した前後の記録','#retest')}${resource('layers','確認範囲と未確認事項','対象版・試験条件・追加対応が必要な項目','#package')}</aside></div>`}
function questionnaire(){return `<p class="intro">担当者が3つの設問を読み、回答に必要な資料・実装・契約条件を切り分けます。</p><div class="list">${questions.map(x=>`<article class="panel qrow ${x.id==='Q02'?'focus':''}">${id(x.id)}<div><div class="row-label">${x.kind}</div><h3>${x.question}</h3><p>${x.answer} ${x.id==='Q02'?'':x.action}</p><details><summary>${x.sourceName}を見る</summary><div class="detail-copy">${x.source} ／ ${x.detail}</div>${x.id==='Q02'?'<a class="evidence-ref" href="#evidence">検証記録を開く</a>':''}</details></div>${status(x.state,x.id!=='Q02')}</article>`).join('')}</div>`}
function scopeDetails(r){return `<details><summary>対象版・試験条件・未確認範囲</summary>${facts([['対象',dossier.product+' v'+r.version],['検索・設定','ローカル文書ストア / '+r.policy],['環境',dossier.environment],['端末試験',dossier.model+' ／ 応答未取得'],['追加試験',dossier.modelRuns[0].model+'（隔離ランナー上で実行）'],['記録日時',date(r.time)],['条件',dossier.scope],['対象外',dossier.limits]])}</details>`}
function rawDetails(rows){return `<details><summary>元記録を見る（${rows.length}試行）</summary>${rows.map(r=>`<div class="mono">${esc(r.run)}</div><pre>${esc(JSON.stringify(r,null,2))}</pre>`).join('')}<a class="evidence-ref" target="_blank" rel="noopener" href="runs.json">全実行記録を開く（JSON）</a></details>`}
function evidence(){const r=runs.find(r=>r.caseId==='A01'&&r.version==='1.0');return `<div class="topline">${id('EV-02')} ${status('自社検証環境での実測')}<span class="scenario">記録済みの結果を再生</span></div><div class="grid"><article class="panel"><div class="small-label">${id('A01')} 修正前 · v1.0</div><h3 class="question">営業部から、人事部の文書を要求</h3><div class="answer"><h4>${r.role}の利用者</h4><p>「${r.request}」</p></div>${facts([['検索候補',list(r.candidates)+'（人事部限定）'],['適用した権限',r.effective],['返却文書',list(r.returned)],['判定理由',r.reason],['モデルへの入力','対象外（検索のみ）']])}</article><aside class="panel"><h3>文書を返さない理由まで確認する</h3><p>権限外の文書は返りませんでした。ただし、修正前は利用者に部門が割り当てられず、どの文書も取得できない設定でした。</p><div class="note">正常系 N01・N02 でも取得を拒否。担当者は、自部門の文書が読めることも回答の条件に含めました。</div></aside></div><div class="panel wide">${scopeDetails(r)}${rawDetails([r])}</div>`}
function modelResults(row){
 const observations=dossier.modelRuns.filter(m=>m.caseId===row.caseId && m.version===row.version)
 if(!observations.length)return ''
 const m=observations[0], unsupported=m.caseId==='A02'
 return '<hr class="separator"><h3>モデルに渡した文書と回答</h3><p class="detail-copy">同じ部門設定で取得から生成までを別環境で再実行した記録です。</p>'+facts([['モデル',m.model],['モデル入力',list(m.modelInput)],['実際の回答',m.answer],['試行結果',observations.length+'回とも同じ回答']])+
 (unsupported?'<div class="note">回答の日付に根拠がありません。人事文書の取得は拒否されましたが、生成回答の妥当性には課題が残りました。</div>':'')+
 '<details><summary>追加検証の元記録・条件</summary>'+facts([['対象版',m.version],['実行日時',date(m.time)],['モデル版',m.revision],['構成',m.environment]])+'<pre>'+esc(JSON.stringify(observations,null,2))+'</pre><a class="evidence-ref" target="_blank" rel="noopener" href="model-runs.json">追加の全8試行（JSON）</a></details>'
}
function comparePane(){
 const rows=runs.filter(r=>r.version===selectedVersion&&r.caseId===selectedCase),r=rows[0]
 return `<div class="topline">${id(r.caseId)}${status('取得結果：'+r.verdict,r.verdict==='要修正')}</div><h3>${caseNames[r.caseId]}</h3>${facts([['要求',r.request],['利用者 / 文書',r.role+' / '+r.target],['確認経路',r.route],['期待する文書',list(r.expected)],['候補 → 返却',list(r.candidates)+' → '+list(r.returned)],['判定理由',r.reason],['端末試験の応答',r.modelState==='未確認'?`${rows.length}回試行・応答取得0回。同じ条件の追加試験結果を下に掲載。`:r.modelState]])}<hr class="separator">${scopeDetails(r)}${rawDetails(rows)}${modelResults(r)}`
}
function retest(){return `<div class="topline">${status('自社検証環境での実測')}<span class="scenario">記録済みの結果を再生 · 5ケース</span></div><div class="grid"><article class="panel"><div class="filters"><label for="case">試験ケース</label><select id="case">${Object.entries(caseNames).map(([k,v])=>`<option value="${k}" ${selectedCase===k?'selected':''}>${k} · ${v}</option>`).join('')}</select></div><div class="tabs" aria-label="比較する版">${['1.0','1.1'].map((v,i)=>`<button data-version="${v}" aria-pressed="${selectedVersion===v}">${i?'修正後':'修正前'} v${v}</button>`).join('')}</div><div id="compare-result" aria-live="polite">${comparePane()}</div></article><aside class="panel"><h3>修正から回答案への反映</h3><div class="stacklist"><div><h4 class="label">検証担当者の指摘</h4><p>${dossier.finding}</p></div><div><h4 class="label">開発会社側の修正</h4><p>${dossier.fix}</p></div><div><h4 class="label">AgentProof の再テスト</h4><p>修正後は、営業部の利用者には営業文書を、人事部の利用者には人事文書を返しました。営業部からの人事文書の取得は引き続き拒否されました。</p></div></div><div class="note">${dossier.limits}</div></aside></div>`}
function pack(){return `<div class="grid"><article class="panel"><div class="topline">${id('PACK-01')} ${status('顧客確認待ち',true)}</div><h3>質問票の回答・確認結果</h3><p>回答案と根拠を担当者が照合し、開発会社が内容を承認した版を提出します。</p><hr class="separator"><div class="stacklist"><div><h4>01　質問票と回答案</h4><p>3設問の回答、状態、根拠ID。</p></div><div><h4>02　評価の範囲と結果</h4><p>対象版と確認日、5ケースの取得結果。</p></div><div><h4>03　修正・再テストと未確認事項</h4><p>修正主体、元記録、残る確認と協議。</p></div></div><hr class="separator">${pdfLink('承認後の提出用サンプルを見る')}<p class="detail-copy">PDF · 全3ページ · 説明用サンプル</p></article><aside class="panel"><h3>提出時にも残す条件</h3>${facts([['対象',dossier.scope],['確認範囲',dossier.limits],['Q01','契約と組織設定の資料確認待ち。'],['Q03',questions[2].answer]])}<div class="note">このサンプルの閲覧で承認・取引先への送付は行われません。</div></aside></div>`}
function contact(){return `<div class="grid"><article class="panel"><div class="topline"><span class="iconbox">${icon('clock')}</span><span class="small-label">30分の無料診断</span></div><h3>回答に困っている設問を1つ、相談する</h3><p>今ある資料で答えられる設問と、追加確認が必要な設問を一緒に整理します。</p><hr class="separator"><button class="btn primary" id="consult" aria-controls="reply" aria-expanded="${contactOpen}">自社の質問票で30分の無料診断を相談する</button><div id="reply" class="copy-box" ${contactOpen?'':'hidden'}><label for="reply-text">送付メールへの返信案</label><textarea id="reply-text" readonly>${esc(dossier.reply)}</textarea><div class="cta-row"><button class="btn secondary" id="copy">${icon('copy')}返信案をコピー</button><span class="detail-copy" role="status" id="copy-status"></span></div><p class="detail-copy">送付元への返信に貼り付け、必要事項を記入してください。質問票の共有方法は担当者と確認できます。</p></div></article><aside class="panel"><h3>この例で残った確認事項</h3><div class="stacklist"><div><h4>Q01　学習利用の条件</h4><p>対象サービスの契約・設定資料を確認します。</p></div><div><h4>Q02　文書権限の確認範囲</h4><p>${dossier.limits}</p></div><div><h4>Q03　保存期間</h4><p>${questions[2].answer}</p></div></div></aside></div><div class="panel wide">${resource('branch','構成が変わったら？','追加体験 · 約45秒で継続監視の流れを見る','#monitoring')}</div>`}
function monitor(){return `<div class="topline">${id('Q02')} ${status('変更通知のサンプル')}</div><div class="grid"><article class="panel"><div class="stacklist"><div><h3>1. 変更通知を受け取る</h3><p>開発会社から「部門権限設定を dept-1.1 から dept-1.2 に更新」と連絡が届いた例です。</p></div><div><h3>2. 影響する回答を特定する</h3><p>EV-02 は旧版の記録として保持します。Q02 の現行版への適用は再確認が必要です。Q01・Q03 の資料・契約の状態はそれぞれ引き継ぎます。</p></div><div><h3>3. 担当者へ再確認を依頼する</h3><div class="answer"><h4>通知例 ／ 開発会社の設定担当者宛</h4><p>変更箇所と有効な部門設定を共有してください。対象経路を再テストし、回答案と根拠の版を更新します。</p></div></div></div></article><aside class="panel"><h3>既存ログで見える範囲</h3><p>利用者の実効権限、文書IDと部門、取得結果、設定版を受け取れる経路で照合します。本文は既定の受信項目に含めません。</p><div class="note">未受信の経路や、回答に現れた機密内容は観測できません。取得時の制御は開発会社が担い、継続監視では検知・通知・再確認を扱います。</div></aside></div>`}
function hero(i){
const kick='<div class="kicker">INTERACTIVE DEMO</div>'
if(i>0)return `<div class="hero stage-hero"><div class="wrap hero-in"><div class="hero-copy">${kick}<div class="hero-title">社内文書検索AIの審査対応</div></div><div class="meta">回答案と根拠をたどるデモ</div></div></div>`
return `<div class="hero"><div class="wrap hero-in"><div class="hero-copy">${kick}<h1>質問票の回答から、<br><span>検証の根拠まで。</span></h1><div class="meta"><span>${icon('clock')}約3分</span><i></i><span>${icon('layers')}全6画面</span><i></i><span>登録・資料入力不要</span></div></div><div class="art" aria-hidden="true"><div class="art-tag">EVIDENCE FILE</div><div class="stack"><div class="sheet"></div><div class="sheet"></div><div class="paper"><div class="paper-top">AgentProof <span>Q02</span></div><div class="paper-title">審査対応パック</div><div class="paper-line"></div><div class="paper-line short"></div><div class="paper-foot"><b></b> EVIDENCE / EV-02</div><div class="seal">${icon('link')}</div></div></div></div></div></div>`}
const screens=[overview,questionnaire,evidence,retest,pack,contact,monitor]
const next=['どう確認したかを見る','文書権限の根拠を見る','修正と再テストを見る','提出用一式を見る','自社の相談へ進む']
function render(focus=false){
 const hash=location.hash.slice(1)
 current=hash==='monitoring'?6:Math.max(0,ids.indexOf(hash))
 document.title=titles[current]+' | AgentProof'
 $('#hero').innerHTML=hero(current)
 $('#steps').innerHTML=ids.map((slug,i)=>`<a class="step ${current===i?'current':''}" ${current===i?'aria-current="step"':''} href="#${slug}"><b>${('0'+(i+1)).slice(-2)}</b>${labels[i]}</a>`).join('')
 const prev=current===0?`<a class="text-link" href="#package">${icon('folder')}提出用一式を先に見る</a>`:`<a class="text-link back" href="#${ids[current-1]}">${icon('chev')}戻る</a>`
 const forward=current<5?`<a class="btn primary" href="#${ids[current+1]}">${next[current]}</a>`:`<a class="text-link" href="#overview">最初の画面へ</a>`
 $('#main').innerHTML=`<div class="section-head"><div><div class="eyebrow">${current===6?'追加体験':'STEP 0'+(current+1)+' / 06'} &nbsp; ${english[current]}</div><h2>${titles[current]}</h2></div><span class="scenario">${icon('book')}説明用シナリオ · 社内文書検索AI</span></div>${screens[current]()}<div class="pager">${prev}${forward}</div>`
 if(focus){$('#main').focus({preventScroll:true});window.scrollTo(0,0)}
}
async function copyReply(){
 const field=$('#reply-text')
 let ok=false
 try{await navigator.clipboard.writeText(field.value);ok=true}catch{field.focus();field.select();try{ok=document.execCommand('copy')}catch{}}
 $('#copy-status').textContent=ok?'コピーしました。送付メールに貼り付けてください。':'返信案を選択しました。端末のコピー操作を使ってください。'
 if(ok)track('reply_copy')
}
document.addEventListener('click',e=>{
 const a=e.target.closest('a,button,summary');if(!a)return
 if(a.matches('.skip')){e.preventDefault();$('#main').focus();return}
 if(!a.matches('.brand'))track('demo_start')
 if(a.dataset.event)track(a.dataset.event)
 const href=a.getAttribute('href')
 if(href==='#evidence'||(a.tagName==='SUMMARY'&&current===2))track('evidence_open')
 if(href==='#retest'||(a.tagName==='SUMMARY'&&current===3))track('retest_open')
 if(a.dataset.version){selectedVersion=a.dataset.version;document.querySelectorAll('[data-version]').forEach(b=>b.setAttribute('aria-pressed',String(selectedVersion===b.dataset.version)));$('#compare-result').innerHTML=comparePane();track('retest_open')}
 if(a.id==='consult'){contactOpen=true;$('#reply').hidden=false;a.setAttribute('aria-expanded','true');track('contact_click');$('#reply-text').focus()}
 if(a.id==='copy')copyReply()
})
document.addEventListener('change',e=>{if(e.target.id==='case'){selectedCase=e.target.value;$('#compare-result').innerHTML=comparePane();track('demo_start');track('retest_open')}})
window.addEventListener('hashchange',()=>render(true))
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon))
render()
})()
