/* Lightweight procedural 3D wildlife arena. Three.js is loaded on demand so
   the battle UI is usable immediately even on a slow connection. */
(() => {
  let THREE, renderer, scene, camera, stage, actors = {}, clock = 0, habitat = "forest";
  const pending = [];
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
    stage=document.getElementById("battleStage");if(!stage||!THREE)return;
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.className="battle-3d-canvas";renderer.domElement.setAttribute("aria-hidden","true");stage.prepend(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,6.2,14.5);camera.lookAt(0,1.15,0);
    scene.add(new THREE.HemisphereLight(0xe5f7ff,0x536446,2.1));const sun=new THREE.DirectionalLight(0xfff0cf,3.2);sun.position.set(-4,9,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
    fit();new ResizeObserver(fit).observe(stage);renderer.setAnimationLoop(draw);stage.classList.add("has-3d");
    window.BioBotBattle3D={update,attack};
    if(window.__bioCity3DState)update(window.__bioCity3DState);
    pending.splice(0).forEach(update);
  }
  function fit(){if(!renderer||!stage)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function clearScene(){for(const a of Object.values(actors))if(a.root)scene.remove(a.root);actors={};while(scene.children.length>2)scene.remove(scene.children[2]);}
  function env(key){
    habitat=palettes[key]?key:"forest";const [ground,leaf,rock]=palettes[habitat],groundMat=mat(ground),leafMat=mat(leaf),rockMat=mat(rock);
    const floor=mesh(scene,new THREE.PlaneGeometry(22,13),groundMat,[0,-.05,-3], [1,1,1],[-Math.PI/2,0,0]);floor.receiveShadow=true;
    const hillMat=mat(leaf);[-8,-4.5,4.5,8].forEach((x,i)=>sphere(scene,hillMat,[x,.2+(i%2)*.12,-7],[3.1,.82,1.1]));
    if(["forest","rainforest","savanna","grassland","wetland"].includes(habitat)){
      for(let i=0;i<12;i++){const x=-9+i*1.65,z=-4-(i%3)*.8,h=1.7+(i%4)*.48;const trunk=mat(0x604832),crown=mat(habitat==="savanna"?0x9a9c43:habitat==="wetland"?0x438a72:leaf);mesh(scene,new THREE.CylinderGeometry(.12,.2,h*.48,7),trunk,[x,h*.24,z],[1,1,1]);if(habitat==="savanna"){sphere(scene,crown,[x,h*.62,z],[.95,.26,.55]);sphere(scene,crown,[x,h*.8,z],[.62,.2,.45]);}else{cone(scene,crown,[x,h*.56,z],.75,h*.9);sphere(scene,crown,[x,h*.8,z],[.5,.52,.5]);}}
    }
    if(habitat==="desert"){for(let i=0;i<7;i++){const x=-8+i*2.65,z=-3-(i%2);sphere(scene,rockMat,[x,.15,z],[1.4,.4,.75]);if(i%2===0){const cactus=mat(0x4c9456);mesh(scene,new THREE.CylinderGeometry(.16,.2,1.7,7),cactus,[x,.95,z],[1,1,1]);mesh(scene,new THREE.CylinderGeometry(.12,.15,.65,7),cactus,[x+.25,1.2,z],[1,1,1],[0,0,Math.PI/2]);}}}
    if(habitat==="snow"||habitat==="mountain"){for(let i=0;i<7;i++)cone(scene,mat(habitat==="snow"?0xe5f1ec:0x839d99),[-9+i*3,1.4+(i%3)*.7,-5],1.8,3.4);}
    if(habitat==="ocean"){for(let i=0;i<15;i++){const x=-9+(i%8)*2.5,z=-5-Math.floor(i/8)*2;const coralMat=mat([0xf18e77,0xe9ba62,0x8e85c2,0x53c3b1][i%4]);for(let b=0;b<3;b++)mesh(scene,new THREE.CylinderGeometry(.08,.14,.45+b*.22,6),coralMat,[x+(b-1)*.22,.25+b*.13,z],[1,1,1],[0,0,(b-1)*.18]);sphere(scene,mat(0xf6e4c1),[x+.45,.4,z],[.5,.18,.32]);}}
    if(habitat==="cave"){for(let i=0;i<8;i++)cone(scene,rockMat,[-9+i*2.5,2.5,-5],.65,4.6,[Math.PI,0,0]);}
  }
  function animalModel(animal,side){
    const root=new THREE.Group();scene.add(root);root.position.set(side==="player"?-3.05:3.05,0,side==="player"?.5:-.35);root.rotation.y=side==="player"?-.12:Math.PI+.12;
    const name=(animal.name||"").toLowerCase(),className=animal.class||"MAMMALIA";let coat=className==="AVES"?0x738b49:className==="REPTILIA"||className==="AMPHIBIA"?0x64844b:className==="ACTINOPTERYGII"||className==="CHONDRICHTHYES"?0x438da0:className==="INSECTA"?0xc09b42:className==="MALACOSTRACA"?0xa95f46:0x98764e;if(/deer|antelope|gazelle|horse|zebra/.test(name))coat=0xa66c43;if(/rat|mouse|chinchilla|hare|rabbit|squirrel/.test(name))coat=0x88847a;if(/bear|wolf|fox|cat|tiger|lion|leopard/.test(name))coat=0xb27a4a;if(/polar|arctic|snow|ice/.test(name))coat=0xe2e3d9;if(/elephant|rhino|hippo/.test(name))coat=0x77776c;const base=new THREE.Color(coat),fur=mat(base),light=mat(base.clone().offsetHSL(0,.01,.17)),dark=mat(base.clone().offsetHSL(0,-.02,-.2)),black=mat(0x182a27),white=mat(0xfff4d6),limbs=[];
    const body=sphere(root,fur,[0,1.2,0],[1.02,.56,.55]);const head=new THREE.Group();root.add(head);head.position.set(.68,1.68,0);sphere(head,light,[0,0,0],[.42,.4,.39]);sphere(head,black,[.29,.08,.26],[.055,.07,.055]);sphere(head,black,[.29,.08,-.26],[.055,.07,.055]);
    const legMat=dark, addLeg=(x,z)=>{const pivot=new THREE.Group();pivot.position.set(x,.95,z);root.add(pivot);mesh(pivot,new THREE.CylinderGeometry(.105,.13,.67,8),legMat,[0,-.28,0],[1,1,1]);sphere(pivot,dark,[.08,-.59,.02],[.22,.12,.16]);limbs.push(pivot);};
    if(["AVES"].includes(className)){body.scale.set(.8,.62,.58);head.position.set(.7,1.75,0);cone(head,mat(0xe5a53c),[.42,-.04,0],.13,.5,[0,0,-Math.PI/2]);const wingL=mesh(root,new THREE.SphereGeometry(1,12,8),light,[-.05,1.35,.45],[.62,.16,.36],[0,0,-.18]),wingR=mesh(root,new THREE.SphereGeometry(1,12,8),light,[-.05,1.35,-.45],[.62,.16,.36],[0,0,.18]);limbs.push(wingL,wingR);addLeg(.1,.2);addLeg(.1,-.2);}
    else if(["ACTINOPTERYGII","CHONDRICHTHYES"].includes(className)){body.scale.set(1.25,.45,.52);head.position.set(.7,1.37,0);const tail=cone(root,light,[-1.28,1.2,0],.5,.85,[0,0,Math.PI/2]);limbs.push(tail);mesh(root,new THREE.ConeGeometry(.28,.65,4),dark,[-.05,1.72,0],[1,1,1]);for(let i=0;i<3;i++)sphere(root,light,[.2-i*.42,1.18,.49],[.27,.1,.12]);}
    else if(["REPTILIA","AMPHIBIA"].includes(className)){body.scale.set(1.18,.36,.62);head.position.set(.92,1.47,0);cone(root,fur,[-1.4,1.12,0],.25,1.2,[0,0,Math.PI/2]);addLeg(.62,.42);addLeg(.62,-.42);addLeg(-.56,.42);addLeg(-.56,-.42);if(className==="AMPHIBIA"){sphere(head,light,[.05,.32,.23],[.16,.19,.15]);sphere(head,light,[.05,.32,-.23],[.16,.19,.15]);}}
    else {addLeg(.58,.35);addLeg(.58,-.35);addLeg(-.58,.35);addLeg(-.58,-.35);cone(root,fur,[-1.12,1.27,0],.18,.85,[0,0,Math.PI/2]);if(/deer|antelope|goat|ibex/.test(animal.name.toLowerCase()))for(const z of [-.22,.22]){mesh(head,new THREE.CylinderGeometry(.035,.1,.48,6),dark,[-.06,.53,z],[1,1,1],[0,0,-.5]);cone(head,white,[-.2,.82,z-.02],.12,.36,[0,0,-.4]);}if(/elephant/.test(animal.name.toLowerCase()))mesh(head,new THREE.CylinderGeometry(.1,.19,.66,8),light,[.32,-.34,0],[1,1,1],[0,0,-.16]);if(/lion|tiger/.test(animal.name.toLowerCase()))sphere(head,dark,[-.08,0,0],[.45,.46,.45]);}
    root.scale.setScalar(1.25);const shadow=mesh(root,new THREE.CircleGeometry(.82,24),mat(0x203426,.98),[0,.045,.02],[1.2,.36,1],[-Math.PI/2,0,0]);shadow.receiveShadow=true;
    return{root,body,head,limbs,side,phase:Math.random()*6,animal};
  }
  function update(state){if(!THREE){pending.push(state);return;}if(!scene)init();if(!scene)return;clearScene();env(state.habitat);actors.player=animalModel(state.player||{name:"Wildlife",class:"MAMMALIA"},"player");actors.rival=animalModel(state.rival||{name:"Wildlife",class:"MAMMALIA"},"rival");}
  function attack(side,move){const a=actors[side];if(!a)return;const sign=side==="player"?1:-1;a.root.userData.attack={start:performance.now(),sign,move};}
  function draw(){if(!renderer)return;clock+=.016;for(const a of Object.values(actors)){const t=clock*4+a.phase,hit=a.root.userData.attack,now=performance.now();let dash=0,jump=0;if(hit&&now-hit.start<700){const p=(now-hit.start)/700;dash=Math.sin(p*Math.PI)*.9*hit.sign;jump=Math.sin(p*Math.PI)*.28;}else if(hit)a.root.userData.attack=null;a.root.position.x=(a.side==="player"?-3.05:3.05)+dash;a.root.position.y=Math.max(0,jump)+Math.sin(t)*.035;a.body.rotation.z=Math.sin(t*.5)*.035;a.head.rotation.z=Math.sin(t*.7)*.04;a.limbs.forEach((limb,i)=>{if(limb.isGroup)limb.rotation.z=Math.sin(t+(i%2)*Math.PI)*.48;else limb.rotation.x=Math.sin(t*1.2+i)*.28;});}
    renderer.render(scene,camera);
  }
  import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js").then(module=>{THREE=module;init();}).catch(error=>{console.warn("3D arena could not load:",error);});
  window.addEventListener("biobot:battle3d-update",event=>{window.__bioCity3DState=event.detail;if(window.BioBotBattle3D)window.BioBotBattle3D.update(event.detail);});
})();
