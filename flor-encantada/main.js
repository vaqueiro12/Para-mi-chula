import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = s => document.querySelector(s);
const mobile = matchMedia('(max-width: 760px)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
catch (error) { $('#error').hidden = false; $('#phase').textContent = 'WebGL no está disponible'; throw error; }
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
$('#scene').appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Jardín 3D interactivo');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#040e0c');
scene.fog = new THREE.FogExp2('#040e0c', .024);
const camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, .1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 36;
controls.minPolarAngle = .35;
controls.maxPolarAngle = Math.PI * .53;
controls.autoRotate = false;
controls.autoRotateSpeed = .15;
function frameCamera() {
  const small = innerWidth < 761;
  camera.position.set(0, small ? 8 : 8.5, small ? 23.5 : 18.8);
  controls.target.set(0, small ? 3.7 : 3, 0);
  camera.setViewOffset(innerWidth, innerHeight, small ? -innerWidth * .035 : -innerWidth * .135, small ? -innerHeight * .07 : 0, innerWidth, innerHeight);
  controls.update();
}
frameCamera();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .65, .7, 1.05);
composer.addPass(bloom);
composer.addPass(new OutputPass());
scene.add(new THREE.HemisphereLight('#a8c4ff', '#15231e', 2));
function light(color, intensity, position) { const p = new THREE.PointLight(color, intensity, 30, 2); p.position.set(...position); scene.add(p); return p; }
light('#c7ffdc', 65, [-4, 8, 5]);
light('#74ccb8', 80, [5, 7, -3]);
light('#ffdaa2', 45, [1, 9, 4]);
const coreLight = light('#ffbb63', 4, [0, 5, 0]);
const plant = new THREE.Group(); scene.add(plant);
const flower = new THREE.Group(); plant.add(flower);
const green = new THREE.MeshPhysicalMaterial({ color: '#286149', roughness: .42, metalness: .08, clearcoat: .5, side: THREE.DoubleSide });
const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0), new THREE.Vector3(-.14,1.5,0), new THREE.Vector3(.12,3.1,.04), new THREE.Vector3(0,4.75,0)]);
const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 70, .065, 10, false), green); plant.add(stem);
// Parametric petal: cupped edges, a raised midrib, fine surface folds and a recurved tip.
function surfacePoint(t, s, leaf = false) {
  const width = Math.pow(Math.max(0,Math.sin(Math.PI * t)), leaf ? .9 : .48) * (leaf ? .43 : .92);
  const fold = .004 * Math.sin(s * 39 + t * 15) * Math.sin(Math.PI * t);
  return new THREE.Vector3(s * width, t * (leaf ? 2.1 : 2.65), leaf ? .21*Math.sin(Math.PI*t)+.12*s*s*Math.sin(Math.PI*t) : .62*Math.sin(Math.PI*t/2)+.26*s*s*Math.sin(Math.PI*t)+fold);
}
function surfaceGeometry(leaf, baseColor, tipColor) {
  const positions=[], colors=[], uvs=[], indices=[]; const W=20,H=38;
  const base=new THREE.Color(baseColor), tip=new THREE.Color(tipColor);
  for(let j=0;j<=H;j++) for(let i=0;i<=W;i++) {
    const t=j/H,s=i/W*2-1,p=surfacePoint(t,s,leaf); positions.push(p.x,p.y,p.z); uvs.push(i/W,t);
    const c=base.clone().lerp(tip,THREE.MathUtils.smoothstep(t,.12,1));
    c.multiplyScalar(1-.025*Math.cos(s*32+t*9)*Math.sin(Math.PI*t)); colors.push(c.r,c.g,c.b);
  }
  for(let j=0;j<H;j++) for(let i=0;i<W;i++) { const a=j*(W+1)+i,b=a+W+1;indices.push(a,b,a+1,b,b+1,a+1); }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
const veinMat = new THREE.LineBasicMaterial({ color:'#b6d196', transparent:true, opacity:.25 });
const leaves=[];
for(let i=0;i<4;i++) {
  const pivot=new THREE.Group();pivot.position.y=1.1+i*.73;pivot.rotation.y=i*2.5+.7;
  const mesh=new THREE.Mesh(surfaceGeometry(true,'#164d34','#59955b'),green);pivot.add(mesh);
  const points=Array.from({length:35},(_,j)=>surfacePoint(j/34,0,true).add(new THREE.Vector3(0,0,.012)));
  pivot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),veinMat));
  for(let k=1;k<7;k++) for(const side of [-1,1]) {
    const pts=Array.from({length:12},(_,j)=>surfacePoint(k/8+j/11*.13,side*j/11*.85,true).add(new THREE.Vector3(0,0,.012)));
    pivot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),veinMat));
  }
  const scale=i===3?.65:1;pivot.userData={scale};plant.add(pivot);leaves.push(pivot);
}
const palettes=[['#17634d','#a4e4b1'],['#397d62','#d8efb7'],['#187265','#8fd9b6'],['#789c5d','#f1e6b5'],['#235b48','#b6d8a4']];
const petals=[];
for(let layer=0;layer<7;layer++) {
  const count=[13,12,11,10,9,7,5][layer];
  for(let i=0;i<count;i++) {
    const palette=palettes[(i+layer*2)%palettes.length];
    const material=new THREE.MeshPhysicalMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.48,metalness:.015,clearcoat:.18,clearcoatRoughness:.5,sheen:.8,sheenColor:new THREE.Color(palette[1]),sheenRoughness:.6,emissive:palette[0],emissiveIntensity:.045});
    const pivot=new THREE.Group();pivot.rotation.y=i/count*Math.PI*2+layer*.34;
    pivot.position.set(Math.sin(pivot.rotation.y)*.1,layer*.085,Math.cos(pivot.rotation.y)*.1);
    const hinge=new THREE.Group();pivot.add(hinge);
    const mesh=new THREE.Mesh(surfaceGeometry(false,...palette),material);mesh.scale.setScalar([1,.92,.83,.73,.62,.5,.36][layer]);hinge.add(mesh);flower.add(pivot);
    petals.push({hinge,mesh,layer,index:i,order:petals.length,open:[1.3,1.16,.99,.83,.66,.48,.3][layer]});
  }
}
// Five sepals enclose the base of the bud.
for(let i=0;i<5;i++){const pivot=new THREE.Group();pivot.rotation.y=i/5*Math.PI*2;const m=new THREE.Mesh(surfaceGeometry(true,'#19432c','#4e8060'),green);m.scale.set(.5,.45,.5);m.rotation.x=2.15;pivot.add(m);flower.add(pivot);}
const core=new THREE.Mesh(new THREE.SphereGeometry(.38,32,20),new THREE.MeshStandardMaterial({color:'#edb64f',emissive:'#ffbd50',emissiveIntensity:.65,roughness:.6}));core.scale.y=.48;core.position.y=.18;flower.add(core);
const pollenMaterial=new THREE.MeshStandardMaterial({color:'#ffe3a1',emissive:'#ffbf57',emissiveIntensity:1.4,roughness:.4});
const pollenGeometry=new THREE.SphereGeometry(.035,7,5);
const filaments=new THREE.Group();flower.add(filaments);
for(let i=0;i<85;i++){
  const a=i*2.39996,r=Math.sqrt(i/85)*.48,h=.22+Math.random()*.32;
  const x=Math.cos(a)*r,z=Math.sin(a)*r;
  const tip=new THREE.Mesh(pollenGeometry,pollenMaterial);tip.position.set(x,h,z);filaments.add(tip);
  const thread=new THREE.Mesh(new THREE.CylinderGeometry(.008,.012,h,5),pollenMaterial);thread.position.set(x,h/2,z);filaments.add(thread);
}
const ground=new THREE.Mesh(new THREE.CircleGeometry(35,96),new THREE.MeshStandardMaterial({color:'#071319',roughness:.35,metalness:.35}));ground.rotation.x=-Math.PI/2;ground.position.y=-.06;scene.add(ground);
// Moss-like clusters and individual fine blades keep the garden fully volumetric.
const grassGeometry=new THREE.ConeGeometry(.025,.45,3);
const grass=new THREE.InstancedMesh(grassGeometry,new THREE.MeshStandardMaterial({color:'#34594e',roughness:.9}),650);
const dummy=new THREE.Object3D();
for(let i=0;i<650;i++){const a=Math.random()*Math.PI*2,r=.3+Math.pow(Math.random(),.6)*5;dummy.position.set(Math.cos(a)*r,.06,Math.sin(a)*r);dummy.rotation.set(Math.random()*.5,Math.random()*6,Math.random()*.5);dummy.scale.setScalar(.4+Math.random());dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}scene.add(grass);
for(const r of [1.05,1.13,2.7]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.008,5,150),new THREE.MeshBasicMaterial({color:'#a48460',transparent:true,opacity:r>2?.17:.35}));ring.rotation.x=Math.PI/2;ring.position.y=-.02;scene.add(ring);}
function glowTexture(){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#fff');gradient.addColorStop(.12,'#fff');gradient.addColorStop(.3,'#ffffff88');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);}
const glow=glowTexture();
function cloud(count,spread,star=false){const p=new Float32Array(count*3),c=new Float32Array(count*3);for(let i=0;i<count;i++){p[i*3]=(Math.random()-.5)*spread;p[i*3+1]=star?3+Math.random()*30:Math.random()*10;p[i*3+2]=(Math.random()-.5)*spread;const color=new THREE.Color().setHSL(star?.62:Math.random()>.5?.1:.78,.45,.65+Math.random()*.3);c.set([color.r,color.g,color.b],i*3);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(p,3));geometry.setAttribute('color',new THREE.BufferAttribute(c,3));const material=new THREE.PointsMaterial({size:star?.09:.14,map:glow,transparent:true,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending});const points=new THREE.Points(geometry,material);scene.add(points);return points;}
const stars=cloud(mobile?1100:1900,48,true),flies=cloud(mobile?100:200,15);
stars.material.size=.2;stars.material.opacity=1;stars.material.fog=false;stars.material.toneMapped=false;
const flyBase=flies.geometry.attributes.position.array.slice();
scene.add(camera);
const comets=Array.from({length:5},(_,i)=>{
  const positions=new Float32Array(42*3),colors=new Float32Array(42*3);
  for(let j=0;j<42;j++){const k=1-j/42;colors.set([k*.65,k,k*.8],j*3);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const points=new THREE.Points(geo,new THREE.PointsMaterial({map:glow,size:.085,transparent:true,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));camera.add(points);points.frustumCulled=false;points.material.fog=false;
  const trail=new THREE.Line(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false}));trail.frustumCulled=false;camera.add(trail);
  const head=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:'#fff1ce',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false}));head.scale.setScalar(.2);camera.add(head);
  return {points,trail,head,offset:i*1.7};
});
// Extruded hearts are real 3D meshes, with shared geometry and bounded lifetimes.
const heartShape=new THREE.Shape();heartShape.moveTo(0,.25);heartShape.bezierCurveTo(-.5,.8,-.9,.1,0,-.65);heartShape.bezierCurveTo(.9,.1,.5,.8,0,.25);
const heartGeometry=new THREE.ExtrudeGeometry(heartShape,{depth:.13,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:10});
const sparkGeometry=new THREE.OctahedronGeometry(.045);
// Six new flowers carry the supplied photographs on curved petals and in their centers.
const memories = [];

