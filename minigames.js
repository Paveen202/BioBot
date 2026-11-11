const species = window.BIOBOT_IUCN?.species || [];
const categoryNames = [...new Set(species.map(s => s.category).filter(Boolean))];
const shuffle = list => list.slice().sort(() => Math.random() - .5);
const scoreNode = document.getElementById('gameScore');
let score = window.BioBotProfile?.get().points || 0;
scoreNode.textContent = score;
function award(points){score = window.BioBotProfile ? window.BioBotProfile.addPoints(points) : score + points;scoreNode.textContent=score;}
window.addEventListener('biobot:profilechange',()=>{score=window.BioBotProfile?.get().points||score;scoreNode.textContent=score;});
function emojiFor(record){
  const c=String(record.class||'').toUpperCase();
  if(c.includes('AVES'))return '🐦';if(c.includes('MAMMALIA'))return '🐾';if(c.includes('REPTILIA'))return '🐢';
  if(c.includes('AMPHIBIA'))return '🐸';if(c.includes('ACTINOPTERYGII')||c.includes('FISH'))return '🐟';if(c.includes('CHONDRICHTHYES'))return '🦈';
  if(c.includes('INSECTA'))return '🦋';if(c.includes('ARACHNIDA'))return '🕷️';if(c.includes('MALACOSTRACA'))return '🦀';if(c.includes('GASTROPODA'))return '🐌';return '🐾';
}
function displayName(record){return record.commonName && record.commonName!==record.scientificName ? record.commonName : record.scientificName;}
const tabs=[...document.querySelectorAll('.game-tab[aria-controls]')];
const panels=[...document.querySelectorAll('.game-panel')];
function activatePanel(id,updateHash=false){
  const tab=tabs.find(item=>item.getAttribute('aria-controls')===id);
  if(!tab)return false;
  tabs.forEach(item=>{const active=item===tab;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active));});
  panels.forEach(panel=>{const active=panel.id===id;panel.hidden=!active;panel.classList.toggle('active',active);});
  if(updateHash)history.replaceState(null,"",`#${id}`);
  return true;
}
tabs.forEach(tab=>tab.addEventListener('click',()=>activatePanel(tab.getAttribute('aria-controls'),true)));
function syncPanelFromHash(){
  const id=decodeURIComponent(location.hash.slice(1));
  if(activatePanel(id))requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:"start"}));
}
syncPanelFromHash();
window.addEventListener('hashchange',syncPanelFromHash);

// Four difficulty levels: match each animal's common name to its scientific name.
let openCards=[],matchedPairs=0,moves=0,busy=false;
function resetMemory(){
  const count=[3,6,8,12][Number(document.getElementById('memoryLevel').value)-1];
  matchedPairs=0;moves=0;openCards=[];busy=false;
  document.getElementById('memoryMoves').textContent='Moves: 0';document.getElementById('memoryMatches').textContent=`Pairs: 0 / ${count}`;
  const selected=shuffle(species).slice(0,count);
  const cards=selected.flatMap((record,index)=>[
    {pair:index,label:`${emojiFor(record)} ${displayName(record)}`},
    {pair:index,label:record.scientificName}
  ]).sort(()=>Math.random()-.5);
  const board=document.getElementById('memoryBoard');board.style.setProperty('--memory-columns',count===3?3:count===12?6:4);board.replaceChildren();
  cards.forEach((card,index)=>{
    const button=document.createElement('button');button.type='button';button.className='memory-card';button.setAttribute('aria-label',`Hidden animal card ${index+1}`);button.dataset.pair=String(card.pair);button.dataset.label=card.label;
    const back=document.createElement('span');back.className='memory-card-back';back.textContent='✳';back.setAttribute('aria-hidden','true');
    const face=document.createElement('span');face.className='memory-card-face';face.textContent=card.label;button.append(back,face);button.addEventListener('click',()=>flip(button));board.append(button);
  });
  document.getElementById('memoryFeedback').textContent='Find each animal’s common and scientific name.';document.getElementById('memoryFeedback').classList.remove('success');
}
function flip(card){
  if(busy||card.classList.contains('revealed')||card.classList.contains('matched'))return;
  card.classList.add('revealed');card.setAttribute('aria-label',card.dataset.label);openCards.push(card);if(openCards.length<2)return;
  moves++;document.getElementById('memoryMoves').textContent=`Moves: ${moves}`;
  const [a,b]=openCards;
  if(a.dataset.pair===b.dataset.pair){
    a.classList.add('matched');b.classList.add('matched');a.disabled=b.disabled=true;matchedPairs++;award(5);trackExtraActivity('memoryPairs');const total=[3,6,8,12][Number(document.getElementById('memoryLevel').value)-1];
    document.getElementById('memoryMatches').textContent=`Pairs: ${matchedPairs} / ${total}`;openCards=[];
    if(matchedPairs===total){const feedback=document.getElementById('memoryFeedback');feedback.textContent=`Level complete in ${moves} moves! +10 points.`;feedback.classList.add('success');award(10);}
  }else{busy=true;setTimeout(()=>{[a,b].forEach(x=>{x.classList.remove('revealed');x.setAttribute('aria-label','Hidden animal card');});openCards=[];busy=false;},850);}
}
document.getElementById('memoryLevel').addEventListener('change',resetMemory);document.getElementById('resetMemory').addEventListener('click',resetMemory);

