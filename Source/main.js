var Engine  = require('./Game/Engine');
var Loading = require('./States/Loading');
var Menu    = require('./States/Menu');
var Playing = require('./States/Playing');
var EventHandler = require('./Events/EventHandler');
var ImageLoader  = require('./Game/ImageLoader');
var AjaxLoader   = require('./Game/AjaxLoader');
var Viewport     = require('./Game/Viewport');


var Controller = new EventHandler();

Viewport.pipe(Menu);
Viewport.pipe(Loading);
Viewport.pipe(Playing);

Engine.pipe(Controller);
Menu.pipe(Controller);
Loading.pipe(Controller);

Controller.on('doneLoading', goToMenu);
Controller.on('newGame', startGame);

var assets = [
	{
		type: 'image',
		source: '../Assets/crate.gif',
		data: {}
	},
	{
		type: 'image',
		source: '../Assets/spaceship.png',
		data: {}
	},
	{
		type: 'image',
		source: '../Assets/space1.jpg',
		data: {}
	},
	{
		type: 'image',
		source: '../Assets/enemySprites.png',
		data: {}
	},
	{
		type: 'image',
		source: '../Assets/Character.png',
		data: {}
	},
	{
		type: 'data',
		source: '../Shaders/FragmentShader.glsl',
		data: {}
	},
	{
		type: 'data',
		source: '../Shaders/VertexShader.glsl',
		data: {}
	}
]

Loading.register(ImageLoader);
Loading.register(AjaxLoader);
Loading.load(assets);

Engine.setState(Loading);

function goToMenu()
{
    Engine.setState(Menu);
}

function startGame()
{
	Engine.setState(Playing);
}

function loop()
{
    Engine.step();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);