const LOTTERIES = [
 {id:'mega',name:'Mega-Sena',desc:'6 a 20 números',n:60,k:6,min:6,max:20,prizes:[4,5,6],symbol:'M',type:'combination'},
 {id:'lotofacil',name:'Lotofácil',desc:'15 a 20 números',n:25,k:15,min:15,max:20,prizes:[11,12,13,14,15],symbol:'L',type:'combination'},
 {id:'quina',name:'Quina',desc:'5 a 15 números',n:80,k:5,min:5,max:15,prizes:[2,3,4,5],symbol:'Q',type:'combination'},
 {id:'lotomania',name:'Lotomania',desc:'50 números',n:100,k:50,min:50,max:50,prizes:[0,16,17,18,19,20],symbol:'O',type:'lotomania'},
 {id:'duplasena',name:'Dupla Sena',desc:'6 a 15 números · 2 sorteios',n:50,k:6,min:6,max:15,prizes:[3,4,5,6],symbol:'D',type:'combination'},
 {id:'timemania',name:'Timemania',desc:'10 números + time',n:80,k:10,min:10,max:10,prizes:[3,4,5,6,7],symbol:'T',type:'timemania'},
 {id:'diadesorte',name:'Dia de Sorte',desc:'7 a 15 números + mês',n:31,k:7,min:7,max:15,prizes:[4,5,6,7],symbol:'S',type:'combination'},
 {id:'supersete',name:'Super Sete',desc:'7 colunas de 0 a 9',n:10,k:7,min:7,max:7,prizes:[3,4,5,6,7],symbol:'7',type:'super7'},
 {id:'maismilionaria',name:'+Milionária',desc:'6 números + 2 trevos',n:50,k:6,min:6,max:6,prizes:[2,3,4,5,6],symbol:'+',type:'plus'},
 {id:'loteca',name:'Loteca',desc:'14 jogos de futebol',n:3,k:14,min:14,max:14,prizes:[13,14],symbol:'F',type:'special'},
 {id:'federal',name:'Loteria Federal',desc:'Bilhetes numerados',n:100000,k:1,min:1,max:1,prizes:[1],symbol:'B',type:'special'},
 {id:'instantanea',name:'Instantânea',desc:'Bilhetes e prêmios',n:0,k:0,min:0,max:0,prizes:[],symbol:'!',type:'special'}
];

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

let generated=[], saved=JSON.parse(localStorage.getItem('loto_saved')||'[]');

function choose(n,k){
 if(k<0||k>n)return 0;
 k=Math.min(k,n-k);
 let r=1;
 for(let i=1;i<=k;i++)r=r*(n-k+i)/i;
 return Math.round(r);
}

function fmt(n){return new Intl.NumberFormat('pt-BR').format(n)}
function lottery(id){return LOTTERIES.find(x=>x.id===id)||LOTTERIES[0]}

function toast(msg){
 const t=$('#toast');
 t.textContent=msg;
 t.classList.add('show');
 setTimeout(()=>t.classList.remove('show'),2400);
}

function renderLotteryCards(){
 $('#lotteryGrid').innerHTML=LOTTERIES.map(l=>`<button class="lottery-card" data-lottery="${l.id}"><span class="lotto-symbol">${l.symbol}</span><b>${l.name}</b><small>${l.desc}</small></button>`).join('');
 $$('[data-lottery]').forEach(b=>b.onclick=()=>{
  showView('generator');
  $('#gameLottery').value=b.dataset.lottery;
  updateNumberOptions();
 });
}

function fillLotterySelects(){
 ['#gameLottery','#probLottery'].forEach(sel=>{
  $(sel).innerHTML=LOTTERIES.map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
 });
 $('#gameLottery').value='mega';
 $('#probLottery').value='mega';
 updateNumberOptions();
 updateProbabilityOptions();
}

function updateNumberOptions(){
 const l=lottery($('#gameLottery').value);
 const s=$('#numbersCount');
 if(['special','super7','plus'].includes(l.type)){
  s.innerHTML='<option value="0">Modelo específico em desenvolvimento</option>';
  s.disabled=true;
  return;
 }
 s.disabled=false;
 s.innerHTML=Array.from({length:l.max-l.min+1},(_,i)=>`<option value="${l.min+i}">${l.min+i} números</option>`).join('');
 s.value=l.k;
}