// Each Q&A round draws twelve distinct animals and randomizes answer order.
let quizRound=[],quizIndex=0,quizScore=0,quizAnswered=false;
function makeQuestion(record){
  const useCategory=Math.random()<.65;
  if(useCategory){
    const wrong=shuffle(categoryNames.filter(c=>c!==record.category)).slice(0,3);
    return {prompt:`What is the IUCN Red List category for ${displayName(record)}?`,answer:record.category,choices:[record.category,...wrong]};
  }
  const wrong=shuffle(species.filter(s=>s.id!==record.id)).slice(0,3).map(s=>s.scientificName);
  return {prompt:`What is the scientific name of ${displayName(record)}?`,answer:record.scientificName,choices:[record.scientificName,...wrong]};
}
function startQuiz(){
  quizRound=shuffle(species).slice(0,12).map(makeQuestion);quizIndex=0;quizScore=0;document.getElementById('startQuiz').hidden=true;showQuestion();
}
function showQuestion(){
  if(quizIndex>=12){
    document.getElementById('quizTitle').textContent=`Round complete · ${quizScore}/12`;document.getElementById('quizPrompt').textContent='Play again for a new random set of species questions.';document.getElementById('qaOptions').replaceChildren();document.getElementById('qaFeedback').textContent='Great field work!';document.getElementById('qaFeedback').classList.add('success');document.getElementById('qaProgress').textContent=`Final score: ${quizScore} / 12`;document.getElementById('nextQuestion').hidden=true;document.getElementById('startQuiz').hidden=false;document.getElementById('startQuiz').textContent='Play a new round ↻';return;
  }
  quizAnswered=false;const item=quizRound[quizIndex];document.getElementById('quizTitle').textContent=`Question ${quizIndex+1} of 12`;document.getElementById('quizPrompt').textContent=item.prompt;document.getElementById('qaFeedback').textContent='';document.getElementById('qaFeedback').classList.remove('success');document.getElementById('qaProgress').textContent=`Score: ${quizScore} / 12`;document.getElementById('nextQuestion').hidden=true;
  const box=document.getElementById('qaOptions');box.replaceChildren();shuffle(item.choices).forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='qa-choice';button.textContent=choice;button.addEventListener('click',()=>answerQuestion(choice,item));box.append(button);});
}
function answerQuestion(choice,item){
  if(quizAnswered)return;quizAnswered=true;const correct=choice===item.answer;
  document.querySelectorAll('#qaOptions .qa-choice').forEach(button=>{button.disabled=true;if(button.textContent===item.answer)button.classList.add('is-correct');});
  if(correct){quizScore++;award(10);trackExtraActivity('quizCorrect');}const feedback=document.getElementById('qaFeedback');feedback.textContent=correct?'Correct! +10 points.':`The answer is ${item.answer}.`;feedback.classList.toggle('success',correct);document.getElementById('qaProgress').textContent=`Score: ${quizScore} / 12`;document.getElementById('nextQuestion').textContent=quizIndex===11?'See results':'Next question →';document.getElementById('nextQuestion').hidden=false;
}
document.getElementById('startQuiz').addEventListener('click',startQuiz);document.getElementById('nextQuestion').addEventListener('click',()=>{quizIndex++;showQuestion();});

