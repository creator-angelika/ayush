import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js";

document.addEventListener("DOMContentLoaded", () => {
    // Set up Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);  // Black background

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 500);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);  // Transparent background
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';  // Ensure it's above any other content
    document.getElementById("container3d").appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    // EffectComposer for post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,  // Bloom strength
        0.4,  // Bloom radius
        0.85  // Bloom threshold
    );
    composer.addPass(bloomPass);

    let model;  // Declare model variable

    // Load the HDR environment map
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setPath('https://raw.githubusercontent.com/miroleon/gradient_hdr_freebie/main/Gradient_HDR_Freebies/')
        .load('ml_gradient_freebie_01.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            // Load the GLB model
            const loader = new GLTFLoader();
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
            loader.setDRACOLoader(dracoLoader);

            loader.load(
                'models/glass/scene.glb',
                function (gltf) {
                    console.log(gltf.scene);  // Log the loaded model
                    model = gltf.scene;  // Assign to model variable

                    model.traverse((node) => {
                        if (node.isMesh) {
                            node.material.envMap = texture;
                            node.material.envMapIntensity = 1;  // Adjust to reduce sunset effect
                            node.material.metalness = 1;  // Adjust as needed
                            node.material.roughness = -0.5;  // Adjust as needed
                            node.material.reflectivity = 0.5;  // Adjust as needed
                            node.material.needsUpdate = true;
                        }
                    });

                    model.scale.set(100, 100, 100);
                    model.position.y = -200;
                    model.position.z = -250;

                    scene.add(model);

                    console.log("Model loaded successfully");
                },
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                function (error) {
                    console.error('An error happened while loading the model', error);
                }
            );
        },
        function (error) {
            console.error('An error happened while loading the HDR environment', error);
        });

    // Lights
    const topLight = new THREE.DirectionalLight(0xffffff, 10);
    topLight.position.set(10, 10, 10);
    topLight.castShadow = true;
    scene.add(topLight);

    const ambientLight = new THREE.AmbientLight(0x333333, 1);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x0000ff, 10, 2000);
    blueLight.position.set(-1000, 600, 800);
    scene.add(blueLight);

    const redLight = new THREE.PointLight(0xff0000, 10, 2000);
    redLight.position.set(1000, -600, 800);
    scene.add(redLight);

    // Camera Position Sliders Control
    const cameraXSlider = document.getElementById("cameraXSlider");
    const cameraYSlider = document.getElementById("cameraYSlider");
    const cameraZSlider = document.getElementById("cameraZSlider");

    const cameraXValue = document.getElementById("cameraXValue");
    const cameraYValue = document.getElementById("cameraYValue");
    const cameraZValue = document.getElementById("cameraZValue");

    function updateCameraPosition() {
        const posX = parseFloat(cameraXSlider.value);
        const posY = parseFloat(cameraYSlider.value);
        const posZ = cameraZSlider.value;

        camera.position.set(posX, posY, posZ);
        camera.lookAt(scene.position);

        cameraXValue.textContent = cameraXSlider.value;
        cameraYValue.textContent = cameraYSlider.value;
        cameraZValue.textContent = cameraZSlider.value;
    }

    cameraXSlider.addEventListener("input", updateCameraPosition);
    cameraYSlider.addEventListener("input", updateCameraPosition);
    cameraZSlider.addEventListener("input", updateCameraPosition);

    let rotationSpeed = 0.01;  // Rotation speed for the model

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // Auto-rotate model
        // if (model) {
        //     model.rotation.y += rotationSpeed;
        // }

        composer.render();
    }

    animate();
});