function updateProbabilityOptions(){
 const l=lottery($('#probLottery').value),n=$('#probNumbers'),p=$('#probPrize');
 if(!['combination','lotomania'].includes(l.type)){
  n.innerHTML='<option>Modelo específico em desenvolvimento</option>';
  p.innerHTML='<option>Modelo específico em desenvolvimento</option>';
  n.disabled=p.disabled=true;
  return;
 }
 n.disabled=p.disabled=false;
 let min=l.type==='lotomania'?50:l.min,max=l.type==='lotomania'?50:l.max;
 n.innerHTML=Array.from({length:max-min+1},(_,i)=>`<option value="${min+i}">${min+i} números</option>`).join('');
 n.value=l.k;
 p.innerHTML=l.prizes.map(x=>`<option value="${x}">${x===0?'0 acertos':x+' acertos'}</option>`).join('');
}

function randInt(max){
 const a=new Uint32Array(1);
 crypto.getRandomValues(a);
 return a[0]%max;
}

function shuffle(a){
 for(let i=a.length-1;i>0;i--){
  let j=randInt(i+1);
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}

function makeGame(l,count,opts){
 let attempts=0;
 while(attempts++<5000){
  let nums=shuffle(Array.from({length:l.n},(_,i)=>i+1)).slice(0,count).sort((a,b)=>a-b);
  if(opts.balance){
   let evens=nums.filter(x=>x%2===0).length;
   if(Math.abs(evens-(count/2))>1)continue;
  }
  if(opts.range){
   let buckets=new Set(nums.map(x=>Math.floor((x-1)/(l.n/5))));
   if(buckets.size<Math.min(3,Math.ceil(count/5)))continue;
  }
  let key=nums.join('-');
  if(opts.unique&&generated.some(g=>g.key===key))continue;
  return {nums,key};
 }
 return null;
}

function generate(){
 const l=lottery($('#gameLottery').value);
 const count=Number($('#numbersCount').value);
 const qty=Math.max(1,Math.min(100,Number($('#gameCount').value)||1));
 if(!['combination','lotomania','timemania'].includes(l.type)){
  toast('Este gerador específico entrará em uma próxima etapa.');
  return;
 }
 generated=[];
 const opts={
  balance:$('#balanceFilter').checked,
  range:$('#rangeFilter').checked,
  unique:$('#uniqueFilter').checked
 };
 for(let i=0;i<qty;i++){
  const g=makeGame(l,count,opts);
  if(!g)break;
  generated.push({...g,lottery:l.id,created:new Date().toISOString()});
 }
 renderGenerated();
 if(!generated.length)toast('Não foi possível gerar jogos únicos com esses critérios.');
}

function renderGenerated(){
 const el=$('#generatedGames');
 $('#resultSubtitle').textContent=generated.length?`${generated.length} combinação(ões) gerada(s)`: 'Aguardando geração';
 $('#generatedSummary').textContent=generated.length?`${lottery(generated[0].lottery).name} · ${generated[0].nums.length} números por jogo`:'Os jogos gerados não são salvos automaticamente.';
 $('#saveGames').disabled=!generated.length;
 if(!generated.length){
  el.innerHTML='<div class="empty-state"><div class="empty-icon">◎</div><b>Nenhum jogo gerado ainda</b><span>Configure os campos ao lado e clique em gerar.</span></div>';
  return;
 }
 el.innerHTML=generated.map((g,i)=>`<div class="game-row"><span class="game-number">JOGO ${String(i+1).padStart(2,'0')}</span><div class="balls">${g.nums.map(n=>`<span class="number-ball">${String(n).padStart(2,'0')}</span>`).join('')}</div></div>`).join('');
}

function probability(){
 const l=lottery($('#probLottery').value);
 if(!['mega','lotofacil','quina','lotomania','duplasena'].includes(l.id)){
  toast('Esta modalidade exige regras adicionais; o cálculo específico será implementado na próxima etapa.');
  return;
 }
 const chosen=Number($('#probNumbers').value),hits=Number($('#probPrize').value);
 let total=choose(l.n,l.k),ways;
 if(l.type==='lotomania'){
  ways=choose(50,hits)*choose(50,20-hits);
  total=choose(100,20);
 }else{
  ways=choose(chosen,hits)*choose(l.n-chosen,l.k-hits);
 }
 const chance=ways/total,oneIn=chance>0?1/chance:Infinity;
 $('#probResult').innerHTML=`<div class="prob-big"><small>CHANCE TEÓRICA DE ${hits} ACERTOS</small><strong>${Number.isFinite(oneIn)?'1 em '+fmt(Math.round(oneIn)):'Impossível'}</strong><span>${(chance*100).toLocaleString('pt-BR',{maximumFractionDigits:8})}% de chance por aposta</span></div><div class="prob-meta"><div><small>Combinações possíveis do sorteio</small><b>${fmt(total)}</b></div><div><small>Combinações favoráveis</small><b>${fmt(ways)}</b></div></div><p class="micro-copy">Cálculo teórico da faixa numérica por aposta. Regras especiais e custos não incluídos.</p>`;
}

function save(){
 if(!generated.length)return;
 const l=lottery(generated[0].lottery);
 const entries=generated.map(g=>({...g,name:l.name}));
 saved=[...entries,...saved].slice(0,500);
 localStorage.setItem('loto_saved',JSON.stringify(saved));
 renderSaved();
 toast(`${entries.length} jogo(s) salvo(s) neste dispositivo.`);
}

function renderSaved(){
 const el=$('#savedGames');
 if(!saved.length){
  el.innerHTML='<div class="empty-state compact"><b>Nenhum jogo salvo</b><span>Gere combinações e use “Salvar jogos”.</span></div>';
  return;
 }
 el.innerHTML=saved.map((g,i)=>`<div class="saved-item"><div><b>${g.name||lottery(g.lottery).name}</b><small>${g.nums.map(n=>String(n).padStart(2,'0')).join(' · ')} · ${new Date(g.created).toLocaleDateString('pt-BR')}</small></div><button data-delete="${i}" aria-label="Excluir jogo">Excluir</button></div>`).join('');
 $$('[data-delete]').forEach(b=>b.onclick=()=>{
  saved.splice(Number(b.dataset.delete),1);
  localStorage.setItem('loto_saved',JSON.stringify(saved));
  renderSaved();
 });
}

function exportCSV(){
 if(!saved.length){
  toast('Não há jogos salvos para exportar.');
  return;
 }
 const rows=[['Modalidade','Números','Data'],...saved.map(g=>[g.name||lottery(g.lottery).name,g.nums.join(' '),new Date(g.created).toLocaleDateString('pt-BR')])];
 const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\n');
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 a.download='meus-jogos-loto-inteligente.csv';
 a.click();
 URL.revokeObjectURL(a.href);
}

function showView(name){
 $$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));
 $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
 const labels={dashboard:'Visão geral',generator:'Gerador de jogos',probabilities:'Probabilidades',statistics:'Estatísticas',history:'Meus jogos'};
 $('#crumb').textContent=labels[name];
 $('#sidebar').classList.remove('open');
 window.scrollTo({top:0,behavior:'smooth'});
}

