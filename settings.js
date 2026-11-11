(()=> {
  const background=window.BioBotBackground;
  const profile=window.BioBotProfile;
  const input=document.getElementById("customBackgroundColor");
  const status=document.getElementById("settingsStatus");
  const swatches=[...document.querySelectorAll(".color-swatch")];
  const key=background?.key||"biobot-background-color";
  const sizeInput=document.getElementById("textSize");
  const motionInput=document.getElementById("reduceMotion");
  const displayStatus=document.getElementById("displayStatus");
  const preferencesKey="biobot-display-preferences";
  const defaultPreferences={textSize:"normal",reduceMotion:false};

  function currentBackground(){
    const cloud=profile?.get?.().backgroundColor;
    if(background?.valid(cloud)) return cloud;
    try{return localStorage.getItem(key)||"#f5f4ec"}catch{return "#f5f4ec"}
  }
  function selectBackground(value){
    input.value=value;
    swatches.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.color.toLowerCase()===value.toLowerCase())));
  }
  function saveBackground(value){
    if(!background?.valid(value)) return;
    try{localStorage.setItem(key,value)}catch{}
    background.apply(value);
    selectBackground(value);
    if(profile?.setBackgroundColor) profile.setBackgroundColor(value);
    const signedIn=Boolean(profile?.getAccount?.());
    const configured=Boolean(profile?.isCloudConfigured?.());
    status.textContent=signedIn
      ?"Background color saved to your BioBot account and syncing across devices."
      :configured
        ?"Saved on this device. Sign in from the Profile button to sync across devices."
        :"Saved on this device. Account sync needs to be configured before it can sync across devices.";
  }

  function readPreferences(){
    try{
      return {...defaultPreferences,...JSON.parse(localStorage.getItem(preferencesKey)||"{}")};
    }catch{return {...defaultPreferences}}
  }
  function applyPreferences(preferences){
    const validSize=["normal","large","larger"].includes(preferences.textSize)?preferences.textSize:"normal";
    const reduceMotion=Boolean(preferences.reduceMotion);
    document.documentElement.dataset.textSize=validSize;
    document.documentElement.dataset.reduceMotion=String(reduceMotion);
    sizeInput.value=validSize;
    motionInput.checked=reduceMotion;
  }
  function savePreferences(){
    const preferences={textSize:sizeInput.value,reduceMotion:motionInput.checked};
    try{localStorage.setItem(preferencesKey,JSON.stringify(preferences))}catch{}
    applyPreferences(preferences);
    displayStatus.textContent="Display preferences saved in this browser.";
  }

  swatches.forEach(button=>button.addEventListener("click",()=>selectBackground(button.dataset.color)));
  input.addEventListener("input",()=>swatches.forEach(button=>button.setAttribute("aria-pressed","false")));
  document.getElementById("saveBackground").addEventListener("click",()=>saveBackground(input.value));
  document.getElementById("resetBackground").addEventListener("click",()=>saveBackground("#f5f4ec"));
  sizeInput.addEventListener("change",savePreferences);
  motionInput.addEventListener("change",savePreferences);
  document.getElementById("resetDisplayPreferences").addEventListener("click",()=>{
    sizeInput.value=defaultPreferences.textSize;
    motionInput.checked=defaultPreferences.reduceMotion;
    savePreferences();
  });
  window.addEventListener("biobot:profilechange",()=>selectBackground(currentBackground()));
  selectBackground(currentBackground());
  applyPreferences(readPreferences());
})();