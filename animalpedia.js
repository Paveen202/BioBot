const metadata = window.BIOBOT_IUCN || {version:'', citation:'', species:[]};
let records = metadata.species || [];
let currentPage = 1;
const pageSize = 60;
const fileInput = document.getElementById('iucnCsv');
const statusEl = document.getElementById('importStatus');
const grid = document.getElementById('pediaGrid');
const searchEl = document.getElementById('pediaSearch');
const normalize = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const photoCache = new Map();
const photoQueue = [];
let photoWorkerRunning = false;
function requestAnimalPhoto(record, photoBox, name) {
  // IUCN exports often append the taxonomic authority to a binomial. iNaturalist
  // searches by the genus and species names, so remove the authority suffix.
  const query = record.scientificName ? record.scientificName.trim().split(/\s+/).slice(0,2).join(' ') : record.commonName;
  if (!query) return;
  const key = normalize(query);
  const cached = photoCache.get(key);
  if (cached) { showPhoto(cached, photoBox, name); return; }
  photoQueue.push({record, photoBox, name, key, query});
  runPhotoQueue();
}
async function runPhotoQueue() {
  if (photoWorkerRunning) return;
  photoWorkerRunning = true;
  while (photoQueue.length) {
    const batch = photoQueue.splice(0, 4);
    await Promise.all(batch.map(async item => {
      try {
        const url = `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(item.query)}&per_page=1`;
        const response = await fetch(url);
        if (!response.ok) return;
        const matches = await response.json();
        const taxon = matches.find(t => normalize(t.name) === item.key && t.default_photo?.medium_url);
        if (!taxon) return;
        const photo = {url:taxon.default_photo.medium_url, attribution:taxon.default_photo.attribution || 'iNaturalist'};
        photoCache.set(item.key, photo);
        if (item.photoBox.isConnected) showPhoto(photo, item.photoBox, item.name);
      } catch (_) { /* Keep the illustrated animal placeholder if a photo cannot load. */ }
    }));
    if (photoQueue.length) await new Promise(resolve => setTimeout(resolve, 4000));
  }
  photoWorkerRunning = false;
}
function showPhoto(photo, photoBox, name) {
  if (!photoBox.isConnected || photoBox.querySelector('img')) return;
  const img = document.createElement('img'); img.src=photo.url; img.alt=`Photo of ${name}`; img.loading='lazy';
  img.onerror=()=>{img.remove();};
  photoBox.prepend(img);
  const credit=document.createElement('span'); credit.className='pedia-photo-credit'; credit.textContent=photo.attribution; photoBox.append(credit);
}

if(records.length){
  document.getElementById('pediaCount').textContent = `${records.length.toLocaleString()} animals · IUCN ${metadata.version}`;
  statusEl.textContent = `Loaded ${records.length.toLocaleString()} globally assessed animal species from IUCN ${metadata.version}.`;
  searchEl.disabled = false;
}