$$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));

$('#gameLottery').addEventListener('change',updateNumberOptions);
$('#probLottery').addEventListener('change',updateProbabilityOptions);
$('#generateBtn').addEventListener('click',generate);
$('#saveGames').addEventListener('click',save);
$('#clearGames').addEventListener('click',()=>{generated=[];renderGenerated();});
$('#calculateBtn').addEventListener('click',probability);
$('#exportGames').addEventListener('click',exportCSV);
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#helpBtn').addEventListener('click',()=>$('#helpDialog').showModal());
$('#closeHelp').addEventListener('click',()=>$('#helpDialog').close());

$('#today').textContent=new Intl.DateTimeFormat('pt-BR',{dateStyle:'full'}).format(new Date());
renderLotteryCards();
fillLotterySelects();
renderGenerated();
renderSaved();

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
 navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

// INTEGRAÇÃO SUPABASE
let sbClient=null;
let currentUser=null;
let authMode='login';

const DB_LOTTERY_IDS={
 mega:'mega-sena',
 lotofacil:'lotofacil',
 quina:'quina',
 lotomania:'lotomania',
 duplasena:'dupla-sena',
 timemania:'timemania',
 diadesorte:'dia-de-sorte',
 supersete:'super-sete',
 maismilionaria:'mais-milionaria',
 loteca:'loteca',
 federal:'federal',
 instantanea:'instantanea'
};

function authMessage(msg,bad=false){
 const el=document.querySelector('#authMessage');
 if(el){
  el.textContent=msg;
  el.style.color=bad?'#ff9b9b':'#e7c879';
 }
}

function showAuth(){document.querySelector('#authGate').classList.remove('hidden');}
function hideAuth(){document.querySelector('#authGate').classList.add('hidden');}

