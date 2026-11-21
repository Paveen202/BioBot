(() => {
'use strict';
const meta=window.BIOBOT_PLANTS||{version:'',citation:'',species:[]};
let records=Array.isArray(meta.species)?meta.species:[], page=1, activeCategory='All';
const pageSize=60, categories=['Extinct','Extinct in the Wild','Critically Endangered','Endangered','Vulnerable','Near Threatened','Least Concern','Data Deficient'];
const $=id=>document.getElementById(id);
const grid=$('plantGrid'), search=$('plantSearch'), status=$('plantStatus');
const normalize=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const categoryCode=v=>({extinct:'EX','extinct in the wild':'EW','critically endangered':'CR','endangered':'EN','vulnerable':'VU','near threatened':'NT','least concern':'LC','data deficient':'DD'})[normalize(v)]||'';
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){cell+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function recordsFromCSV(text){
 const rows=parseCSV(text);if(rows.length<2)return [];
 const headers=rows.shift().map(normalize);
 const get=(r,names)=>{const i=headers.findIndex(h=>names.includes(h));return i<0?'':String(r[i]||'').trim();};
 return rows.map(r=>({
 commonName:get(r,['common name','commonname','english name','name']),
 scientificName:get(r,['scientific name','scientificname','taxon name','species name']),
 category:get(r,['category','red list category','iucn category','red list status','assessment category']),
 assessmentYear:get(r,['assessment year','year assessed','year']),
 url:get(r,['url','assessment url','iucn url','species url']),
 habitat:get(r,['habitat','habitats','habitat type']),
 populationDecline:get(r,['population decline','why declining','threats','major threats']),
 naturalHistory:get(r,['natural history','habitat and ecology','ecology','where it grows']),
 ecologicalRole:get(r,['ecological role','ecosystem role','role in ecosystem']),
 disappearanceImpact:get(r,['impact if lost','what happens if it disappears','ecosystem impact']),
 conservationActions:get(r,['conservation actions','conservation measures','actions']),
 family:get(r,['family']),genus:get(r,['genus']),kingdom:get(r,['kingdom'])
 })).filter(r=>r.scientificName||r.commonName).slice(0,1000);
}
function renderFilters(){
 const wrap=$('plantFilters');wrap.replaceChildren();
 ['All',...categories].forEach(cat=>{const b=document.createElement('button');b.type='button';b.className='small-game-button'+(activeCategory===cat?' is-active':'');b.textContent=cat;b.setAttribute('aria-pressed',String(activeCategory===cat));b.addEventListener('click',()=>{activeCategory=cat;page=1;renderFilters();renderList();});wrap.append(b);});
}
function renderChart(){
 const chart=$('plantChart');chart.replaceChildren();
 if(!records.length){const e=document.createElement('div');e.className='chart-empty';e.textContent='Load plant records to see category counts.';chart.append(e);return;}
 const counts=Object.fromEntries(categories.map(c=>[c,0]));records.forEach(r=>{if(counts[r.category]!==undefined)counts[r.category]++;});
 const max=Math.max(1,...Object.values(counts));
 categories.filter(c=>counts[c]>0).forEach(cat=>{const line=document.createElement('div');line.className='chart-row';const label=document.createElement('span');label.className='chart-label';label.textContent=cat;const track=document.createElement('div');track.className='chart-track';const bar=document.createElement('span');bar.className='chart-bar category-'+categoryCode(cat).toLowerCase();bar.style.width=Math.max(1,counts[cat]/max*100)+'%';track.append(bar);const count=document.createElement('strong');count.className='chart-count';count.textContent=counts[cat];line.append(label,track,count);chart.append(line);});
}
function showEntry(r){
 $('plantModalTitle').textContent=r.commonName||r.scientificName||'Plant species';
 $('plantModalScientific').textContent=r.scientificName||'Scientific name not supplied';
 const code=categoryCode(r.category);$('plantModalCategory').textContent=r.category||'Category unavailable';$('plantModalCategory').className='category-pill category-pill-'+code.toLowerCase();
 const facts=$('plantModalFacts');facts.replaceChildren();
 const sections=[['IUCN conservation status',r.category],['Why its population is declining',r.populationDecline],['Natural habitat and ecology',r.naturalHistory||r.habitat],['Role in the ecosystem',r.ecologicalRole],['What happens if it disappears',r.disappearanceImpact],['Conservation actions',r.conservationActions],['Family',r.family],['Assessment year',r.assessmentYear]];
 sections.forEach(([label,value])=>{const box=document.createElement('section');box.className='plant-wiki-fact';const h=document.createElement('h3');h.textContent=label;const p=document.createElement('p');p.textContent=value||'Not included in the loaded source data.';box.append(h,p);facts.append(box);});
 const source=$('plantModalSource');source.href=r.url||('https://www.iucnredlist.org/search?query='+encodeURIComponent(r.scientificName||r.commonName||''));$('plantModal').hidden=false;document.body.classList.add('pedia-modal-open');
}
function renderList(){
 grid.replaceChildren();const q=normalize(search.value);
 const filtered=records.filter(r=>(activeCategory==='All'||r.category===activeCategory)&&(!q||normalize([r.commonName,r.scientificName,r.category,r.family,r.genus].join(' ')).includes(q)));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);const start=(page-1)*pageSize;
 filtered.slice(start,start+pageSize).forEach(r=>{const card=document.createElement('article');card.className='pedia-card';const photo=document.createElement('div');photo.className='pedia-photo';const icon=document.createElement('span');icon.className='pedia-emoji';icon.textContent='🌿';photo.append(icon);const top=document.createElement('div');top.className='pedia-card-top';const pill=document.createElement('span');const code=categoryCode(r.category);pill.className='category-pill category-pill-'+code.toLowerCase();pill.textContent=r.category||'Category unavailable';top.append(pill);photo.append(top);const name=document.createElement('h3');name.textContent=r.commonName||r.scientificName;const sci=document.createElement('p');sci.className='pedia-scientific';sci.textContent=r.commonName&&r.scientificName!==r.commonName?r.scientificName:'';const facts=document.createElement('p');facts.className='pedia-facts';facts.textContent=[r.family,r.assessmentYear?'Assessed '+r.assessmentYear:''].filter(Boolean).join(' · ')||'Global IUCN plant assessment';const link=document.createElement('button');link.type='button';link.className='pedia-link';link.textContent='Open plant wiki →';link.addEventListener('click',()=>showEntry(r));card.append(photo,name,sci,facts,link);grid.append(card);});
 if(!filtered.length){const empty=document.createElement('div');empty.className='pedia-empty';empty.textContent=records.length?'No plants match that search or category.':'No plant records loaded yet. Load an IUCN plant CSV above.';grid.append(empty);}
 $('plantSummary').textContent=filtered.length+' plants match · '+records.length+' records loaded.';
 $('plantPageSummary').textContent=filtered.length?(start+1)+'–'+Math.min(start+pageSize,filtered.length)+' of '+filtered.length:'0 results';
 $('plantPrevious').disabled=page<=1;$('plantNext').disabled=page>=pages;
}
$('plantCsv').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{const parsed=recordsFromCSV(await file.text());if(!parsed.length)throw new Error('No plant rows with a scientific or common name were found. Check that the CSV is an IUCN plant export.');records=parsed;page=1;activeCategory='All';search.disabled=false;status.textContent='Loaded '+records.length.toLocaleString()+' plant records from '+file.name+'. '+(records.length<1000?'The file contains fewer than 1,000 usable rows.':'The first 1,000 usable rows are ready.');$('plantCount').textContent=records.length.toLocaleString()+' plants loaded';$('plantChartSubtitle').textContent='IUCN category distribution across '+records.length.toLocaleString()+' loaded plant records.';renderFilters();renderChart();renderList();}catch(err){status.textContent=err.message;}});
search.addEventListener('input',()=>{page=1;renderList();});
$('plantPrevious').addEventListener('click',()=>{page=Math.max(1,page-1);renderList();});
$('plantNext').addEventListener('click',()=>{page++;renderList();});
if(records.length){search.disabled=false;$('plantCount').textContent=records.length.toLocaleString()+' plants · IUCN '+meta.version;status.textContent='Loaded '+records.length.toLocaleString()+' plant assessments from the IUCN '+meta.version+' sample.';$('plantChartSubtitle').textContent='IUCN category distribution across '+records.length.toLocaleString()+' plant assessments.';}
document.querySelectorAll('[data-close-plant]').forEach(el=>el.addEventListener('click',()=>{$('plantModal').hidden=true;document.body.classList.remove('pedia-modal-open');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('plantModal').hidden){$('plantModal').hidden=true;document.body.classList.remove('pedia-modal-open');}});
renderFilters();renderChart();renderList();
})();