function parseCsv(text){
  const rows=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++}
    else if(c==='"')quoted=!quoted;
    else if(c===','&&!quoted){row.push(cell);cell=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}
    else cell+=c;
  }
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
const aliases={scientific:['scientific name','scientific_name','taxon name','taxon_name','binomial'],common:['common name','common_name','english name','english_name','vernacular name'],kingdom:['kingdom'],category:['red list category','red list category and criteria','red_list_category','category','redlistcategory','iucn category'],year:['assessment year','assessment_year','year assessed','year'],family:['family'],className:['class'],order:['order'],genus:['genus'],url:['url','assessment url','assessment_url','species url']};
function field(row,headers,names){const wanted=names.map(normalize);const index=headers.findIndex(h=>wanted.includes(normalize(h)));return index<0?'':String(row[index]||'').trim()}
function rowsToRecords(rows){
  if(rows.length<2)throw new Error('The CSV has no data rows.');
  const headers=rows[0];
  return rows.slice(1).map(row=>({
    scientificName:field(row,headers,aliases.scientific),commonName:field(row,headers,aliases.common),kingdom:field(row,headers,aliases.kingdom),
    category:field(row,headers,aliases.category),assessmentYear:field(row,headers,aliases.year),family:field(row,headers,aliases.family),
    class:field(row,headers,aliases.className),order:field(row,headers,aliases.order),genus:field(row,headers,aliases.genus),url:field(row,headers,aliases.url)
  })).filter(r=>(r.scientificName||r.commonName)&&(!r.kingdom||normalize(r.kingdom)==='animalia')).slice(0,1000);
}
fileInput.addEventListener('change',async()=>{
  const file=fileInput.files?.[0];if(!file)return;
  try{
    const parsed=rowsToRecords(parseCsv(await file.text()));
    if(!parsed.length)throw new Error('No animal rows with scientific or common names were found.');
    records=parsed;currentPage=1;searchEl.disabled=false;
    statusEl.textContent=`Loaded ${records.length.toLocaleString()} animal records from “${file.name}”.`;
    document.getElementById('pediaCount').textContent=`${records.length.toLocaleString()} animals loaded`;
    document.getElementById('chartSubtitle').textContent=`Red List category distribution across ${records.length.toLocaleString()} imported animal records.`;
    document.getElementById('listSummary').textContent=`Showing ${records.length.toLocaleString()} imported species entries (up to 1,000).`;
    renderChart();renderList();
  }catch(error){statusEl.textContent=error.message;}
});
function categoryCode(value){
  const normalized=normalize(value).replace(/ /g,'').toUpperCase();
  const names={EXTINCT:'EX',EXTINCTINTHEWILD:'EW',CRITICALLYENDANGERED:'CR',ENDANGERED:'EN',VULNERABLE:'VU',NEARTHREATENED:'NT',LEASTCONCERN:'LC',DATADEFICIENT:'DD',NOTEVALUATED:'NE'};
  const code=names[normalized]||normalized;
  return ({EX:'EX',EW:'EW',CR:'CR',EN:'EN',VU:'VU',NT:'NT',LC:'LC',DD:'DD',NE:'NE'})[code]||'';
}
function renderChart(){
  const chart=document.getElementById('statusChart');chart.replaceChildren();
  if(!records.length){chart.innerHTML='<div class="chart-empty">No IUCN records are available.</div>';return;}
  const order=['EX','EW','CR','EN','VU','NT','LC','DD','NE'];
  const labels={EX:'Extinct',EW:'Extinct in the Wild',CR:'Critically Endangered',EN:'Endangered',VU:'Vulnerable',NT:'Near Threatened',LC:'Least Concern',DD:'Data Deficient',NE:'Not Evaluated'};
  const counts=Object.fromEntries(order.map(code=>[code,0]));
  records.forEach(record=>{const code=categoryCode(record.category);if(code)counts[code]++;});
  const max=Math.max(1,...Object.values(counts));
  order.filter(code=>counts[code]>0).forEach(code=>{
    const line=document.createElement('div');line.className='chart-row';
    const label=document.createElement('span');label.className='chart-label';label.textContent=labels[code];
    const track=document.createElement('div');track.className='chart-track';
    const bar=document.createElement('span');bar.className=`chart-bar category-${code.toLowerCase()}`;bar.style.width=`${Math.max(1,counts[code]/max*100)}%`;track.append(bar);
    const count=document.createElement('strong');count.className='chart-count';count.textContent=String(counts[code]);
    line.append(label,track,count);chart.append(line);
  });
  if(!chart.childElementCount)chart.innerHTML='<div class="chart-empty">No recognized Red List categories are present.</div>';
}
function animalEmoji(record){
  const c=normalize(record.class);
  if(c.includes('aves'))return '🐦';if(c.includes('mammalia'))return '🐾';if(c.includes('reptilia'))return '🐢';
  if(c.includes('amphibia'))return '🐸';if(c.includes('actinopterygii')||c.includes('fish'))return '🐟';if(c.includes('chondrichthyes'))return '🦈';
  if(c.includes('insecta'))return '🦋';if(c.includes('arachnida'))return '🕷️';if(c.includes('malacostraca'))return '🦀';if(c.includes('gastropoda'))return '🐌';return '🐾';
}
function renderList(){
  grid.replaceChildren();
  const query=normalize(searchEl.value);
  const filtered=records.filter(r=>!query||normalize([r.commonName,r.scientificName,r.category,r.family,r.class,r.order,r.genus].join(' ')).includes(query));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));currentPage=Math.min(currentPage,pages);
  const start=(currentPage-1)*pageSize;const shown=filtered.slice(start,start+pageSize);
  shown.forEach(record=>{
    const card=document.createElement('article');card.className='pedia-card';
    const photo=document.createElement('div');photo.className='pedia-photo';
    const emoji=document.createElement('span');emoji.className='pedia-emoji';emoji.textContent=animalEmoji(record);photo.append(emoji);
    const category=document.createElement('span');category.className=`category-pill category-pill-${categoryCode(record.category).toLowerCase()}`;category.textContent=record.category||'Category unavailable';
    const top=document.createElement('div');top.className='pedia-card-top';top.append(category);photo.append(top);
    const name=document.createElement('h3');name.textContent=record.commonName||record.scientificName;
    const scientific=document.createElement('p');scientific.className='pedia-scientific';scientific.textContent=record.commonName&&record.scientificName!==record.commonName?record.scientificName:'';
    const facts=document.createElement('p');facts.className='pedia-facts';facts.textContent=[record.class,record.family,record.assessmentYear?`Assessed ${record.assessmentYear}`:''].filter(Boolean).join(' · ')||'Global IUCN Red List assessment';
    const link=document.createElement('a');link.className='pedia-link';link.href=record.url||`https://www.iucnredlist.org/search?query=${encodeURIComponent(record.scientificName||record.commonName)}`;link.target='_blank';link.rel='noreferrer';link.textContent='Open IUCN assessment ↗';
    card.append(photo,name,scientific,facts,link);grid.append(card);
    requestAnimalPhoto(record,photo,name.textContent);
  });
  if(!shown.length){const empty=document.createElement('div');empty.className='pedia-empty';empty.textContent='No animals match that search.';grid.append(empty);}
  document.getElementById('listSummary').textContent=`${filtered.length.toLocaleString()} species match · ${records.length.toLocaleString()} records loaded.`;
  document.getElementById('pageSummary').textContent=filtered.length?`${start+1}–${Math.min(start+pageSize,filtered.length)} of ${filtered.length}`:'0 results';
  document.getElementById('previousPage').disabled=currentPage<=1;document.getElementById('nextPage').disabled=currentPage>=pages;
}
searchEl.addEventListener('input',()=>{currentPage=1;renderList()});
document.getElementById('previousPage').addEventListener('click',()=>{currentPage=Math.max(1,currentPage-1);renderList()});
document.getElementById('nextPage').addEventListener('click',()=>{currentPage++;renderList()});
renderChart();renderList();
