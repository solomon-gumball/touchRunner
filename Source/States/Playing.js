var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Playing               = {};
var KeyHandler            = require('../Inputs/KeyHandler');
var TouchHandler          = require('../Inputs/TouchHandler');
var Renderer              = require('../GL/GL');

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	this.canvas = document.getElementById('renderer');
	this.canvas.width = innerWidth;
	this.canvas.height = innerHeight;
	KeyHandler.init();
	// TouchHandler.init();
	this.renderer = new Renderer({
		canvas: this.canvas,
		textures: [
			'../Assets/space1.jpg',
			'../Assets/spaceship.png',
			'../Assets/enemySprites.png'
			// '../Assets/crate.gif'
		]
	});
};

Playing.update     = function update()
{
	KeyHandler.update();
	// TouchHandler.update();
	this.renderer.update();
};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;