const FONT = "30px Arial";
const GREEN = "rgb(0,255,0)";
const HUD_X = 50;
const HUD_Y = 50;

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

        ctx.beginPath();
        ctx.font = "24px Arial";
        ctx.fillStyle = GREEN;
        ctx.fillText("TAP to start.", HUD_X / 3, HUD_Y);
        ctx.fillText("Then TAP to take a photo.", HUD_X / 3, HUD_Y * 2);
        ctx.fillText("Photo processing may take", HUD_X / 3, HUD_Y * 4);
        ctx.fillText("       up to 10 seconds!", HUD_X / 3, HUD_Y * 5);
    }
 }, 50);

function drawButton(posCb, clickCb, imgSrc) {
    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.onload = function() {
        var dx = (canvas.offsetWidth / 6) - (img.width / 2);
        var dy = 7 * (canvas.offsetHeight / 8) - (img.height / 2);

        console.log("YO " + dx + " " + dy);
        ctx.drawImage(img, dx, dy);
        registerButtonEvents(canvas, img, dx, dy, clickCb);
        
        
        if (posCb) {
            posCb([Math.round(dx), Math.round(dy), img.width, img.height]);
            posCb.drop();
        }
    };

    img.src = imgSrc;
}

function registerButtonEvents(canvas, img, dx, dy, clickCb) {
    var buttonPath = new Path2D();
    buttonPath.rect(dx,dy,img.width,img.height);

    canvas.onclick = function (e) {
        var context = e.target.getContext('2d');
        var coordX  = e.offsetX;
        var coordY  = e.offsetY;
        
        if (context.isPointInPath(buttonPath, coordX, coordY)) {
            clickCb(true);
            clickCb.drop();
            return;
        }
    }

    canvas.onmousemove = function (e)
    {
        var context = e.target.getContext('2d');
        var coordX  = e.offsetX;
        var coordY  = e.offsetY;
        
        if (context.isPointInPath(buttonPath, coordX, coordY)) {
            e.target.style.cursor = 'pointer';
            return;
        }
        
        e.target.style.cursor = 'default';
    };
}

function snapshotBoundingBoxes(img, drawDlBtn) {
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
                const TEXT_OFFSET = -10;
                ctx.fillText(p.class, p.bbox[0], p.bbox[1] + TEXT_OFFSET);
            });

            drawDlBtn();
        });
    });
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


alterHiDPICanvas = function(can, w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}

function logCursorPosition(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
}