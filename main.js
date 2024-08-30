import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";

document.addEventListener("DOMContentLoaded", () => {
    // Set up Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 0, 500);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;  // Enable WebXR support
    document.getElementById("container3d").appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    // Load HDR environment map for reflections and lighting
    new RGBELoader()
    .setPath('environment/')
    .load('env6.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture;  // Set HDR as background
        
        renderer.toneMappingExposure = 2;  // Adjust exposure
        loadModel();
    });

    function loadModel() {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            'models/glass/scene.glb',
            function (gltf) {
                const model = gltf.scene;

                model.traverse((node) => {
                    if (node.isMesh) {
                        node.material.envMap = scene.environment;
                        node.material.needsUpdate = true;
                    }
                });

                model.scale.set(900, 900, 900);
                model.position.y = -250;
                model.position.z = -350;
                scene.add(model);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('An error happened while loading the model', error);
            }
        );
    }

    // Adjusted Lights
    const topLight = new THREE.DirectionalLight(0xffffff, 1);
    topLight.position.set(100, 100, 100);
    topLight.castShadow = true;
    scene.add(topLight);

    const ambientLight = new THREE.AmbientLight(0x333333, 1);
    scene.add(ambientLight);

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
        const posZ = parseFloat(cameraZSlider.value);

        camera.position.set(posX, posY, posZ);
        camera.lookAt(scene.position);

        cameraXValue.textContent = cameraXSlider.value;
        cameraYValue.textContent = cameraYSlider.value;
        cameraZValue.textContent = cameraZSlider.value;
    }

    cameraXSlider.addEventListener("input", updateCameraPosition);
    cameraYSlider.addEventListener("input", updateCameraPosition);
    cameraZSlider.addEventListener("input", updateCameraPosition);

    // WebXR setup and handle AR/VR Button
    if (navigator.xr) {
        // Check if immersive-vr is supported
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            const enterXRButton = document.getElementById('enterXR');
            if (supported) {
                // Enable button for immersive VR
                enterXRButton.addEventListener('click', () => {
                    navigator.xr.requestSession('immersive-vr').then((session) => {
                        renderer.xr.setSession(session);
                        session.addEventListener('end', onSessionEnd);
                    }).catch((err) => {
                        console.error("Failed to start XR session", err);
                    });
                });
            } else {
                // Disable the button if immersive VR is not supported
                enterXRButton.disabled = true;
                console.warn('Immersive VR not supported on this device');
            }
        }).catch((err) => {
            console.error("Error checking session support", err);
        });
    } else {
        console.warn('WebXR not available in this browser');
    }

    function onSessionEnd() {
        console.log("VR session ended");
    }

    function animate() {
        renderer.setAnimationLoop(() => {
            controls.update();
            renderer.render(scene, camera);
        });
    }

    animate();
});
