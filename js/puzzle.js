$(function() {

	var init = function() {
		
		var $canvas;
		var id;
		
		// Create a canvas to represent each tile and append to container
		for (var i = 0; i < (TILES - 1); i ++) {
	
			id = "c" + i;
			
			$canvas = $("<canvas></canvas>").attr({
				id: id,
				width: TILE_WIDTH - 2,
				height: TILE_HEIGHT - 2
			})
			.click(function(e){
				move($(this));
			});
			
			$("#tile-container").append($canvas);
			canvases.push(id);	
		}
		
		// This is the missing tile (not a canvas).
		canvases.push(BLANK); 
	};	

	var draw = function() {
		
		grid = [];
		var row = [];
		
		var id;
		
		var top = 0;
		var left = 0;
	
		var l = canvases.length;
		for (var i = 0; i < l; i ++) {	
			
			id = canvases[i];
			
			// Grab the canvas and position it.
			if (id != BLANK) {
				$("#" + id).css({
					left: left + "px",
					top: top + "px"
				});	
			}
	
			row.push(id);
			
			left += TILE_WIDTH;
			
			// Populate a 2D Array to represent the grid 
			if (!((i + 1) % ROWS)) {
				
				grid.push(row);
				row = [];
				
				top += TILE_HEIGHT;
				left = 0;
			}
		}	
	};
	
	// Called repeatedly on a timeout 
	var update = function() {
		
		var context;
		
		var x = 0;
		var y = 0;
		
		$("canvas").each(function(index){
			
			// Draw a chunk of video on this canvas
			context = $(this)[0].getContext("2d");
			context.drawImage($video[0], x, y, VIDEO_WIDTH, VIDEO_HEIGHT);
			
			// console.log(context);
			
			// Put a number on the tile to make the puzzle a bit easier
			context.fillStyle = "#272D31";
			context.font = "16px san-serif";;
			context.textBaseline = "bottom";
			context.fillText(index + 1, 42, 60);

			// Calculate the position of the chunk of video associated 
			// with the next canvas in the collection. 
			if ((index + 1) % ROWS) {
				x -= TILE_WIDTH;				
			} else {
				x = 0;
				y -= TILE_HEIGHT;			
			}	
		});
		
		// Do it all again!
		setTimeout(update, 20);		
	};

	// Can the selected tile move?
	var move = function($canvas) {
		
		var id = $canvas.attr("id");
		
		// Need the position of the selected tile 
		// and the position of the blank (target)
		var position = getPosition(id);
		var target = getPosition(BLANK);
		
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
				left: (target.col * TILE_WIDTH) + "px",
				top: (target.row * TILE_HEIGHT) + "px"
			});
			
			// And switch the canvas with the blank in the grid
			grid[target.row][target.col] = id;
			grid[position.row][position.col] = BLANK;
			
			checkSolved();
		}
	};

	var checkSolved = function() {
		$mix.css("text-decoration", isSolved() ? "none" : "line-through");
	};
	
	// Resets the grid to the correct sequence
	var solve = function() {
		
		canvases = [];
		
		for (var i = 0; i < (TILES - 1); i ++) 
			canvases[i] = "c" + i;
		
		canvases[i] = BLANK;
		draw();
	};
	
	// Checks whether the puzzle is solved
	var isSolved = function() {
		
		var g = grid.length;
		var r;	
		
		var row;
		var col;
		
		var k = 0;
		
		for (var i = 0; i < g; i ++) {
			row = grid[i];
			r = row.length;
			for (var j = 0; j < r; j ++) {
				col = row[j];
				if ((k < TILES - 1) && col != "c" + k)
					return false;
				k ++;
			}
		}
		
		return true;
	};
	
	// Gets the position of an item in the grid
	// based on the supplied id
	var getPosition = function(id) {
		
		var g = grid.length;
		var row;
		var r;
		
		for (var i = 0; i < g; i ++) {
			
			row = grid[i];
			r = row.length;
			
			for (var j = 0; j < r; j ++) {
				if (row[j] == id) 
					return {row: i, col: j};
			}				
		}
	};

	var shuffleArray = function(arr) {
		for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i),
			x = arr[--i], arr[i] = arr[j], arr[j] = x);
		return arr;	
	};	
	
	// Check browser capabilities first.
	// Does the user's browser support HTML video and canvas?
	if (Modernizr.video && Modernizr.canvas) {
		
		// We kick things off on play of the video
		$video = $("#video");
		$video.bind("play", function(e) {
			init();
			draw();
			update(); // called recursively on a timeout
		});
		
		$mix = $("#mix");
		$mix.click(function(e) {
			// console.log("toggle shuffle");
			if (isSolved()) {
				canvases = shuffleArray(canvases); 
				draw();			
			} else {
				solve();
			}
			checkSolved();
		});
		
		$("#mute").click(function(e) {
			// console.log("toggle volume")
			mute = !mute;
	
			// jQuery.attr() doesn't seem to work here
			$video[0].muted = mute;
			$(this).css("text-decoration", mute ? "line-through" : "none");
		});	
		
	} else {
		// User's browser isn't up to the job
		$("#no-dice").show();
		$("#controls").hide();
	}

	var TILES = 9;
	var ROWS = 3;
	
	var TILE_WIDTH = 100;
	var TILE_HEIGHT = 100;
	
	var VIDEO_WIDTH = 630;
	var VIDEO_HEIGHT = 360;
	
	var BLANK = "blank";
	
	var $video;
	var $mix;
	
	var canvases = [];
	var grid = [];
	
	var mute = false;
});