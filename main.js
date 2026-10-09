
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const area = document.getElementById("solar-system");
const loading = document.getElementById("loading");
const error = document.getElementById("scene-error");
const list = document.getElementById("planet-list");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 35, 55);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
area.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 0.5;
controls.maxDistance = 150;
controls.target.set(0, 0, 0);

const loader = new THREE.TextureLoader();
const folder = "./Planet%20texture/";

function texture(file, color = true) {
    const map = loader.load(folder + file);
    if (color) map.colorSpace = THREE.SRGBColorSpace;
    return map;
}

scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const sunlight = new THREE.PointLight(0xffffff, 1800, 0, 2);
scene.add(sunlight);

const background = texture("2k_stars_milky_way.jpg");
background.mapping = THREE.EquirectangularReflectionMapping;
scene.background = background;

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 48, 48),
    new THREE.MeshBasicMaterial({ map: texture("8k_sun.jpg") })
);
scene.add(sun);

const data = [
    ["Mercury","2k_mercury.jpg",.38,6,.42,"4,879 km","57.9 million km","58.6 days","88 days","3.7 m/s²","The smallest planet, covered in craters."],
    ["Venus","2k_venus_surface.jpg",.68,8.5,.29,"12,104 km","108.2 million km","243 days","225 days","8.87 m/s²","A rocky world with a thick, extremely hot atmosphere."],
    ["Earth","2k_earth_daymap.jpg",.72,11,.2,"12,742 km","149.6 million km","23 h 56 min","365 days","9.81 m/s²","Our home, with liquid water and life."],
    ["Mars","2k_mars.jpg",.52,14,.15,"6,779 km","227.9 million km","24 h 37 min","687 days","3.71 m/s²","A cold, rocky world known for its red surface."],
    ["Jupiter","2k_jupiter.jpg",1.65,20,.083,"139,820 km","778.6 million km","9 h 56 min","11.86 years","24.79 m/s²","The largest planet, with enormous storms."],
    ["Saturn","2k_saturn.jpg",1.38,27,.061,"116,460 km","1.43 billion km","10.7 hours","29.4 years","10.44 m/s²","A gas giant surrounded by broad rings of ice and rock."],
    ["Uranus","2k_uranus.jpg",1.02,34,.043,"50,724 km","2.87 billion km","17 h 14 min","84 years","8.69 m/s²","An ice giant that rotates on its side."],
    ["Neptune","2k_neptune.jpg",.99,41,.033,"49,244 km","4.5 billion km","16 h 6 min","165 years","11.15 m/s²","A distant blue world with powerful winds."]
];

const worlds = [];
const keys = {};
let selected = null;
let paused = false;
let speed = 1;
let flying = false;
let flyPosition = new THREE.Vector3();
let flyTarget = new THREE.Vector3();
let lastTime = 0;

function makeOrbit(radius) {
    const points = [];

    for (let i = 0; i <= 180; i++) {
        const a = i / 180 * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(a) * radius, 0, Math.sin(a) * radius
        ));
    }

    const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
            color: 0x8798b8,
            transparent: true,
            opacity: 0.55
        })
    );

    scene.add(line);
}

function showDetails(world) {
    const d = world.data;

    document.getElementById("body-type").textContent = "PLANET DETAILS";
    document.getElementById("planet-name").textContent = d[0];
    document.getElementById("planet-description").textContent = d[10];
    document.getElementById("diameter").textContent = d[5];
    document.getElementById("distance").textContent = d[6];
    document.getElementById("day-length").textContent = d[7];
    document.getElementById("year-length").textContent = d[8];
    document.getElementById("gravity").textContent = d[9];
    document.getElementById("nasa-link").href =
        "https://science.nasa.gov/solar-system/" + d[0].toLowerCase() + "/";
}

function selectPlanet(world) {
    selected = world;
    flying = true;

    showDetails(world);

    document.querySelectorAll(".planet-option").forEach(button => {
        button.classList.toggle("active", button.textContent === world.data[0]);
    });

    const p = world.group.position;
    flyTarget.copy(p);

    const distance = Math.max(world.data[2] * 5, 3.5);
    const offset = new THREE.Vector3(distance, distance * 0.35, distance);

    flyPosition.copy(p).add(offset);
}

function resetView() {
    selected = null;
    flying = true;
    flyTarget.set(0, 0, 0);
    flyPosition.set(0, 35, 55);

    document.querySelectorAll(".planet-option").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById("body-type").textContent = "PLANET DETAILS";
    document.getElementById("planet-name").textContent = "The Solar System";
    document.getElementById("planet-description").textContent = "Choose a planet to get started.";

    ["diameter", "distance", "day-length", "year-length", "gravity"].forEach(id => {
        document.getElementById(id).textContent = "—";
    });

    document.getElementById("nasa-link").href = "https://science.nasa.gov/solar-system/";
}

