window.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.src = "up.jpg";
    img.addEventListener("load", function() {
        ctx.drawImage(img, 10, 10);

        // Notice there is no 'import' statement. 'cocoSsd' and 'tf' is
        // available on the index-page because of the script tag above.

        // Load the model.
        cocoSsd.load().then(model => {
            // detect objects in the image.
            model.detect(img).then(predictions => {
                console.log("Found " + predictions.length + " predictions");
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.lineWidth = 5;

                const COLORS = ["rgb(255,0,0)", "rgb(0,255,0)", "rgb(0,0,255)"];
                predictions.forEach(function(p, i) {
                    
                    ctx.beginPath();
                    ctx.strokeStyle = COLORS[i % COLORS.length];
                    ctx.rect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);
                    ctx.stroke();
                    
                    //console.log(i + " -> " + JSON.stringify(p));
                });
            });
        });
    }, false);
};