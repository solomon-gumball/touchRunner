(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/joseph/code/touchRunner/Source/Events/EventEmitter.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

/**
 * EventEmitter represents a channel for events.
 *
 * @class EventEmitter
 * @constructor
 */
function EventEmitter() {
    this.listeners = {};
    this._owner = this;
}

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventEmitter.prototype.emit = function emit(type, event) {
    var handlers = this.listeners[type];
    if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
            handlers[i].call(this._owner, event);
        }
    }
    return this;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventEmitter.prototype.on = function on(type, handler) {
    if (!(type in this.listeners)) this.listeners[type] = [];
    var index = this.listeners[type].indexOf(handler);
    if (index < 0) this.listeners[type].push(handler);
    return this;
};

/**
 * Alias for "on".
 * @method addListener
 */
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

/**
 * Unbind an event by type and handler.
 *   This undoes the work of "on".
 *
 * @method removeListener
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function} handler function object to remove
 * @return {EventEmitter} this
 */
EventEmitter.prototype.removeListener = function removeListener(type, handler) {
    var index = this.listeners[type].indexOf(handler);
    if (index >= 0) this.listeners[type].splice(index, 1);
    return this;
};

/**
 * Call event handlers with this set to owner.
 *
 * @method bindThis
 *
 * @param {Object} owner object this EventEmitter belongs to
 */
EventEmitter.prototype.bindThis = function bindThis(owner) {
    this._owner = owner;
};

module.exports = EventEmitter;
},{}],"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

var EventEmitter = require('./EventEmitter');

/**
 * EventHandler forwards received events to a set of provided callback functions.
 * It allows events to be captured, processed, and optionally piped through to other event handlers.
 *
 * @class EventHandler
 * @extends EventEmitter
 * @constructor
 */
function EventHandler() {
    EventEmitter.apply(this, arguments);

    this.downstream = []; // downstream event handlers
    this.downstreamFn = []; // downstream functions

    this.upstream = []; // upstream event handlers
    this.upstreamListeners = {}; // upstream listeners
}
EventHandler.prototype = Object.create(EventEmitter.prototype);
EventHandler.prototype.constructor = EventHandler;

/**
 * Assign an event handler to receive an object's input events.
 *
 * @method setInputHandler
 * @static
 *
 * @param {Object} object object to mix trigger, subscribe, and unsubscribe functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setInputHandler = function setInputHandler(object, handler) {
    object.trigger = handler.trigger.bind(handler);
    if (handler.subscribe && handler.unsubscribe) {
        object.subscribe = handler.subscribe.bind(handler);
        object.unsubscribe = handler.unsubscribe.bind(handler);
    }
};

/**
 * Assign an event handler to receive an object's output events.
 *
 * @method setOutputHandler
 * @static
 *
 * @param {Object} object object to mix pipe, unpipe, on, addListener, and removeListener functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setOutputHandler = function setOutputHandler(object, handler) {
    if (handler instanceof EventHandler) handler.bindThis(object);
    object.pipe = handler.pipe.bind(handler);
    object.unpipe = handler.unpipe.bind(handler);
    object.on = handler.on.bind(handler);
    object.addListener = object.on;
    object.removeListener = handler.removeListener.bind(handler);
};

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventHandler.prototype.emit = function emit(type, event) {
    EventEmitter.prototype.emit.apply(this, arguments);
    var i = 0;
    for (i = 0; i < this.downstream.length; i++) {
        if (this.downstream[i].trigger) this.downstream[i].trigger(type, event);
    }
    for (i = 0; i < this.downstreamFn.length; i++) {
        this.downstreamFn[i](type, event);
    }
    return this;
};

/**
 * Alias for emit
 * @method addListener
 */
EventHandler.prototype.trigger = EventHandler.prototype.emit;

/**
 * Add event handler object to set of downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
EventHandler.prototype.pipe = function pipe(target) {
    if (target.subscribe instanceof Function) return target.subscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index < 0) downstreamCtx.push(target);

    if (target instanceof Function) target('pipe', null);
    else if (target.trigger) target.trigger('pipe', null);

    return target;
};

/**
 * Remove handler object from set of downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
EventHandler.prototype.unpipe = function unpipe(target) {
    if (target.unsubscribe instanceof Function) return target.unsubscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index >= 0) {
        downstreamCtx.splice(index, 1);
        if (target instanceof Function) target('unpipe', null);
        else if (target.trigger) target.trigger('unpipe', null);
        return target;
    }
    else return false;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventHandler.prototype.on = function on(type, handler) {
    EventEmitter.prototype.on.apply(this, arguments);
    if (!(type in this.upstreamListeners)) {
        var upstreamListener = this.trigger.bind(this, type);
        this.upstreamListeners[type] = upstreamListener;
        for (var i = 0; i < this.upstream.length; i++) {
            this.upstream[i].on(type, upstreamListener);
        }
    }
    return this;
};

/**
 * Alias for "on"
 * @method addListener
 */
EventHandler.prototype.addListener = EventHandler.prototype.on;

/**
 * Listen for events from an upstream event handler.
 *
 * @method subscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.subscribe = function subscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index < 0) {
        this.upstream.push(source);
        for (var type in this.upstreamListeners) {
            source.on(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

/**
 * Stop listening to events from an upstream event handler.
 *
 * @method unsubscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.unsubscribe = function unsubscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index >= 0) {
        this.upstream.splice(index, 1);
        for (var type in this.upstreamListeners) {
            source.removeListener(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

module.exports = EventHandler;
},{"./EventEmitter":"/Users/joseph/code/touchRunner/Source/Events/EventEmitter.js"}],"/Users/joseph/code/touchRunner/Source/GL/GL.js":[function(require,module,exports){
var ImageLoader  = require('../Game/ImageLoader');
var AjaxLoader   = require('../Game/AjaxLoader');
var Timer        = require('../Utilities/Timer');
var WorldSprite  = require('./Sprites/WorldSprite');

function Renderer (options) {
    this.canvas = options.canvas;
    this.gl = this.canvas.getContext("webgl");
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;

    this.initShaders();
    this.initTextures(options.textures);

    initMatrices.call(this);

    this.worldSprite = new WorldSprite({
        gl: this.gl,
        texture: this.textures[0],
        shaderProgram: this.shaderProgram,
        pMatrix: this.pMatrix
    });

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.BLEND);
}

Renderer.prototype.update = function update () {
    this.render();
}

Renderer.prototype.render = function render() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    /* INITIALIZE MV MATRIX */
    mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);

    mat4.identity(this.mvMatrix);

    /* SET WORLD TEXTURE */
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
    this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);

    /* RENDER WORLD */
    this.worldSprite.render();
}

Renderer.prototype.initShaders = function initShaders(responseArray) {
	var vertexShaderData = AjaxLoader.get('../Shaders/VertexShader.glsl');
	var fragmentShaderData = AjaxLoader.get('../Shaders/FragmentShader.glsl');

    vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, vertexShaderData);
    this.gl.compileShader(vertexShader);

    this.gl.shaderSource(fragmentShader, fragmentShaderData);
    this.gl.compileShader(fragmentShader);

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) console.log("Could not initialise shaders");

    this.gl.useProgram(this.shaderProgram);

    this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

    this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
    this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

    this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
    this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler");
    this.shaderProgram.spriteCoord = this.gl.getUniformLocation(this.shaderProgram, "uSpriteCoord");
}

Renderer.prototype.initTextures = function initTextures(textures) {
    this.textures = [];

    for (var i = 0; i < textures.length; i++) {
       	this.textures[i] = this.gl.createTexture();
    	this.textures[i].image = ImageLoader.get(textures[i]);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textures[i].image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    };
}

function initMatrices () {
	this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();
}

module.exports = Renderer;
},{"../Game/AjaxLoader":"/Users/joseph/code/touchRunner/Source/Game/AjaxLoader.js","../Game/ImageLoader":"/Users/joseph/code/touchRunner/Source/Game/ImageLoader.js","../Utilities/Timer":"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js","./Sprites/WorldSprite":"/Users/joseph/code/touchRunner/Source/GL/Sprites/WorldSprite.js"}],"/Users/joseph/code/touchRunner/Source/GL/Sprites/WorldSprite.js":[function(require,module,exports){
var TouchHandler = require('../../Inputs/TouchHandler');

function WorldSprite (options) {
	this.gl = options.gl;
	this.shaderProgram = options.shaderProgram;

	this.matrix = mat4.create();
	this.position = [0, 0, -2.0];
	this.spriteCoord = [0.0, 0.0];

	TouchHandler.on('move', this.update.bind(this));

	initBuffers.call(this);
}

WorldSprite.prototype.update = function update(offset) {
	this.spriteCoord[0] -= 0.002 * offset[0];
	this.spriteCoord[1] -= 0.002 * offset[1];
}

WorldSprite.prototype.render = function render() {
	mat4.identity(this.matrix);
    mat4.translate(this.matrix, [this.position[0], this.position[1], this.position[2]]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.positionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.matrix);
    this.gl.uniform2f(this.shaderProgram.spriteCoord, this.spriteCoord[0], this.spriteCoord[1]);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
}

function initBuffers() {
	this.positionBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
	this.positionVertices = [
		-0.9,  0.9, 0.0,
		 0.9,  0.9, 0.0,
		-0.9, -0.9, 0.0,
		 0.9, -0.9, 0.0,
	];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positionVertices), this.gl.STATIC_DRAW);
    this.positionBuffer.itemSize = 3;
    this.positionBuffer.numItems = 4;

    this.textureBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
	this.textureVertices = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textureVertices), this.gl.STATIC_DRAW);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = 4;
}

