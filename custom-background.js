(()=> {
  const key="biobot-background-color";
  const fontKey="biobot-font-color";
  const valid=value=>/^#[0-9a-f]{6}$/i.test(value||"");
  const read=(storageKey)=>{
    try{return localStorage.getItem(storageKey)||""}catch{return ""}
  };
  function apply(value){
    if(!valid(value))return;
    document.documentElement.style.setProperty("--cream",value);
    const channels=value.slice(1).match(/.{2}/g).map(part=>parseInt(part,16));
    const luminance=(.2126*channels[0]+.7152*channels[1]+.0722*channels[2])/255;
    const customFont=read(fontKey);
    document.documentElement.style.setProperty("--ink",valid(customFont)?customFont:(luminance<.42?"#f7f7ef":"#1b3025"));
    document.documentElement.style.setProperty("--muted",luminance<.42?"#c6cec5":"#718078");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",value);
  }
  function setFontColor(value){
    if(!valid(value))return false;
    try{localStorage.setItem(fontKey,value)}catch{}
    document.documentElement.style.setProperty("--ink",value);
    return true;
  }
  function resetFontColor(){
    try{localStorage.removeItem(fontKey)}catch{}
    apply(read(key)||"#f5f4ec");
  }
  const background=read(key),font=read(fontKey);
  if(background)apply(background);
  else if(valid(font))document.documentElement.style.setProperty("--ink",font);
  window.addEventListener("biobot:profilechange",event=>{
    const cloud=event.detail?.state?.backgroundColor;
    if(!valid(cloud))return;
    try{localStorage.setItem(key,cloud)}catch{}
    apply(cloud);
  });
  window.BioBotBackground={key,fontKey,valid,apply,setFontColor,resetFontColor,getFontColor:()=>read(fontKey)};
})();