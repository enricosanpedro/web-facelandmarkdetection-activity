import {
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";


// ==============================
// HTML ELEMENTS
// ==============================

const video = document.getElementById("camera");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");
const drawingUtils = new DrawingUtils(ctx);

const status = document.getElementById("status");
const startButton = document.getElementById("startButton");


// ==============================
// GLOBAL VARIABLES
// ==============================

let faceLandmarker = null;
let running = false;


// ==============================
// CREATE MEDIAPIPE
// ==============================

async function createFaceLandmarker() {

    status.textContent = "Loading MediaPipe...";

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
            },

            runningMode: "VIDEO",

            numFaces: 1,

            outputFaceBlendshapes: true
        }
    );

    status.textContent = "MediaPipe ready";

    console.log("Face Landmarker created successfully.");
}


// ==============================
// START CAMERA
// ==============================

async function startCamera() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

        video.srcObject = stream;

        await video.play();

        // Hide the original video element.
        // We use the canvas as the visible camera display.
        video.style.display = "none";

        status.textContent = "Camera started";

        running = true;

        detectFace();

    } catch (error) {

        console.error(error);

        status.textContent =
            "Could not access camera.";

    }
}


// ==============================
// FACE DETECTION LOOP
// ==============================

let lastVideoTime = -1;

async function detectFace() {

    if (!running) {
        return;
    }

    if (video.currentTime !== lastVideoTime) {

        lastVideoTime = video.currentTime;

        const results =
            faceLandmarker.detectForVideo(
                video,
                performance.now()
            );

        // Match canvas to the actual camera resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear canvas
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // ==========================================
        // DRAW CAMERA IMAGE
        // ==========================================

        ctx.save();

        // Mirror camera horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.restore();


        // ==========================================
        // DRAW FACE MESH
        // ==========================================

        if (results.faceLandmarks.length > 0) {

            const landmarks =
                results.faceLandmarks[0];

            ctx.save();

            // Mirror MediaPipe coordinates
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);

            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                {
                    color: "#00FF00",
                    lineWidth: 1
                }
            );

            ctx.restore();

            status.textContent = "Face detected";

        }
        else {

            status.textContent = "No face detected";

        }
    }

    requestAnimationFrame(detectFace);
}


// ==============================
// BUTTON
// ==============================

startButton.addEventListener(
    "click",
    startCamera
);


// ==============================
// INITIALIZE
// ==============================

createFaceLandmarker();