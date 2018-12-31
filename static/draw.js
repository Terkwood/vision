var checkExist = setInterval(function() {
    if (document.getElementById("canvas")) {
       clearInterval(checkExist);
       draw();
    }
 }, 50);

function draw() {
    console.log("Enter draw");
    _.debounce(() => {
        console.log("Enter debounce closure");
        var canvas = document.getElementById("canvas");
            
        var ctx = canvas.getContext("2d");
        var img = new Image();
        img.src = "image.jpg";

        var scaleX = canvas.offsetWidth / img.width;
        var scaleY = canvas.offsetWidth / img.width;

        img.addEventListener("load", function() {
            ctx.drawImage(img, 0, 0, img.width * scaleX, img.height * scaleY);

            cocoSsd.load().then(model => {

                model.detect(img).then(predictions => {
                    var c = document.getElementById("canvas");
                    var ctx = c.getContext("2d");
                    ctx.lineWidth = 3;

                    const COLORS = ["rgb(255,0,0)", "rgb(255,255,0)", "rgb(0,255,0)", "rgb(0,255,255)"];
                    predictions.forEach(function(p, i) {
                        ctx.beginPath();
                        var color = COLORS[i % COLORS.length];

                        ctx.strokeStyle = color;
                        ctx.rect(p.bbox[0] * scaleX, p.bbox[1] * scaleY, p.bbox[2] * scaleX, p.bbox[3] * scaleY);
                        ctx.stroke();

                        ctx.font = "30px Arial";
                        ctx.fillStyle = color;
                        const TEXT_OFFSET = -10;
                        ctx.fillText(p.class, p.bbox[0] * scaleX, p.bbox[1] * scaleY + TEXT_OFFSET);
                    });
                });
            });
        }, false)
    }, 1000)()
}
