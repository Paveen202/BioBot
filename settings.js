(()=> {
  const background=window.BioBotBackground;
  const profile=window.BioBotProfile;
  const input=document.getElementById("customBackgroundColor");
  const status=document.getElementById("settingsStatus");
  const swatches=[...document.querySelectorAll(".color-swatch")];
  const key=background?.key||"biobot-background-color";
  const fontInput=document.getElementById("customFontColor");
  const fontStatus=document.getElementById("fontColorStatus");
  const familyInput=document.getElementById("fontFamily");
  const familyStatus=document.getElementById("fontFamilyStatus");
  const sizeInput=document.getElementById("textSize");
  const motionInput=document.getElementById("reduceMotion");
  const displayStatus=document.getElementById("displayStatus");
  const preferencesKey="biobot-display-preferences";
  const familyKey="biobot-font-family";
  const defaultPreferences={textSize:"normal",reduceMotion:false};
  const fontFamilies={
    default:{sans:"'DM Sans',sans-serif",display:"'Manrope',sans-serif"},
    system:{sans:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",display:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    rounded:{sans:"'Trebuchet MS',sans-serif",display:"'Trebuchet MS',sans-serif"},
    serif:{sans:"Georgia,'Times New Roman',serif",display:"Georgia,'Times New Roman',serif"},
    mono:{sans:"ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",display:"ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"}
  };

  function read(keyName){
    try{return localStorage.getItem(keyName)||""}catch{return ""}
  }
  function currentBackground(){
    const cloud=profile?.get?.().backgroundColor;
    if(background?.valid(cloud))return cloud;
    const saved=read(key);
    return background?.valid(saved)?saved:"#f5f4ec";
  }
  function selectBackground(value){
    if(input)input.value=value;
    swatches.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.color.toLowerCase()===value.toLowerCase())));
  }
  function saveBackground(value){
    if(!background?.valid(value))return;
    try{localStorage.setItem(key,value)}catch{}
    background.apply(value);
    selectBackground(value);
    profile?.setBackgroundColor?.(value);
    if(!status)return;
    const signedIn=Boolean(profile?.getAccount?.());
    const configured=Boolean(profile?.isCloudConfigured?.());
    status.textContent=signedIn
      ?"Wallpaper color saved to your BioBot account and syncing across devices."
      :configured
        ?"Saved on this device. Open Profile to sign in and sync across devices."
        :"Saved on this device. Account sync needs to be configured before it can sync across devices.";
  }

  function currentFontColor(){
    const saved=background?.getFontColor?.();
    return background?.valid(saved)?saved:"#1b3025";
  }
  function saveFontColor(value){
    if(!background?.setFontColor?.(value))return;
    if(fontInput)fontInput.value=value;
    if(fontStatus)fontStatus.textContent="Font color saved in this browser.";
  }
  function resetFontColor(){
    background?.resetFontColor?.();
    if(fontInput)fontInput.value="#1b3025";
    if(fontStatus)fontStatus.textContent="Font color reset to BioBot's default.";
  }
  function applyFontFamily(value){
    const chosen=fontFamilies[value]?value:"default";
    const font=fontFamilies[chosen];
    document.documentElement.style.setProperty("--sans",font.sans);
    document.documentElement.style.setProperty("--display",font.display);
    document.documentElement.dataset.fontFamily=chosen;
    if(familyInput)familyInput.value=chosen;
  }
  function saveFontFamily(value){
    if(!fontFamilies[value])return;
    try{localStorage.setItem(familyKey,value)}catch{}
    applyFontFamily(value);
    if(familyStatus)familyStatus.textContent="Font selection saved in this browser.";
  }
  function readPreferences(){
    try{
      const saved=JSON.parse(localStorage.getItem(preferencesKey)||"{}");
      return {...defaultPreferences,...(saved&&typeof saved==="object"?saved:{})};
    }catch{return {...defaultPreferences}}
  }
  function applyPreferences(preferences){
    const validSize=["normal","large","larger"].includes(preferences.textSize)?preferences.textSize:"normal";
    const reduceMotion=Boolean(preferences.reduceMotion);
    document.documentElement.dataset.textSize=validSize;
    document.documentElement.dataset.reduceMotion=String(reduceMotion);
    if(sizeInput)sizeInput.value=validSize;
    if(motionInput)motionInput.checked=reduceMotion;
  }
  function savePreferences(){
    if(!sizeInput||!motionInput)return;
    const preferences={textSize:sizeInput.value,reduceMotion:motionInput.checked};
    try{localStorage.setItem(preferencesKey,JSON.stringify(preferences))}catch{}
    applyPreferences(preferences);
    if(displayStatus)displayStatus.textContent="Display preferences saved in this browser.";
  }

  swatches.forEach(button=>button.addEventListener("click",()=>selectBackground(button.dataset.color)));
  input?.addEventListener("input",()=>swatches.forEach(button=>button.setAttribute("aria-pressed","false")));
  document.getElementById("saveBackground")?.addEventListener("click",()=>saveBackground(input?.value));
  document.getElementById("resetBackground")?.addEventListener("click",()=>saveBackground("#f5f4ec"));
  document.getElementById("saveFontColor")?.addEventListener("click",()=>saveFontColor(fontInput?.value));
  document.getElementById("resetFontColor")?.addEventListener("click",resetFontColor);
  if(fontInput)fontInput.value=currentFontColor();
  familyInput?.addEventListener("change",()=>saveFontFamily(familyInput.value));
  applyFontFamily(read(familyKey)||"default");
  sizeInput?.addEventListener("change",savePreferences);
  motionInput?.addEventListener("change",savePreferences);
  document.getElementById("resetDisplayPreferences")?.addEventListener("click",()=>{
    if(!sizeInput||!motionInput)return;
    sizeInput.value=defaultPreferences.textSize;
    motionInput.checked=defaultPreferences.reduceMotion;
    savePreferences();
  });
  window.addEventListener("biobot:profilechange",()=>selectBackground(currentBackground()));
  selectBackground(currentBackground());
  applyPreferences(readPreferences());
})();