function addPlanets() {
    data.forEach((d, index) => {
        makeOrbit(d[3]);

        const group = new THREE.Group();
        scene.add(group);

        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(d[2], 48, 48),
            new THREE.MeshStandardMaterial({
                map: texture(d[1]),
                roughness: 1
            })
        );

        ball.userData.spin = 0.002;
        group.add(ball);

        if (d[0] === "Earth") {
            const clouds = new THREE.Mesh(
                new THREE.SphereGeometry(d[2] * 1.015, 48, 48),
                new THREE.MeshStandardMaterial({
                    map: texture("2k_earth_clouds.jpg"),
                    transparent: true,
                    opacity: 0.35,
                    depthWrite: false
                })
            );
            group.add(clouds);
        }

        if (d[0] === "Saturn") {
            const ringMap = texture("2k_saturn_ring_alpha.png", false);

            const rings = new THREE.Mesh(
                new THREE.RingGeometry(d[2] * 1.25, d[2] * 2.5, 128),
                new THREE.MeshStandardMaterial({
                    color: 0xe0cba5,
                    map: ringMap,
                    alphaMap: ringMap,
                    transparent: true,
                    opacity: 0.95,
                    side: THREE.DoubleSide,
                    depthWrite: false
                })
            );

            rings.rotation.x = -Math.PI / 2.3;
            rings.rotation.z = 0.08;
            rings.renderOrder = 2;
            group.add(rings);
        }

        const world = {
            data: d,
            group,
            ball,
            angle: index * 0.8
        };

        worlds.push(world);

        const button = document.createElement("button");
        button.className = "planet-option";
        button.textContent = d[0];
        button.addEventListener("click", () => selectPlanet(world));
        list.appendChild(button);
    });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("click", event => {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -(event.clientY - rect.top) / rect.height * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(worlds.map(w => w.ball));

    if (hits.length) {
        const world = worlds.find(w => w.ball === hits[0].object);
        if (world) selectPlanet(world);
    }
});

document.getElementById("pause-button").addEventListener("click", event => {
    paused = !paused;
    event.currentTarget.textContent = paused ? "Resume" : "Pause";
    document.getElementById("simulation-state").textContent =
        paused ? "Simulation paused" : "Simulation running";
});

document.getElementById("reset-button").addEventListener("click", resetView);

document.getElementById("speed-control").addEventListener("change", event => {
    speed = Number(event.target.value) || 1;
});

function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
    camera.position.copy(controls.target).add(offset);
}

window.addEventListener("keydown", event => {
    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
    ) return;

    keys[event.key.toLowerCase()] = true;

    if (event.key === "+" || event.key === "=" || event.code === "NumpadAdd") zoom(0.8);
    if (event.key === "-" || event.key === "_" || event.code === "NumpadSubtract") zoom(1.25);
    if (event.key === "Escape") resetView();
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
    Object.keys(keys).forEach(key => keys[key] = false);
});

function moveCamera(delta) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const amount = 12 * delta;

    const movement = new THREE.Vector3();

    if (keys.w) movement.add(forward);
    if (keys.s) movement.sub(forward);
    if (keys.d) movement.add(right);
    if (keys.a) movement.sub(right);

    if (movement.lengthSq()) {
        movement.normalize().multiplyScalar(amount);
        camera.position.add(movement);
        controls.target.add(movement);
        selected = null;
        flying = false;

        document.querySelectorAll(".planet-option").forEach(button => {
            button.classList.remove("active");
        });
    }
}

function resize() {
    const width = area.clientWidth;
    const height = area.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener("resize", resize);

function animate(time = 0) {
    requestAnimationFrame(animate);

    const delta = Math.min((time - lastTime) / 1000 || 0, 0.05);
    lastTime = time;

    if (!paused) {
        worlds.forEach(world => {
            world.angle += world.data[4] * delta * speed;

            world.group.position.set(
                Math.cos(world.angle) * world.data[3],
                0,
                Math.sin(world.angle) * world.data[3]
            );

            world.ball.rotation.y += world.ball.userData.spin * speed;

            if (world.data[0] === "Earth" && world.group.children[1]) {
                world.group.children[1].rotation.y += 0.0005 * speed;
            }
        });

        sun.rotation.y += 0.0004 * speed;
    }

    if (flying) {
        if (selected) {
            flyTarget.copy(selected.group.position);

            const offset = new THREE.Vector3(
                Math.max(selected.data[2] * 5, 3.5),
                Math.max(selected.data[2] * 1.75, 1.5),
                Math.max(selected.data[2] * 5, 3.5)
            );

            flyPosition.copy(flyTarget).add(offset);
        }

        camera.position.lerp(flyPosition, 1 - Math.exp(-3.5 * delta));
        controls.target.lerp(flyTarget, 1 - Math.exp(-3.5 * delta));

        if (
            camera.position.distanceTo(flyPosition) < 0.05 &&
            controls.target.distanceTo(flyTarget) < 0.05
        ) {
            flying = false;
        }
    }

    if (!flying) moveCamera(delta);

    controls.update();
    renderer.render(scene, camera);
}

try {
    addPlanets();
    resize();
    loading.hidden = true;
    animate();
} catch (err) {
    console.error(err);
    loading.hidden = true;
    error.hidden = false;
}