// Ten-round category game using species and status from the same IUCN sample.
let statusRound=[],statusIndex=0,statusScore=0,statusAnswered=false;
function startStatusMatch(){statusRound=shuffle(species).slice(0,10);statusIndex=0;statusScore=0;document.getElementById('startHabitat').hidden=true;showStatusQuestion();}
function showStatusQuestion(){
  if(statusIndex>=10){document.getElementById('habitatPrompt').textContent=`Round complete · ${statusScore}/10 correct`;document.getElementById('habitatAnimal').textContent='Round finished!';document.getElementById('habitatOptions').replaceChildren();document.getElementById('habitatFeedback').textContent='Play again to meet a new set of species.';document.getElementById('habitatFeedback').classList.add('success');document.getElementById('habitatProgress').textContent=`Final score: ${statusScore} / 10`;document.getElementById('nextHabitat').hidden=true;document.getElementById('startHabitat').hidden=false;document.getElementById('startHabitat').textContent='Play again ↻';return;}
  statusAnswered=false;const animal=statusRound[statusIndex];document.getElementById('habitatPrompt').textContent=`Round ${statusIndex+1} of 10 · Choose its IUCN category.`;document.getElementById('habitatAnimal').textContent=`${emojiFor(animal)}  ${displayName(animal)}`;document.getElementById('habitatFeedback').textContent='';document.getElementById('habitatFeedback').classList.remove('success');document.getElementById('habitatProgress').textContent=`Score: ${statusScore} / 10`;document.getElementById('nextHabitat').hidden=true;
  const choices=shuffle([animal.category,...shuffle(categoryNames.filter(c=>c!==animal.category)).slice(0,3)]);const box=document.getElementById('habitatOptions');box.replaceChildren();choices.forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='qa-choice';button.textContent=choice;button.addEventListener('click',()=>answerStatus(choice,animal));box.append(button);});
}
function answerStatus(choice,animal){
  if(statusAnswered)return;statusAnswered=true;const correct=choice===animal.category;document.querySelectorAll('#habitatOptions .qa-choice').forEach(button=>{button.disabled=true;if(button.textContent===animal.category)button.classList.add('is-correct');});
  if(correct){statusScore++;award(10);trackExtraActivity('statusCorrect');}const feedback=document.getElementById('habitatFeedback');feedback.textContent=correct?'That’s the right category! +10 points.':`This species is listed as ${animal.category}.`;feedback.classList.toggle('success',correct);document.getElementById('habitatProgress').textContent=`Score: ${statusScore} / 10`;document.getElementById('nextHabitat').textContent=statusIndex===9?'See results':'Next species →';document.getElementById('nextHabitat').hidden=false;
}
document.getElementById('startHabitat').addEventListener('click',startStatusMatch);document.getElementById('nextHabitat').addEventListener('click',()=>{statusIndex++;showStatusQuestion();});

