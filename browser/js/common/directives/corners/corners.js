app.directive('corners', function() {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/corners/corners.html',
        link: function(scope) {

            scope.log = function(){
                console.log("Left", scope.lefteyeX.toFixed(1),scope.lefteyeY.toFixed(1))
                //console.log("Right",scope.righteyeX.toFixed(1),scope.righteyeY.toFixed(1))
            }
            let zero = [];
            let zeroBrow = [];
            scope.zero = function(){
                zero=[scope.eyeX, scope.eyeY]
                zeroBrow = [scope.brows]
            }

            //initiates webcam
            navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;

            var errorCallback = function(e) {
                console.log('Reeeejected!', e);
            };

            var video = document.getElementById('webcam');

            if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    video: true
                }, function(stream) {
                    video.src = window.URL.createObjectURL(stream);
                    console.log('video load');
                    positionLoop();
                    drawLoop();
                }, errorCallback);
            } else {
                console.log('cannot find cam');
                alert('Cannot connect')
            }

            //start tracker
            var ctracker = new clm.tracker();
            ctracker.init(pModel);
            ctracker.start(video);
            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");

            scope.box = [0, 0, 0, 0, 0, 0, 0, 0, 0]

            var scopeInterval;

            document.addEventListener('click', function() {
                console.log("EYEX is", scope.xDiff)
                console.log("EYEY is", scope.yDiff)
            })

            function eyePosition(){
                var xDiff = zero[0] - scope.eyeX;
                var yDiff = zero[1] - scope.eyeY;
                var thresholdX = 4;
                var thresholdY = 3;
                var threshold = 100;
                scope.xDiff = xDiff.toFixed(1);
                scope.yDiff = yDiff.toFixed(1);

                if (Math.abs(xDiff) < thresholdX) {
                    scope.box = [0, 0, 0, 0, 1, 0, 0, 0, 0]
                } else if(xDiff < 0 && yDiff > 0){// LEFT TOP
                    scope.box = [1, 0, 0, 0, 0, 0, 0, 0, 0]
                } else if(xDiff > 0 && yDiff > 0){ // RIGHT TOP
                    scope.box = [0, 0, 1, 0, 0, 0, 0, 0, 0]
                } else if(xDiff > 0 && yDiff < 0){ // BOTTOM RIGHT
                    scope.box = [0, 0, 0, 0, 0, 0, 0, 0, 1]
                } else if(xDiff < 0 && yDiff < 0){ // BOTTOM LEFT
                    scope.box = [0, 0, 0, 0, 0, 0, 1, 0, 0]
                }
            }

            // brow selection
            function browSelect(){
                var browChange = scope.brows - zeroBrow[0];
                if (browChange > 25) {
                    // select something
                }
            }

            //initial canvas drawing
            function positionLoop() {
                requestAnimationFrame(positionLoop);
                var positions = ctracker.getCurrentPosition();
                if(positions) {
                    scope.eyeX = positions[27][0] + positions[32][0]
                    scope.eyeY = positions[27][1] + positions[32][1]
                    scope.brows = positions[20][0] + positions[17][0];
                    eyePosition();
                    browSelect();
                    scope.$digest();
                }
            }

            //draws on canvas, needed to position over video
            function drawLoop() {
                requestAnimationFrame(drawLoop);
                context.clearRect(0, 0, canvas.width, canvas.height);
                ctracker.draw(canvas);
            }


        }
    };

});
