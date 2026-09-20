(() => {
  'use strict';
  const civs = window.ATLAS_CIVS, plans = window.ATLAS_PLANS;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  let selected = civs[0].id, strategy = 'feudal';
  function matches() {
    const tokens = normalize($('search').value).trim().split(/\s+/).filter(Boolean);
    return civs.filter(c => {
      const hay = normalize(JSON.stringify(c)+' '+c.plans.map(p=>JSON.stringify(plans[p])).join(' '));
      return tokens.every(t=>hay.includes(t)) && ($('edition').value==='all'||c.edition===$('edition').value) && ($('age').value==='all'||c.plans.some(p=>String(plans[p].age)===$('age').value));
    });
  }
  function saveHash() {
    const q = new URLSearchParams({civ:selected,plan:strategy});
    if($('search').value) q.set('q',$('search').value);
    if($('age').value!=='all') q.set('age',$('age').value);
    if($('edition').value!=='all') q.set('edition',$('edition').value);
    history.replaceState(null,'',`#${q}`);
  }
  function choosePlan(c) {
    const eligible = c.plans.filter(p=>$('age').value==='all'||String(plans[p].age)===$('age').value);
    if(!eligible.includes(strategy)) strategy=eligible[0]||c.plans[0];
  }
  function render() {
    const filtered=matches();
    $('count').textContent=`${filtered.length} / ${civs.length}`;
    if(!filtered.some(c=>c.id===selected)&&filtered.length) selected=filtered[0].id;
    $('civ-list').innerHTML=filtered.length?filtered.map(c=>`<button class="civ ${c.id===selected?'active':''}" data-civ="${escape(c.id)}" aria-pressed="${c.id===selected}"><img class="civ-flag" src="${escape(c.flag)}" alt="" width="60" height="40"><span class="civ-name">${escape(c.name)}<small>${escape(c.en)}</small></span><span class="chevron" aria-hidden="true">›</span></button>`).join(''):'<p class="empty">該当する文明がありません</p>';
    if(!filtered.length){$('detail').innerHTML='<div class="empty"><h2>条件に合う文明がありません</h2><p>検索語を短くするか、時代・文明の絞り込みを変更してください。</p><button class="strategy" id="empty-reset">すべての文明を表示</button></div>';$('empty-reset').onclick=reset;saveHash();return;}
    const c=civs.find(c=>c.id===selected);choosePlan(c);renderDetail(c);saveHash();
  }
  function renderDetail(c) {
    const p=plans[strategy];
    const stepText = value => c.id === 'mongols' ? value.replaceAll('住宅と採集所','ゲルと生産施設').replaceAll('住宅・採集所','ゲルと生産施設').replaceAll('人口上限に余裕をつくる','オボー周辺での生産を整える').replaceAll('採集所と人口枠','ゲルと生産施設') : value;
    const unitDefinitions=items=>items.map(i=>`<div class="unit-entry"><dt>${escape(i.name)}</dt><dd>${escape(i.description)}<div class="matchup"><p><b class="advantage">得意・役割</b><span>${escape(i.matchup.strong)}</span></p><p><b class="disadvantage">苦手・脅威</b><span>${escape(i.matchup.weak)}</span></p><p class="matchup-note">${escape(i.matchup.note)}</p></div></dd></div>`).join('');
    const definitions=items=>items.map(i=>`<dt>${escape(i.name)}</dt><dd>${escape(i.description)}</dd>`).join('');
    $('detail').innerHTML=`<div class="detail-head"><img class="civ-flag" src="${escape(c.flag)}" alt="" width="60" height="40"><div><div class="en">${escape(c.en)}</div><h2>${escape(c.name)}</h2></div><span class="badge">${c.edition==='base'?'基本文明':'追加・派生文明'}</span></div>
      <p class="summary">${escape(c.summary)}</p><div class="tags">${c.tags.map(t=>`<span class="tag">${escape(t)}</span>`).join('')}</div>
      <section class="section"><div class="section-title"><h3><span class="number">01</span>文明の特徴と相性</h3><small>主な要素をピックアップ</small></div><div class="weakness-card"><h3>文明の弱点・注意点</h3><p>${escape(c.weakness)}</p></div><p class="note matchup-guide">相性は基本兵種と能力から見た定性的な目安です。同時代・同程度の研究を想定し、同数の1対1勝敗を示すものではありません。軍量・資源コスト・地形・操作で変わります。「射撃」は一括りにせず、弓兵・弩兵・火薬兵を区別します。</p><div class="unique-grid"><div class="info-card"><div class="label">UNIQUE UNITS / 固有・特徴的なユニット</div><dl>${unitDefinitions(c.units)}</dl></div><div class="info-card"><div class="label">TECH & SYSTEM / 研究・文明システム</div><dl>${definitions(c.systems)}</dl></div></div></section>
      <section class="section"><div class="section-title"><h3><span class="number">02</span>戦術とパワースパイク</h3><small>強みを発揮する時間帯</small></div><div class="strategy-picker" aria-label="戦術を選択">${c.plans.map(key=>`<button class="strategy" data-plan="${key}" aria-pressed="${key===strategy}">${escape(plans[key].name)}</button>`).join('')}</div><p class="strategy-context">${escape(p.goal)}</p><div class="timeline-box"><div class="time-labels"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>24:00+</span></div><div class="track" role="img" aria-label="目安 ${p.start}分から${p.end}分"><span class="window" style="left:${p.start/24*100}%;width:${(Math.min(p.end,24)-p.start)/24*100}%"></span></div><div class="spike-row"><div class="spike-time">${p.start}:00 – ${p.end}:00</div><div><strong>${escape(p.title)}</strong><p>${escape(c.condition)}</p></div></div></div><p class="note">標準資源・1v1陸マップを想定した戦術タイプ別の目安。実測タイムや勝率ではありません。文明・対面・マップ・パッチで前後し、時刻より軍量・研究・資源の条件を優先します。</p></section>
      <section class="section"><div class="section-title"><h3><span class="number">03</span>暗黒時代の内政</h3><small>${escape(p.name)} / 練習用の方針</small></div><div class="info-card"><div class="label">${escape(c.name)}で意識すること</div><p>${escape(c.opening)}</p></div><p class="note" style="margin-bottom:12px">以下は戦術ごとの配分方針です。農民人数を固定した検証済みビルドオーダーではありません。</p><div class="build">${p.steps.map(([phase,title,text,resources],i)=>`<div class="build-row"><div class="phase">${escape(phase)}<small>STEP ${String(i+1).padStart(2,'0')}</small></div><div><strong>${escape(title)}</strong><p>${escape(stepText(text))}</p><div class="resources">${resources.split('|').map(r=>`<span class="resource">${escape(r)}</span>`).join('')}</div></div></div>`).join('')}</div><p class="warning">判断の分かれ目：${escape(p.risk)}</p></section>
      <div class="sources"><p>文明の弱点・相性は編集上の解説です。最新パッチでの実戦検証は未実施です。</p><p>${window.ATLAS_MATCHUP_SOURCES.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a>`).join(" ")}</p><a href="${escape(c.source)}" target="_blank" rel="noopener noreferrer">${escape(c.en)} 公式文明紹介 ↗</a><p>文明の特徴：公式紹介を要約（確認日 ${c.reviewed}）。紹介ページが現行の数値を反映していない場合があります。戦術・時間・内政：本サイトの編集案。最新パッチでの実戦検証は未実施です。</p></div>`;
  }
  function reset(){ $('search').value='';$('age').value='all';$('edition').value='all';render(); }
  function readHash(){
    if(location.hash==='#detail') return;
    const p=new URLSearchParams(location.hash.slice(1));
    selected=civs.some(c=>c.id===p.get('civ'))?p.get('civ'):civs[0].id;
    strategy=Object.hasOwn(plans,p.get('plan'))?p.get('plan'):'feudal';
    $('search').value=p.get('q')||'';
    $('age').value=['2','3','4'].includes(p.get('age'))?p.get('age'):'all';
    $('edition').value=['base','dlc'].includes(p.get('edition'))?p.get('edition'):'all';render();
  }
  $('search').addEventListener('input',render);
  $('age').addEventListener('change',render);$('edition').addEventListener('change',render);$('reset').onclick=reset;
  $('civ-list').addEventListener('click',event=>{const b=event.target.closest('[data-civ]');if(!b)return;selected=b.dataset.civ;render();const active=$('civ-list').querySelector(`[data-civ="${selected}"]`);active?.focus({preventScroll:true});});
  $('detail').addEventListener('click',event=>{const b=event.target.closest('[data-plan]');if(!b)return;strategy=b.dataset.plan;if($('age').value!=='all'&&String(plans[strategy].age)!==$ ('age').value)$('age').value='all';render();$('detail').querySelector(`[data-plan="${strategy}"]`)?.focus({preventScroll:true});});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){event.preventDefault();$('search').focus();}});
  window.addEventListener('hashchange',readHash);readHash();
  const context=document.modelContext;
  if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'search_civilizations',description:'検索語で文明一覧を絞り込み、画面を更新する。',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input.query!=='string'||Object.keys(input).some(k=>k!=='query'))throw new Error('query は文字列で指定してください');$('search').value=input.query;$('age').value='all';$('edition').value='all';render();return {civilizations:matches().map(c=>({id:c.id,name:c.name}))};}})).catch(()=>{});}catch{}}
})();