module.exports = WorldSprite;
},{"../../Inputs/TouchHandler":"/Users/joseph/code/touchRunner/Source/Inputs/TouchHandler.js"}],"/Users/joseph/code/touchRunner/Source/Game/AjaxLoader.js":[function(require,module,exports){
var ASSET_TYPE = 'data';

var EventHandler       = require('../Events/EventHandler');

var TextLoader  = {};
var Storage  = {};

TextLoader.eventInput      = new EventHandler();
TextLoader.eventOutput     = new EventHandler();

EventHandler.setInputHandler(TextLoader, TextLoader.eventInput);
EventHandler.setOutputHandler(TextLoader, TextLoader.eventOutput);

TextLoader.load = function load(asset)
{
    var source = asset.source;
    if (!Storage[source])
    {
        var request = new XMLHttpRequest();
        request.open('GET', source);
        request.onreadystatechange = function(response){
            if(response.currentTarget.readyState === 4) {
                Storage[source] = response.currentTarget.responseText;
                finishedLoading(source);
            }
        }
        request.send();
    }
};

TextLoader.get  = function get(source)
{
    return Storage[source];
};

TextLoader.toString = function toString()
{
    return ASSET_TYPE;
};

function finishedLoading(source)
{
    TextLoader.eventOutput.emit('doneLoading', {source: source, type: ASSET_TYPE});
}

module.exports = TextLoader;
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js"}],"/Users/joseph/code/touchRunner/Source/Game/Engine.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');
var Timer              = require('../Utilities/Timer');

var Engine             = {};

Engine.eventInput      = new EventHandler();
Engine.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Engine, Engine.eventInput);
EventHandler.setOutputHandler(Engine, Engine.eventOutput);

Engine.currentState = null;

Engine.setState     = function setState(state)
{
	if (state.initialize) state.initialize();
	
	if (this.currentState)
	{
		this.currentState.unpipe(Engine.eventInput);
		this.currentState.hide();
	}

	state.pipe(this.eventInput);
	state.show();

	this.currentState = state;
};

Engine.step         = function step(time)
{
	Timer.update();
	var state = Engine.currentState;
	if (state)
	{
		if (state.update) state.update();
	}
};

module.exports = Engine;
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js","../Utilities/Timer":"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js"}],"/Users/joseph/code/touchRunner/Source/Game/ImageLoader.js":[function(require,module,exports){
var ASSET_TYPE = 'image';

var EventHandler       = require('../Events/EventHandler');

var ImageLoader  = {};
var Images       = {};

ImageLoader.eventInput      = new EventHandler();
ImageLoader.eventOutput     = new EventHandler();

EventHandler.setInputHandler(ImageLoader, ImageLoader.eventInput);
EventHandler.setOutputHandler(ImageLoader, ImageLoader.eventOutput);

ImageLoader.load = function load(asset)
{
    var source = asset.source;
    if (!Images[source])
    {
        var image = new Image();
        image.src = source;
        image.onload = function() {
            finishedLoading(source);
        };
        Images[source] = image;
    }
};

ImageLoader.get  = function get(source)
{
    return Images[source];
};

ImageLoader.toString = function toString()
{
    return ASSET_TYPE;
};

function finishedLoading(source)
{
    ImageLoader.eventOutput.emit('doneLoading', {source: source, type: ASSET_TYPE});
}

module.exports = ImageLoader;
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js"}],"/Users/joseph/code/touchRunner/Source/Game/Viewport.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');

var Viewport = {};

Viewport.eventInput      = new EventHandler();
Viewport.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Viewport, Viewport.eventInput);
EventHandler.setOutputHandler(Viewport, Viewport.eventOutput);

window.onresize = handleResize;

function handleResize()
{
	Viewport.eventOutput.emit('resize');
}

module.exports = Viewport;
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/KeyHandler.js":[function(require,module,exports){
var KEY_MAP = require('./keymap.js');
var KeyHandler = {};

KeyHandler.init = function init() {
	this._activeKeys = {};
	this._handlers = {};
	this._updateFns = [];
	this._press = {};

	this.EVENTTYPES = {
		'PRESS' : this._press
	}

	this.boundKeyDown = registerKeyDown.bind(this);
	this.boundKeyUp = registerKeyUp.bind(this);

	document.onkeydown = this.boundKeyDown;
	document.onkeyup = this.boundKeyUp;
}

KeyHandler.update = function update() {
	var handlers;
	var handlersLength;
	var updatesLength = this._updateFns.length;
	var i;
	
	for(var key in this._activeKeys){
		if(this._activeKeys[key] === true){
			handlers = this._handlers[key];
			if(handlers) {
				handlersLength = handlers.length;
				for (i = 0; i < handlersLength; i++) {
					handlers[i]();
				}
			}
		}
	}

	for (var i = 0; i < updatesLength; i++) {
		this._updateFns[i](this._activeKeys);
	}
}

KeyHandler.on = function on(eventName, callback) {
	eventName = eventName.toUpperCase();
	if( eventName.indexOf(':') !== -1 ) {
		var eventName = eventName.split(':');
		var key = eventName[0];
		var type = eventName[1];
		var storage = this.EVENTTYPES[eventName[1]];
		if( !storage ) throw "invalid eventType";
		if( !storage[key] ) storage[key] = [];
		storage[key].push(callback);
	}
	else if( KEY_MAP.letters[eventName] ) {
		if(!this._handlers[eventName]) this._handlers[eventName] = [];
		this._handlers[eventName].push(callback);
	}
	else if (eventName === "UPDATE") {
		this._updateFns.push(callback);
	}
	else throw "invalid eventName";
}

KeyHandler.off = function off(key, callback) {
	var callbackIndex;
	var callbacks;

	if(this._handlers[key]) {
		callbacks = this._handlers[key];
		callbackIndex = callbacks.indexOf(callback);
		if(callbackIndex !== -1) {
			callbacks.splice(callbackIndex, 1);
			if(!callbacks.length) {
				delete callbacks;
				delete this._activeKeys[key];
			}
		}
	}
}

function registerKeyDown(event) {
	var keyName = KEY_MAP.keys[event.keyCode];
	var pressEvents = this._press[keyName];
	if (keyName) this._activeKeys[keyName] = true;
	if (pressEvents) {
		for (var i = 0; i < pressEvents.length; i++) {
			pressEvents[i]();
		}
	}
}

function registerKeyUp(event) {
	var keyName = KEY_MAP.keys[event.keyCode];
	if (keyName) this._activeKeys[keyName] = false;
}