function setAuthMode(mode){
 authMode=mode;
 document.querySelector('#authTitle').textContent=mode==='login'?'Entre na sua conta':'Criar sua conta';
 document.querySelector('#authDescription').textContent=mode==='login'?'Acesse seus jogos e análises com segurança.':'Cadastre seu e-mail e uma senha para usar sua área privada.';
 document.querySelector('#authSubmit').textContent=mode==='login'?'Entrar':'Criar conta';
 document.querySelector('#authToggle').textContent=mode==='login'?'Ainda não tenho conta · Criar cadastro':'Já tenho conta · Fazer login';
 document.querySelector('#authPassword').autocomplete=mode==='login'?'current-password':'new-password';
 authMessage('');
}

async function loadCloudGames(){
 if(!sbClient||!currentUser)return;
 const el=$('#savedGames');
 if(el)el.innerHTML='<div class="empty-state compact"><b>Carregando seus jogos...</b><span>Consultando sua conta.</span></div>';
 try{
  const {data,error}=await sbClient.from('saved_games')
   .select('id,lottery_id,label,game_data,created_at')
   .eq('user_id',currentUser.id)
   .order('created_at',{ascending:false})
   .limit(500);

  if(error){
   console.error('Erro ao consultar saved_games:',error);
   saved=[];
   if(el)el.innerHTML=`<div class="empty-state compact"><b>Não foi possível carregar seus jogos</b><span>${[error.message,error.details,error.hint,error.code].filter(Boolean).join(' · ')}</span><button type="button" id="retrySavedGames">Tentar novamente</button></div>`;
   $('#retrySavedGames')?.addEventListener('click',loadCloudGames);
   return;
  }

  saved=(data||[]).map(row=>{
   const game=row.game_data&&typeof row.game_data==='object'?row.game_data:{};
   return {
    ...game,
    nums:Array.isArray(game.nums)?game.nums:[],
    cloudId:row.id,
    lottery:Object.keys(DB_LOTTERY_IDS).find(k=>DB_LOTTERY_IDS[k]===row.lottery_id)||game.lottery||row.lottery_id,
    name:row.label||game.name||'Jogo salvo',
    created:row.created_at||game.created||new Date().toISOString()
   };
  });

  renderSaved();
  if(!data?.length)console.info('Consulta saved_games concluída sem registros para o usuário:',currentUser.id);

 }catch(err){
  console.error('Falha inesperada ao carregar jogos:',err);
  saved=[];
  if(el)el.innerHTML=`<div class="empty-state compact"><b>Falha ao carregar os jogos</b><span>${err.message||String(err)}</span><button type="button" id="retrySavedGames">Tentar novamente</button></div>`;
  $('#retrySavedGames')?.addEventListener('click',loadCloudGames);
 }
}

async function saveCloudGames(){
 if(!sbClient||!currentUser){
  toast('Entre na sua conta para salvar.');
  return;
 }
 if(!generated.length){
  toast('Gere pelo menos um jogo antes de salvar.');
  return;
 }

 const btn=$('#saveGames');
 if(btn){
  btn.disabled=true;
  btn.textContent='Salvando...';
 }

 try{
  const rows=generated.map(g=>({
   user_id:currentUser.id,
   lottery_id:DB_LOTTERY_IDS[g.lottery]||g.lottery,
   label:lottery(g.lottery).name,
   game_data:{
    nums:g.nums,
    lottery:g.lottery,
    key:g.key,
    created:g.created
   }
  }));

  const {data,error}=await sbClient.from('saved_games')
   .insert(rows)
   .select('id,user_id,lottery_id,label,game_data,created_at');

  if(error){
   console.error('Erro ao inserir jogos em saved_games:',error);
   toast('Não foi possível salvar: '+(error.message||error.code||'erro no Supabase'));
   return;
  }

  if(!Array.isArray(data)||data.length!==rows.length){
   console.error('O Supabase não confirmou todos os jogos:',{
    esperados:rows.length,
    retornados:data?.length,
    data
   });
   toast('O Supabase não confirmou todos os jogos. Verifique Meus jogos antes de tentar novamente.');
   await loadCloudGames();
   return;
  }

  const confirmed=data.map(row=>{
   const game=row.game_data&&typeof row.game_data==='object'?row.game_data:{};
   return {
    ...game,
    nums:Array.isArray(game.nums)?game.nums:[],
    cloudId:row.id,
    lottery:Object.keys(DB_LOTTERY_IDS).find(k=>DB_LOTTERY_IDS[k]===row.lottery_id)||game.lottery||row.lottery_id,
    name:row.label||game.name||'Jogo salvo',
    created:row.created_at||game.created||new Date().toISOString()
   };
  });

  saved=[...confirmed,...saved].slice(0,500);
  renderSaved();
  toast(confirmed.length+' jogo(s) confirmado(s) e salvo(s) na sua conta.');

 }catch(err){
  console.error('Falha inesperada ao salvar jogos:',err);
  toast('Falha ao salvar: '+(err.message||String(err)));
 }finally{
  if(btn){
   btn.disabled=!generated.length;
   btn.textContent='Salvar jogos';
  }
 }
}

