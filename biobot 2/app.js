const speciesCatalog = [
  {key:'vaquita',name:'Vaquita',scientific:'Phocoena sinus',group:'Mammal',place:'Gulf of California · Mexico',emoji:'🐬',status:'Critically endangered',kind:'mammal'},
  {key:'saola',name:'Saola',scientific:'Pseudoryx nghetinhensis',group:'Mammal',place:'Annamite Mountains · Laos and Vietnam',emoji:'🦌',status:'Critically endangered',kind:'mammal'},
  {key:'gharial',name:'Gharial',scientific:'Gavialis gangeticus',group:'Reptile',place:'South Asian rivers',emoji:'🐊',status:'Critically endangered',kind:'other'},
  {key:'kakapo',name:'Kākāpō',scientific:'Strigops habroptilus',group:'Bird',place:'Aotearoa New Zealand',emoji:'🦜',status:'Critically endangered',kind:'bird'},
  {key:'yangtze',name:'Yangtze finless porpoise',scientific:'Neophocaena asiaeorientalis',group:'Mammal',place:'Yangtze River · China',emoji:'🐬',status:'Endangered',kind:'mammal'},
  {key:'eagle',name:'Philippine eagle',scientific:'Pithecophaga jefferyi',group:'Bird',place:'Philippines',emoji:'🦅',status:'Critically endangered',kind:'bird'},
  {key:'bustard',name:'Great Indian bustard',scientific:'Ardeotis nigriceps',group:'Bird',place:'India’s open grasslands',emoji:'🪶',status:'Critically endangered',kind:'bird'},
  {key:'hirola',name:'Hirola',scientific:'Beatragus hunteri',group:'Mammal',place:'Kenya · near the Somalia border',emoji:'🦌',status:'Critically endangered',kind:'mammal'},
  {key:'ibis',name:'Northern bald ibis',scientific:'Geronticus eremita',group:'Bird',place:'North Africa and Europe',emoji:'🪶',status:'Endangered',kind:'bird'},
  {key:'ploughshare',name:'Ploughshare tortoise',scientific:'Astrochelys yniphora',group:'Reptile',place:'Madagascar',emoji:'🐢',status:'Critically endangered',kind:'other'},
  {key:'redwolf',name:'Red wolf',scientific:'Canis rufus',group:'Mammal',place:'North Carolina · United States',emoji:'🐺',status:'Endangered',kind:'mammal'},
  {key:'axolotl',name:'Wild axolotl',scientific:'Ambystoma mexicanum',group:'Amphibian',place:'Xochimilco · Mexico City',emoji:'🦎',status:'Critically endangered',kind:'other'},
  {key:'javanmagpie',name:'Javan green magpie',scientific:'Cissa thalassina',group:'Bird',place:'Java · Indonesia',emoji:'🐦',status:'Critically endangered',kind:'bird'},
  {key:'sumatrancuckoo',name:'Sumatran ground-cuckoo',scientific:'Carpococcyx viridis',group:'Bird',place:'Sumatra · Indonesia',emoji:'🐦',status:'Critically endangered',kind:'bird'},
  {key:'riverterrapin',name:'Northern river terrapin',scientific:'Batagur baska',group:'Reptile',place:'South and Southeast Asian rivers',emoji:'🐢',status:'Critically endangered',kind:'other'},
  {key:'tapanuli',name:'Tapanuli orangutan',scientific:'Pongo tapanuliensis',group:'Mammal',place:'Batang Toru · Sumatra, Indonesia',emoji:'🦧',status:'Critically endangered',kind:'mammal'},
  {key:'sumatranorangutan',name:'Sumatran orangutan',scientific:'Pongo abelii',group:'Mammal',place:'Northern Sumatra · Indonesia',emoji:'🦧',status:'Critically endangered',kind:'mammal'},
  {key:'javanrhino',name:'Javan rhinoceros',scientific:'Rhinoceros sondaicus',group:'Mammal',place:'Ujung Kulon · Java, Indonesia',emoji:'🦏',status:'Critically endangered',kind:'mammal'},
  {key:'hawksbill',name:'Hawksbill turtle',scientific:'Eretmochelys imbricata',group:'Reptile',place:'Tropical oceans worldwide',emoji:'🐢',status:'Critically endangered',kind:'other'},
  {key:'forestelephant',name:'African forest elephant',scientific:'Loxodonta cyclotis',group:'Mammal',place:'Central and West African forests',emoji:'🐘',status:'Critically endangered',kind:'mammal'},
  {key:'mountaingorilla',name:'Mountain gorilla',scientific:'Gorilla beringei beringei',group:'Mammal',place:'Virunga Mountains and Bwindi · East Africa',emoji:'🦍',status:'Endangered',kind:'mammal'},
  {key:'borneanorangutan',name:'Bornean orangutan',scientific:'Pongo pygmaeus',group:'Mammal',place:'Borneo · Indonesia and Malaysia',emoji:'🦧',status:'Critically endangered',kind:'mammal'},
  {key:'redpanda',name:'Red panda',scientific:'Ailurus fulgens',group:'Mammal',place:'Himalayan forests · South Asia',emoji:'🦊',status:'Endangered',kind:'mammal'},
  {key:'blackrhino',name:'Black rhinoceros',scientific:'Diceros bicornis',group:'Mammal',place:'Eastern and southern Africa',emoji:'🦏',status:'Critically endangered',kind:'mammal'},
  {key:'tiger',name:'Tiger',scientific:'Panthera tigris',group:'Mammal',place:'Scattered habitats across Asia',emoji:'🐅',status:'Endangered',kind:'mammal'}
];

