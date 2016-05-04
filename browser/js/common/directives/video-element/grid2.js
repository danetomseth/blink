app.directive('gridVideo', function(BlinkFactory2) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/video-element/grid-template.html',
        controller: 'VideoCtrl',
        scope: '=',
        link: function(scope, elem, attr) {

            scope.running = false;
            scope.ready = false;
            scope.imageStable = false;



            scope.rowSelect = true;
            scope.letterSelect = false;
            scope.sentence = ''
            scope.selectedText = "";

            scope.selectArray = [
                ['A', 'B', 'C', 'D', 'E'],
                ['F', 'G', 'H', 'I', 'J'],
                ['K', 'L', 'M', 'N', 'O'],
                ['P', 'Q', 'R', 'S', 'T'],
                ['U', 'V', 'W', 'X', 'Y'],
                ['Z', 'Back', '+ Word', '?', '?']
            ]
            scope.styleArray = [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
            ]

            scope.letterIndex = 0;
            scope.rowArray = [0, 0, 0, 0, 0, 0];
            scope.rowIndex = 0;


            //threshold for detection
            scope.leftThreshold = 23;
            scope.browThreshold = 25;
            scope.mouthThreshold = 15;
            scope.thresholdB = 20;
            //yeahhh, this is the right threshold. I had a weird problem.

            var mouthZero;
            var leftZeroArray = [];
            var rightZeroArray = [];
            var browZeroArray = [];

            scope.rightDetails = [];
            scope.leftDetails = [];


            var leftDebounce = true;
            var rightDebounce = true;
            var mouthDebounce = true;
            var browDebounce = true;


            //position arrays
            var browArray = [20, 21, 17, 16];
            var rightArray = [23, 63, 24, 64, 25, 65, 26, 66];
            var leftArray = [28, 67, 29, 68, 30, 69, 31, 70];

            //initiates webcam
            navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
            var errorCallback = function(e) {
                console.log('Reeeejected!', e);
            };
            var video = document.getElementById('webcam');

            //start tracker
            var ctracker = new clm.tracker();
            ctracker.init(pModel);
            ctracker.start(video);
            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");


            //draws on canvas, needed to position over video
            function drawLoop() {
                requestAnimationFrame(drawLoop);
                context.clearRect(0, 0, canvas.width, canvas.height);
                ctracker.draw(canvas);
            }

            //all interval based logic
            var intervalRead;
            function takeReading() {
                intervalRead = setInterval(readPositions, 50)
            }

            var calibrateInterval;
            function calibrate() {
                calibrateInterval = setInterval(findZero, 50)
            }

            var scoreInterval;
            function getScore() {
                scoreInterval = setInterval(updateZero, 1500)
            }


            var initiateInterval;
            var count = 0;
            var negativeCount = 0;
            //counts are reset outside parameters of converge value from clm tacker
            function initialize() {
                initiateInterval = setInterval(stableFace, 200) //reads convergence every 200ms
            }

            function stableFace() {
                var converge = ctracker.getConvergence();
                scope.conv = converge //displayed on red overlay
                if (converge < 300) { //smaller number is better
                    count++;
                    if (count > 20) {
                        scope.imageStable = true; //this changes the 'ng-hide' value so the overlay goes away
                        scope.takeBase(); //starts taking base reading
                    }
                } else if (scope.imageStable && converge > 1000) { //last mimute implementation of what to do if the subject became out of focus
                    negativeCount++
                    if (negativeCount > 10) {
                        scope.imageStable = false;
                        clearInterval(intervalRead);
                        negativeCount = 0;
                        count = 0;
                    }
                } else {
                    negativeCount = 0;
                    count = 0;
                }
            }


            //ready to start selecting letters
            scope.startLetters = function() {
                scope.ready = true;
                startRow();
            }

            //sets [0][0] to green
            function startRow() {
                scope.rowArray = [1, 0, 0, 0, 0, 0];
                scope.rowIndex = 0;
            }

            function selectRow(back) {
                scope.rowArray[scope.rowIndex] = 0;
                if (back) {
                    scope.rowIndex--;
                    if (scope.rowIndex === -1) scope.rowIndex = scope.rowArray.length - 1;
                    scope.rowArray[scope.rowIndex] = 1;
                } else {
                    scope.rowIndex++;
                    if (scope.rowIndex === scope.rowArray.length) scope.rowIndex = 0;
                    scope.rowArray[scope.rowIndex] = 1;
                }
            }


            //moves cursor across letters
            function selectLetter() {
                scope.styleArray[scope.rowIndex][scope.letterIndex] = 0;
                scope.letterIndex++;
                if (scope.letterIndex > 4) scope.letterIndex = 0;
                scope.styleArray[scope.rowIndex][scope.letterIndex] = 1;
            }


            //moves cursor across rows
            function resetRow() {
                scope.rowArray[scope.rowIndex] = 1;
                scope.styleArray[scope.rowIndex][scope.letterIndex] = 0
                scope.letterIndex = 0;
                scope.rowSelect = true;
                scope.letterSelect = false;
            }

            //pushes letter into input, checks for special chars
            function pushLetter() {
                var newLetter = scope.selectArray[scope.rowIndex][scope.letterIndex];
                if (newLetter === 'Space') {
                    scope.selectedText += ' '
                } else if (newLetter === 'Back') {
                    scope.selectedText = scope.selectedText.substring(0, scope.selectedText.length - 1);
                } else if (newLetter === '+ Word') {
                    scope.sentence += ' ' + scope.selectedText;
                    scope.selectedText = "";
                } else {
                    scope.selectedText += newLetter
                }
            }





            function resetRight() {
                if (scope.ready && scope.rowSelect) selectRow();
                if (scope.ready && scope.letterSelect) selectLetter();
                setTimeout(function() {
                    scope.statusRight = false;
                    scope.$digest();
                    rightDebounce = true;
                }, 200)
            }


            function resetLeft() {
                if (scope.ready && scope.rowSelect) selectRow(true);
                if (scope.ready && scope.letterSelect) resetRow();
                setTimeout(function() {
                    scope.statusLeft = false;
                    scope.$digest();
                    leftDebounce = true;
                }, 200)
            }


            //This calls the reset zero function when the image is stable and none of the debounce lements are currently active
            function updateZero() {
                var converge = ctracker.getConvergence();
                if (converge < 10 && leftDebounce && rightDebounce && browDebounce) {
                    dynamicZero();
                }
            }

            function dynamicZero() {
                var positions = ctracker.getCurrentPosition(); //gets current x,y cords of all positions
                if (positions) {
                    leftZeroArray = leftArray.map(function(index) {
                        return positions[index][1]
                    });
                    rightZeroArray = rightArray.map(function(index) {
                        return positions[index][1]
                    });
                    browZeroArray = browArray.map(function(index) {
                        return positions[index][1]
                    });
                }
            }




            function resetMouth() {
                setTimeout(function() {
                    scope.statusMouth = false;
                    mouthDebounce = true;
                    scope.$digest();
                }, 700)
            }

            function resetBrow() {
                // scope.ready determines if user is ready to select letters by selecting row
                if (scope.ready) {
                    if (scope.rowSelect) { //if the user is still selecting the row
                        scope.rowSelect = false;
                        scope.letterSelect = true;
                        scope.rowArray[scope.rowIndex] = 0;
                        scope.styleArray[scope.rowIndex][0] = 1;
                    } else if (scope.letterSelect) { //if the user is selecting the letter
                        scope.letterInput = 'letter-success'; //changes css
                        pushLetter(); //pushes letter into input
                        scope.styleArray[scope.rowIndex][scope.letterIndex] = 0; //reset index of row and column
                        scope.letterSelect = false; //letter is not ready to select
                        scope.rowSelect = true;
                        startRow(); //reset row select
                        scope.letterIndex = 0;
                    }
                }
                setTimeout(function() {
                    scope.statusBrow = false;
                    scope.letterInput = '';
                    scope.selectBox = "";
                    scope.$digest();
                    browDebounce = true;
                }, 700)
            }



            scope.takeBase = function() {
                //take current readings of desired elements
                leftZeroArray = scope.leftDetails;
                rightZeroArray = scope.rightDetails;
                browZeroArray = scope.browDetails;

                //starts main program logic
                takeReading();
                //starts interval to dynamically update zero
                getScore();
                //stops calibration logic (display)
                clearInterval(calibrateInterval)
            }



            //findZero and reset zero can be combined... used a button to manually reset zero
            scope.resetZero = function() {
                var positions = ctracker.getCurrentPosition();
                if (positions) {
                    leftZeroArray = leftArray.map(function(index) {
                        return positions[index][1]
                    });
                    rightZeroArray = rightArray.map(function(index) {
                        return positions[index][1]
                    });
                    browZeroArray = browArray.map(function(index) {
                        return positions[index][1]
                    })
                }
            }

            function findZero() {
                var positions = ctracker.getCurrentPosition();
                if (positions) {
                    mouthZero = BlinkFactory2.mouthDistance(positions);
                    scope.leftDetails = leftArray.map(function(index) {
                        return positions[index][1]
                    });
                    scope.rightDetails = rightArray.map(function(index) {
                        return positions[index][1]
                    });
                    scope.browDetails = browArray.map(function(index) {
                        return positions[index][1]
                    })
                    scope.$digest();
                }

            }



            //meat of the logic
            function readPositions() {
                //get psoition cords
                var positions = ctracker.getCurrentPosition();
                if (positions) {
                    //if positions, get current readings at desired points
                    var currentMouth = BlinkFactory2.mouthDistance(positions)
                    scope.zeroArray = BlinkFactory2.percentChange(leftZeroArray, rightZeroArray, browZeroArray, positions) //this compares current positions with Zero, returns [deltaLeft, deltaRight, deltaBrow]
                }

                //all of these < 0, element active
                scope.leftThres = scope.zeroArray[0] - scope.leftThreshold;
                scope.rightThres = scope.zeroArray[1] - scope.thresholdB;
                scope.browThres = scope.zeroArray[2] - scope.browThreshold;
                scope.mouthThres = (currentMouth - mouthZero) - scope.mouthThreshold;


                if (scope.mouthThres > 0 && mouthDebounce) {
                    scope.statusMouth = true;
                    resetMouth();
                    mouthDebounce = false;
                }

                if (scope.browThres > 0 && browDebounce) {
                    scope.selectBox = "selected-letter"; //highlights input
                    scope.statusBrow = true;
                    scope.$digest();
                    browDebounce = false
                    resetBrow();
                }


                if ((scope.leftThres > 0) && (scope.rightThres > 0) && rightDebounce && leftDebounce) {

                    //var leftDiff = scope.zeroArray[0] - scope.leftThreshold
                    //var rightDiff = scope.zeroArray[1] - scope.thresholdB
                    //scope.eyeDiff = (Math.abs(leftDiff - rightDiff) / (scope.leftThreshold + scope.thresholdB)) * 100; //originally used to check different between eyes, if close, both eyes active

                    if (scope.leftThres > scope.rightThres && leftDebounce) {
                        scope.statusLeft = true; //shows 'active' grid element
                        scope.$digest(); // to change stuff, I think?
                        resetLeft(); //calls left debounce func
                        leftDebounce = false; //makes sure left can't activate until debounce is finished
                    } else if (rightDebounce) {
                        scope.statusRight = true;
                        scope.$digest();
                        resetRight();
                        rightDebounce = false;
                    }
                }

                scope.$digest();
            }



            //initial canvas drawing
            function positionLoop() {
                requestAnimationFrame(positionLoop);
                var positions = ctracker.getCurrentPosition();
            }


            getScore();



            calibrate();
            if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    video: true
                }, function(stream) {
                    initialize();
                    video.src = window.URL.createObjectURL(stream);
                    console.log('video load');
                    positionLoop();
                    drawLoop();
                }, errorCallback);
            } else {
                console.log('cannot find cam');
                alert('Cannot connect')
            }

        }
    }
});
