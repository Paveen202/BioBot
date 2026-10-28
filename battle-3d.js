/* Real textured wildlife models in the Bio City battle arena.
   The GLBs below are CC0 assets; the arena still supplies the physical lunge,
   recoil, idle motion, habitat scenery and impact effects. */
(() => {
  let THREE, GLTFLoader, renderer, scene, camera, stage, clock = 0, habitat = "forest", impacts = [], revision = 0;
  const actors = {}, modelCache = new Map(), pending = [];
  const ASSET = (id) => `https://cdn.3dassets.dev/assets/${id}/v1/model.glb`;
  const MODELS = {
    chinchilla: "https://gobkit.com/freebies/animal008/Chinchilla.glb",
    rat: ASSET(32795), deer: ASSET(30203), bat: ASSET(20650), gibbon: ASSET(21679),
    songbird: ASSET(20608), auklet: ASSET(39350), jay: ASSET(20608), woodpecker: ASSET(20643),
    swift: ASSET(20620), kingfisher: ASSET(28091), monitor: ASSET(28101), snake: ASSET(28100),
    gecko: ASSET(28165), frog: ASSET(21693), salamander: ASSET(28105),
    fish: ASSET(5876), reefFish: "https://gobkit.com/freebies/animal008/Parrotfish.glb",
    flatfish: ASSET(39342), bee: ASSET(20659), dragonfly: ASSET(20657), lobster: ASSET(19590),
    isopod: ASSET(5893), shark: ASSET(39339), ray: ASSET(39337),
    mammal: ASSET(30212), bird: ASSET(28091), reptile: ASSET(28101), amphibian: ASSET(28105),
    crustacean: ASSET(19590), cartilaginousFish: ASSET(39339), insect: ASSET(20657)
  };
  const palettes = {
    forest:[0x67904f,0x43805a,0xb1a179], rainforest:[0x23855d,0x40a66d,0xd5a849],
    savanna:[0xc5a34b,0x92703a,0xe0c68b], desert:[0xc98948,0xd5a454,0xf0ca83],
    wetland:[0x3e8f7e,0x75a985,0xc2a668], snow:[0x83a9c1,0xe0edf0,0x8398a6],
    ocean:[0x16869e,0x32b8ba,0xf0b86e], grassland:[0x8dae4f,0xb2bd58,0xcda855],
    mountain:[0x728d98,0x9cb5ad,0xebe6d4], cave:[0x514c61,0x777482,0x9d8058]
  };
  const mat=(color,roughness=.82)=>new THREE.MeshStandardMaterial({color,roughness});
  const mesh=(parent,geo,material,pos,scale,rot)=>{const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);if(rot)m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const sphere=(p,m,pos,scale)=>mesh(p,new THREE.SphereGeometry(1,12,9),m,pos,scale);
  const cone=(p,m,pos,r,h,rot=[0,0,0])=>mesh(p,new THREE.ConeGeometry(r,h,8),m,pos,[1,1,1],rot);
  function init(){
    stage=document.getElementById("battleStage");if(!stage||!THREE||!GLTFLoader)return;
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000,0);
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.domElement.className="battle-3d-canvas";renderer.domElement.setAttribute("aria-hidden","true");stage.prepend(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,6.2,14.5);camera.lookAt(0,1.15,0);
    const hemi=new THREE.HemisphereLight(0xe8f6ff,0x4b493a,1.55);hemi.userData.persistent=true;scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xfff1d4,2.6);sun.position.set(-4,9,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.userData.persistent=true;scene.add(sun);
    fit();new ResizeObserver(fit).observe(stage);renderer.setAnimationLoop(draw);stage.classList.add("has-3d");
    window.BioBotBattle3D={update,attack};
    if(window.__bioCity3DState)update(window.__bioCity3DState);
    pending.splice(0).forEach(update);
  }
  function fit(){if(!renderer||!stage)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function clearScene(){for(const a of Object.values(actors))if(a.root)scene.remove(a.root);for(const child of [...scene.children])if(!child.userData.persistent)scene.remove(child);for(const key of Object.keys(actors))delete actors[key];impacts=[];}
  function env(key){
    habitat=palettes[key]?key:"forest";const [ground,leaf,rock]=palettes[habitat],groundMat=mat(ground),leafMat=mat(leaf),rockMat=mat(rock);
    const floor=mesh(scene,new THREE.PlaneGeometry(22,13),groundMat,[0,-.05,-3],[1,1,1],[-Math.PI/2,0,0]);floor.receiveShadow=true;
    [-8,-4.5,4.5,8].forEach((x,i)=>sphere(scene,mat(leaf),[x,.2+(i%2)*.12,-7],[3.1,.82,1.1]));
    if(["forest","rainforest","savanna","grassland","wetland"].includes(habitat)){
      for(let i=0;i<12;i++){const x=-9+i*1.65,z=-4-(i%3)*.8,h=1.7+(i%4)*.48,trunk=mat(0x604832),crown=mat(habitat==="savanna"?0x9a9c43:habitat==="wetland"?0x438a72:leaf);mesh(scene,new THREE.CylinderGeometry(.12,.2,h*.48,7),trunk,[x,h*.24,z],[1,1,1]);if(habitat==="savanna"){sphere(scene,crown,[x,h*.62,z],[.95,.26,.55]);sphere(scene,crown,[x,h*.8,z],[.62,.2,.45]);}else{cone(scene,crown,[x,h*.56,z],.75,h*.9);sphere(scene,crown,[x,h*.8,z],[.5,.52,.5]);}}
    }
    if(habitat==="desert"){for(let i=0;i<7;i++){const x=-8+i*2.65,z=-3-(i%2);sphere(scene,rockMat,[x,.15,z],[1.4,.4,.75]);if(i%2===0){const cactus=mat(0x4c9456);mesh(scene,new THREE.CylinderGeometry(.16,.2,1.7,7),cactus,[x,.95,z],[1,1,1]);mesh(scene,new THREE.CylinderGeometry(.12,.15,.65,7),cactus,[x+.25,1.2,z],[1,1,1],[0,0,Math.PI/2]);}}}
    if(habitat==="snow"||habitat==="mountain")for(let i=0;i<7;i++)cone(scene,mat(habitat==="snow"?0xe5f1ec:0x839d99),[-9+i*3,1.4+(i%3)*.7,-5],1.8,3.4);
    if(habitat==="ocean"){for(let i=0;i<15;i++){const x=-9+(i%8)*2.5,z=-5-Math.floor(i/8)*2,coralMat=mat([0xf18e77,0xe9ba62,0x8e85c2,0x53c3b1][i%4]);for(let b=0;b<3;b++)mesh(scene,new THREE.CylinderGeometry(.08,.14,.45+b*.22,6),coralMat,[x+(b-1)*.22,.25+b*.13,z],[1,1,1],[0,0,(b-1)*.18]);sphere(scene,mat(0xf6e4c1),[x+.45,.4,z],[.5,.18,.32]);}}
    if(habitat==="cave")for(let i=0;i<8;i++)cone(scene,rockMat,[-9+i*2.5,2.5,-5],.65,4.6,[Math.PI,0,0]);
  }
  function assetFor(animal){
    const name=(animal?.name||"").toLowerCase(),cls=animal?.class||"MAMMALIA";
    if(/chinchilla|coccymys/.test(name))return MODELS.chinchilla;
    if(/rat|mouse|vole/.test(name))return MODELS.rat;
    if(/deer|antelope|gazelle|elk|moose/.test(name))return MODELS.deer;
    if(/bat/.test(name))return MODELS.bat;if(/gibbon|monkey|ape/.test(name))return MODELS.gibbon;
    if(/auklet|penguin/.test(name))return MODELS.auklet;
    if(/jay/.test(name))return MODELS.jay;if(/woodcreeper|woodpecker/.test(name))return MODELS.woodpecker;
    if(/pitta|kingfisher/.test(name))return MODELS.kingfisher;if(/warbler|spinetail|swamp/.test(name))return MODELS.songbird;
    if(/snake/.test(name))return MODELS.snake;if(/gecko/.test(name))return MODELS.gecko;
    if(/lizard|skink/.test(name))return MODELS.monitor;
    if(/frog/.test(name))return MODELS.frog;if(/newt|salamander/.test(name))return MODELS.salamander;
    if(/parrotfish/.test(name))return MODELS.reefFish;if(/sole|flounder/.test(name))return MODELS.flatfish;
    if(/barbel|loach/.test(name))return MODELS.fish;
    if(/bee/.test(name))return MODELS.bee;if(/hawker|sprite|clubskimmer|duskdarter|knobtail/.test(name))return MODELS.dragonfly;
    if(/lobster|crayfish/.test(name))return MODELS.lobster;if(/crab|shrimp/.test(name))return MODELS.isopod;
    if(/shark|catshark|ghostshark/.test(name))return MODELS.shark;if(/stingaree|guitarfish/.test(name))return MODELS.ray;
    return ({MAMMALIA:MODELS.mammal,AVES:MODELS.bird,REPTILIA:MODELS.reptile,AMPHIBIA:MODELS.amphibian,ACTINOPTERYGII:MODELS.fish,INSECTA:MODELS.insect,MALACOSTRACA:MODELS.crustacean,CHONDRICHTHYES:MODELS.cartilaginousFish})[cls]||MODELS.mammal;
  }
  function cloneAsset(url){
    if(!modelCache.has(url))modelCache.set(url,new GLTFLoader().loadAsync(url).then(gltf=>gltf.scene));
    return modelCache.get(url).then(source=>source.clone(true));
  }
  async function addAnimal(animal,side,version){
    const sideNode=stage.querySelector(`.battle-${side}`),art=document.getElementById(`${side}BattleArt`);sideNode?.classList.remove("has-3d-model");
    try{
      const model=await cloneAsset(assetFor(animal));if(version!==revision)return;
      const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      if(!Number.isFinite(size.x)||!size.x||!size.y||!size.z)throw new Error("The animal model has no visible geometry.");
      model.position.set(-center.x,-bounds.min.y,-center.z);
      model.scale.setScalar(3.15/Math.max(size.x,size.z,size.y*.8));
      model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;if(node.material){node.material.needsUpdate=true;}}});
      const root=new THREE.Group();root.add(model);root.position.set(side==="player"?-3.05:3.05,0,side==="player"?.35:-.25);root.rotation.y=side==="player"?Math.PI/2:-Math.PI/2;scene.add(root);
      actors[side]={root,side,entryAt:performance.now(),phase:Math.random()*6};sideNode?.classList.add("has-3d-model");
    }catch(error){
      if(version!==revision)return;sideNode?.classList.remove("has-3d-model");
      if(art){const image=art.querySelector("img"),fallback=art.querySelector("span");if(image?.src)image.hidden=false;else if(fallback)fallback.style.opacity="1";}
      console.warn(`3D animal model unavailable for ${animal?.name||"animal"}; showing the species photo instead.`,error);
    }
  }
  function update(state){if(!THREE){pending.push(state);return;}if(!scene)init();if(!scene)return;revision++;clearScene();env(state.habitat);addAnimal(state.player||{name:"Wildlife",class:"MAMMALIA"},"player",revision);addAnimal(state.rival||{name:"Wildlife",class:"MAMMALIA"},"rival",revision);}
  function attack(side,move){const a=actors[side],target=actors[side==="player"?"rival":"player"];if(!a)return;const sign=side==="player"?1:-1,now=performance.now();a.root.userData.attack={start:now,sign,move,impact:false};if(target)target.root.userData.hit={start:now,sign};}
  function impactBurst(move){const colors={habitat:0x52d8e4,pollen:0xffd566,river:0x5ebeff,quake:0xd59b59,heal:0x8de49a,camouflage:0xa7df78,guard:0x9be2bd,vine:0x85c96a,adapt:0xffe28a,hit:0xffa15e},color=colors[move]||colors.hit,g=new THREE.Group();g.position.set(0,1.45,.65);scene.add(g);const core=mesh(g,new THREE.SphereGeometry(.22,12,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95}),[0,0,0],[1,1,1]),ring=mesh(g,new THREE.TorusGeometry(.34,.045,6,20),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9}),[0,0,.02],[1,1,1]),sparks=[];for(let i=0;i<8;i++){const angle=i*Math.PI/4,spark=mesh(g,new THREE.SphereGeometry(.07,7,5),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),[Math.cos(angle)*.2,Math.sin(angle)*.2,.04],[1,1,1]);sparks.push({mesh:spark,angle});}impacts.push({group:g,core,ring,sparks,start:performance.now()});}
  function draw(){if(!renderer)return;clock+=.016;const now=performance.now();for(const a of Object.values(actors)){
      const t=clock*2+a.phase,attack=a.root.userData.attack,hit=a.root.userData.hit,enter=Math.min(1,Math.max(0,(now-a.entryAt)/900)),enterEase=1-Math.pow(1-enter,3),home=a.side==="player"?-3.05:3.05,sign=a.side==="player"?1:-1;
      let x=home-sign*2.5*(1-enterEase),dash=0,bounce=Math.sin(t)*.035,roll=0;
      if(attack){const p=Math.min(1,(now-attack.start)/980),advance=Math.max(0,Math.min(1,(p-.12)/.48)),returning=Math.max(0,Math.min(1,(p-.63)/.37));dash=attack.sign*(2.1*(1-Math.pow(1-advance,3)))*(1-Math.pow(returning,2));bounce+=.14*Math.sin(Math.PI*Math.max(0,Math.min(1,(p-.1)/.58)));if(!attack.impact&&p>.46){attack.impact=true;impactBurst(attack.move||"hit");}if(p>=1)a.root.userData.attack=null;}
      if(hit){const p=(now-hit.start)/550;if(p<1){const decay=Math.exp(-p*4);roll=Math.sin(p*22)*.07*decay;x+=hit.sign*.34*Math.sin(Math.PI*Math.min(1,p))*Math.exp(-p*2.4);}else a.root.userData.hit=null;}
      a.root.position.x=x+dash;a.root.position.y=Math.max(0,bounce);a.root.rotation.y=(a.side==="player"?Math.PI/2:-Math.PI/2)+Math.sin(t*.48)*.025;a.root.rotation.z=roll+(attack?Math.sin(t*5)*.025:0);
    }
    impacts=impacts.filter(effect=>{const p=(now-effect.start)/570;if(p>=1){scene.remove(effect.group);effect.group.traverse(node=>{if(node.geometry)node.geometry.dispose();if(node.material)node.material.dispose();});return false;}effect.group.scale.setScalar(.6+p*1.9);effect.core.material.opacity=1-p;effect.ring.material.opacity=1-p;effect.sparks.forEach(s=>{s.mesh.position.x=Math.cos(s.angle)*(.2+p*.68);s.mesh.position.y=Math.sin(s.angle)*(.2+p*.68);s.mesh.material.opacity=1-p;});return true;});renderer.render(scene,camera);
  }
  Promise.all([
    import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"),
    import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js")
  ]).then(([three,loader])=>{THREE=three;GLTFLoader=loader.GLTFLoader;init();}).catch(error=>console.warn("The 3D wildlife arena could not load:",error));
  window.addEventListener("biobot:battle3d-update",event=>{window.__bioCity3DState=event.detail;if(window.BioBotBattle3D)window.BioBotBattle3D.update(event.detail);});
})();