const memoryPositions = Array.from({length:6},()=>[mobile?0:2.6,mobile?2.1:3.1,mobile?2.5:1.2]);
const memoryPetalGeometry = surfaceGeometry(false, '#ffffff', '#ffffff');
const goldMaterial = new THREE.MeshStandardMaterial({color:'#d9b47a',metalness:.65,roughness:.3,emissive:'#a77737',emissiveIntensity:.15});
const memoryTitles=['Tu sonrisa, mi alegría','Contigo estoy en casa','Un beso, mil mariposas','Me encantas así','Mi casualidad favorita','Te elijo, siempre'];
const memoryCaptions=['Esa sonrisa tuya','Nuestro pequeño refugio','Donde empieza la magia','Tú, tan tú','Qué suerte encontrarnos','Nos quedan mil historias'];
const lovePhrases = [
  'Tu sonrisa tiene esa magia: convierte cualquier día en mi día favorito. Quiero ser una razón más para verte sonreír.',
  'No necesito un lugar perfecto. Si estoy contigo, ya estoy en casa. Gracias por hacerme sentir tan amado.',
  'Hay besos que duran un instante y se quedan para siempre. Los tuyos me recuerdan lo bonito que es estar enamorado de ti.',
  'Me enamoras cuando ríes, cuando haces travesuras y cuando simplemente eres tú. No cambiaría ni un pedacito de nuestra complicidad.',
  'Entre tantas personas, coincidimos tú y yo. Qué suerte tan inmensa la mía: encontrarte y poder llamarte mi amor.',
  'Te elijo en los días fáciles y también en los difíciles. Te amo muchísimo, y quiero seguir llenando la vida de recuerdos contigo.'
];
const dedication=document.createElement('section');dedication.className='dedication';
dedication.innerHTML='<p class="eyebrow">CADA FLOR, UNA RAZÓN PARA AMARTE</p><h2></h2><span class="memory-counter"></span>';
$('#app').appendChild(dedication);
const photoStage=document.createElement('section');photoStage.className='photo-stage';
photoStage.innerHTML='<button class="memory-photo" aria-label="Ampliar nuestro recuerdo"><img alt=""></button><p class="photo-kicker"></p><p class="love-phrase" aria-live="polite"></p><div class="reading-progress" aria-hidden="true"><i></i></div>';
$('#app').appendChild(photoStage);
photoStage.querySelector('button').addEventListener('click',()=>showMemory(displayedMemory));
const finale=document.createElement('section');finale.className='finale';finale.setAttribute('aria-label','Una carta para ti');
finale.innerHTML='<span class="final-heart">♡</span><p class="eyebrow">Y SI VOLVIERA A EMPEZAR…</p><h2>Volvería a elegirte.<br><em>Una y mil veces.</em></h2><p>Te amo muchísimo, mi amor. Más de lo que cabe en estas flores, más de lo que puedo escribir aquí.</p><p>Gracias por amarme tan bonito, por tu risa y por hacer de los días sencillos mis recuerdos favoritos. Quiero seguir cuidándote, abrazándote y construyendo una vida llena de nosotros.</p><strong>Mi deseo más bonito es seguir a tu lado. Te amo. Siempre tú. ♡</strong>';
$('#app').appendChild(finale);
const wishButton=document.createElement('button');wishButton.id='wish';wishButton.innerHTML='<span>☆</span> Pide un deseo';$('.controls').prepend(wishButton);
const wishMessage=document.createElement('div');wishMessage.className='wish-message';wishMessage.setAttribute('role','status');wishMessage.innerHTML='<span>✧</span><h2>Cierra los ojos.<br>Pide un deseo.</h2><p>El mío ya se cumplió cuando llegaste tú. ♡</p>';
$('#app').appendChild(wishMessage);
let wishUntil=0;
wishButton.addEventListener('click',()=>{wishUntil=elapsed+5;wishMessage.classList.add('visible');burst(flower.getWorldPosition(new THREE.Vector3()),true,85);});
const memoryNav=document.createElement('nav'); memoryNav.className='memory-nav';memoryNav.setAttribute('aria-label','Ver las seis fotografías');
$('#app').appendChild(memoryNav);
const photoDialog=document.createElement('dialog');photoDialog.className='photo-dialog';
photoDialog.innerHTML='<button class="photo-close" aria-label="Cerrar fotografía">×</button><img alt=""><p class="photo-caption"></p><div class="photo-navigation"><button class="photo-prev" aria-label="Fotografía anterior">←</button><span></span><button class="photo-next" aria-label="Fotografía siguiente">→</button></div>';
document.body.appendChild(photoDialog);photoDialog.setAttribute('aria-label','Nuestros recuerdos y sus dedicatorias');
let selectedMemory=0,displayedMemory=-1;
function showMemory(index){
  selectedMemory=(index+6)%6;
  const image=photoDialog.querySelector('img');image.src=memories[selectedMemory].url;image.alt=`Nuestro recuerdo ${selectedMemory+1}`;
  photoDialog.querySelector('.photo-caption').textContent=lovePhrases[selectedMemory];
  photoDialog.querySelector('.photo-navigation span').textContent=`${selectedMemory+1} / 6`;
  if(!photoDialog.open) photoDialog.showModal();
  controls.enabled=false;
}
photoDialog.querySelector('.photo-close').addEventListener('click',()=>photoDialog.close());
photoDialog.querySelector('.photo-prev').addEventListener('click',()=>showMemory(selectedMemory-1));
photoDialog.querySelector('.photo-next').addEventListener('click',()=>showMemory(selectedMemory+1));
photoDialog.addEventListener('close',()=>{controls.enabled=true;});
photoDialog.addEventListener('click',event=>{if(event.target===photoDialog){const r=photoDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)photoDialog.close();}});
photoDialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight')showMemory(selectedMemory+1);if(event.key==='ArrowLeft')showMemory(selectedMemory-1);});
memoryPositions.forEach(([x,height,z],index)=>{
  const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
  const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,height,8),green);stalk.position.y=height/2;root.add(stalk);
  const head=new THREE.Group();root.add(head);
  const url=`${import.meta.env.BASE_URL}photos/recuerdo-${index+1}.jpeg`;
  const preload=new Image();preload.src=url;preload.onerror=()=>toast('No se pudo cargar una fotografía.');
  const hinges=[];
  for(let layer=0;layer<4;layer++)for(let j=0;j<11-layer;j++){
    const pivot=new THREE.Group();pivot.rotation.z=j/(11-layer)*Math.PI*2+layer*.39;head.add(pivot);
    const hinge=new THREE.Group();pivot.add(hinge);
    const color=['#9cd6b5','#bbdec2','#e1e8ce','#f4e6d6'][layer];
    const rim=new THREE.Mesh(memoryPetalGeometry,new THREE.MeshPhysicalMaterial({color,side:THREE.DoubleSide,roughness:.5,sheen:.8,sheenColor:new THREE.Color('#d3f2da'),metalness:.01,clearcoat:.15}));
    const scale=.67-layer*.115;rim.scale.set(scale,scale,scale);hinge.position.z=layer*.09;hinge.userData={layer,index:j};hinge.add(rim);hinges.push(hinge);
  }
  const center=new THREE.Group();head.add(center);center.position.z=.42;
  const heart=new THREE.Mesh(new THREE.SphereGeometry(.24,20,14),goldMaterial);center.add(heart);
  for(let j=0;j<2;j++){const leaf=new THREE.Mesh(leaves[0].children[0].geometry,green);leaf.position.y=height*(.28+j*.22);leaf.rotation.set(.3,0,j?-.85:.85);leaf.scale.setScalar(.36);root.add(leaf);}
  const button=document.createElement('button');button.textContent='0'+(index+1);button.setAttribute('aria-label',`Abrir fotografía ${index+1}`);button.addEventListener('click',()=>{bloomTime=10+index*13;memories[index].celebrated=false;});memoryNav.appendChild(button);
  head.traverse(object=>{if(object.isMesh)object.userData.memoryIndex=index;});
  memories.push({root,stalk,head,hinges,center,height,url,delay:10+index*13,celebrated:false});
});
const bursts=[];let magic=false;
function burst(position,hearts=true,count=40){
  for(let i=0;i<count && bursts.length<230;i++){
    const isHeart=hearts&&i%4===0;
    const material=new THREE.MeshStandardMaterial({color:isHeart?'#ff9ecb':'#ffe0a5',emissive:isHeart?'#e64a95':'#ffc36c',emissiveIntensity:1.6,transparent:true,roughness:.3,depthWrite:false});
    const mesh=new THREE.Mesh(isHeart?heartGeometry:sparkGeometry,material);mesh.position.copy(position);mesh.scale.setScalar(isHeart?.11+Math.random()*.12:.5+Math.random());mesh.rotation.set(Math.random(),Math.random(),Math.random());scene.add(mesh);
    bursts.push({mesh,velocity:new THREE.Vector3((Math.random()-.5)*2.3,.5+Math.random()*2,(Math.random()-.5)*2.3),age:0,life:2+Math.random()*1.5});
  }
}
let elapsed=0,bloomTime=0,phase=-1,toastTimer;
const clamp=THREE.MathUtils.clamp;
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
$('#bloom').addEventListener('click',()=>{bloomTime=0;phase=-1;memories.forEach(m=>m.celebrated=false);if(photoDialog.open)photoDialog.close();for(const b of bursts){scene.remove(b.mesh);b.mesh.material.dispose();}bursts.length=0;toast('Cada comienzo tiene su propia magia.');});
$('#sparkles').addEventListener('click',()=>{magic=!magic;$('#sparkles').setAttribute('aria-pressed',String(magic));burst(flower.getWorldPosition(new THREE.Vector3()),true,magic?100:25);toast(magic?'Un poquito más de magia, para ti.':'El jardín vuelve a la calma.');});
let audio=null,musicOn=false,musicTimer=null,noteIndex=0;
function playNote(){const now=audio.currentTime;const melody=[261.63,329.63,392,493.88,523.25,392,329.63,293.66];for(const [frequency,volume] of [[melody[noteIndex++%8],.045],[130.81,.018],[196,.01]]){const oscillator=audio.createOscillator(),gain=audio.createGain(),pan=audio.createStereoPanner();oscillator.type='sine';oscillator.frequency.value=frequency;pan.pan.value=Math.sin(noteIndex)*.45;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.4);gain.gain.exponentialRampToValueAtTime(.0001,now+3.5);oscillator.connect(gain).connect(pan).connect(audio.destination);oscillator.start(now);oscillator.stop(now+3.6);}}
$('#music').addEventListener('click',async()=>{try{if(musicOn){clearInterval(musicTimer);await audio.suspend();musicOn=false;}else{audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();musicOn=true;playNote();musicTimer=setInterval(playNote,1400);}$('#music').setAttribute('aria-pressed',String(musicOn));$('#music-label').textContent=musicOn?'Silenciar':'Música';}catch{toast('El audio no está disponible en este navegador.');}});
const pointers=new Set();let down=null,gesture=false;
renderer.domElement.addEventListener('pointerdown',event=>{pointers.add(event.pointerId);if(pointers.size>1)gesture=true;else{down={x:event.clientX,y:event.clientY};gesture=false;}});
renderer.domElement.addEventListener('pointermove',event=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>7)gesture=true;});
renderer.domElement.addEventListener('pointerup',event=>{pointers.delete(event.pointerId);if(down&&!gesture){const rect=renderer.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);const targets=[plant,...memories.filter(m=>m.root.visible&&bloomTime>m.delay+2.8).map(m=>m.root)];const hits=ray.intersectObjects(targets,true);if(hits.length){burst(hits[0].point,true,65);const memoryIndex=hits[0].object.userData.memoryIndex;if(memoryIndex!==undefined)showMemory(memoryIndex);else toast('Que florezca todo lo bonito que deseas.');}}if(!pointers.size)down=null;});
renderer.domElement.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);down=null;gesture=true;});
const phaseLabels=['Todo lo bonito me recuerda a ti','Llegaste y mis días florecieron','Contigo, hasta la espera es bonita','Hay un te amo en cada pétalo','Estas flores son para ti','Te volvería a elegir, siempre'];
let previous=performance.now(),lastMagic=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.05);previous=now;if(document.hidden)return;elapsed+=dt;if(!photoDialog.open&&elapsed>=wishUntil)bloomTime+=dt;const t=bloomTime;
  const gardenProgress=ease((t-9)/3);
  comets.forEach(({points,trail,head,offset})=>{
    const wishing=elapsed<wishUntil,period=wishing?2.8:7;
    const phase=(elapsed+offset)%period,fall=phase/2.6;
    points.visible=phase<2.6&&(!reducedMotion||wishing);
    const halfHeight=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*8;
    const halfWidth=halfHeight*camera.aspect;
    const p=points.geometry.attributes.position;
    for(let j=0;j<p.count;j++){const u=fall-j*.007;p.setXYZ(j,halfWidth*(.75-u*1.45)+(offset%2-.5)*.25,halfHeight*(1.2-u*2.3),-8);}
    p.needsUpdate=true;points.material.opacity=Math.min(1,phase*4)*Math.min(1,(2.6-phase)*3);
    trail.visible=head.visible=points.visible;trail.material.opacity=points.material.opacity*.8;head.material.opacity=points.material.opacity;head.position.fromBufferAttribute(p,0);
  });
  $('#app').classList.toggle('memories-blooming',t>10);
  const activeIndex=Math.min(5,Math.floor(Math.max(0,t-10)/13));
  const localTime=t-10-activeIndex*13;
  const reveal=ease((localTime-1.7)/1.2)*(activeIndex<5?1-ease((localTime-12)/1):1);
  photoStage.style.opacity=String(reveal);photoStage.inert=reveal<.3;photoStage.querySelector('.reading-progress i').style.width=(Math.min(1,Math.max(0,(localTime-2.9)/9))*100)+'%';
  $('#app').classList.toggle('story-finished',t>=88);
  if(wishMessage.classList.contains('visible')&&elapsed>wishUntil)wishMessage.classList.remove('visible');
  camera.setViewOffset(innerWidth,innerHeight,-innerWidth*(innerWidth<761?.035:.135)*(1-gardenProgress),innerWidth<761?-innerHeight*.07:0,innerWidth,innerHeight);
  memories.forEach((m,index)=>{
    const active=Math.min(5,Math.floor(Math.max(0,t-10)/13))===index;
    const growth=ease((t-m.delay)/1.8),opening=ease((t-m.delay-1.3)/2);
    m.root.visible=active&&growth>.001;m.stalk.scale.y=Math.max(.001,growth);m.stalk.position.y=m.height*growth/2;
    m.root.position.x=innerWidth<761?1.7:-3.2;m.height=innerWidth<761?1.7:1.25;
    m.head.position.y=m.height*growth;m.head.scale.setScalar(Math.max(.001,ease((t-m.delay-.7)/1.5))*(innerWidth<761?.8:.65));
    m.head.quaternion.copy(camera.quaternion);if(!reducedMotion)m.head.rotateZ(Math.sin(elapsed*.65+index)*.035);
    m.hinges.forEach(h=>{const {layer,index}=h.userData;h.rotation.x=(1-ease((t-m.delay-1.2-layer*.12-index*.035)/1.8))*1.35+layer*.18;});
    m.center.scale.setScalar(Math.max(.001,opening));
    if(active&&opening>.98&&!m.celebrated){m.celebrated=true;burst(m.head.getWorldPosition(new THREE.Vector3()),false,18);}
  });
  const activeMemory=Math.min(5,Math.floor(Math.max(0,t-10)/13));
  if(displayedMemory!==activeMemory){
    displayedMemory=activeMemory;
    photoStage.querySelector('.love-phrase').textContent=lovePhrases[activeMemory];
    photoStage.querySelector('.photo-kicker').textContent=memoryCaptions[activeMemory];
    dedication.querySelector('h2').textContent=memoryTitles[activeMemory];
    dedication.querySelector('.memory-counter').textContent='FOTO '+(activeMemory+1)+' DE 6 · UNA NUEVA RAZÓN PARA AMARTE';
    const image=photoStage.querySelector('img');image.src=memories[activeMemory].url;image.alt='Nuestro recuerdo '+(activeMemory+1);
    memoryNav.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===activeMemory)));
  }
  plant.position.x=innerWidth<761?-1.5*gardenProgress:-3.4*gardenProgress;
  plant.scale.setScalar(1-.15*gardenProgress);flower.rotation.x=.72*gardenProgress;
  const growth=ease((t-.7)/5);stem.scale.y=Math.max(.001,growth);flower.position.y=4.75*growth;flower.scale.setScalar(.035+.965*ease((t-4)/3));
  leaves.forEach((leaf,i)=>{const p=ease((t-2-i*.65)/2.1);leaf.scale.setScalar(Math.max(.001,p*leaf.userData.scale));leaf.rotation.x=.2+p*1.05;leaf.position.y=(1.1+i*.73)*growth;});
  petals.forEach(p=>{const progress=ease((t-6.2-p.order*.075)/2.5);p.hinge.rotation.x=.12+progress*p.open+(reducedMotion?0:Math.sin(elapsed*.9+p.index)*.015*progress);});
  core.scale.set(.95,.48,.95);const center=ease((t-9)/4);core.visible=center>.01;filaments.scale.setScalar(Math.max(.001,center));coreLight.intensity=.05+center*.35;
  if(!reducedMotion){plant.rotation.z=Math.sin(elapsed*.65)*.018*growth;plant.rotation.x=Math.sin(elapsed*.43)*.012*growth;stars.rotation.y=elapsed*.0015;}
  const positions=flies.geometry.attributes.position.array;for(let i=0;i<positions.length/3;i++){positions[i*3]=flyBase[i*3]+Math.sin(elapsed*.23+i)*.4;positions[i*3+1]=flyBase[i*3+1]+Math.sin(elapsed*.5+i*1.4)*.45;positions[i*3+2]=flyBase[i*3+2]+Math.cos(elapsed*.3+i)*.35;}flies.geometry.attributes.position.needsUpdate=true;flies.material.size=magic?.22:.13;flies.material.opacity=.65+Math.sin(elapsed)*.15;
  bloom.strength=THREE.MathUtils.damp(bloom.strength,magic?1:.55,3,dt);
  if(magic&&t>6&&elapsed-lastMagic>.65){lastMagic=elapsed;burst(flower.getWorldPosition(new THREE.Vector3()),false,5);}
  for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.age+=dt;b.mesh.position.addScaledVector(b.velocity,dt);b.velocity.y-=dt*.25;b.mesh.rotation.y+=dt*.7;b.mesh.material.opacity=Math.max(0,1-b.age/b.life);if(b.age>=b.life){scene.remove(b.mesh);b.mesh.material.dispose();bursts.splice(i,1);}}
  const next=t<1?0:t<3?1:t<6?2:t<7?3:t<10?4:t<58?6:5;if(next!==phase){phase=next;$('#phase').textContent=phase===6?'Nuestros recuerdos también florecen':phase===5?'Seis recuerdos. Un jardín para nosotros.':phaseLabels[phase];}
  controls.update();composer.render();
  if(!window.__garden)window.__garden={scene,renderer,camera,petals,memories,comets,stars,get bloomTime(){return bloomTime;},get bursts(){return bursts.length;}};
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);frameCamera();});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();$('#error').hidden=false;});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());




