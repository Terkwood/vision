// LET THE ATTRIBUTION BE KNOWN!
// The bulk of this was inspired by Paul Irish's
// multi-touch demo: https://www.paulirish.com/demo/multi
var CanvasDrawr = function(options) {
    var canvas = document.getElementById(options.id),
        ctxt = canvas.getContext("2d");
    canvas.style.width = '100%'
    canvas.width = canvas.offsetWidth;
    canvas.style.width = '';

    ctxt.lineWidth = options.size || Math.ceil(Math.random() * 35);
    ctxt.lineCap = options.lineCap || "round";
    ctxt.pX = undefined;
    ctxt.pY = undefined;
    var lines = [, , ];
    var minPoints = [, , ];
    var maxPoints = [, , ];
    var offset = $(canvas).offset();
    var colors = ["red", "green", "yellow", "blue", "magenta", "orangered"]; 
    var mouseId = 0;

    var dormant = true;

    var ifAwake = function(f) {
        return function(e) {
            if (!dormant) {
                return f(e);
            } else {
                return (function(_event) {})(e);
            } 
        }
    }

    var self = {
        // This method can be used by rust
        goToSleep: function() {
            self.dormant = true;
        },
        // This method can be used by rust
        wakeUp: function() {
            self.dormant = false;
        },
        init: function() {
            canvas.addEventListener('touchstart', ifAwake(self.preDrawTouch), false);
            canvas.addEventListener('touchmove', ifAwake(self.drawTouch), false);
            canvas.addEventListener('touchend', ifAwake(self.postDrawTouch), false);
            canvas.addEventListener('mousedown', ifAwake(self.preDrawMouse), false);
            canvas.addEventListener('mousemove', ifAwake(self.drawMouse), false);
            canvas.addEventListener('mouseup', ifAwake(self.postDrawMouse), false);
        },
        color: function() {
            return colors[Math.floor(Math.random() * colors.length)];
        },
        preDrawTouch: function(event) {
            $.each(event.touches, function(i, touch) {
                var id = touch.identifier;
                
                var x = this.pageX - offset.left,
                    y = this.pageY - offset.top;
                
                minPoints[id] = { x: x, y: y };
                maxPoints[id] = { x: x, y: y };
                lines[id] = {
                    x: x,
                    y: y,
                    color: self.color()
                };
            });
            event.preventDefault();
        },
        updateMinMax: function(id, x, y) {
            if (x < minPoints[id].x) {
                minPoints[id].x = x;
            }
            if (x > maxPoints[id].x) {
                maxPoints[id].x = x;
            }
            if (y < minPoints[id].y) {
                minPoints[id].y = y;
            }
            if (y > maxPoints[id].y) {
                maxPoints[id].y = y;
            };
        },
        drawTouch: function(event) {
            var e = event;
            $.each(event.touches, function(i, touch) {
                var id = touch.identifier;
                var moveX = this.pageX - offset.left - lines[id].x,
                    moveY = this.pageY - offset.top - lines[id].y;
                

                var ret = self.move(id, moveX, moveY);
                lines[id].x = ret.x;
                lines[id].y = ret.y;


                var x = this.pageX - offset.left,
                    y = this.pageY - offset.top;

                self.updateMinMax(id, x, y);

            });
            event.preventDefault();
        },
        move: function(i, changeX, changeY) {
            ctxt.strokeStyle = lines[i].color;
            ctxt.beginPath();
            ctxt.moveTo(lines[i].x, lines[i].y);
            ctxt.lineTo(lines[i].x + changeX, lines[i].y + changeY);
            ctxt.stroke();
            ctxt.closePath();
            return {
                x: lines[i].x + changeX,
                y: lines[i].y + changeY
            };
        },
        postDrawTouch: function(event) {
            $.each(event.changedTouches, function(i, _touch) {
                ctxt.rect(minPoints[i].x, minPoints[i].y, maxPoints[i].x - minPoints[i].x, maxPoints[i].y - minPoints[i].y);
                ctxt.fillStyle = '#66b3ff';
                ctxt.fill();
                ctxt.lineWidth = 7;
                ctxt.strokeStyle = 'black';
                ctxt.stroke();    
            });
            event.preventDefault();
        },
        mousePos: function(e) {
            var mouseX, mouseY;
            if (!(navigator.appName == "Microsoft Internet Explorer") ? true : false) {
                mouseX = e.pageX; 
                mouseY = e.pageY;
            }
            else {
                mouseX = event.clientX + document.body.scrollLeft;
                mouseY = event.clientY + document.body.scrollTop;
            }

            return { x: mouseX, y: mouseY };
        },
        preDrawMouse: function(event) {
            var pos = self.mousePos(event);
            var x = pos.x,
                y = pos.y;
            
            minPoints[mouseId] = { x: x, y: y };
            maxPoints[mouseId] = { x: x, y: y };
            lines[mouseId] = {
                x: x,
                y: y,
                color: self.color()
            };
            event.preventDefault();
        },
        drawMouse: function(event) { 
            var id = mouseId;
            if (!lines[id]) {
                self.preDrawMouse(event);
            }
            var pos = self.mousePos(event);
            var ret = self.move(id, pos.x - lines[id].x, pos.y - lines[id].y);
            lines[id].x = ret.x;
            lines[id].y = ret.y;
            
            var pos = self.mousePos(event);

            self.updateMinMax(id, pos.x, pos.y);

            event.preventDefault();
        },
        postDrawMouse: function(event) {
            var i = mouseId;
            ctxt.rect(minPoints[i].x, minPoints[i].y, maxPoints[i].x - minPoints[i].x, maxPoints[i].y - minPoints[i].y);
            ctxt.fillStyle = '#ffb366';
            ctxt.fill();
            ctxt.lineWidth = 7;
            ctxt.strokeStyle = 'black';
            ctxt.stroke();    
            event.preventDefault();
        }
    };
    return self.init();
};

function setCanvasDims() {
    var body = document.body,
    html = document.documentElement;

    var height = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );
    var canvas = document.querySelector("#canvas");
    canvas.height = height * 0.98;
    canvas.width = body.offsetWidth * 0.98;
}