module.exports = KeyHandler;
},{"./keymap.js":"/Users/joseph/code/touchRunner/Source/Inputs/keymap.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/TouchHandler.js":[function(require,module,exports){
var Timer = require('../Utilities/Timer');

module.exports = {
	_position: [0, 0],
	_events: {
		"move": []
	},

	init: function init () {
		this._scrollable = document.createElement('div');
		this._scrollable.style.position = 'absolute';
		this._scrollable.style.top = '0px';
		this._scrollable.style.left = '0px';
		this._scrollable.style.width = innerWidth + 'px';
		this._scrollable.style.height = innerHeight + 'px';
		this._scrollable.style.overflowY = 'scroll';
    	this._scrollable.style.webkitOverflowScrolling = 'touch';

		this._insert = document.createElement('div');
		this._insert.style.width = (innerWidth * 2) + 'px';
		this._insert.style.height = (innerHeight * 2) + 'px';

		this._scrollable.appendChild(this._insert);

		document.body.appendChild(this._scrollable);

		this._scrollable.onscroll = this.handleScroll.bind(this);
		this._scrollable.ontouchend = this.handleTouchEnd.bind(this);
	},

	on: function on(eventName, callback) {
		if(!this._events[eventName]) throw "Invalid eventName: " + eventName;

		this._events[eventName].push(callback);
	},

	handleScroll: function handleScroll(e) {
		var offset = [
			this._position[0] - this._scrollable.scrollLeft,
			this._position[1] - this._scrollable.scrollTop
		];
		var touchMoveEvents = this._events["move"];
		for (var i = 0; i < touchMoveEvents.length; i++) {
			touchMoveEvents[i](offset);
		}

		this._position = [this._scrollable.scrollLeft, this._scrollable.scrollTop];
	},

	handleTouchEnd: function handleTouchEnd(e) {

	},
}
},{"../Utilities/Timer":"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/keymap.js":[function(require,module,exports){
module.exports = 
{
  'letters' : {
     'A': 65,
     'B': 66,
     'C': 67,
     'D': 68,
     'E': 69,
     'F': 70,
     'G': 71,
     'H': 72,
     'I': 73,
     'J': 74,
     'K': 75,
     'L': 76,
     'M': 77,
     'N': 78,
     'O': 79,
     'P': 80,
     'Q': 81,
     'R': 82,
     'S': 83,
     'T': 84,
     'U': 85,
     'V': 86,
     'W': 87,
     'X': 88,
     'Y': 89,
     'Z': 90,
     'ENTER': 13,
     'SHIFT': 16,
     'ESC': 27,
     'SPACE': 32,
     'LEFT': 37,
     'UP': 38,
     'RIGHT': 39,
     'DOWN' : 40
  },
  'keys' : {
     65 : 'A',
     66 : 'B',
     67 : 'C',
     68 : 'D',
     69 : 'E',
     70 : 'F',
     71 : 'G',
     72 : 'H',
     73 : 'I',
     74 : 'J',
     75 : 'K',
     76 : 'L',
     77 : 'M',
     78 : 'N',
     79 : 'O',
     80 : 'P',
     81 : 'Q',
     82 : 'R',
     83 : 'S',
     84 : 'T',
     85 : 'U',
     86 : 'V',
     87 : 'W',
     88 : 'X',
     89 : 'Y',
     90 : 'Z',
     13 : 'ENTER',
     16 : 'SHIFT',
     27 : 'ESC',
     32 : 'SPACE',
     37 : 'LEFT',
     38 : 'UP',
     39 : 'RIGHT',
     40 : 'DOWN'
  }
}
},{}],"/Users/joseph/code/touchRunner/Source/States/Loading.js":[function(require,module,exports){
var COMPLETE = "complete";
var LOAD_STARTED = "startLoading";
var LOAD_COMPLETED = "doneLoading";
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Loading          = {};
var bodyReady        = false;
var assetStack       = [];
var loaderRegistry   = {};
var container        = null;
var splashScreen     = new Image();
splashScreen.src     = '../../Assets/Loading....png';
splashScreen.width   = splashWidth = 500;
splashScreen.height  = splashHeight = 160;
Loading.eventInput      = new EventHandler();
Loading.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Loading, Loading.eventInput);
EventHandler.setOutputHandler(Loading, Loading.eventOutput);

Loading.eventInput.on(LOAD_COMPLETED, handleCompletedLoad);
Loading.eventInput.on('resize', handleResize);

Loading.initialize = function initialize()
{
    if (!container)
    {
        container = document.getElementById('loading');
        container.appendChild(splashScreen);
        splashScreen.style.position = 'absolute';
        splashScreen.style.top = (window.innerHeight * 0.5) - (splashHeight * 0.5) + 'px';
        splashScreen.style.left = (window.innerWidth * 0.5) - (splashWidth* 0.5) + 'px';
    }
    if (assetStack.length)
    {
        this.eventOutput.emit(LOAD_STARTED);
        for (var i = 0; i < assetStack.length; i++)
        {
            var asset  = assetStack[i];
            var loader = asset.type;
            loaderRegistry[loader].load(asset);
        }
    }
};

Loading.load       = function load(asset)
{
    if(Array.isArray(asset))
    {
        Array.prototype.push.apply(assetStack, asset);
    }
    else
    {
        assetStack.push(asset);
    }
};

Loading.show       = function show()
{
    container.style.display = VISIBLE;
};

Loading.hide       = function hide()
{
    container.style.display = NONE;
};

Loading.register   = function register(loader)
{
    var loaderName             = loader.toString();
    loaderRegistry[loaderName] = loader;
    loader.pipe(this.eventInput);
};

function handleCompletedLoad(data)
{
    setTimeout(function()
    {
        var source = data.source;
        var location = assetStack.indexOf(source);
        if (location) assetStack.splice(location, 1);
        if (!assetStack.length) Loading.eventOutput.emit(LOAD_COMPLETED);
    }, 1000);
}

function handleResize()
{
    splashScreen.style.top = (window.innerHeight * 0.5) - (splashHeight * 0.5) + 'px';
    splashScreen.style.left = (window.innerWidth * 0.5) - (splashWidth* 0.5) + 'px';
}

module.exports = Loading;
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js"}],"/Users/joseph/code/touchRunner/Source/States/Menu.js":[function(require,module,exports){
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Menu          = {};

Menu.eventInput      = new EventHandler();
Menu.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Menu, Menu.eventInput);
EventHandler.setOutputHandler(Menu, Menu.eventOutput);

Menu.eventInput.on('resize', handleResize);

var menuElement = null,
container       = null,
newGame         = null;

Menu.initialize = function initialize()
{
    container = document.getElementById('menu');
    menuElement = document.createElement('div');
    menuElement.style.position = 'absolute';
    newGame     = document.createElement('div');
    newGame.onclick = startNewGame;
    newGame.innerHTML = 'New Game';
    newGame.style.fontSize = '50px';
    newGame.style.fontFamily = 'Helvetica';
    newGame.style.color = '#FFF';
    menuElement.appendChild(newGame);
    container.appendChild(menuElement);
    menuElement.style.top  = (window.innerHeight * 0.5) - (58 * 0.5) + 'px';
    menuElement.style.left = (window.innerWidth * 0.5) - (251 * 0.5) + 'px';
};

Menu.show       = function show()
{
    container.style.display = VISIBLE;
};

Menu.hide       = function hide()
{
    container.style.display = NONE;
};

function handleResize()
{
    menuElement.style.top = (window.innerHeight * 0.5) - (58 * 0.5) + 'px';
    menuElement.style.left = (window.innerWidth * 0.5) - (251 * 0.5) + 'px';
}

function startNewGame()
{
    Menu.eventOutput.emit('newGame');
}

module.exports = Menu;
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js"}],"/Users/joseph/code/touchRunner/Source/States/Playing.js":[function(require,module,exports){
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
	TouchHandler.init();
	this.renderer = new Renderer({
		canvas: this.canvas,
		textures: [
			'../Assets/crate.gif'
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
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js","../GL/GL":"/Users/joseph/code/touchRunner/Source/GL/GL.js","../Inputs/KeyHandler":"/Users/joseph/code/touchRunner/Source/Inputs/KeyHandler.js","../Inputs/TouchHandler":"/Users/joseph/code/touchRunner/Source/Inputs/TouchHandler.js"}],"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js":[function(require,module,exports){
module.exports = {
	_once: [],
	_every: [],
	_getter: performance || Date,

	update: function update(){
		var currentTime = this._getter.now();
		var timerEvent;
		var newElapsedTime = currentTime - this._initialTime;

		if(!this._initialTime) this._initialTime = currentTime;
		// console.log(newElapsedTime)
		this._frameDuration = newElapsedTime - this._elapsed;
		this._elapsed = currentTime - this._initialTime;

		for (var i = 0; i < this._once.length; i++) {
			if(this._elapsed > this._once[i].trigger) {
				timerEvent = this._once[i];
				timerEvent.callback();
				this._once.splice(i, 1);
			}
		}

		for (var i = 0; i < this._every.length; i++) {
			if(this._elapsed > this._every[i].trigger) {
				timerEvent = this._every[i];
				timerEvent.callback();
				timerEvent.trigger = this._elapsed + timerEvent.timeout
			}
		}
	},

	getElapsed: function getElapsed() {
		return this._elapsed;
	},

	getFrameDuration: function getFrameDuration() {
		return this._frameDuration;
	},

	after: function after(callback, timeout) {
		this._once.push({
			callback: callback,
			trigger: this._elapsed + timeout
		});
	},

	every: function every(callback, timeout) {
		this._every.push({
			callback: callback,
			trigger: this._elapsed + timeout,
			timeout: timeout
		})
	}
};
},{}],"/Users/joseph/code/touchRunner/Source/main.js":[function(require,module,exports){
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
},{"./Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js","./Game/AjaxLoader":"/Users/joseph/code/touchRunner/Source/Game/AjaxLoader.js","./Game/Engine":"/Users/joseph/code/touchRunner/Source/Game/Engine.js","./Game/ImageLoader":"/Users/joseph/code/touchRunner/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/joseph/code/touchRunner/Source/Game/Viewport.js","./States/Loading":"/Users/joseph/code/touchRunner/Source/States/Loading.js","./States/Menu":"/Users/joseph/code/touchRunner/Source/States/Menu.js","./States/Playing":"/Users/joseph/code/touchRunner/Source/States/Playing.js"}]},{},["/Users/joseph/code/touchRunner/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9FdmVudHMvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9FdmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HTC9HTC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvR0wvU3ByaXRlcy9Xb3JsZFNwcml0ZS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvR2FtZS9BamF4TG9hZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HYW1lL0VuZ2luZS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvR2FtZS9JbWFnZUxvYWRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvR2FtZS9WaWV3cG9ydC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvSW5wdXRzL0tleUhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL0lucHV0cy9Ub3VjaEhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL0lucHV0cy9rZXltYXAuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL1N0YXRlcy9Mb2FkaW5nLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9TdGF0ZXMvTWVudS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvU3RhdGVzL1BsYXlpbmcuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL1V0aWxpdGllcy9UaW1lci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4qIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbipcbiogT3duZXI6IG1hcmtAZmFtby51c1xuKiBAbGljZW5zZSBNUEwgMi4wXG4qIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuKi9cblxuLyoqXG4gKiBFdmVudEVtaXR0ZXIgcmVwcmVzZW50cyBhIGNoYW5uZWwgZm9yIGV2ZW50cy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRFbWl0dGVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0ge307XG4gICAgdGhpcy5fb3duZXIgPSB0aGlzO1xufVxuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQsIHNlbmRpbmcgdG8gYWxsIGRvd25zdHJlYW0gaGFuZGxlcnNcbiAqICAgbGlzdGVuaW5nIGZvciBwcm92aWRlZCAndHlwZScga2V5LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBldmVudCBkYXRhXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlLCBldmVudCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMubGlzdGVuZXJzW3R5cGVdO1xuICAgIGlmIChoYW5kbGVycykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tpXS5jYWxsKHRoaXMuX293bmVyLCBldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgaWYgKCEodHlwZSBpbiB0aGlzLmxpc3RlbmVycykpIHRoaXMubGlzdGVuZXJzW3R5cGVdID0gW107XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPCAwKSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5wdXNoKGhhbmRsZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgXCJvblwiLlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBVbmJpbmQgYW4gZXZlbnQgYnkgdHlwZSBhbmQgaGFuZGxlci5cbiAqICAgVGhpcyB1bmRvZXMgdGhlIHdvcmsgb2YgXCJvblwiLlxuICpcbiAqIEBtZXRob2QgcmVtb3ZlTGlzdGVuZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyIGZ1bmN0aW9uIG9iamVjdCB0byByZW1vdmVcbiAqIEByZXR1cm4ge0V2ZW50RW1pdHRlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgaGFuZGxlcikge1xuICAgIHZhciBpbmRleCA9IHRoaXMubGlzdGVuZXJzW3R5cGVdLmluZGV4T2YoaGFuZGxlcik7XG4gICAgaWYgKGluZGV4ID49IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENhbGwgZXZlbnQgaGFuZGxlcnMgd2l0aCB0aGlzIHNldCB0byBvd25lci5cbiAqXG4gKiBAbWV0aG9kIGJpbmRUaGlzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG93bmVyIG9iamVjdCB0aGlzIEV2ZW50RW1pdHRlciBiZWxvbmdzIHRvXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYmluZFRoaXMgPSBmdW5jdGlvbiBiaW5kVGhpcyhvd25lcikge1xuICAgIHRoaXMuX293bmVyID0gb3duZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4qIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbipcbiogT3duZXI6IG1hcmtAZmFtby51c1xuKiBAbGljZW5zZSBNUEwgMi4wXG4qIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuKi9cblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4vRXZlbnRFbWl0dGVyJyk7XG5cbi8qKlxuICogRXZlbnRIYW5kbGVyIGZvcndhcmRzIHJlY2VpdmVkIGV2ZW50cyB0byBhIHNldCBvZiBwcm92aWRlZCBjYWxsYmFjayBmdW5jdGlvbnMuXG4gKiBJdCBhbGxvd3MgZXZlbnRzIHRvIGJlIGNhcHR1cmVkLCBwcm9jZXNzZWQsIGFuZCBvcHRpb25hbGx5IHBpcGVkIHRocm91Z2ggdG8gb3RoZXIgZXZlbnQgaGFuZGxlcnMuXG4gKlxuICogQGNsYXNzIEV2ZW50SGFuZGxlclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRXZlbnRIYW5kbGVyKCkge1xuICAgIEV2ZW50RW1pdHRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5kb3duc3RyZWFtID0gW107IC8vIGRvd25zdHJlYW0gZXZlbnQgaGFuZGxlcnNcbiAgICB0aGlzLmRvd25zdHJlYW1GbiA9IFtdOyAvLyBkb3duc3RyZWFtIGZ1bmN0aW9uc1xuXG4gICAgdGhpcy51cHN0cmVhbSA9IFtdOyAvLyB1cHN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMgPSB7fTsgLy8gdXBzdHJlYW0gbGlzdGVuZXJzXG59XG5FdmVudEhhbmRsZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudEVtaXR0ZXIucHJvdG90eXBlKTtcbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBFdmVudEhhbmRsZXI7XG5cbi8qKlxuICogQXNzaWduIGFuIGV2ZW50IGhhbmRsZXIgdG8gcmVjZWl2ZSBhbiBvYmplY3QncyBpbnB1dCBldmVudHMuXG4gKlxuICogQG1ldGhvZCBzZXRJbnB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggdHJpZ2dlciwgc3Vic2NyaWJlLCBhbmQgdW5zdWJzY3JpYmUgZnVuY3Rpb25zIGludG9cbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSBoYW5kbGVyIGFzc2lnbmVkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldElucHV0SGFuZGxlcihvYmplY3QsIGhhbmRsZXIpIHtcbiAgICBvYmplY3QudHJpZ2dlciA9IGhhbmRsZXIudHJpZ2dlci5iaW5kKGhhbmRsZXIpO1xuICAgIGlmIChoYW5kbGVyLnN1YnNjcmliZSAmJiBoYW5kbGVyLnVuc3Vic2NyaWJlKSB7XG4gICAgICAgIG9iamVjdC5zdWJzY3JpYmUgPSBoYW5kbGVyLnN1YnNjcmliZS5iaW5kKGhhbmRsZXIpO1xuICAgICAgICBvYmplY3QudW5zdWJzY3JpYmUgPSBoYW5kbGVyLnVuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIG91dHB1dCBldmVudHMuXG4gKlxuICogQG1ldGhvZCBzZXRPdXRwdXRIYW5kbGVyXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvYmplY3QgdG8gbWl4IHBpcGUsIHVucGlwZSwgb24sIGFkZExpc3RlbmVyLCBhbmQgcmVtb3ZlTGlzdGVuZXIgZnVuY3Rpb25zIGludG9cbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSBoYW5kbGVyIGFzc2lnbmVkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIgPSBmdW5jdGlvbiBzZXRPdXRwdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIGlmIChoYW5kbGVyIGluc3RhbmNlb2YgRXZlbnRIYW5kbGVyKSBoYW5kbGVyLmJpbmRUaGlzKG9iamVjdCk7XG4gICAgb2JqZWN0LnBpcGUgPSBoYW5kbGVyLnBpcGUuYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QudW5waXBlID0gaGFuZGxlci51bnBpcGUuYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3Qub24gPSBoYW5kbGVyLm9uLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0LmFkZExpc3RlbmVyID0gb2JqZWN0Lm9uO1xuICAgIG9iamVjdC5yZW1vdmVMaXN0ZW5lciA9IGhhbmRsZXIucmVtb3ZlTGlzdGVuZXIuYmluZChoYW5kbGVyKTtcbn07XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmRvd25zdHJlYW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKSB0aGlzLmRvd25zdHJlYW1baV0udHJpZ2dlcih0eXBlLCBldmVudCk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmRvd25zdHJlYW1Gbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmRvd25zdHJlYW1GbltpXSh0eXBlLCBldmVudCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgZW1pdFxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnRyaWdnZXIgPSBFdmVudEhhbmRsZXIucHJvdG90eXBlLmVtaXQ7XG5cbi8qKlxuICogQWRkIGV2ZW50IGhhbmRsZXIgb2JqZWN0IHRvIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICpcbiAqIEBtZXRob2QgcGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgZXZlbnQgaGFuZGxlciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHBhc3NlZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uIHBpcGUodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldC5zdWJzY3JpYmUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuIHRhcmdldC5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPCAwKSBkb3duc3RyZWFtQ3R4LnB1c2godGFyZ2V0KTtcblxuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCdwaXBlJywgbnVsbCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCdwaXBlJywgbnVsbCk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGFuZGxlciBvYmplY3QgZnJvbSBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqICAgVW5kb2VzIHdvcmsgb2YgXCJwaXBlXCIuXG4gKlxuICogQG1ldGhvZCB1bnBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IHRhcmdldCBoYW5kbGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwcm92aWRlZCB0YXJnZXRcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS51bnBpcGUgPSBmdW5jdGlvbiB1bnBpcGUodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldC51bnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnVuc3Vic2NyaWJlKHRoaXMpO1xuXG4gICAgdmFyIGRvd25zdHJlYW1DdHggPSAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pID8gdGhpcy5kb3duc3RyZWFtRm4gOiB0aGlzLmRvd25zdHJlYW07XG4gICAgdmFyIGluZGV4ID0gZG93bnN0cmVhbUN0eC5pbmRleE9mKHRhcmdldCk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgZG93bnN0cmVhbUN0eC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHRhcmdldCgndW5waXBlJywgbnVsbCk7XG4gICAgICAgIGVsc2UgaWYgKHRhcmdldC50cmlnZ2VyKSB0YXJnZXQudHJpZ2dlcigndW5waXBlJywgbnVsbCk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgb2JqZWN0LlxuICpcbiAqIEBtZXRob2QgXCJvblwiXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24odHlwZSwgaGFuZGxlcikge1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMpKSB7XG4gICAgICAgIHZhciB1cHN0cmVhbUxpc3RlbmVyID0gdGhpcy50cmlnZ2VyLmJpbmQodGhpcywgdHlwZSk7XG4gICAgICAgIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0gPSB1cHN0cmVhbUxpc3RlbmVyO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudXBzdHJlYW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudXBzdHJlYW1baV0ub24odHlwZSwgdXBzdHJlYW1MaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCJcbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUub247XG5cbi8qKlxuICogTGlzdGVuIGZvciBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2Qgc3Vic2NyaWJlXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IHNvdXJjZSBzb3VyY2UgZW1pdHRlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIHN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIHRoaXMudXBzdHJlYW0ucHVzaChzb3VyY2UpO1xuICAgICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHNvdXJjZS5vbih0eXBlLCB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnRzIGZyb20gYW4gdXBzdHJlYW0gZXZlbnQgaGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIHVuc3Vic2NyaWJlXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IHNvdXJjZSBzb3VyY2UgZW1pdHRlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gdW5zdWJzY3JpYmUoc291cmNlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy51cHN0cmVhbS5pbmRleE9mKHNvdXJjZSk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcih0eXBlLCB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRIYW5kbGVyOyIsInZhciBJbWFnZUxvYWRlciAgPSByZXF1aXJlKCcuLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG52YXIgQWpheExvYWRlciAgID0gcmVxdWlyZSgnLi4vR2FtZS9BamF4TG9hZGVyJyk7XG52YXIgVGltZXIgICAgICAgID0gcmVxdWlyZSgnLi4vVXRpbGl0aWVzL1RpbWVyJyk7XG52YXIgV29ybGRTcHJpdGUgID0gcmVxdWlyZSgnLi9TcHJpdGVzL1dvcmxkU3ByaXRlJyk7XG5cbmZ1bmN0aW9uIFJlbmRlcmVyIChvcHRpb25zKSB7XG4gICAgdGhpcy5jYW52YXMgPSBvcHRpb25zLmNhbnZhcztcbiAgICB0aGlzLmdsID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpO1xuICAgIHRoaXMuZ2wudmlld3BvcnRXaWR0aCA9IHRoaXMuY2FudmFzLndpZHRoO1xuICAgIHRoaXMuZ2wudmlld3BvcnRIZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG5cbiAgICB0aGlzLmluaXRTaGFkZXJzKCk7XG4gICAgdGhpcy5pbml0VGV4dHVyZXMob3B0aW9ucy50ZXh0dXJlcyk7XG5cbiAgICBpbml0TWF0cmljZXMuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMud29ybGRTcHJpdGUgPSBuZXcgV29ybGRTcHJpdGUoe1xuICAgICAgICBnbDogdGhpcy5nbCxcbiAgICAgICAgdGV4dHVyZTogdGhpcy50ZXh0dXJlc1swXSxcbiAgICAgICAgc2hhZGVyUHJvZ3JhbTogdGhpcy5zaGFkZXJQcm9ncmFtLFxuICAgICAgICBwTWF0cml4OiB0aGlzLnBNYXRyaXhcbiAgICB9KTtcblxuICAgIHRoaXMuZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xuICAgIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuQkxFTkQpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHRoaXMuZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5nbC52aWV3cG9ydFdpZHRoLCB0aGlzLmdsLnZpZXdwb3J0SGVpZ2h0KTtcbiAgICB0aGlzLmdsLmNsZWFyKHRoaXMuZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IHRoaXMuZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG5cbiAgICAvKiBJTklUSUFMSVpFIE1WIE1BVFJJWCAqL1xuICAgIG1hdDQucGVyc3BlY3RpdmUoNDUsIHRoaXMuZ2wudmlld3BvcnRXaWR0aCAvIHRoaXMuZ2wudmlld3BvcnRIZWlnaHQsIDAuMSwgMTAwLjAsIHRoaXMucE1hdHJpeCk7XG4gICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS5wTWF0cml4VW5pZm9ybSwgZmFsc2UsIHRoaXMucE1hdHJpeCk7XG5cbiAgICBtYXQ0LmlkZW50aXR5KHRoaXMubXZNYXRyaXgpO1xuXG4gICAgLyogU0VUIFdPUkxEIFRFWFRVUkUgKi9cbiAgICB0aGlzLmdsLmFjdGl2ZVRleHR1cmUodGhpcy5nbC5URVhUVVJFMCk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZXNbMF0pO1xuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHRoaXMuc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSwgMCk7XG5cbiAgICAvKiBSRU5ERVIgV09STEQgKi9cbiAgICB0aGlzLndvcmxkU3ByaXRlLnJlbmRlcigpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuaW5pdFNoYWRlcnMgPSBmdW5jdGlvbiBpbml0U2hhZGVycyhyZXNwb25zZUFycmF5KSB7XG5cdHZhciB2ZXJ0ZXhTaGFkZXJEYXRhID0gQWpheExvYWRlci5nZXQoJy4uL1NoYWRlcnMvVmVydGV4U2hhZGVyLmdsc2wnKTtcblx0dmFyIGZyYWdtZW50U2hhZGVyRGF0YSA9IEFqYXhMb2FkZXIuZ2V0KCcuLi9TaGFkZXJzL0ZyYWdtZW50U2hhZGVyLmdsc2wnKTtcblxuICAgIHZlcnRleFNoYWRlciA9IHRoaXMuZ2wuY3JlYXRlU2hhZGVyKHRoaXMuZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcih0aGlzLmdsLkZSQUdNRU5UX1NIQURFUik7XG5cbiAgICB0aGlzLmdsLnNoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXIsIHZlcnRleFNoYWRlckRhdGEpO1xuICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuXG4gICAgdGhpcy5nbC5zaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXIsIGZyYWdtZW50U2hhZGVyRGF0YSk7XG4gICAgdGhpcy5nbC5jb21waWxlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbSA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKHRoaXMuc2hhZGVyUHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcbiAgICB0aGlzLmdsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIGZyYWdtZW50U2hhZGVyKTtcbiAgICB0aGlzLmdsLmxpbmtQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICBpZiAoIXRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnNoYWRlclByb2dyYW0sIHRoaXMuZ2wuTElOS19TVEFUVVMpKSBjb25zb2xlLmxvZyhcIkNvdWxkIG5vdCBpbml0aWFsaXNlIHNoYWRlcnNcIik7XG5cbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcblxuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSA9IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcbiAgICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSk7XG5cbiAgICB0aGlzLnNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlID0gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwiYVRleHR1cmVDb29yZFwiKTtcbiAgICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuc2hhZGVyUHJvZ3JhbS50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUpO1xuXG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVQTWF0cml4XCIpO1xuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS5tdk1hdHJpeFVuaWZvcm0gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwidU1WTWF0cml4XCIpO1xuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJ1U2FtcGxlclwiKTtcbiAgICB0aGlzLnNoYWRlclByb2dyYW0uc3ByaXRlQ29vcmQgPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwidVNwcml0ZUNvb3JkXCIpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuaW5pdFRleHR1cmVzID0gZnVuY3Rpb24gaW5pdFRleHR1cmVzKHRleHR1cmVzKSB7XG4gICAgdGhpcy50ZXh0dXJlcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgIFx0dGhpcy50ZXh0dXJlc1tpXSA9IHRoaXMuZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIFx0dGhpcy50ZXh0dXJlc1tpXS5pbWFnZSA9IEltYWdlTG9hZGVyLmdldCh0ZXh0dXJlc1tpXSk7XG5cbiAgICAgICAgdGhpcy5nbC5waXhlbFN0b3JlaSh0aGlzLmdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICAgICAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlc1tpXSk7XG4gICAgICAgIHRoaXMuZ2wudGV4SW1hZ2UyRCh0aGlzLmdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZ2wuUkdCQSwgdGhpcy5nbC5SR0JBLCB0aGlzLmdsLlVOU0lHTkVEX0JZVEUsIHRoaXMudGV4dHVyZXNbaV0uaW1hZ2UpO1xuICAgICAgICB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5nbC5MSU5FQVIpO1xuICAgICAgICAvLyB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5nbC5MSU5FQVJfTUlQTUFQX0xJTkVBUik7XG4gICAgICAgIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLmdsLkxJTkVBUik7XG4gICAgICAgIHRoaXMuZ2wuZ2VuZXJhdGVNaXBtYXAodGhpcy5nbC5URVhUVVJFXzJEKTtcbiAgICAgICAgLy90aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLmdsLlJFUEVBVCk7XG4gICAgICAgIC8vdGhpcy5nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5nbC5URVhUVVJFX1dSQVBfVCwgdGhpcy5nbC5SRVBFQVQpO1xuXG4gICAgICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy5nbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpbml0TWF0cmljZXMgKCkge1xuXHR0aGlzLm12TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcbiAgICB0aGlzLm12TWF0cml4U3RhY2sgPSBbXTtcbiAgICB0aGlzLnBNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyOyIsInZhciBUb3VjaEhhbmRsZXIgPSByZXF1aXJlKCcuLi8uLi9JbnB1dHMvVG91Y2hIYW5kbGVyJyk7XG5cbmZ1bmN0aW9uIFdvcmxkU3ByaXRlIChvcHRpb25zKSB7XG5cdHRoaXMuZ2wgPSBvcHRpb25zLmdsO1xuXHR0aGlzLnNoYWRlclByb2dyYW0gPSBvcHRpb25zLnNoYWRlclByb2dyYW07XG5cblx0dGhpcy5tYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xuXHR0aGlzLnBvc2l0aW9uID0gWzAsIDAsIC0yLjBdO1xuXHR0aGlzLnNwcml0ZUNvb3JkID0gWzAuMCwgMC4wXTtcblxuXHRUb3VjaEhhbmRsZXIub24oJ21vdmUnLCB0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcblxuXHRpbml0QnVmZmVycy5jYWxsKHRoaXMpO1xufVxuXG5Xb3JsZFNwcml0ZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKG9mZnNldCkge1xuXHR0aGlzLnNwcml0ZUNvb3JkWzBdIC09IDAuMDAyICogb2Zmc2V0WzBdO1xuXHR0aGlzLnNwcml0ZUNvb3JkWzFdIC09IDAuMDAyICogb2Zmc2V0WzFdO1xufVxuXG5Xb3JsZFNwcml0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRtYXQ0LmlkZW50aXR5KHRoaXMubWF0cml4KTtcbiAgICBtYXQ0LnRyYW5zbGF0ZSh0aGlzLm1hdHJpeCwgW3RoaXMucG9zaXRpb25bMF0sIHRoaXMucG9zaXRpb25bMV0sIHRoaXMucG9zaXRpb25bMl1dKTtcblxuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQnVmZmVyKTtcbiAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5zaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgdGhpcy50ZXh0dXJlQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMucG9zaXRpb25CdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLnNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIHRoaXMucG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdih0aGlzLnNoYWRlclByb2dyYW0ubXZNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5tYXRyaXgpO1xuICAgIHRoaXMuZ2wudW5pZm9ybTJmKHRoaXMuc2hhZGVyUHJvZ3JhbS5zcHJpdGVDb29yZCwgdGhpcy5zcHJpdGVDb29yZFswXSwgdGhpcy5zcHJpdGVDb29yZFsxXSk7XG5cbiAgICB0aGlzLmdsLmRyYXdBcnJheXModGhpcy5nbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5wb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyk7XG59XG5cbmZ1bmN0aW9uIGluaXRCdWZmZXJzKCkge1xuXHR0aGlzLnBvc2l0aW9uQnVmZmVyID0gdGhpcy5nbC5jcmVhdGVCdWZmZXIoKTtcblx0dGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnBvc2l0aW9uQnVmZmVyKTtcblx0dGhpcy5wb3NpdGlvblZlcnRpY2VzID0gW1xuXHRcdC0wLjksICAwLjksIDAuMCxcblx0XHQgMC45LCAgMC45LCAwLjAsXG5cdFx0LTAuOSwgLTAuOSwgMC4wLFxuXHRcdCAwLjksIC0wLjksIDAuMCxcblx0XTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb3NpdGlvblZlcnRpY2VzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG4gICAgdGhpcy5wb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSA9IDM7XG4gICAgdGhpcy5wb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyA9IDQ7XG5cbiAgICB0aGlzLnRleHR1cmVCdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMudGV4dHVyZUJ1ZmZlcik7XG5cdHRoaXMudGV4dHVyZVZlcnRpY2VzID0gW1xuXHRcdDAuMCwgMC4wLFxuXHRcdDEuMCwgMC4wLFxuXHRcdDAuMCwgMS4wLFxuXHRcdDEuMCwgMS4wXG5cdF07XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHRoaXMudGV4dHVyZVZlcnRpY2VzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG4gICAgdGhpcy50ZXh0dXJlQnVmZmVyLml0ZW1TaXplID0gMjtcbiAgICB0aGlzLnRleHR1cmVCdWZmZXIubnVtSXRlbXMgPSA0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmxkU3ByaXRlOyIsInZhciBBU1NFVF9UWVBFID0gJ2RhdGEnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgVGV4dExvYWRlciAgPSB7fTtcbnZhciBTdG9yYWdlICA9IHt9O1xuXG5UZXh0TG9hZGVyLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblRleHRMb2FkZXIuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFRleHRMb2FkZXIsIFRleHRMb2FkZXIuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihUZXh0TG9hZGVyLCBUZXh0TG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuVGV4dExvYWRlci5sb2FkID0gZnVuY3Rpb24gbG9hZChhc3NldClcbntcbiAgICB2YXIgc291cmNlID0gYXNzZXQuc291cmNlO1xuICAgIGlmICghU3RvcmFnZVtzb3VyY2VdKVxuICAgIHtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgcmVxdWVzdC5vcGVuKCdHRVQnLCBzb3VyY2UpO1xuICAgICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIGlmKHJlc3BvbnNlLmN1cnJlbnRUYXJnZXQucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIFN0b3JhZ2Vbc291cmNlXSA9IHJlc3BvbnNlLmN1cnJlbnRUYXJnZXQucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgIH1cbn07XG5cblRleHRMb2FkZXIuZ2V0ICA9IGZ1bmN0aW9uIGdldChzb3VyY2UpXG57XG4gICAgcmV0dXJuIFN0b3JhZ2Vbc291cmNlXTtcbn07XG5cblRleHRMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIFRleHRMb2FkZXIuZXZlbnRPdXRwdXQuZW1pdCgnZG9uZUxvYWRpbmcnLCB7c291cmNlOiBzb3VyY2UsIHR5cGU6IEFTU0VUX1RZUEV9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0TG9hZGVyOyIsInZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgVGltZXIgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vVXRpbGl0aWVzL1RpbWVyJyk7XG5cbnZhciBFbmdpbmUgICAgICAgICAgICAgPSB7fTtcblxuRW5naW5lLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbkVuZ2luZS5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoRW5naW5lLCBFbmdpbmUuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihFbmdpbmUsIEVuZ2luZS5ldmVudE91dHB1dCk7XG5cbkVuZ2luZS5jdXJyZW50U3RhdGUgPSBudWxsO1xuXG5FbmdpbmUuc2V0U3RhdGUgICAgID0gZnVuY3Rpb24gc2V0U3RhdGUoc3RhdGUpXG57XG5cdGlmIChzdGF0ZS5pbml0aWFsaXplKSBzdGF0ZS5pbml0aWFsaXplKCk7XG5cdFxuXHRpZiAodGhpcy5jdXJyZW50U3RhdGUpXG5cdHtcblx0XHR0aGlzLmN1cnJlbnRTdGF0ZS51bnBpcGUoRW5naW5lLmV2ZW50SW5wdXQpO1xuXHRcdHRoaXMuY3VycmVudFN0YXRlLmhpZGUoKTtcblx0fVxuXG5cdHN0YXRlLnBpcGUodGhpcy5ldmVudElucHV0KTtcblx0c3RhdGUuc2hvdygpO1xuXG5cdHRoaXMuY3VycmVudFN0YXRlID0gc3RhdGU7XG59O1xuXG5FbmdpbmUuc3RlcCAgICAgICAgID0gZnVuY3Rpb24gc3RlcCh0aW1lKVxue1xuXHRUaW1lci51cGRhdGUoKTtcblx0dmFyIHN0YXRlID0gRW5naW5lLmN1cnJlbnRTdGF0ZTtcblx0aWYgKHN0YXRlKVxuXHR7XG5cdFx0aWYgKHN0YXRlLnVwZGF0ZSkgc3RhdGUudXBkYXRlKCk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW5naW5lOyIsInZhciBBU1NFVF9UWVBFID0gJ2ltYWdlJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEltYWdlTG9hZGVyICA9IHt9O1xudmFyIEltYWdlcyAgICAgICA9IHt9O1xuXG5JbWFnZUxvYWRlci5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5JbWFnZUxvYWRlci5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuSW1hZ2VMb2FkZXIubG9hZCA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgdmFyIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICBpZiAoIUltYWdlc1tzb3VyY2VdKVxuICAgIHtcbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLnNyYyA9IHNvdXJjZTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmaW5pc2hlZExvYWRpbmcoc291cmNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW1hZ2VzW3NvdXJjZV0gPSBpbWFnZTtcbiAgICB9XG59O1xuXG5JbWFnZUxvYWRlci5nZXQgID0gZnVuY3Rpb24gZ2V0KHNvdXJjZSlcbntcbiAgICByZXR1cm4gSW1hZ2VzW3NvdXJjZV07XG59O1xuXG5JbWFnZUxvYWRlci50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKClcbntcbiAgICByZXR1cm4gQVNTRVRfVFlQRTtcbn07XG5cbmZ1bmN0aW9uIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpXG57XG4gICAgSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQuZW1pdCgnZG9uZUxvYWRpbmcnLCB7c291cmNlOiBzb3VyY2UsIHR5cGU6IEFTU0VUX1RZUEV9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxvYWRlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgVmlld3BvcnQgPSB7fTtcblxuVmlld3BvcnQuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuVmlld3BvcnQuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudE91dHB1dCk7XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGhhbmRsZVJlc2l6ZTtcblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcblx0Vmlld3BvcnQuZXZlbnRPdXRwdXQuZW1pdCgncmVzaXplJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7IiwidmFyIEtFWV9NQVAgPSByZXF1aXJlKCcuL2tleW1hcC5qcycpO1xudmFyIEtleUhhbmRsZXIgPSB7fTtcblxuS2V5SGFuZGxlci5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcblx0dGhpcy5fYWN0aXZlS2V5cyA9IHt9O1xuXHR0aGlzLl9oYW5kbGVycyA9IHt9O1xuXHR0aGlzLl91cGRhdGVGbnMgPSBbXTtcblx0dGhpcy5fcHJlc3MgPSB7fTtcblxuXHR0aGlzLkVWRU5UVFlQRVMgPSB7XG5cdFx0J1BSRVNTJyA6IHRoaXMuX3ByZXNzXG5cdH1cblxuXHR0aGlzLmJvdW5kS2V5RG93biA9IHJlZ2lzdGVyS2V5RG93bi5iaW5kKHRoaXMpO1xuXHR0aGlzLmJvdW5kS2V5VXAgPSByZWdpc3RlcktleVVwLmJpbmQodGhpcyk7XG5cblx0ZG9jdW1lbnQub25rZXlkb3duID0gdGhpcy5ib3VuZEtleURvd247XG5cdGRvY3VtZW50Lm9ua2V5dXAgPSB0aGlzLmJvdW5kS2V5VXA7XG59XG5cbktleUhhbmRsZXIudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuXHR2YXIgaGFuZGxlcnM7XG5cdHZhciBoYW5kbGVyc0xlbmd0aDtcblx0dmFyIHVwZGF0ZXNMZW5ndGggPSB0aGlzLl91cGRhdGVGbnMubGVuZ3RoO1xuXHR2YXIgaTtcblx0XG5cdGZvcih2YXIga2V5IGluIHRoaXMuX2FjdGl2ZUtleXMpe1xuXHRcdGlmKHRoaXMuX2FjdGl2ZUtleXNba2V5XSA9PT0gdHJ1ZSl7XG5cdFx0XHRoYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzW2tleV07XG5cdFx0XHRpZihoYW5kbGVycykge1xuXHRcdFx0XHRoYW5kbGVyc0xlbmd0aCA9IGhhbmRsZXJzLmxlbmd0aDtcblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGhhbmRsZXJzTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRoYW5kbGVyc1tpXSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB1cGRhdGVzTGVuZ3RoOyBpKyspIHtcblx0XHR0aGlzLl91cGRhdGVGbnNbaV0odGhpcy5fYWN0aXZlS2V5cyk7XG5cdH1cbn1cblxuS2V5SGFuZGxlci5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0ZXZlbnROYW1lID0gZXZlbnROYW1lLnRvVXBwZXJDYXNlKCk7XG5cdGlmKCBldmVudE5hbWUuaW5kZXhPZignOicpICE9PSAtMSApIHtcblx0XHR2YXIgZXZlbnROYW1lID0gZXZlbnROYW1lLnNwbGl0KCc6Jyk7XG5cdFx0dmFyIGtleSA9IGV2ZW50TmFtZVswXTtcblx0XHR2YXIgdHlwZSA9IGV2ZW50TmFtZVsxXTtcblx0XHR2YXIgc3RvcmFnZSA9IHRoaXMuRVZFTlRUWVBFU1tldmVudE5hbWVbMV1dO1xuXHRcdGlmKCAhc3RvcmFnZSApIHRocm93IFwiaW52YWxpZCBldmVudFR5cGVcIjtcblx0XHRpZiggIXN0b3JhZ2Vba2V5XSApIHN0b3JhZ2Vba2V5XSA9IFtdO1xuXHRcdHN0b3JhZ2Vba2V5XS5wdXNoKGNhbGxiYWNrKTtcblx0fVxuXHRlbHNlIGlmKCBLRVlfTUFQLmxldHRlcnNbZXZlbnROYW1lXSApIHtcblx0XHRpZighdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSkgdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xuXHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG5cdH1cblx0ZWxzZSBpZiAoZXZlbnROYW1lID09PSBcIlVQREFURVwiKSB7XG5cdFx0dGhpcy5fdXBkYXRlRm5zLnB1c2goY2FsbGJhY2spO1xuXHR9XG5cdGVsc2UgdGhyb3cgXCJpbnZhbGlkIGV2ZW50TmFtZVwiO1xufVxuXG5LZXlIYW5kbGVyLm9mZiA9IGZ1bmN0aW9uIG9mZihrZXksIGNhbGxiYWNrKSB7XG5cdHZhciBjYWxsYmFja0luZGV4O1xuXHR2YXIgY2FsbGJhY2tzO1xuXG5cdGlmKHRoaXMuX2hhbmRsZXJzW2tleV0pIHtcblx0XHRjYWxsYmFja3MgPSB0aGlzLl9oYW5kbGVyc1trZXldO1xuXHRcdGNhbGxiYWNrSW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG5cdFx0aWYoY2FsbGJhY2tJbmRleCAhPT0gLTEpIHtcblx0XHRcdGNhbGxiYWNrcy5zcGxpY2UoY2FsbGJhY2tJbmRleCwgMSk7XG5cdFx0XHRpZighY2FsbGJhY2tzLmxlbmd0aCkge1xuXHRcdFx0XHRkZWxldGUgY2FsbGJhY2tzO1xuXHRcdFx0XHRkZWxldGUgdGhpcy5fYWN0aXZlS2V5c1trZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZWdpc3RlcktleURvd24oZXZlbnQpIHtcblx0dmFyIGtleU5hbWUgPSBLRVlfTUFQLmtleXNbZXZlbnQua2V5Q29kZV07XG5cdHZhciBwcmVzc0V2ZW50cyA9IHRoaXMuX3ByZXNzW2tleU5hbWVdO1xuXHRpZiAoa2V5TmFtZSkgdGhpcy5fYWN0aXZlS2V5c1trZXlOYW1lXSA9IHRydWU7XG5cdGlmIChwcmVzc0V2ZW50cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcHJlc3NFdmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHByZXNzRXZlbnRzW2ldKCk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyS2V5VXAoZXZlbnQpIHtcblx0dmFyIGtleU5hbWUgPSBLRVlfTUFQLmtleXNbZXZlbnQua2V5Q29kZV07XG5cdGlmIChrZXlOYW1lKSB0aGlzLl9hY3RpdmVLZXlzW2tleU5hbWVdID0gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gS2V5SGFuZGxlcjsiLCJ2YXIgVGltZXIgPSByZXF1aXJlKCcuLi9VdGlsaXRpZXMvVGltZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdF9wb3NpdGlvbjogWzAsIDBdLFxuXHRfZXZlbnRzOiB7XG5cdFx0XCJtb3ZlXCI6IFtdXG5cdH0sXG5cblx0aW5pdDogZnVuY3Rpb24gaW5pdCAoKSB7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHRoaXMuX3Njcm9sbGFibGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdHRoaXMuX3Njcm9sbGFibGUuc3R5bGUudG9wID0gJzBweCc7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5zdHlsZS5sZWZ0ID0gJzBweCc7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5zdHlsZS53aWR0aCA9IGlubmVyV2lkdGggKyAncHgnO1xuXHRcdHRoaXMuX3Njcm9sbGFibGUuc3R5bGUuaGVpZ2h0ID0gaW5uZXJIZWlnaHQgKyAncHgnO1xuXHRcdHRoaXMuX3Njcm9sbGFibGUuc3R5bGUub3ZlcmZsb3dZID0gJ3Njcm9sbCc7XG4gICAgXHR0aGlzLl9zY3JvbGxhYmxlLnN0eWxlLndlYmtpdE92ZXJmbG93U2Nyb2xsaW5nID0gJ3RvdWNoJztcblxuXHRcdHRoaXMuX2luc2VydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHRoaXMuX2luc2VydC5zdHlsZS53aWR0aCA9IChpbm5lcldpZHRoICogMikgKyAncHgnO1xuXHRcdHRoaXMuX2luc2VydC5zdHlsZS5oZWlnaHQgPSAoaW5uZXJIZWlnaHQgKiAyKSArICdweCc7XG5cblx0XHR0aGlzLl9zY3JvbGxhYmxlLmFwcGVuZENoaWxkKHRoaXMuX2luc2VydCk7XG5cblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuX3Njcm9sbGFibGUpO1xuXG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5vbnNjcm9sbCA9IHRoaXMuaGFuZGxlU2Nyb2xsLmJpbmQodGhpcyk7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5vbnRvdWNoZW5kID0gdGhpcy5oYW5kbGVUb3VjaEVuZC5iaW5kKHRoaXMpO1xuXHR9LFxuXG5cdG9uOiBmdW5jdGlvbiBvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdFx0aWYoIXRoaXMuX2V2ZW50c1tldmVudE5hbWVdKSB0aHJvdyBcIkludmFsaWQgZXZlbnROYW1lOiBcIiArIGV2ZW50TmFtZTtcblxuXHRcdHRoaXMuX2V2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuXHR9LFxuXG5cdGhhbmRsZVNjcm9sbDogZnVuY3Rpb24gaGFuZGxlU2Nyb2xsKGUpIHtcblx0XHR2YXIgb2Zmc2V0ID0gW1xuXHRcdFx0dGhpcy5fcG9zaXRpb25bMF0gLSB0aGlzLl9zY3JvbGxhYmxlLnNjcm9sbExlZnQsXG5cdFx0XHR0aGlzLl9wb3NpdGlvblsxXSAtIHRoaXMuX3Njcm9sbGFibGUuc2Nyb2xsVG9wXG5cdFx0XTtcblx0XHR2YXIgdG91Y2hNb3ZlRXZlbnRzID0gdGhpcy5fZXZlbnRzW1wibW92ZVwiXTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRvdWNoTW92ZUV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG91Y2hNb3ZlRXZlbnRzW2ldKG9mZnNldCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fcG9zaXRpb24gPSBbdGhpcy5fc2Nyb2xsYWJsZS5zY3JvbGxMZWZ0LCB0aGlzLl9zY3JvbGxhYmxlLnNjcm9sbFRvcF07XG5cdH0sXG5cblx0aGFuZGxlVG91Y2hFbmQ6IGZ1bmN0aW9uIGhhbmRsZVRvdWNoRW5kKGUpIHtcblxuXHR9LFxufSIsIm1vZHVsZS5leHBvcnRzID0gXG57XG4gICdsZXR0ZXJzJyA6IHtcbiAgICAgJ0EnOiA2NSxcbiAgICAgJ0InOiA2NixcbiAgICAgJ0MnOiA2NyxcbiAgICAgJ0QnOiA2OCxcbiAgICAgJ0UnOiA2OSxcbiAgICAgJ0YnOiA3MCxcbiAgICAgJ0cnOiA3MSxcbiAgICAgJ0gnOiA3MixcbiAgICAgJ0knOiA3MyxcbiAgICAgJ0onOiA3NCxcbiAgICAgJ0snOiA3NSxcbiAgICAgJ0wnOiA3NixcbiAgICAgJ00nOiA3NyxcbiAgICAgJ04nOiA3OCxcbiAgICAgJ08nOiA3OSxcbiAgICAgJ1AnOiA4MCxcbiAgICAgJ1EnOiA4MSxcbiAgICAgJ1InOiA4MixcbiAgICAgJ1MnOiA4MyxcbiAgICAgJ1QnOiA4NCxcbiAgICAgJ1UnOiA4NSxcbiAgICAgJ1YnOiA4NixcbiAgICAgJ1cnOiA4NyxcbiAgICAgJ1gnOiA4OCxcbiAgICAgJ1knOiA4OSxcbiAgICAgJ1onOiA5MCxcbiAgICAgJ0VOVEVSJzogMTMsXG4gICAgICdTSElGVCc6IDE2LFxuICAgICAnRVNDJzogMjcsXG4gICAgICdTUEFDRSc6IDMyLFxuICAgICAnTEVGVCc6IDM3LFxuICAgICAnVVAnOiAzOCxcbiAgICAgJ1JJR0hUJzogMzksXG4gICAgICdET1dOJyA6IDQwXG4gIH0sXG4gICdrZXlzJyA6IHtcbiAgICAgNjUgOiAnQScsXG4gICAgIDY2IDogJ0InLFxuICAgICA2NyA6ICdDJyxcbiAgICAgNjggOiAnRCcsXG4gICAgIDY5IDogJ0UnLFxuICAgICA3MCA6ICdGJyxcbiAgICAgNzEgOiAnRycsXG4gICAgIDcyIDogJ0gnLFxuICAgICA3MyA6ICdJJyxcbiAgICAgNzQgOiAnSicsXG4gICAgIDc1IDogJ0snLFxuICAgICA3NiA6ICdMJyxcbiAgICAgNzcgOiAnTScsXG4gICAgIDc4IDogJ04nLFxuICAgICA3OSA6ICdPJyxcbiAgICAgODAgOiAnUCcsXG4gICAgIDgxIDogJ1EnLFxuICAgICA4MiA6ICdSJyxcbiAgICAgODMgOiAnUycsXG4gICAgIDg0IDogJ1QnLFxuICAgICA4NSA6ICdVJyxcbiAgICAgODYgOiAnVicsXG4gICAgIDg3IDogJ1cnLFxuICAgICA4OCA6ICdYJyxcbiAgICAgODkgOiAnWScsXG4gICAgIDkwIDogJ1onLFxuICAgICAxMyA6ICdFTlRFUicsXG4gICAgIDE2IDogJ1NISUZUJyxcbiAgICAgMjcgOiAnRVNDJyxcbiAgICAgMzIgOiAnU1BBQ0UnLFxuICAgICAzNyA6ICdMRUZUJyxcbiAgICAgMzggOiAnVVAnLFxuICAgICAzOSA6ICdSSUdIVCcsXG4gICAgIDQwIDogJ0RPV04nXG4gIH1cbn0iLCJ2YXIgQ09NUExFVEUgPSBcImNvbXBsZXRlXCI7XG52YXIgTE9BRF9TVEFSVEVEID0gXCJzdGFydExvYWRpbmdcIjtcbnZhciBMT0FEX0NPTVBMRVRFRCA9IFwiZG9uZUxvYWRpbmdcIjtcbnZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIExvYWRpbmcgICAgICAgICAgPSB7fTtcbnZhciBib2R5UmVhZHkgICAgICAgID0gZmFsc2U7XG52YXIgYXNzZXRTdGFjayAgICAgICA9IFtdO1xudmFyIGxvYWRlclJlZ2lzdHJ5ICAgPSB7fTtcbnZhciBjb250YWluZXIgICAgICAgID0gbnVsbDtcbnZhciBzcGxhc2hTY3JlZW4gICAgID0gbmV3IEltYWdlKCk7XG5zcGxhc2hTY3JlZW4uc3JjICAgICA9ICcuLi8uLi9Bc3NldHMvTG9hZGluZy4uLi5wbmcnO1xuc3BsYXNoU2NyZWVuLndpZHRoICAgPSBzcGxhc2hXaWR0aCA9IDUwMDtcbnNwbGFzaFNjcmVlbi5oZWlnaHQgID0gc3BsYXNoSGVpZ2h0ID0gMTYwO1xuTG9hZGluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5Mb2FkaW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTG9hZGluZywgTG9hZGluZy5ldmVudE91dHB1dCk7XG5cbkxvYWRpbmcuZXZlbnRJbnB1dC5vbihMT0FEX0NPTVBMRVRFRCwgaGFuZGxlQ29tcGxldGVkTG9hZCk7XG5Mb2FkaW5nLmV2ZW50SW5wdXQub24oJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbkxvYWRpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuICAgIGlmICghY29udGFpbmVyKVxuICAgIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmcnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHNwbGFzaFNjcmVlbik7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtIChzcGxhc2hIZWlnaHQgKiAwLjUpICsgJ3B4JztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4JztcbiAgICB9XG4gICAgaWYgKGFzc2V0U3RhY2subGVuZ3RoKVxuICAgIHtcbiAgICAgICAgdGhpcy5ldmVudE91dHB1dC5lbWl0KExPQURfU1RBUlRFRCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXNzZXRTdGFjay5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGFzc2V0ICA9IGFzc2V0U3RhY2tbaV07XG4gICAgICAgICAgICB2YXIgbG9hZGVyID0gYXNzZXQudHlwZTtcbiAgICAgICAgICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlcl0ubG9hZChhc3NldCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Mb2FkaW5nLmxvYWQgICAgICAgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIGlmKEFycmF5LmlzQXJyYXkoYXNzZXQpKVxuICAgIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXNzZXRTdGFjaywgYXNzZXQpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBhc3NldFN0YWNrLnB1c2goYXNzZXQpO1xuICAgIH1cbn07XG5cbkxvYWRpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbkxvYWRpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbkxvYWRpbmcucmVnaXN0ZXIgICA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGxvYWRlcilcbntcbiAgICB2YXIgbG9hZGVyTmFtZSAgICAgICAgICAgICA9IGxvYWRlci50b1N0cmluZygpO1xuICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlck5hbWVdID0gbG9hZGVyO1xuICAgIGxvYWRlci5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVDb21wbGV0ZWRMb2FkKGRhdGEpXG57XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpXG4gICAge1xuICAgICAgICB2YXIgc291cmNlID0gZGF0YS5zb3VyY2U7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGFzc2V0U3RhY2suaW5kZXhPZihzb3VyY2UpO1xuICAgICAgICBpZiAobG9jYXRpb24pIGFzc2V0U3RhY2suc3BsaWNlKGxvY2F0aW9uLCAxKTtcbiAgICAgICAgaWYgKCFhc3NldFN0YWNrLmxlbmd0aCkgTG9hZGluZy5ldmVudE91dHB1dC5lbWl0KExPQURfQ09NUExFVEVEKTtcbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nOyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIE1lbnUgICAgICAgICAgPSB7fTtcblxuTWVudS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5NZW51LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudE91dHB1dCk7XG5cbk1lbnUuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxudmFyIG1lbnVFbGVtZW50ID0gbnVsbCxcbmNvbnRhaW5lciAgICAgICA9IG51bGwsXG5uZXdHYW1lICAgICAgICAgPSBudWxsO1xuXG5NZW51LmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudScpO1xuICAgIG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIG5ld0dhbWUgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3R2FtZS5vbmNsaWNrID0gc3RhcnROZXdHYW1lO1xuICAgIG5ld0dhbWUuaW5uZXJIVE1MID0gJ05ldyBHYW1lJztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRTaXplID0gJzUwcHgnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udEZhbWlseSA9ICdIZWx2ZXRpY2EnO1xuICAgIG5ld0dhbWUuc3R5bGUuY29sb3IgPSAnI0ZGRic7XG4gICAgbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3R2FtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG1lbnVFbGVtZW50KTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn07XG5cbk1lbnUuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbk1lbnUuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn1cblxuZnVuY3Rpb24gc3RhcnROZXdHYW1lKClcbntcbiAgICBNZW51LmV2ZW50T3V0cHV0LmVtaXQoJ25ld0dhbWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51OyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFBsYXlpbmcgICAgICAgICAgICAgICA9IHt9O1xudmFyIEtleUhhbmRsZXIgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0lucHV0cy9LZXlIYW5kbGVyJyk7XG52YXIgVG91Y2hIYW5kbGVyICAgICAgICAgID0gcmVxdWlyZSgnLi4vSW5wdXRzL1RvdWNoSGFuZGxlcicpO1xudmFyIFJlbmRlcmVyICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0dML0dMJyk7XG5cblBsYXlpbmcuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuUGxheWluZy5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoUGxheWluZywgUGxheWluZy5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFBsYXlpbmcsIFBsYXlpbmcuZXZlbnRPdXRwdXQpO1xuXG5QbGF5aW5nLmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcblx0dGhpcy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVuZGVyZXInKTtcblx0dGhpcy5jYW52YXMud2lkdGggPSBpbm5lcldpZHRoO1xuXHR0aGlzLmNhbnZhcy5oZWlnaHQgPSBpbm5lckhlaWdodDtcblx0S2V5SGFuZGxlci5pbml0KCk7XG5cdFRvdWNoSGFuZGxlci5pbml0KCk7XG5cdHRoaXMucmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoe1xuXHRcdGNhbnZhczogdGhpcy5jYW52YXMsXG5cdFx0dGV4dHVyZXM6IFtcblx0XHRcdCcuLi9Bc3NldHMvY3JhdGUuZ2lmJ1xuXHRcdF1cblx0fSk7XG59O1xuXG5QbGF5aW5nLnVwZGF0ZSAgICAgPSBmdW5jdGlvbiB1cGRhdGUoKVxue1xuXHRLZXlIYW5kbGVyLnVwZGF0ZSgpO1xuXHQvLyBUb3VjaEhhbmRsZXIudXBkYXRlKCk7XG5cdHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG59O1xuXG5QbGF5aW5nLnNob3cgICAgICAgPSBmdW5jdGlvbiBzaG93KClcbntcbn07XG5cblBsYXlpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5aW5nOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRfb25jZTogW10sXG5cdF9ldmVyeTogW10sXG5cdF9nZXR0ZXI6IHBlcmZvcm1hbmNlIHx8IERhdGUsXG5cblx0dXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKXtcblx0XHR2YXIgY3VycmVudFRpbWUgPSB0aGlzLl9nZXR0ZXIubm93KCk7XG5cdFx0dmFyIHRpbWVyRXZlbnQ7XG5cdFx0dmFyIG5ld0VsYXBzZWRUaW1lID0gY3VycmVudFRpbWUgLSB0aGlzLl9pbml0aWFsVGltZTtcblxuXHRcdGlmKCF0aGlzLl9pbml0aWFsVGltZSkgdGhpcy5faW5pdGlhbFRpbWUgPSBjdXJyZW50VGltZTtcblx0XHQvLyBjb25zb2xlLmxvZyhuZXdFbGFwc2VkVGltZSlcblx0XHR0aGlzLl9mcmFtZUR1cmF0aW9uID0gbmV3RWxhcHNlZFRpbWUgLSB0aGlzLl9lbGFwc2VkO1xuXHRcdHRoaXMuX2VsYXBzZWQgPSBjdXJyZW50VGltZSAtIHRoaXMuX2luaXRpYWxUaW1lO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9vbmNlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZih0aGlzLl9lbGFwc2VkID4gdGhpcy5fb25jZVtpXS50cmlnZ2VyKSB7XG5cdFx0XHRcdHRpbWVyRXZlbnQgPSB0aGlzLl9vbmNlW2ldO1xuXHRcdFx0XHR0aW1lckV2ZW50LmNhbGxiYWNrKCk7XG5cdFx0XHRcdHRoaXMuX29uY2Uuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fZXZlcnkubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKHRoaXMuX2VsYXBzZWQgPiB0aGlzLl9ldmVyeVtpXS50cmlnZ2VyKSB7XG5cdFx0XHRcdHRpbWVyRXZlbnQgPSB0aGlzLl9ldmVyeVtpXTtcblx0XHRcdFx0dGltZXJFdmVudC5jYWxsYmFjaygpO1xuXHRcdFx0XHR0aW1lckV2ZW50LnRyaWdnZXIgPSB0aGlzLl9lbGFwc2VkICsgdGltZXJFdmVudC50aW1lb3V0XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGdldEVsYXBzZWQ6IGZ1bmN0aW9uIGdldEVsYXBzZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2VsYXBzZWQ7XG5cdH0sXG5cblx0Z2V0RnJhbWVEdXJhdGlvbjogZnVuY3Rpb24gZ2V0RnJhbWVEdXJhdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5fZnJhbWVEdXJhdGlvbjtcblx0fSxcblxuXHRhZnRlcjogZnVuY3Rpb24gYWZ0ZXIoY2FsbGJhY2ssIHRpbWVvdXQpIHtcblx0XHR0aGlzLl9vbmNlLnB1c2goe1xuXHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrLFxuXHRcdFx0dHJpZ2dlcjogdGhpcy5fZWxhcHNlZCArIHRpbWVvdXRcblx0XHR9KTtcblx0fSxcblxuXHRldmVyeTogZnVuY3Rpb24gZXZlcnkoY2FsbGJhY2ssIHRpbWVvdXQpIHtcblx0XHR0aGlzLl9ldmVyeS5wdXNoKHtcblx0XHRcdGNhbGxiYWNrOiBjYWxsYmFjayxcblx0XHRcdHRyaWdnZXI6IHRoaXMuX2VsYXBzZWQgKyB0aW1lb3V0LFxuXHRcdFx0dGltZW91dDogdGltZW91dFxuXHRcdH0pXG5cdH1cbn07IiwidmFyIEVuZ2luZSAgPSByZXF1aXJlKCcuL0dhbWUvRW5naW5lJyk7XG52YXIgTG9hZGluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL0xvYWRpbmcnKTtcbnZhciBNZW51ICAgID0gcmVxdWlyZSgnLi9TdGF0ZXMvTWVudScpO1xudmFyIFBsYXlpbmcgPSByZXF1aXJlKCcuL1N0YXRlcy9QbGF5aW5nJyk7XG52YXIgRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgSW1hZ2VMb2FkZXIgID0gcmVxdWlyZSgnLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG52YXIgQWpheExvYWRlciAgID0gcmVxdWlyZSgnLi9HYW1lL0FqYXhMb2FkZXInKTtcbnZhciBWaWV3cG9ydCAgICAgPSByZXF1aXJlKCcuL0dhbWUvVmlld3BvcnQnKTtcblxuXG52YXIgQ29udHJvbGxlciA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuVmlld3BvcnQucGlwZShNZW51KTtcblZpZXdwb3J0LnBpcGUoTG9hZGluZyk7XG5WaWV3cG9ydC5waXBlKFBsYXlpbmcpO1xuXG5FbmdpbmUucGlwZShDb250cm9sbGVyKTtcbk1lbnUucGlwZShDb250cm9sbGVyKTtcbkxvYWRpbmcucGlwZShDb250cm9sbGVyKTtcblxuQ29udHJvbGxlci5vbignZG9uZUxvYWRpbmcnLCBnb1RvTWVudSk7XG5Db250cm9sbGVyLm9uKCduZXdHYW1lJywgc3RhcnRHYW1lKTtcblxudmFyIGFzc2V0cyA9IFtcblx0e1xuXHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0c291cmNlOiAnLi4vQXNzZXRzL2NyYXRlLmdpZicsXG5cdFx0ZGF0YToge31cblx0fSxcblx0e1xuXHRcdHR5cGU6ICdkYXRhJyxcblx0XHRzb3VyY2U6ICcuLi9TaGFkZXJzL0ZyYWdtZW50U2hhZGVyLmdsc2wnLFxuXHRcdGRhdGE6IHt9XG5cdH0sXG5cdHtcblx0XHR0eXBlOiAnZGF0YScsXG5cdFx0c291cmNlOiAnLi4vU2hhZGVycy9WZXJ0ZXhTaGFkZXIuZ2xzbCcsXG5cdFx0ZGF0YToge31cblx0fVxuXVxuXG5Mb2FkaW5nLnJlZ2lzdGVyKEltYWdlTG9hZGVyKTtcbkxvYWRpbmcucmVnaXN0ZXIoQWpheExvYWRlcik7XG5Mb2FkaW5nLmxvYWQoYXNzZXRzKTtcblxuRW5naW5lLnNldFN0YXRlKExvYWRpbmcpO1xuXG5mdW5jdGlvbiBnb1RvTWVudSgpXG57XG4gICAgRW5naW5lLnNldFN0YXRlKE1lbnUpO1xufVxuXG5mdW5jdGlvbiBzdGFydEdhbWUoKVxue1xuXHRFbmdpbmUuc2V0U3RhdGUoUGxheWluZyk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKVxue1xuICAgIEVuZ2luZS5zdGVwKCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufVxuXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7Il19
