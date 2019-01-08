var checkExist = setInterval(function() {
    if (document.getElementById("canvas")) {
       clearInterval(checkExist);
       draw(null, null);
    }
 }, 50);

function drawCamera(camPositionCb, cameraClickCb) {
    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.onload = function() {
        var dx = (canvas.offsetWidth / 2) - (img.width / 2);
        var dy = 7 * (canvas.offsetHeight / 8) - (img.height / 2);

        ctx.drawImage(img, dx, dy);
        registerCameraEvents(canvas, img, dx, dy, cameraClickCb);
        
        if (camPositionCb) {
            camPositionCb([Math.round(dx), Math.round(dy), img.width, img.height]);
            camPositionCb.drop();
        }
    };

    img.src = "camera-outline.png";
}

function registerCameraEvents(canvas, img, dx, dy, cameraClickCb) {
    var cameraPath = new Path2D();
    cameraPath.rect(dx,dy,img.width,img.height);

    canvas.onclick = function (e) {
        var context = e.target.getContext('2d');
        var coordX  = e.offsetX;
        var coordY  = e.offsetY;
        
        if (context.isPointInPath(cameraPath, coordX, coordY)) {
            exp(cameraClickCb);
            return;
        }
    }

    canvas.onmousemove = function (e)
    {
        var context = e.target.getContext('2d');
        var coordX  = e.offsetX;
        var coordY  = e.offsetY;
        
        if (context.isPointInPath(cameraPath, coordX, coordY)) {
            e.target.style.cursor = 'pointer';
            return;
        }
        
        e.target.style.cursor = 'default';
    };
}

function draw(cb, cameraClickCb) {
    _.debounce(() => {
        var canvas = document.getElementById("canvas");
            
        var ctx = canvas.getContext("2d");
        var img = new Image();
        img.src = "image.png";

        img.onload = function() {
            var dx = (canvas.offsetWidth / 2) - (img.width / 2);
            var dy = (canvas.offsetHeight / 2) - (img.height / 2);

            ctx.drawImage(img, dx, dy, img.width, img.height);
            //drawCamera(canvas, cb, cameraClickCb);

            if (cb) {
                drawBoundingBoxes(canvas, img, cameraClickCb);
            }
        };
    }, 1000)()
}

const FONT = "30px Arial";
const GREEN = "rgb(0,255,0)";
const HUD_X = 50;
const HUD_Y = 50;

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
                const TEXT_OFFSET = -10;
                ctx.fillText(p.class, p.bbox[0], p.bbox[1] + TEXT_OFFSET);
            });

            //drawCamera(canvas, null, cameraClickCb);
        });
    });
}

function drawBoundingBoxes(canvas, img, cameraClickCb) {
    cocoSsd.load().then(model => {
        model.detect(img).then(predictions => {
            var ctx = canvas.getContext("2d");
            ctx.lineWidth = 3;

            const COLORS = ["rgb(255,0,0)", "rgb(255,255,0)", "rgb(0,255,0)", "rgb(0,255,255)"];
            predictions.forEach(function(p, i) {
                ctx.beginPath();
                var color = COLORS[i % COLORS.length];

                ctx.strokeStyle = color;
                ctx.rect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
                ctx.stroke();

                ctx.font = "30px Arial";
                ctx.fillStyle = color;
                const TEXT_OFFSET = -10;
                ctx.fillText(p.class, p.bbox[0], p.bbox[1] + TEXT_OFFSET);
            });

            //drawCamera(canvas, null, cameraClickCb);
        });
    });
}

function exp(cameraClickCb) {
    cameraClickCb(true);
    cameraClickCb.drop();
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