async function deleteCloudGame(id){
 const {error}=await sbClient.from('saved_games').delete().eq('id',id);
 if(error){
  toast('Não foi possível excluir este jogo.');
  return;
 }
 await loadCloudGames();
}

async function handleAuthSubmit(ev){
 ev.preventDefault();
 if(!sbClient){
  authMessage('Não foi possível iniciar a conexão com o Supabase.',true);
  return;
 }

 const email=document.querySelector('#authEmail').value.trim();
 const password=document.querySelector('#authPassword').value;
 const btn=document.querySelector('#authSubmit');
 btn.disabled=true;
 authMessage(authMode==='login'?'Entrando...':'Criando cadastro...');

 try{
  if(authMode==='login'){
   const {data,error}=await sbClient.auth.signInWithPassword({email,password});
   if(error)throw error;
   if(data.user){
    currentUser=data.user;
    hideAuth();
    await loadCloudGames();
    toast('Login realizado com sucesso.');
   }
  }else{
   const {data,error}=await sbClient.auth.signUp({email,password});
   if(error)throw error;
   if(data.session){
    currentUser=data.user;
    hideAuth();
    await loadCloudGames();
    toast('Cadastro realizado!');
   }else{
    authMessage('Cadastro iniciado. Confirme seu e-mail e depois faça login.');
   }
  }
 }catch(e){
  authMessage(e.message||'Não foi possível concluir. Confira os dados.',true);
 }finally{
  btn.disabled=false;
 }
}

async function initSupabase(){
 const cfg=window.LOTO_SUPABASE_CONFIG||{};
 if(!window.supabase||!cfg.url||!cfg.publishableKey){
  showAuth();
  authMessage('Configuração do Supabase ausente.');
  return;
 }

 sbClient=window.supabase.createClient(cfg.url,cfg.publishableKey);

 document.querySelector('#authForm').addEventListener('submit',handleAuthSubmit);
 document.querySelector('#authToggle').addEventListener('click',()=>setAuthMode(authMode==='login'?'signup':'login'));

 document.querySelector('#signOutBtn').addEventListener('click',async()=>{
  await sbClient.auth.signOut();
  currentUser=null;
  saved=[];
  renderSaved();
  showAuth();
  setAuthMode('login');
  toast('Você saiu da sua conta.');
 });

 const {data:{session}}=await sbClient.auth.getSession();

 if(session?.user){
  currentUser=session.user;
  hideAuth();
  await loadCloudGames();
 }else{
  showAuth();
  setAuthMode('login');
 }

 sbClient.auth.onAuthStateChange(async(_event,session)=>{
  currentUser=session?.user||null;
  if(currentUser){
   hideAuth();
   await loadCloudGames();
  }else{
   showAuth();
  }
 });
}

// Substitui o salvamento local pelo salvamento na nuvem.
$('#saveGames').removeEventListener('click',save);
$('#saveGames').addEventListener('click',saveCloudGames);

// Renderização do histórico com exclusão dos registros na nuvem.
renderSaved=function(){
 const el=$('#savedGames');

 if(!saved.length){
  el.innerHTML='<div class="empty-state compact"><b>Nenhum jogo salvo</b><span>Gere combinações e use “Salvar jogos”.</span></div>';
  return;
 }

 el.innerHTML=saved.map((g,i)=>`
  <div class="saved-item">
   <div>
    <b>${g.name||lottery(g.lottery).name}</b>
    <small>${(g.nums||[]).map(n=>String(n).padStart(2,'0')).join(' · ')} · ${new Date(g.created).toLocaleDateString('pt-BR')}</small>
   </div>
   <button data-delete="${i}" aria-label="Excluir jogo">Excluir</button>
  </div>
 `).join('');

 $$('[data-delete]').forEach(b=>b.onclick=()=>{
  const item=saved[Number(b.dataset.delete)];
  if(item?.cloudId)deleteCloudGame(item.cloudId);
 });
};

initSupabase();