const faqs = [
  {q:'Why is conservation important?',a:'Conservation protects species, habitats, and the relationships that connect them. It can also protect clean water, healthy soils, and the natural heritage people share with future generations.'},
  {q:'What happens when a species goes extinct?',a:'Extinction is permanent global loss. It removes a unique branch of life and may change food webs or ecosystem processes. The effects vary: some are well understood, while others are difficult to predict.'},
  {q:'Does every animal have a role in its ecosystem?',a:'Animals interact with plants, other animals, and their surroundings in many ways. Predators, grazers, pollinators, seed dispersers, and prey all contribute to ecological relationships. Some species’ roles are still being studied.'},
  {q:'Can conservation help a population recover?',a:'Yes, when action addresses the main pressures and continues over time. Habitat protection, safer fishing practices, anti-poaching work, and community-led stewardship have supported recoveries. Results differ by species and place.'},
  {q:'What is the difference between endangered and extinct?',a:'Endangered describes a species facing a high risk of extinction. Extinct means no individuals remain anywhere on Earth. A species can also disappear locally while still surviving elsewhere.'},
  {q:'How can I help wildlife?',a:'Learn from reliable sources, support habitat protection, choose responsibly sourced products, avoid buying wild-caught animals, and follow local guidance when visiting wildlife areas.'}
];

const pageNames = {welcome:'Welcome',learning:'Learning','qa':'Q & A',settings:'Settings'};
const state = {page:'welcome',selected:'vaquita',remote:null,searchSequence:0,imported:[]};
const $ = (selector, root=document) => root.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const allSpecies = () => [...speciesCatalog,...state.imported];

