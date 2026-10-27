const species = window.BIOBOT_IUCN?.species || [];
const categoryNames = [...new Set(species.map(s => s.category).filter(Boolean))];
const shuffle = list => list.slice().sort(() => Math.random() - .5);
const scoreNode = document.getElementById('gameScore');
let score = 0;
try { score = Number(localStorage.getItem('biobot-game-score') || 0); } catch {}
scoreNode.textContent = score;
function award(points){score += points;scoreNode.textContent=score;try{localStorage.setItem('biobot-game-score',String(score));}catch{}}
function emojiFor(record){
  const c=String(record.class||'').toUpperCase();
  if(c.includes('AVES'))return '🐦';if(c.includes('MAMMALIA'))return '🐾';if(c.includes('REPTILIA'))return '🐢';
  if(c.includes('AMPHIBIA'))return '🐸';if(c.includes('ACTINOPTERYGII')||c.includes('FISH'))return '🐟';if(c.includes('CHONDRICHTHYES'))return '🦈';
  if(c.includes('INSECTA'))return '🦋';if(c.includes('ARACHNIDA'))return '🕷️';if(c.includes('MALACOSTRACA'))return '🦀';if(c.includes('GASTROPODA'))return '🐌';return '🐾';
}
function displayName(record){return record.commonName && record.commonName!==record.scientificName ? record.commonName : record.scientificName;}
const tabs=[...document.querySelectorAll('.game-tab')];
tabs.forEach(tab=>tab.addEventListener('click',()=>{
  tabs.forEach(t=>{const on=t===tab;t.classList.toggle('active',on);t.setAttribute('aria-selected',String(on));});
  document.querySelectorAll('.game-panel').forEach(panel=>{const on=panel.id===tab.getAttribute('aria-controls');panel.hidden=!on;panel.classList.toggle('active',on);});
}));

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
    a.classList.add('matched');b.classList.add('matched');a.disabled=b.disabled=true;matchedPairs++;award(5);const total=[3,6,8,12][Number(document.getElementById('memoryLevel').value)-1];
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
  if(correct){quizScore++;award(10);}const feedback=document.getElementById('qaFeedback');feedback.textContent=correct?'Correct! +10 points.':`The answer is ${item.answer}.`;feedback.classList.toggle('success',correct);document.getElementById('qaProgress').textContent=`Score: ${quizScore} / 12`;document.getElementById('nextQuestion').textContent=quizIndex===11?'See results':'Next question →';document.getElementById('nextQuestion').hidden=false;
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
  if(correct){statusScore++;award(10);}const feedback=document.getElementById('habitatFeedback');feedback.textContent=correct?'That’s the right category! +10 points.':`This species is listed as ${animal.category}.`;feedback.classList.toggle('success',correct);document.getElementById('habitatProgress').textContent=`Score: ${statusScore} / 10`;document.getElementById('nextHabitat').textContent=statusIndex===9?'See results':'Next species →';document.getElementById('nextHabitat').hidden=false;
}
document.getElementById('startHabitat').addEventListener('click',startStatusMatch);document.getElementById('nextHabitat').addEventListener('click',()=>{statusIndex++;showStatusQuestion();});
resetMemory();
