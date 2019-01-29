const FONT = "30px Arial";
const GREEN = "rgb(0,255,0)";
const HUD_X = 50;
const HUD_Y = 50;
const PRIVACY_Y = 20;

var readyCheck = setInterval(function() {
    var canvas = document.querySelector("#canvas");
    if (canvas) {
        clearInterval(readyCheck);
        
        var myCanvas = alterHiDPICanvas(canvas, document.body.clientWidth, document.body.clientHeight);
        var ctx = myCanvas.getContext("2d");
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fill();

        ctx.font = "24px Arial";
        ctx.fillStyle = GREEN;
        var howToLines = [
            "TAP to start,",
            "    then TAP to take a photo.",
            "",
            "Photo processing may take",
            "    up to 10 seconds!",
        ];
        var howToIdx = 1;
        howToLines.forEach(function(l) {
            ctx.fillText(l, HUD_X / 3, HUD_Y * howToIdx);
            howToIdx += 1;
        });
        
        ctx.font = "14px Arial"; 
        const PRIVACY_Y_OFFSET = HUD_Y * 7;
        var privacyLines = [
            "PRIVACY NOTICE: This educational project",
            "does not collect ANY data about you.",
            "Images created with this app do not leave",
            "your device, and are under your control.",
            "The code may be reviewed by visiting",
            "https://github.com/Terkwood/vision",
        ];
        var privacyIdx = 0;
        privacyLines.forEach(function(l) {
            ctx.fillText(l, HUD_X / 3, PRIVACY_Y_OFFSET + PRIVACY_Y * privacyIdx);
            privacyIdx += 1;
        });
    }
}, 50);

function snapshotBoundingBoxes(img) {
    cocoSsd.load().then(model => {
        model.detect(img).then(predictions => {
            var canvas = document.querySelector("#canvas");
            var ctx = canvas.getContext("2d");
            ctx.lineWidth = 3;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height);

            const COLORS = ["rgb(255,0,0)", "rgb(255,255,0)", "rgb(0,255,0)", "rgb(0,255,255)"];
            if (predictions.length == 0) {
                ctx.font = FONT;
                ctx.fillStyle = GREEN;
                ctx.fillText("I DON'T SEE ANYTHING", HUD_X, HUD_Y);
            }
            
            predictions.forEach(function(p, i) {
                ctx.beginPath();
                var color = COLORS[i % COLORS.length];

                ctx.strokeStyle = color;
                ctx.rect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
                ctx.stroke();

                ctx.font = FONT;
                ctx.fillStyle = color;

                var textPos = bbTextPosition(p.bbox[0], p.bbox[1], p.bbox[3]);
                ctx.fillText(p.class, textPos.x, textPos.y);
            });
        });
    });
}

function bbTextPosition(x, y, height) {
    const TEXT_OFFSET_X = 3;
    const TEXT_OFFSET_Y = -10;
    const TEXT_MIN_Y = 13;
    var shiftX = x + TEXT_OFFSET_X;
    var shiftY = y + TEXT_OFFSET_Y;
    if (shiftY < TEXT_MIN_Y) {
        return { x: shiftX, y: shiftY + height};
    } else {
        return { x: shiftX, y: shiftY };
    }
}

function swapToVideo() {
    var constraints = { audio: false, video: { facingMode: { ideal: "environment"} } }; 

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream){
            var video = document.querySelector('#video');
            video.srcObject = stream;
            video.onloadedmetadata = function(e) {
                video.play();
            };
        }).catch(function(err){
            console.log(err.name + ": " + err.message);
        });
}

function takePicture(callback){
    var canvas = document.querySelector("#canvas"),
        video = document.getElementById("video"),
        width = video.videoWidth,
        height = video.videoHeight,
        context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    context.drawImage(video, 0, 0, width, height);
    stopVideo(video);

    // callback with the data URL
    var imageURL = canvas.toDataURL("image/png");
    
    callback(imageURL);
    callback.drop();
}

function stopVideo(video) {
    video.srcObject.getTracks()[0].stop();
    video.removeAttribute('src');
    video.load();
}

// from https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

function alterHiDPICanvas(can, w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}