// In-page conservation extras. Progress stays on this device; Bio points still use the profile.
const extraStorageKey = "biobot-minigames-extras-v1";
function extraTodayKey(){
  const now=new Date();
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
}
function freshExtraState(){
  return {day:extraTodayKey(),daily:{memoryPairs:0,quizCorrect:0,statusCorrect:0,claimed:{},challengeDone:false},stats:{memoryPairs:0,quizCorrect:0,statusCorrect:0,rescueStories:0,mysteriesSolved:0,dailyClaims:0,habitatBuilds:0},unlockedBadges:[],builder:{biome:"woodland",itemsByBiome:{woodland:[],wetland:[],grassland:[],ocean:[]}}};
}
function loadExtraState(){
  const fresh=freshExtraState();
  try{
    const saved=JSON.parse(localStorage.getItem(extraStorageKey)||"null");
    if(!saved||typeof saved!=="object")return fresh;
    const daily={...fresh.daily,...(saved.daily||{}),claimed:{...(saved.daily?.claimed||{})}};
    const stats={...fresh.stats,...(saved.stats||{})};
    const builder={...fresh.builder,...(saved.builder||{}),itemsByBiome:{...fresh.builder.itemsByBiome,...(saved.builder?.itemsByBiome||{})}};
    const state={...fresh,...saved,daily,stats,builder,unlockedBadges:Array.isArray(saved.unlockedBadges)?saved.unlockedBadges:[]};
    if(state.day!==fresh.day){state.day=fresh.day;state.daily=fresh.daily;}
    return state;
  }catch{return fresh;}
}
let extraState=loadExtraState();
function saveExtraState(){try{localStorage.setItem(extraStorageKey,JSON.stringify(extraState));}catch{}}
function extraNode(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
}
function trackExtraActivity(type){
  if(typeof extraState.stats[type]==="number")extraState.stats[type]++;
  if(typeof extraState.daily[type]==="number")extraState.daily[type]++;
  saveExtraState();
  renderDailyMissions();
  checkExtraBadges();
}
const extraMissions=[
  {id:"memoryPairs",title:"Memory keeper",description:"Match 3 animal name pairs.",goal:3,panel:"memoryPanel",playLabel:"Play memory"},
  {id:"quizCorrect",title:"Curious naturalist",description:"Answer 2 Animal Q&A questions correctly.",goal:2,panel:"quizPanel",playLabel:"Play Q&A"},
  {id:"statusCorrect",title:"Red List spotter",description:"Get 2 Red List category matches right.",goal:2,panel:"habitatPanel",playLabel:"Play Red List match"}
];
const conservationChallenges=[
  {title:"Give wildlife space",copy:"If you see a wild animal today, enjoy watching from a distance. Never feed or handle it."},
  {title:"Share a species fact",copy:"Tell someone one new thing you learned about an animal in BioBot."},
  {title:"Save a little energy",copy:"Switch off one light or device that no one is using."},
  {title:"Choose a reusable item",copy:"Use a reusable bottle or bag once today, if one is available."}
];
function challengeForToday(){
  const seed=extraTodayKey().split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  return conservationChallenges[seed%conservationChallenges.length];
}
function renderDailyMissions(){
  const root=document.getElementById("dailyMissions");
  if(!root)return;
  root.replaceChildren();
  extraMissions.forEach(mission=>{
    const current=Math.min(mission.goal,extraState.daily[mission.id]||0);
    const claimed=Boolean(extraState.daily.claimed[mission.id]);
    const card=extraNode("article","mission-card");
    const top=extraNode("div","mission-card-top");
    top.append(extraNode("span","mission-icon","✳"),extraNode("span","mission-progress-label",claimed?"Done today":current+" / "+mission.goal));
    card.append(top,extraNode("h3","",mission.title),extraNode("p","",mission.description));
    const track=extraNode("div","mission-progress-track");
    const fill=extraNode("span","mission-progress-fill");
    fill.style.width=Math.round(current/mission.goal*100)+"%";
    track.append(fill);
    const ready=current>=mission.goal;
    const button=extraNode("button","small-game-button mission-action",claimed?"Completed ✓":ready?"Claim +10 Bio points":mission.playLabel+" →");
    button.type="button";
    button.disabled=claimed;
    button.addEventListener("click",()=>{
      if(button.disabled)return;
      if(ready){
        extraState.daily.claimed[mission.id]=true;
        extraState.stats.dailyClaims++;
        saveExtraState();
        award(10);
        renderDailyMissions();
        checkExtraBadges();
      }else{
        activatePanel(mission.panel,true);
        requestAnimationFrame(()=>document.getElementById(mission.panel)?.scrollIntoView({behavior:"smooth",block:"start"}));
      }
    });
    card.append(track,button);
    root.append(card);
  });
  const challengeRoot=document.getElementById("dailyChallenge");
  if(challengeRoot){
    const challenge=challengeForToday();
    challengeRoot.replaceChildren();
    challengeRoot.append(extraNode("p","feature-kicker","TODAY’S CONSERVATION CHALLENGE"),extraNode("h3","",challenge.title),extraNode("p","",challenge.copy));
    const button=extraNode("button","button button-primary",extraState.daily.challengeDone?"Completed today ✓":"I did this today · +8 Bio points");
    button.type="button";
    button.disabled=extraState.daily.challengeDone;
    button.addEventListener("click",()=>{
      if(button.disabled)return;
      extraState.daily.challengeDone=true;
      saveExtraState();
      award(8);
      renderDailyMissions();
    });
    challengeRoot.append(button);
  }
}
const rescueStories=[
  {id:"bird-path",title:"A bird beside the footpath",prompt:"A bird is sitting quietly beside a busy footpath. What should you do?",choices:["Move it somewhere quieter yourself.","Keep your distance and ask a trusted adult to contact local wildlife rescue.","Offer it food by hand."],answer:"Keep your distance and ask a trusted adult to contact local wildlife rescue.",why:"A calm space and trained local help are safer than handling a wild bird."},
  {id:"hedgehog-road",title:"A hedgehog near a road",prompt:"You spot a hedgehog close to a road as cars pass. What is the safest choice?",choices:["Stay out of the road and tell an adult, who can contact local wildlife responders.","Chase it away from the traffic.","Pick it up and carry it across."],answer:"Stay out of the road and tell an adult, who can contact local wildlife responders.",why:"Never enter traffic or chase wildlife. A trusted adult can decide how to get local help safely."},
  {id:"schoolyard-animal",title:"Wildlife near the schoolyard",prompt:"A wild animal appears where students are gathering. What should happen next?",choices:["Crowd around it to take photos.","Try to lure it closer with a snack.","Move away calmly, give it space, and tell a teacher."],answer:"Move away calmly, give it space, and tell a teacher.",why:"A quiet space reduces stress. A teacher can contact local wildlife experts if needed."},
  {id:"baby-deer",title:"A young animal alone",prompt:"You see a young wild animal resting by itself. What is the best response?",choices:["Leave it undisturbed, keep your distance, and tell an adult if it seems hurt or in danger.","Pick it up because it must have been abandoned.","Stay nearby and keep checking on it."],answer:"Leave it undisturbed, keep your distance, and tell an adult if it seems hurt or in danger.",why:"Some young animals are left alone while their parent searches for food. Distance helps avoid disturbing them."},
  {id:"bat-ground",title:"A bat on the ground",prompt:"A bat is resting on the ground near a building. What should you do?",choices:["Touch it gently to see if it can fly.","Keep people and pets away, do not touch it, and ask an adult to call local wildlife rescue.","Put a blanket over it."],answer:"Keep people and pets away, do not touch it, and ask an adult to call local wildlife rescue.",why:"Bats should not be handled. A trained local responder can advise what to do."},
  {id:"nest-trail",title:"A nest beside a trail",prompt:"You notice a bird nest near a walking path. How can you help?",choices:["Move the nest farther into the trees.","Stay on the path, keep your distance, and let an adult know if the nest is damaged.","Touch the eggs to check if they are warm."],answer:"Stay on the path, keep your distance, and let an adult know if the nest is damaged.",why:"Keeping people back helps avoid disturbing nesting wildlife."},
  {id:"turtle-road",title:"A turtle by the road",prompt:"A turtle is near a road, but you are not with an adult. What should you do?",choices:["Go into the road and move it yourself.","Ask a friend to stop traffic.","Stay well away from traffic and tell a trusted adult who can contact local responders."],answer:"Stay well away from traffic and tell a trusted adult who can contact local responders.",why:"Do not step into traffic or handle an unfamiliar wild animal. Get help from a safe place."},
  {id:"fence-animal",title:"An animal caught in a fence",prompt:"A small animal seems caught in a garden fence. What is the safest choice?",choices:["Pull it free carefully.","Keep back and ask an adult to contact trained wildlife rescuers.","Cut the fence near the animal."],answer:"Keep back and ask an adult to contact trained wildlife rescuers.",why:"Pulling or cutting near an animal could make an injury worse. Trained help is safer."},
  {id:"bins-wildlife",title:"An animal near outdoor bins",prompt:"A wild animal is searching around outdoor bins. What should you do?",choices:["Offer it food so it leaves the bins.","Try to scare it away by running toward it.","Keep your distance, do not feed it, and tell an adult or site staff."],answer:"Keep your distance, do not feed it, and tell an adult or site staff.",why:"Feeding wildlife can cause problems. People should give it space and ask an adult to handle the situation."},
  {id:"shed-animal",title:"Wildlife inside a shed",prompt:"You notice a wild animal inside a shed. How should you respond?",choices:["Do not go in or corner it; move away and tell an adult.","Block the doorway so it cannot leave.","Try to guide it out with a broom."],answer:"Do not go in or corner it; move away and tell an adult.",why:"Give the animal room and let an adult decide whether local wildlife help is needed."},
  {id:"beach-bird",title:"A seabird resting on the beach",prompt:"A seabird is resting on the sand while people walk nearby. What is a wildlife-friendly choice?",choices:["Carry it closer to the water.","Stay well back and tell a lifeguard or trusted adult if it appears injured.","Gather people around it to see what it does."],answer:"Stay well back and tell a lifeguard or trusted adult if it appears injured.",why:"Crowding can stress wildlife. A nearby adult can contact the right local organization."},
  {id:"window-bird",title:"A bird after a window collision",prompt:"A bird is resting outside after hitting a window. What should you do?",choices:["Keep pets and people away and ask an adult to contact local wildlife rescue.","Pick it up immediately.","Try to make it fly by waving your hands."],answer:"Keep pets and people away and ask an adult to contact local wildlife rescue.",why:"A quiet area and advice from trained local help are safer than handling or startling the bird."}
];
const rescueDeckKey="biobot-rescue-deck-v2";
const rescueAwardsKey="biobot-rescue-awards-v2";
function newRescueDeck(){return {order:shuffle(rescueStories.map(story=>story.id)),index:0};}
function loadRescueDeck(){
  try{
    const saved=JSON.parse(localStorage.getItem(rescueDeckKey)||"null");
    const validOrder=Array.isArray(saved?.order)&&saved.order.length===rescueStories.length&&new Set(saved.order).size===rescueStories.length&&saved.order.every(id=>rescueStories.some(story=>story.id===id));
    if(validOrder)return {order:saved.order,index:Math.max(0,Math.min(rescueStories.length,Number(saved.index)||0))};
  }catch{}
  return newRescueDeck();
}
function saveRescueDeck(){try{localStorage.setItem(rescueDeckKey,JSON.stringify(rescueDeck));}catch{}}
function loadRescueAwards(){
  try{
    const saved=JSON.parse(localStorage.getItem(rescueAwardsKey)||"null");
    if(Array.isArray(saved))return saved;
  }catch{}
  const legacyIds=["bird-path","hedgehog-road","schoolyard-animal"];
  try{
    const legacy=JSON.parse(localStorage.getItem("biobot-rescue-stories-v1")||"[]");
    return legacyIds.filter((id,index)=>Array.isArray(legacy)&&legacy.includes(index));
  }catch{return [];}
}
let rescueDeck=loadRescueDeck();
let rescueAwards=loadRescueAwards();
function renderRescueStory(){
  const progress=document.getElementById("rescueProgress");
  const title=document.getElementById("rescueTitle");
  const prompt=document.getElementById("rescuePrompt");
  const feedback=document.getElementById("rescueFeedback");
  const next=document.getElementById("nextRescue");
  const root=document.getElementById("rescueChoices");
  feedback.textContent="";
  feedback.classList.remove("success");
  root.replaceChildren();
  if(rescueDeck.index>=rescueDeck.order.length){
    progress.textContent="Round complete · "+rescueStories.length+" / "+rescueStories.length;
    title.textContent="Wildlife helper!";
    prompt.textContent="You have seen every story in this round. Start a fresh shuffle when you are ready.";
    feedback.textContent="Great work. This round had "+rescueStories.length+" different scenarios, with no repeats.";
    feedback.classList.add("success");
    next.textContent="Shuffle a new round ↻";
    next.hidden=false;
    return;
  }
  const storyId=rescueDeck.order[rescueDeck.index];
  const story=rescueStories.find(item=>item.id===storyId);
  progress.textContent="Story "+(rescueDeck.index+1)+" of "+rescueStories.length+" · no repeats this round";
  title.textContent=story.title;
  prompt.textContent=story.prompt;
  next.textContent="Next story →";
  next.hidden=true;
  shuffle(story.choices).forEach(choice=>{
    const button=extraNode("button","qa-choice",choice);
    button.type="button";
    button.addEventListener("click",()=>{
      const correct=choice===story.answer;
      if(!correct){
        button.disabled=true;
        feedback.textContent="Not quite. Think about keeping your distance and asking a trusted adult for help, then try another choice.";
        feedback.classList.remove("success");
        return;
      }
      root.querySelectorAll("button").forEach(item=>item.disabled=true);
      button.classList.add("is-correct");
      feedback.textContent="Good choice! "+story.why;
      feedback.classList.add("success");
      if(!rescueAwards.includes(story.id)){
        rescueAwards.push(story.id);
        try{localStorage.setItem(rescueAwardsKey,JSON.stringify(rescueAwards));}catch{}
        trackExtraActivity("rescueStories");
        award(10);
        feedback.textContent+=" +10 Bio points.";
      }else feedback.textContent+=" You already earned points for this story.";
      next.hidden=false;
    });
    root.append(button);
  });
}
document.getElementById("nextRescue").addEventListener("click",()=>{
  if(rescueDeck.index>=rescueDeck.order.length)rescueDeck=newRescueDeck();
  else rescueDeck.index++;
  saveRescueDeck();
  renderRescueStory();
});
const namedAnimals=[];
const seenAnimalNames=new Set();
species.forEach(record=>{
  const name=String(record.commonName||"").trim();
  if(name&&name!==record.scientificName&&!seenAnimalNames.has(name)){
    seenAnimalNames.add(name);
    namedAnimals.push(record);
  }
});
function readableTaxon(value){
  return String(value||"Not listed").replace(/_/g," ").toLowerCase().replace(/\b[a-z]/g,letter=>letter.toUpperCase());
}
let mysteryRecord=null;
function startMystery(){
  const pool=namedAnimals.length>=4?namedAnimals:species.filter(record=>record.commonName);
  if(!pool.length)return;
  const choices=shuffle(pool).slice(0,4);
  mysteryRecord=choices[0];
  const className=readableTaxon(mysteryRecord.class);
  const familyName=readableTaxon(mysteryRecord.family);
  document.getElementById("mysteryTitle").textContent="Which animal fits these clues?";
  const clues=document.getElementById("mysteryClues");
  clues.replaceChildren();
  [ "Its animal group is "+className+".", "Its family is "+familyName+".", "Its IUCN Red List category is "+(mysteryRecord.category||"not listed")+"." ].forEach(clue=>clues.append(extraNode("li","",clue)));
  const root=document.getElementById("mysteryOptions");
  root.replaceChildren();
  choices.forEach(record=>{
    const button=extraNode("button","qa-choice",displayName(record));
    button.type="button";
    button.addEventListener("click",()=>{
      root.querySelectorAll("button").forEach(item=>{
        item.disabled=true;
        if(item.textContent===displayName(mysteryRecord))item.classList.add("is-correct");
      });
      const correct=record.id===mysteryRecord.id;
      const feedback=document.getElementById("mysteryFeedback");
      feedback.textContent=correct?"You solved it! "+displayName(mysteryRecord)+" is "+mysteryRecord.scientificName+". +8 Bio points.":"The mystery animal was "+displayName(mysteryRecord)+" ("+mysteryRecord.scientificName+").";
      feedback.classList.toggle("success",correct);
      if(correct){award(8);trackExtraActivity("mysteriesSolved");}
      document.getElementById("nextMystery").hidden=false;
    });
    root.append(button);
  });
  document.getElementById("mysteryFeedback").textContent="";
  document.getElementById("mysteryFeedback").classList.remove("success");
  document.getElementById("nextMystery").hidden=true;
}
document.getElementById("nextMystery").addEventListener("click",startMystery);
function renderSpotlight(){
  if(!namedAnimals.length)return;
  const seed=extraTodayKey().split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const animal=namedAnimals[seed%namedAnimals.length];
  document.getElementById("spotlightAnimal").replaceChildren(
    extraNode("span","spotlight-emoji",emojiFor(animal)),
    extraNode("div","",displayName(animal))
  );
  const facts=document.getElementById("spotlightFacts");
  facts.replaceChildren();
  const rows=[
    ["Scientific name",animal.scientificName],
    ["IUCN category",animal.category||"Not listed"],
    ["Assessment year",animal.assessmentYear||"Not listed"],
    ["Family",readableTaxon(animal.family)]
  ];
  rows.forEach(row=>{
    const item=extraNode("p","spotlight-fact");
    item.append(extraNode("span","",row[0]),extraNode("strong","",row[1]));
    facts.append(item);
  });
  const link=document.getElementById("spotlightSource");
  link.href=animal.url||"https://www.iucnredlist.org/";
}
const habitatTypes={
  woodland:{name:"Woodland",emoji:"🌳",features:[["tree","🌳","Trees"],["log","🪵","Fallen log"],["nativePlants","🌿","Native plants"],["flowers","🌼","Wildflowers"],["stones","🪨","Rock shelter"],["water","💧","Fresh water"]]},
  wetland:{name:"Wetland",emoji:"🪷",features:[["reeds","🌾","Reeds"],["pool","💧","Shallow pool"],["nativePlants","🌿","Native plants"],["flowers","🌼","Wildflowers"],["stones","🪨","Rocks"],["shelter","🪵","Shelter"]]},
  grassland:{name:"Grassland",emoji:"🌾",features:[["grasses","🌾","Tall grasses"],["flowers","🌼","Wildflowers"],["shrubs","🌱","Native shrubs"],["water","💧","Fresh water"],["stones","🪨","Rock shelter"],["nest","🪺","Nesting place"]]},
  ocean:{name:"Ocean",emoji:"🌊",features:[["coral","🪸","Coral"],["kelp","🌿","Kelp forest"],["seagrass","🌱","Seagrass"],["reef","🪨","Reef shelter"],["cleanWater","💧","Clean water"],["fishSchool","🐟","Fish school"]]}
};
function currentHabitatItems(){
  const key=extraState.builder.biome;
  return extraState.builder.itemsByBiome[key]||(extraState.builder.itemsByBiome[key]=[]);
}
function renderHabitatBuilder(){
  const select=document.getElementById("habitatBiome");
  if(!habitatTypes[extraState.builder.biome])extraState.builder.biome="woodland";
  select.value=extraState.builder.biome;
  const habitat=habitatTypes[extraState.builder.biome];
  const picked=currentHabitatItems();
  const palette=document.getElementById("habitatPalette");
  palette.replaceChildren();
  habitat.features.forEach(feature=>{
    const selected=picked.includes(feature[0]);
    const button=extraNode("button","habitat-choice"+(selected?" selected":""),feature[1]+" "+feature[2]+(selected?" ✓":""));
    button.type="button";
    button.setAttribute("aria-pressed",String(selected));
    button.addEventListener("click",()=>{
      const items=currentHabitatItems();
      const index=items.indexOf(feature[0]);
      if(index>=0)items.splice(index,1);
      else items.push(feature[0]);
      if(items.length&&!extraState.stats.habitatBuilds)extraState.stats.habitatBuilds=1;
      saveExtraState();
      document.getElementById("builderSaveStatus").textContent="Saved on this device · no Bio points spent.";
      renderHabitatBuilder();
      checkExtraBadges();
    });
    palette.append(button);
  });
  const plot=document.getElementById("habitatPlot");
  plot.dataset.biome=extraState.builder.biome;
  plot.replaceChildren(extraNode("h3","habitat-plot-heading",habitat.emoji+" "+habitat.name+" habitat"));
  const tileGrid=extraNode("div","habitat-tile-grid");
  if(!picked.length)tileGrid.append(extraNode("p","habitat-empty","Choose features above to start building."));
  picked.forEach(key=>{
    const feature=habitat.features.find(item=>item[0]===key);
    if(!feature)return;
    const tile=extraNode("div","habitat-piece");
    tile.append(extraNode("span","",feature[1]),extraNode("strong","",feature[2]));
    const remove=extraNode("button","habitat-remove","Remove");
    remove.type="button";
    remove.setAttribute("aria-label","Remove "+feature[2]);
    remove.addEventListener("click",()=>{
      const items=currentHabitatItems();
      items.splice(items.indexOf(key),1);
      saveExtraState();
      document.getElementById("builderSaveStatus").textContent="Saved on this device · no Bio points spent.";
      renderHabitatBuilder();
    });
    tile.append(remove);
    tileGrid.append(tile);
  });
  plot.append(tileGrid);
}
document.getElementById("habitatBiome").addEventListener("change",event=>{
  extraState.builder.biome=event.target.value;
  saveExtraState();
  renderHabitatBuilder();
});
const extraBadges=[
  {id:"first-match",title:"First Match",icon:"🧩",description:"Match your first animal pair.",ready:()=>extraState.stats.memoryPairs>=1},
  {id:"curious-naturalist",title:"Curious Naturalist",icon:"🔎",description:"Answer 10 Animal Q&A questions correctly.",ready:()=>extraState.stats.quizCorrect>=10},
  {id:"red-list-ranger",title:"Red List Ranger",icon:"📗",description:"Get 5 category matches right.",ready:()=>extraState.stats.statusCorrect>=5},
  {id:"wildlife-ally",title:"Wildlife Ally",icon:"🪽",description:"Complete a wildlife rescue story.",ready:()=>extraState.stats.rescueStories>=1},
  {id:"mystery-solver",title:"Mystery Solver",icon:"🐾",description:"Solve 3 mystery animals.",ready:()=>extraState.stats.mysteriesSolved>=3},
  {id:"challenge-champion",title:"Challenge Champion",icon:"🌎",description:"Claim 3 daily game missions.",ready:()=>extraState.stats.dailyClaims>=3},
  {id:"habitat-designer",title:"Habitat Designer",icon:"🌱",description:"Add a feature to your first habitat.",ready:()=>extraState.stats.habitatBuilds>=1}
];
function checkExtraBadges(){
  const newlyEarned=[];
  extraBadges.forEach(badge=>{
    if(badge.ready()&&!extraState.unlockedBadges.includes(badge.id)){
      extraState.unlockedBadges.push(badge.id);
      newlyEarned.push(badge);
    }
  });
  if(newlyEarned.length){
    saveExtraState();
    newlyEarned.forEach(()=>award(15));
  }
  renderBadges();
}
function renderBadges(){
  const root=document.getElementById("badgeGrid");
  if(!root)return;
  root.replaceChildren();
  extraBadges.forEach(badge=>{
    const earned=extraState.unlockedBadges.includes(badge.id);
    const card=extraNode("article","badge-card"+(earned?" earned":""));
    card.append(extraNode("span","badge-icon",earned?badge.icon:"🔒"),extraNode("div","", ""));
    const copy=card.querySelector("div");
    copy.append(extraNode("h3","",badge.title),extraNode("p","",badge.description),extraNode("strong","badge-status",earned?"Earned · +15 Bio points":"Keep playing"));
    root.append(card);
  });
  const total=extraBadges.length;
  document.getElementById("badgeSummary").textContent=extraState.unlockedBadges.length+" of "+total+" badges earned";
}
function initExtraGames(){
  renderDailyMissions();
  renderRescueStory();
  startMystery();
  renderSpotlight();
  renderHabitatBuilder();
  checkExtraBadges();
}
initExtraGames();

resetMemory();