function navigate(page, updateHistory=true){
  if(!pageNames[page]) page='welcome';
  state.page=page;
  document.querySelectorAll('[data-page-view]').forEach(section=>{
    const active=section.dataset.pageView===page;
    section.hidden=!active;
    section.classList.toggle('active',active);
  });
  document.querySelectorAll('.nav-link').forEach(button=>{
    const active=button.dataset.page===page;
    button.classList.toggle('active',active);
    if(active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  $('#currentPageName').textContent=pageNames[page];
  if(updateHistory && location.hash!==`#${page}`) history.pushState({page},'',`#${page}`);
  window.scrollTo({top:0,behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth'});
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-page], [data-page-link]');
  if(!button) return;
  const page=button.dataset.page || button.dataset.pageLink;
  if(page) navigate(page);
});
window.addEventListener('popstate',()=>navigate(location.hash.slice(1)||'welcome',false));
window.addEventListener('hashchange',()=>{const page=location.hash.slice(1);if(pageNames[page]&&page!==state.page)navigate(page,false)});

function renderSpeciesList(filter=''){
  const host=$('#speciesList');
  const query=filter.trim().toLocaleLowerCase();
  const filtered=allSpecies().filter(species=>!query||`${species.name} ${species.scientific} ${species.place||''}`.toLocaleLowerCase().includes(query));
  host.replaceChildren();
  filtered.forEach(species=>{
    const button=document.createElement('button');
    button.className=`species-option${state.selected===species.key&&!state.remote?' active':''}${species.imported?' imported-option':''}`;
    button.type='button';
    button.dataset.species=species.key;
    button.setAttribute('aria-pressed',String(state.selected===species.key&&!state.remote));
    button.innerHTML=`<span class="species-emoji" aria-hidden="true">${species.emoji||'🌿'}</span><span><strong>${escapeHtml(species.name)}</strong><small>${escapeHtml(species.scientific)}${species.imported?' · IUCN CSV':''}</small></span>`;
    button.addEventListener('click',()=>selectSpecies(species.key));
    host.append(button);
  });
  if(!filtered.length){const empty=document.createElement('p');empty.className='picker-help';empty.textContent='No featured profiles match that search. Search the wider catalogue above.';host.append(empty)}
}

function profileMarkup(species){
  const animal=animals[species.key];
  const care=careFacts[species.key];
  const causes=animal.causes.map(([title,detail])=>`<li><strong>${escapeHtml(title)}:</strong> ${escapeHtml(detail)}</li>`).join('');
  return `<div class="profile-banner"><span class="profile-place">${escapeHtml(species.place)} · ${escapeHtml(species.group)}</span><span class="profile-status">${escapeHtml(species.status)}</span></div>
    <div class="profile-body"><div class="profile-title"><div><h2>${escapeHtml(species.name)}</h2><p class="profile-latin"><i>${escapeHtml(species.scientific)}</i></p></div><div class="profile-population"><small>Population snapshot</small><strong>${escapeHtml(animal.now)}</strong></div></div>
    <p class="profile-summary">${escapeHtml(animal.summary)}</p>
    <div class="profile-facts"><section class="profile-fact"><h3 class="fact-title">Why it is declining</h3><ul>${causes}</ul></section><section class="profile-fact"><h3 class="fact-title">Its ecosystem role</h3><p>${escapeHtml(care.role)}</p></section><section class="profile-fact"><h3 class="fact-title">What conservation can do</h3><p>${escapeHtml(care.action)}</p></section><section class="profile-fact impact"><h3 class="fact-title">If it disappeared</h3><p>${escapeHtml(animal.extinction)}</p></section></div>
    <p class="profile-detail"><strong>Assessment context:</strong> ${escapeHtml(animal.old)} (${escapeHtml(animal.oldYear)}). ${escapeHtml(animal.note)}</p>
    <div class="profile-source"><a href="${escapeHtml(animal.source)}" target="_blank" rel="noreferrer">${escapeHtml(animal.sourceName)} ↗</a><span>${escapeHtml(care.reason)}</span></div></div>`;
}

function selectSpecies(key){
  const species=allSpecies().find(item=>item.key===key);
  if(!species) return;
  state.selected=key;state.remote=null;
  $('#speciesProfile').innerHTML=species.imported?importedProfileMarkup(species):profileMarkup(species);
  renderSpeciesList($('#speciesSearch').value);
  $('#speciesSuggestions').hidden=true;
  $('#speciesProfile').scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth',block:'start'});
}

function importedProfileMarkup(species){
  return `<div class="profile-banner"><span class="profile-place">IUCN RED LIST CSV · ${escapeHtml(species.group||'SPECIES')}</span><span class="profile-status">${escapeHtml(species.status||'Status not included')}</span></div><div class="generic-profile"><div class="eyebrow eyebrow-dark">Imported field-guide entry</div><h2>${escapeHtml(species.name)}</h2><p><i>${escapeHtml(species.scientific)}</i></p><p>This name and category came from the IUCN CSV you imported. This prototype does not have a full research profile for this species yet.</p><p>Explore its current assessment and details on the IUCN Red List.</p><a class="button button-dark" href="https://www.iucnredlist.org/search" target="_blank" rel="noreferrer">Open IUCN Red List <span aria-hidden="true">↗</span></a></div>`;
}

function showRemoteSpecies(result){
  state.remote=result;state.selected=null;
  const name=result.vernacularName||result.canonicalName||result.scientificName||'Species';
  const scientific=result.canonicalName||result.scientificName||name;
  $('#speciesProfile').innerHTML=`<div class="generic-profile"><div class="eyebrow">Wider catalogue · GBIF taxonomy</div><h2>${escapeHtml(name)}</h2><p><i>${escapeHtml(scientific)}</i></p><p>This name appears in the GBIF taxonomy catalogue. BioBot has not prepared a detailed learning profile for it yet, and GBIF taxonomy matches do not confirm an IUCN conservation category.</p><a class="button button-dark" href="https://www.iucnredlist.org/search" target="_blank" rel="noreferrer">Check the IUCN Red List <span aria-hidden="true">↗</span></a></div>`;
  document.querySelectorAll('.species-option').forEach(button=>{button.classList.remove('active');button.setAttribute('aria-pressed','false')});
  $('#speciesSuggestions').hidden=true;
}

async function searchCatalogue(){
  const query=$('#speciesSearch').value.trim();
  if(!query) return;
  renderSpeciesList(query);
  const suggestions=$('#speciesSuggestions');
  const sequence=++state.searchSequence;
  suggestions.hidden=false;
  suggestions.innerHTML='<div class="suggestion"><span>Searching the wider catalogue…</span></div>';
  try{
    const response=await fetch(`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(query)}&limit=8`,{headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error('Catalogue unavailable');
    const results=(await response.json()).filter(item=>item.rank==='SPECIES'&&item.status!=='DOUBTFUL').slice(0,6);
    if(sequence!==state.searchSequence) return;
    suggestions.replaceChildren();
    const localMatches=allSpecies().filter(item=>`${item.name} ${item.scientific}`.toLowerCase().includes(query.toLowerCase()));
    const shownNames=new Set(localMatches.map(item=>item.scientific.toLowerCase()));
    results.filter(item=>!shownNames.has((item.canonicalName||item.scientificName||'').toLowerCase())).forEach(item=>{
      const button=document.createElement('button');button.type='button';button.className='suggestion';
      const common=item.vernacularName||item.canonicalName||item.scientificName;
      const scientific=item.canonicalName||item.scientificName||'';
      button.innerHTML=`<span>${escapeHtml(common)}</span><small>${escapeHtml(scientific)}</small>`;
      button.addEventListener('click',()=>showRemoteSpecies(item));suggestions.append(button);
    });
    if(localMatches.length){const label=document.createElement('div');label.className='suggestion';label.innerHTML='<span>Featured matches are shown in the collection below.</span>';suggestions.prepend(label)}
    if(!suggestions.children.length){const empty=document.createElement('div');empty.className='suggestion';empty.textContent='No additional catalogue matches. Try a scientific name.';suggestions.append(empty)}
  }catch{
    if(sequence!==state.searchSequence)return;
    suggestions.innerHTML='<div class="suggestion"><span>The wider catalogue is unavailable right now. Featured profiles are still available below.</span></div>';
  }
}

$('#searchSpecies').addEventListener('click',searchCatalogue);
$('#speciesSearch').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchCatalogue()}});
$('#speciesSearch').addEventListener('input',()=>{renderSpeciesList($('#speciesSearch').value);if(!$('#speciesSearch').value.trim())$('#speciesSuggestions').hidden=true});

function renderFaqs(){
  const host=$('#faqList');
  faqs.forEach((item,index)=>{
    const article=document.createElement('article');article.className='faq-item';
    const button=document.createElement('button');button.type='button';button.className='faq-question';button.setAttribute('aria-expanded','false');button.innerHTML=`<span>${escapeHtml(item.q)}</span><span aria-hidden="true">+</span>`;
    const answer=document.createElement('div');answer.className='faq-answer';answer.hidden=true;answer.textContent=item.a;
    button.addEventListener('click',()=>{const open=article.classList.toggle('open');button.setAttribute('aria-expanded',String(open));answer.hidden=!open});
    article.append(button,answer);host.append(article);
  });
}

function answerQuestion(question){
  const q=question.toLocaleLowerCase();
  const matchingSpecies=allSpecies().find(item=>q.includes(item.name.toLocaleLowerCase())||q.includes(item.scientific.toLocaleLowerCase()));
  if(matchingSpecies?.imported)return `${matchingSpecies.name} (${matchingSpecies.scientific}) is listed in your imported IUCN CSV as ${matchingSpecies.status||'a species with no category in the file'}. Open its Red List assessment for the full details.`;
  if(matchingSpecies){const care=careFacts[matchingSpecies.key];const animal=animals[matchingSpecies.key];return `${matchingSpecies.name}: ${care.role} Conservation can help by ${care.action.charAt(0).toLocaleLowerCase()+care.action.slice(1)} ${animal.note}`}
  if(/extinct|extinction|disappear|die out/.test(q))return faqs[1].a;
  if(/conserv|protect|save wildlife|help wildlife/.test(q))return `${faqs[0].a} ${faqs[3].a}`;
  if(/predator|food web|ecosystem|role|pollinat|graze|seed/.test(q))return faqs[2].a;
  if(/help|what can i do|my action/.test(q))return faqs[5].a;
  if(/endangered|category|status|red list/.test(q))return 'Endangered is one of the IUCN Red List categories for species at high risk of extinction. BioBot’s featured profiles include their listed status and source notes; follow each source link for the latest assessment.';
  return 'I can help with questions about conservation, extinction, ecosystems, or one of the 25 featured species. Try asking what role an animal plays, why it is at risk, or how conservation can help.';
}

$('#askForm').addEventListener('submit',event=>{
  event.preventDefault();const question=$('#askInput').value.trim();if(!question)return;
  const box=$('#answerBox');box.innerHTML=`<strong>BioBot’s field note</strong>${escapeHtml(answerQuestion(question))}`;box.hidden=false;
});

function toast(message){
  const node=$('#toast');node.textContent=message;node.classList.add('show');window.clearTimeout(toast.timer);toast.timer=window.setTimeout(()=>node.classList.remove('show'),2200);
}
function loadSettings(){
  let settings={};try{settings=JSON.parse(localStorage.getItem('biobot-settings')||'{}')}catch{}
  $('#themeSetting').value=settings.theme||'forest';$('#textSetting').value=settings.text||'comfortable';$('#readingSetting').value=settings.reading||'clear';$('#motionSetting').checked=Boolean(settings.reduceMotion);
  applySettings(settings);
}

function parseCsv(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(quoted){if(char==='"'&&text[i+1]==='"'){cell+='"';i++}else if(char==='"')quoted=false;else cell+=char;continue}
    if(char==='"'){quoted=true;continue}
    if(char===','){row.push(cell);cell='';continue}
    if(char==='\n'){row.push(cell);rows.push(row);row=[];cell='';continue}
    if(char!=='\r')cell+=char;
  }
  if(cell.length||row.length){row.push(cell);rows.push(row)}
  return rows.filter(line=>line.some(value=>value.trim()));
}
function normalizeHeader(value){return String(value||'').trim().toLocaleLowerCase().replace(/[^a-z0-9]/g,'')}
function importCatalog(rows){
  if(rows.length<2)throw new Error('The CSV has no species rows.');
  const headers=rows[0].map(normalizeHeader);
  const findHeader=names=>headers.findIndex(header=>names.includes(header));
  const scientificIndex=findHeader(['scientificname','scientific','speciesname','taxonname','binomial','scientificnameofacceptedtaxon']);
  if(scientificIndex<0)throw new Error('I couldn’t find a scientific name column. Look for scientificName or scientific_name.');
  const commonIndex=findHeader(['maincommonname','commonname','englishname','vernacularname','preferredcommonname']);
  const categoryIndex=findHeader(['redlistcategory','redliststatus','category','iucncategory','threatcategory']);
  const classIndex=findHeader(['class','taxonomicclass']);
  const categoryNames={CR:'Critically endangered',EN:'Endangered',VU:'Vulnerable',NT:'Near threatened',LC:'Least concern',DD:'Data deficient',EW:'Extinct in the wild',EX:'Extinct',NE:'Not evaluated',LR:'Lower risk'};
  const seen=new Set(speciesCatalog.map(item=>item.scientific.toLocaleLowerCase()));
  const imported=[];
  rows.slice(1).forEach((values,index)=>{
    const scientific=(values[scientificIndex]||'').trim();if(!scientific)return;
    const normalized=scientific.toLocaleLowerCase();if(seen.has(normalized))return;seen.add(normalized);
    const rawCategory=categoryIndex>=0?(values[categoryIndex]||'').trim():'';
    const status=categoryNames[rawCategory.toUpperCase()]||rawCategory||'Status not included';
    const common=commonIndex>=0?(values[commonIndex]||'').trim():'';
    const key=`import_${normalized.normalize('NFKD').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||index}`;
    imported.push({key,name:common||scientific,scientific,group:classIndex>=0?(values[classIndex]||'').trim():'',place:'',emoji:'🌿',status,kind:'other',imported:true});
  });
  if(!imported.length)throw new Error('No new species names were found in that file.');
  return imported;
}
function updateImportStatus(message){
  const importedCount=state.imported.length;
  $('#speciesImportStatus').textContent=message||`${speciesCatalog.length} featured profiles${importedCount?` + ${importedCount} imported IUCN entries`:''}.`;
  const count=$('.count-pill');if(count)count.textContent=String(speciesCatalog.length+importedCount);
}
async function restoreImportedCatalog(){
  try{const saved=JSON.parse(localStorage.getItem('biobot-iucn-catalog')||'[]');if(Array.isArray(saved))state.imported=saved.filter(item=>item&&item.key&&item.scientific&&item.imported)}catch{state.imported=[]}
  renderSpeciesList($('#speciesSearch').value);updateImportStatus();
}
$('#speciesImport').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  updateImportStatus('Reading the CSV in this browser…');
  try{
    const imported=importCatalog(parseCsv(await file.text()));
    state.imported=[...state.imported,...imported];
    localStorage.setItem('biobot-iucn-catalog',JSON.stringify(state.imported));
    renderSpeciesList($('#speciesSearch').value);updateImportStatus(`${imported.length} species added. ${speciesCatalog.length+state.imported.length} species are now searchable.`);toast(`${imported.length} species added from your CSV.`);
  }catch(error){updateImportStatus(error.message||'The CSV could not be read.');toast('Could not import that CSV. Check the file columns.');}
  event.target.value='';
});
function applySettings(settings){
  document.body.dataset.theme=settings.theme||'forest';
  document.body.classList.toggle('large',settings.text==='large');
  document.body.classList.toggle('reduce-motion',Boolean(settings.reduceMotion));
  document.body.classList.toggle('detailed',settings.reading==='detailed');
}
$('#settingsForm').addEventListener('submit',event=>{
  event.preventDefault();
  const settings={theme:$('#themeSetting').value,text:$('#textSetting').value,reading:$('#readingSetting').value,reduceMotion:$('#motionSetting').checked};
  localStorage.setItem('biobot-settings',JSON.stringify(settings));applySettings(settings);
  $('#settingsStatus').textContent='Saved on this device.';toast('Your reading settings are saved.');
});

renderFaqs();renderSpeciesList();selectSpecies('vaquita');loadSettings();restoreImportedCatalog();
const initialPage=location.hash.slice(1);if(pageNames[initialPage])navigate(initialPage,false);
