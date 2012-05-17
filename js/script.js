$(function () {

    var createCanvas = function () {

        var $canvas;
        var id;

        // Create a canvas to represent each tile and append to container
        for (var i = 0; i < (tileCount - 1); i++) {

            id = "c" + i;

            $canvas = $("<canvas></canvas>").attr({
                id: id,
                width: tileWidth - 2,
                height: tileHeight - 2
            })
            .click(function (e) {
                move($(this));
            });

            $("#tile-container").append($canvas);
            canvases.push(id);
        }

        // This is the missing tile (not a canvas).
        canvases.push(blankTile);
    };

    var draw = function () {

        grid = [];
        var row = [];

        var id;

        var top = 0;
        var left = 0;

        var l = canvases.length;
        for (var i = 0; i < l; i++) {

            id = canvases[i];

            // Grab the canvas and position it.
            if (id != blankTile) {
                $("#" + id).css({
                    left: left + "px",
                    top: top + "px"
                });
            }

            row.push(id);

            left += tileWidth;

            // Populate a 2D Array to represent the grid 
            if (!((i + 1) % rowCount)) {

                grid.push(row);
                row = [];

                top += tileHeight;
                left = 0;
            }
        }
    };

    // Called repeatedly on a timeout 
    var update = function () {

        var context;

        var x = 0;
        var y = 0;

        $("canvas").each(function (index) {

            // Draw a chunk of video on this canvas
            context = $(this)[0].getContext("2d");
            context.drawImage($video[0], x, y, videoWidth, videoHeight);

            // console.log(context);

            // Put a number on the tile to make the puzzle a bit easier
            context.fillStyle = "#272D31";
            context.font = "16px san-serif"; ;
            context.textBaseline = "bottom";
            context.fillText(index + 1, 42, 60);

            // Calculate the position of the chunk of video associated 
            // with the next canvas in the collection. 
            if ((index + 1) % rowCount) {
                x -= tileWidth;
            } else {
                x = 0;
                y -= tileHeight;
            }
        });

        // Do it all again!
        setTimeout(update, 20);
    };

    // Can the selected tile move?
    var move = function ($canvas) {

        var id = $canvas.attr("id");

        // Need the position of the selected tile 
        // and the position of the blank (target)
        var position = getPosition(id);
        var target = getPosition(blankTile);

        // console.log("Position: row: " + position.row + " col: " + position.col);
        // console.log("Target: row: " + (target.row * TILE_HEIGHT) + " col: " + (target.col * TILE_WIDTH));

        // This feels a wee bit brute force ...
        // If we move one tile vertically or horizontally either side
        // do we encounter the blank tile?
        if ((position.row + 1 == target.row && position.col == target.col)
			|| (position.row - 1 == target.row && position.col == target.col)
			|| (position.row == target.row && position.col - 1 == target.col)
			|| (position.row == target.row && position.col + 1 == target.col)) {

            // Put the canvas where the blank was
            $canvas.css({
                left: (target.col * tileWidth) + "px",
                top: (target.row * tileHeight) + "px"
            });

            // And switch the canvas with the blank in the grid
            grid[target.row][target.col] = id;
            grid[position.row][position.col] = blankTile;

            checkSolved();
        }
    };

    var checkSolved = function () {
        $mix.css("text-decoration", isSolved() ? "none" : "line-through");
    };

    // Resets the grid to the correct sequence
    var solve = function () {

        canvases = [];

        for (var i = 0; i < (tileCount - 1); i++)
            canvases[i] = "c" + i;

        canvases[i] = blankTile;
        draw();
    };

    // Checks whether the puzzle is solved
    var isSolved = function () {

        var g = grid.length;
        var r;

        var row;
        var col;

        var k = 0;

        for (var i = 0; i < g; i++) {
            row = grid[i];
            r = row.length;
            for (var j = 0; j < r; j++) {
                col = row[j];
                if ((k < tileCount - 1) && col != "c" + k)
                    return false;
                k++;
            }
        }

        return true;
    };

    // Gets the position of an item in the grid
    // based on the supplied id
    var getPosition = function (id) {

        var g = grid.length;
        var row;
        var r;

        for (var i = 0; i < g; i++) {

            row = grid[i];
            r = row.length;

            for (var j = 0; j < r; j++) {
                if (row[j] == id)
                    return { row: i, col: j };
            }
        }
    };

    var shuffleArray = function (arr) {
        for (var j, x, i = arr.length; i; j = parseInt(Math.random() * i),
			x = arr[--i], arr[i] = arr[j], arr[j] = x);
        return arr;
    };

    var fallbackHandler = function() {
        setSource('assets/BigBuckBunny_640x360.mp4');
    };
    
    var setSource = function(source) {
        $video.attr('src', source);
    };

    var init = function() {

        // Check browser capabilities first.
        // Does the user's browser support HTML video and canvas?
        if (Modernizr.video && Modernizr.canvas) {
            console.log("Got HTML5 video and canvas");

            // We kick things off on play of the video
            $video.bind("play", function (e) {
                createCanvas();
                draw();
                update(); // called recursively on a timeout
            });

            $mix.click(function (e) {
                // console.log("toggle shuffle");
                if (isSolved()) {
                    canvases = shuffleArray(canvases);
                    draw();
                } else {
                    solve();
                }
                checkSolved();
            });

            $("#mute").click(function (e) {
                // console.log("toggle volume")
                mute = !mute;

                // jQuery.attr() doesn't seem to work here
                $video[0].muted = mute;
                $(this).css("text-decoration", mute ? "line-through" : "none");
            });

            if (Modernizr.prefixed('getUserMedia', navigator)) {

                navigator.getUserMedia = navigator.getUserMedia 
                    || navigator.webkitGetUserMedia;
           
                if (navigator.getUserMedia) {
                    navigator.getUserMedia({audio: false, video: true}, function(stream) {
                        if (navigator.webkitGetUserMedia) {
                            setSource(window.webkitURL.createObjectURL(stream));
                        } else {
                            setSource(stream); // Opera
                        }
                    }, fallbackHandler);
                } else {
                    fallbackHandler();
                }
            } else {
                fallbackHandler();
            }       
            
        } else {
            // User's browser isn't up to the job
            $("#no-dice").show();
            $("#controls").hide();
        }
    };

    var $video = $('#video');
    var $mix = $('#mix');

    var tileCount = 9;
    var rowCount = 3;
    var tileWidth = 100;
    var tileHeight = 100;
    var videoWidth = 630;
    var videoHeight = 360;

    var blankTile = "blank";
    var mute = false;
    var canvases = [];
    var grid = [];

    init();
});