import {createEntangledMaterial} from './entangled-materials.js';
import GPUComputationRenderer from './GPUComputationRenderer.js';
import {createPosTargetShader, createAccShader, createVelShader, createPosShader} from './entangled-text-shaders.js';
import WindowManager from './WindowManager.js';

const NUM_POINTS = 1e6; // 1 million particles like Bjørn's original
const NUM_X = Math.ceil(Math.sqrt(NUM_POINTS));
const NUM_Y = NUM_X;

let t = THREE;
let w = window.innerWidth;
let h = window.innerHeight;
let camera, scene, renderer, world;
let points;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let time = new Date().getTime();
let frame = 0;
let internalTime = 0;

let gpu;
let posTargetTex, posTargetVar;
let accTex, accVar;
let velTex, velVar;
let posTex, posVar;

let windowManager;
let initialized = false;

let isPaired = false;
let syncIntensity = 0;

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState != 'hidden' && !initialized) {
        init();
    }
});

window.onload = () => {
    if (document.visibilityState != 'hidden') {
        init();
    }
};

function init() {
    console.log("Initializing Entangled Text...");
    initialized = true;

    setTimeout(() => {
        setupScene();
        setupWindowManager();
        createPoints();
        setupGpuComputation();
        setupInteraction();
        render();
        window.addEventListener("resize", resize);
    }, 500);
}

function setupScene() {
    camera = new t.PerspectiveCamera(50, w/h, 0.1, 2000);
    camera.position.z = 500;

    scene = new t.Scene();
    scene.background = new t.Color(0x0a0a0f);
    scene.add(camera);

    renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true, alpha: false});
    renderer.setPixelRatio(pixR);
    renderer.setSize(w, h);

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
}

function setupWindowManager() {
    windowManager = new WindowManager();

    let metaData = {
        type: 'entangled-text',
        seed: 195056,
        shape: 'text'
    };

    windowManager.init(metaData);
    windowManager.setWinChangeCallback(() => {
        let wins = windowManager.getWindows();
        isPaired = wins.length > 1;
        console.log('Windows:', wins.length, 'Paired:', isPaired);
    });
}

function createPoints() {
    let geometry = new THREE.BufferGeometry();
    let verts = [];
    let s = 200;

    for (let i = 0; i < NUM_POINTS; i++) {
        verts.push(s *-.5 + Math.random() * s, s *-.5 + Math.random() * s, s *-.5 + Math.random() * s);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));

    let material = createEntangledMaterial(NUM_X, NUM_Y);
    points = new THREE.Points(geometry, material);

    world.add(points);
}

function setupGpuComputation() {
    gpu = new GPUComputationRenderer(NUM_X, NUM_Y, renderer);

    posTargetTex = gpu.createTexture();
    posTargetVar = gpu.addVariable("posTarget", createPosTargetShader(), posTargetTex);

    accTex = gpu.createTexture();
    accVar = gpu.addVariable("acc", createAccShader(), accTex);

    velTex = gpu.createTexture();
    velVar = gpu.addVariable("vel", createVelShader(), velTex);

    posTex = gpu.createTexture();
    posVar = gpu.addVariable("pos", createPosShader(), posTex);

    gpu.setVariableDependencies(accVar, [posTargetVar, posVar, accVar]);
    gpu.setVariableDependencies(velVar, [accVar, velVar]);
    gpu.setVariableDependencies(posVar, [accVar, velVar, posVar, posTargetVar]);

    var error = gpu.init();
    if (error !== null) {
        console.error('GPU error:', error);
    }

    console.log('GPU computation initialized - Text MAWHI');
}

function setupInteraction() {
    document.getElementById('resetView').addEventListener('click', () => {
        world.rotation.set(0, 0, 0);
        camera.position.z = 500;
    });

    document.getElementById('openPair').addEventListener('click', () => {
        const width = 800;
        const height = 800;
        const left = window.screenX + window.outerWidth + 20;
        const top = window.screenY;

        window.open(
            'entangled-text.html',
            '_blank',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    });
}

function render() {
    let t = new Date().getTime();
    let delta = t - time;
    internalTime += delta;
    time = t;

    if (windowManager) {
        windowManager.update();
    }

    if (isPaired) {
        if (Math.random() < 0.1) {
            syncIntensity += Math.random() * 0.15;
        }
        syncIntensity *= 0.95;
    } else {
        syncIntensity *= 0.9;
    }

    let u = posTargetVar.material.uniforms;
    u.time = {value: internalTime};

    u = accVar.material.uniforms;
    u.time = {value: internalTime};
    u.syncIntensity = {value: syncIntensity};

    u = velVar.material.uniforms;
    u.time = {value: internalTime};

    u = posVar.material.uniforms;
    u.time = {value: internalTime};
    u.frame = {value: frame};

    gpu.compute();

    let pu = points.material.uniforms;
    pu.time.value = internalTime;
    pu.isPaired.value = isPaired;
    pu.syncIntensity.value = syncIntensity;
    pu.posTarget = { value: gpu.getCurrentRenderTarget(posTargetVar).texture };
    pu.acc = { value: gpu.getCurrentRenderTarget(accVar).texture };
    pu.vel = { value: gpu.getCurrentRenderTarget(velVar).texture };
    pu.pos = { value: gpu.getCurrentRenderTarget(posVar).texture };

    world.rotation.y += .005;
    world.rotation.x += .003;

    renderer.render(scene, camera);
    requestAnimationFrame(render);

    frame++;
}

function resize() {
    w = window.innerWidth;
    h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, true);
}
