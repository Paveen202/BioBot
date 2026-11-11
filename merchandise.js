(()=> {
  const profile=window.BioBotProfile;
  const items=window.BIOBOT_MERCH_DATA||[];
  const grid=document.getElementById("merchandiseGrid");
  const filters=document.getElementById("merchFilters");
  const status=document.getElementById("merchStatus");
  const safe=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const categories=["All","Outfits","Accessories","Effects"];
  let activeCategory="All";
  function renderFilters(){
    filters.replaceChildren();
    categories.forEach(category=>{
      const count=category==="All"?items.length:items.filter(item=>item.category===category).length;
      const button=document.createElement("button");
      button.type="button";
      button.className="merch-filter"+(activeCategory===category?" active":"");
      button.setAttribute("aria-pressed",String(activeCategory===category));
      button.textContent=category+" · "+count;
      button.addEventListener("click",()=>{activeCategory=category;renderFilters();render();});
      filters.append(button);
    });
  }
  function render(){
    if(!profile)return;
    const state=profile.get();
    document.getElementById("shopPoints").textContent=state.points;
    const visible=activeCategory==="All"?items:items.filter(item=>item.category===activeCategory);
    grid.innerHTML=visible.map(item=>{
      const owned=state.ownedMerch.includes(item.id);
      return '<article class="merch-page-card"><span class="merch-icon" aria-hidden="true">'+safe(item.icon)+'</span><span class="merch-category">'+safe(item.category||"Accessories")+'</span><h2>'+safe(item.name)+'</h2><p>'+safe(item.description)+'</p><div class="merch-card-actions">'+(owned?'<span class="merch-owned">Owned ✓</span>':'<button class="small-game-button merch-buy" data-merch="'+safe(item.id)+'" '+(state.points<item.price?'disabled':'')+'>'+(item.price===0?'Starter gear · free':safe(item.price)+' Bio points')+'</button>')+'</div></article>';
    }).join("");
    grid.querySelectorAll("[data-merch]").forEach(button=>button.addEventListener("click",()=>{
      if(profile.buyMerch(button.dataset.merch)){
        status.textContent="Added to your collection with Bio points. Visit Bio City to equip it.";
        render();
      }
    }));
  }
  window.addEventListener("biobot:profilechange",render);
  renderFilters();
  render();
})();