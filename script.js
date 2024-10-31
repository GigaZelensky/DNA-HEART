window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var heartX = window.innerWidth / 2; // Start in the center of the canvas
var heartY = window.innerHeight / 2; // Start in the center of the canvas
var dragging = false;

var init = function () {
    if (loaded) return;
    loaded = true;
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    });

    // Mouse event listeners
    window.addEventListener('mousedown', function (event) {
        dragging = true;
        heartX = event.clientX;
        heartY = event.clientY;
    });

    window.addEventListener('mouseup', function () {
        dragging = false;
    });

    window.addEventListener('mousemove', function (event) {
        if (dragging) {
            heartX = event.clientX;
            heartY = event.clientY;
        }
    });

    // Touch event listeners for mobile
    window.addEventListener('touchstart', function (event) {
        dragging = true;
        heartX = event.touches[0].clientX;
        heartY = event.touches[0].clientY;
    });

    window.addEventListener('touchmove', function (event) {
        if (dragging) {
            event.preventDefault(); // Prevent scrolling
            heartX = event.touches[0].clientX;
            heartY = event.touches[0].clientY;
        }
    });

    window.addEventListener('touchend', function () {
        dragging = false;
    });

    var targetPoints = [];
    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var dr = mobile ? 0.3 : 0.1;

    for (let i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (let i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (let i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));

    var heartPointsCount = pointsOrigin.length;

    var pulse = function () {
        for (let i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = pointsOrigin[i][0] + heartX - (width / 2);
            targetPoints[i][1] = pointsOrigin[i][1] + heartY - (height / 2);
        }
    };

    var e = [];
    for (let i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
            trace: []
        };
        for (let k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var smoothFactor = 0.1; // adjust for smoother motion
    var motionSensitivity = 0.05; // Adjusted sensitivity for smoother movement

    // Handle device motion
    window.addEventListener('deviceorientation', function (event) {
        if (mobile) {
            // Use beta and gamma for relative adjustments
            heartX += ((event.gamma + 90) / 180 * width - heartX) * motionSensitivity;
            heartY += ((event.beta + 90) / 180 * height - heartY) * motionSensitivity;
        }
    });

    var loop = function () {
        pulse();

        // Keep the heart within bounds (adjusting for heart dimensions)
        heartX = Math.max(70, Math.min(heartX, width - 70)); // Offset to prevent off-screen
        heartY = Math.max(70, Math.min(heartY, height - 70)); // Offset to prevent off-screen

        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);
        for (let i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (let k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (let k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }
        window.requestAnimationFrame(loop, canvas);
    };
    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
