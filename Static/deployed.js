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
var ImageLoader           = require('../Game/ImageLoader');
var AjaxLoader            = require('../Game/AjaxLoader');
var Timer                 = require('../Utilities/Timer');
var WorldSprite           = require('./Sprites/WorldSprite');
var CharacterSprite       = require('./Sprites/CharacterSprite');
var EnemySpriteCollection = require('./Sprites/EnemySpriteCollection');
var RotateSync            = require('../Inputs/RotateSync');
// var MapGenerator          = require('../Inputs/MapGenerator');

function Renderer (options) {
    this.canvas = options.canvas;
    this.gl = this.canvas.getContext("webgl");
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;

    this.initShaders();
    this.initTextures(options.textures);

    initMatrices.call(this);

    this.worldRotation = 0;
    this.worldTranslation = [0, 0];
    this.translateRate = [0, -1];
    this.starCoords = [];
    this.shipSize = 0.2;

    this.gl.enable(this.gl.BLEND);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this._rotateSync = new RotateSync(window);
    this._rotateSync.on('update', this.handleRotation.bind(this));
    this._rotateSync.on('end', this.handleEnd.bind(this));

    this.sprites = [];
    initSprites.call(this);

    var points = [];
    window.onclick = function (e) {
        points.push([(((e.clientX / innerWidth) * 2) - 1) + this.worldTranslation[0], (1 - ((e.clientY / innerHeight) * 2)) + this.worldTranslation[1]]);
        console.log(JSON.stringify(points));
    }.bind(this)
}

syncActive = true;
Renderer.prototype.update = function update () {
    this.render();

    if(!syncActive) return;

    this.worldTranslation[0] += 0.003 * this.translateRate[0];
    this.worldTranslation[1] += 0.003 * this.translateRate[1];

    if(this.collisionDetected()) {
        this.characterSprite.handleCollision();
        syncActive = false;
    }
}

Renderer.prototype.handleRotation = function handleRotation (e) {
    this.worldRotation += e.delta;

    var newX = -Math.sin(this.worldRotation);
    var newY = -Math.cos(this.worldRotation);

    this.translateRate = [newX, newY];

    this.worldSprite.rotation = this.worldRotation;
    this.enemySprites.worldRotation = this.worldRotation;
    this.characterSprite.updateRot(e);
}

Renderer.prototype.collisionDetected = function collisionDetected() {
    var halfShipSize = this.shipSize * 0.5;

    for (var i = 0; i < this.starCoords.length; i++) {
        if(this.starCoords[i][0] < (this.worldTranslation[0] + halfShipSize)){
            if(this.starCoords[i][0] > (this.worldTranslation[0] - halfShipSize)){
                if(-this.starCoords[i][1] < (this.worldTranslation[1] + halfShipSize)){
                    if(-this.starCoords[i][1] > (this.worldTranslation[1] - halfShipSize)){
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

Renderer.prototype.handleEnd = function handleEnd () {
    this.characterSprite.settle();
}

Renderer.prototype.render = function render() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    /* INITIALIZE MV MATRIX */
    mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);

    mat4.identity(this.mvMatrix);

    /* SET UNIFORMS */
    this.gl.uniform1f(this.shaderProgram.resolution, innerHeight / innerWidth);

    /* RENDER WORLD */
    for (var i = 0; i < this.sprites.length; i++) {
        this.sprites[i].update();
        this.sprites[i].render();
    }
    // this.enemySprites.render();
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
    this.shaderProgram.spriteRot = this.gl.getUniformLocation(this.shaderProgram, "uSpriteRot");
    this.shaderProgram.resolution = this.gl.getUniformLocation(this.shaderProgram, "uResolution");
    this.shaderProgram.drawState = this.gl.getUniformLocation(this.shaderProgram, "uDrawState");
    this.shaderProgram.enemyPositions = this.gl.getUniformLocation(this.shaderProgram, "uEnemyPositions");
}

Renderer.prototype.initTextures = function initTextures(textures) {
    this.textures = [];

    for (var i = 0; i < textures.length; i++) {
       	this.textures[i] = this.gl.createTexture();
    	this.textures[i].image = ImageLoader.get(textures[i]);
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textures[i].image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    };
}

function initSprites () {
    var NUMENEMIES = 40;

    this.worldSprite = new WorldSprite({
        gl: this.gl,
        canvas: this.canvas,
        texture: this.textures[0],
        shaderProgram: this.shaderProgram,
        pMatrix: this.pMatrix,
        spriteCoord: this.worldTranslation,
        worldRotation: this.worldRotation
    });

    this.characterSprite = new CharacterSprite({
        gl: this.gl,
        canvas: this.canvas,
        texture: this.textures[1],
        shaderProgram: this.shaderProgram,
        pMatrix: this.pMatrix,
        size: this.shipSize
    });

    for (var i = 0; i < 10; i++) {
        this.starCoords.push([0.4, i * 0.25], [-0.4, i * 0.25]);
    }

    this.enemySprites = new EnemySpriteCollection({
        gl: this.gl,
        canvas: this.canvas,
        texture: this.textures[2],
        shaderProgram: this.shaderProgram,
        pMatrix: this.pMatrix,
        positions: this.starCoords,
        worldTranslation: this.worldTranslation
    });

    this.sprites.push(this.worldSprite);
    this.sprites.push(this.characterSprite);
    this.sprites.push(this.enemySprites);
}

function initMatrices () {
    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();
}

module.exports = Renderer;
},{"../Game/AjaxLoader":"/Users/joseph/code/touchRunner/Source/Game/AjaxLoader.js","../Game/ImageLoader":"/Users/joseph/code/touchRunner/Source/Game/ImageLoader.js","../Inputs/RotateSync":"/Users/joseph/code/touchRunner/Source/Inputs/RotateSync.js","../Utilities/Timer":"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js","./Sprites/CharacterSprite":"/Users/joseph/code/touchRunner/Source/GL/Sprites/CharacterSprite.js","./Sprites/EnemySpriteCollection":"/Users/joseph/code/touchRunner/Source/GL/Sprites/EnemySpriteCollection.js","./Sprites/WorldSprite":"/Users/joseph/code/touchRunner/Source/GL/Sprites/WorldSprite.js"}],"/Users/joseph/code/touchRunner/Source/GL/Sprites/CharacterSprite.js":[function(require,module,exports){
var Transitionable = require('../../Transitions/Transitionable');

function CharacterSprite (options) {
	this.gl            = options.gl;
	this.shaderProgram = options.shaderProgram;
	this.texture       = options.texture;

	this.matrix      = mat4.create();
	this.position    = new Transitionable([0.0, 0.0, -1.5]);
	this.spriteCoord = [0.0, 0.0];
	this.spriteRot   = 0;
	this.rotation    = new Transitionable(0);
	this.settleRate  = 0.1;

	initBuffers.call(this);
}

CharacterSprite.OPTIONS = {
	spinOutAnimation: {duration: 1000}
}

CharacterSprite.prototype.update = function update() {

}

CharacterSprite.prototype.updateRot = function updateRot(theta) {
	this.rotation.halt();
	this.rotation.set(-theta.angle % Math.PI);
	// console.log(theta.angle)
	// this.rotation.set(0, {duration: 100});
}

CharacterSprite.prototype.handleCollision = function handleCollision() {
	this.rotation.halt();
	this.position.halt();
	this.position.set([0.0, 1.0, -1.5], {duration: 1400});
	this.rotation.set(Math.PI * 10, {duration: 1400});
}

CharacterSprite.prototype.settle = function settle() {
	this.rotation.set(0, {duration: 1000, curve: 'outQuart'});
}

CharacterSprite.prototype.render = function render() {
	mat4.identity(this.matrix);
    mat4.translate(this.matrix, this.position.get());
    mat4.rotate(this.matrix, -this.rotation.get(), [0, 0.0, 0.4]);

    /* SCALED TO WINDOW */
    this.gl.uniform1i(this.shaderProgram.drawState, 1);

    /* SET TEXTURE */
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);

    /* BIND TEXTURE COORDINATES */
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    /* BIND POSITION COORDINATES */
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.positionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    /* SET UNIFORMS */
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.matrix);
    this.gl.uniform2f(this.shaderProgram.spriteCoord, this.spriteCoord[0], this.spriteCoord[1]);
    this.gl.uniform1f(this.shaderProgram.resolution, innerHeight / innerWidth);
    this.gl.uniform1f(this.shaderProgram.spriteRot, 0);

    /* DRAW */
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
}

function initBuffers() {
	this.positionBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
	this.positionVertices = [
		-0.1,  0.10, 0.0,
		 0.1,  0.10, 0.0,
		-0.1, -0.10, 0.0,
		 0.1, -0.10, 0.0
	];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positionVertices), this.gl.STATIC_DRAW);
    this.positionBuffer.itemSize = 3;
    this.positionBuffer.numItems = 4;

    this.textureBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
	this.textureVertices = [
		0.0, 0.0,
		0.19, 0.0,
		0.0, 0.25,
		0.19, 0.25
	];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textureVertices), this.gl.STATIC_DRAW);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = 4;
}

module.exports = CharacterSprite;
},{"../../Transitions/Transitionable":"/Users/joseph/code/touchRunner/Source/Transitions/Transitionable.js"}],"/Users/joseph/code/touchRunner/Source/GL/Sprites/EnemySpriteCollection.js":[function(require,module,exports){

function EnemySpriteCollection (options) {
	this.gl            = options.gl;
	this.shaderProgram = options.shaderProgram;
	this.texture       = options.texture;

	this.matrix           = mat4.create();
	this.position         = [0.0, 0.0, -1.5];
	this.spriteCoord      = [0.0, 0.0];
	this.spriteRot        = 0;
    this.worldRotation    = 0;
    this.worldTranslation = options.worldTranslation;

    this.enemies = [];
    for (var i = 0; i < options.positions.length; i++) {
        this.enemies[i] = {
            translation: options.positions[i],
            rotation: Math.random() * Math.PI,
            rotationRate: 0.08
        }
    }

	initBuffers.call(this);
}

EnemySpriteCollection.prototype.update = function update() {
    for (var i = 0; i < this.enemies.length; i++) {
        this.enemies[i].rotation += this.enemies[i].rotationRate;
    }
}

EnemySpriteCollection.prototype.render = function render() {
    /* SCALED TO WINDOW */
    this.gl.uniform1i(this.shaderProgram.drawState, 2);

    /* SET TEXTURE */
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);

    /* BIND TEXTURE COORDINATES */
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    /* BIND POSITION COORDINATES */
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.positionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    /* FOR ALL ENEMIES */
    var enemy;
    var i;
    for (i = 0; i < this.enemies.length; i++) {
        enemy = this.enemies[i];
        mat4.identity(this.matrix);
        mat4.rotate(this.matrix, this.worldRotation, [0, 0.0, -1]);
        mat4.translate(this.matrix, [
            enemy.translation[0] - this.worldTranslation[0],
            enemy.translation[1] + this.worldTranslation[1],
            this.position[2]
        ]);
        mat4.rotate(this.matrix, -enemy.rotation, [0, 0.0, 1]);

        /* SET UNIFORMS */
        this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.matrix);
        this.gl.uniform2f(this.shaderProgram.spriteCoord, this.spriteCoord[0], this.spriteCoord[1]);
        this.gl.uniform1f(this.shaderProgram.resolution, innerHeight / innerWidth);
        this.gl.uniform1f(this.shaderProgram.spriteRot, 0);
        
        /* DRAW */
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
    }
}

function initBuffers() {
    var ePos;
    var vertices;
    var textureVertices;

	this.positionBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.positionBuffer.itemSize = 3;
    this.positionBuffer.numItems = 4;
	vertices = [
        -0.037,  0.037, 0.0,
         0.037,  0.037, 0.0,
        -0.037, -0.037, 0.0,
         0.037, -0.037, 0.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    this.textureBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = 4;
    textureVertices = [
        0.34, 0.025,
        0.413, 0.025,
        0.34, 0.1,
        0.413, 0.1
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureVertices), this.gl.STATIC_DRAW);
}

module.exports = EnemySpriteCollection;
},{}],"/Users/joseph/code/touchRunner/Source/GL/Sprites/WorldSprite.js":[function(require,module,exports){
var Timer = require('../../Utilities/Timer');
var RotateSync = require('../../Inputs/RotateSync');

function WorldSprite (options) {
	this.gl = options.gl;
	this.shaderProgram = options.shaderProgram;
	this.texture = options.texture;

	this.rotation = 0;
	this.matrix = mat4.create();
	this.position = [0, 0, -2];
	this.spriteCoord = options.spriteCoord;
	this.translateScale = 0.05;

	initBuffers.call(this);
}

WorldSprite.prototype.update = function update() {
}
	
WorldSprite.prototype.render = function render() {
	mat4.identity(this.matrix);
    mat4.translate(this.matrix, [this.position[0], this.position[1], this.position[2]]);

    /* SCALED TO WINDOW */
    this.gl.uniform1i(this.shaderProgram.drawState, 0);

    /* SET TEXTURE */
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.shaderProgram.samplerUniform, 0);

    /* BIND TEXTURE COORDINATES */
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    /* BIND POSITION COORDINATES */
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.positionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    /* SET UNIFORMS */
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.matrix);
    this.gl.uniform2f(this.shaderProgram.spriteCoord, this.spriteCoord[0] * this.translateScale, this.spriteCoord[1] * this.translateScale);
    this.gl.uniform1f(this.shaderProgram.resolution, innerHeight / innerWidth);
    this.gl.uniform1f(this.shaderProgram.spriteRot, this.rotation);

    /* DRAW */
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
}

function initBuffers() {
	var aspectRatio = innerHeight / innerWidth;

	this.positionBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
	this.positionVertices = [
		-2.5,  2.5 * aspectRatio, 0.0,
		 2.5,  2.5 * aspectRatio, 0.0,
		-2.5, -2.5 * aspectRatio, 0.0,
		 2.5, -2.5 * aspectRatio, 0.0
	];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positionVertices), this.gl.STATIC_DRAW);
    this.positionBuffer.itemSize = 3;
    this.positionBuffer.numItems = 4;

    this.textureBuffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
	this.textureVertices = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0 * aspectRatio,
		1.0, 1.0 * aspectRatio
	];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textureVertices), this.gl.STATIC_DRAW);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = 4;
}

module.exports = WorldSprite;
},{"../../Inputs/RotateSync":"/Users/joseph/code/touchRunner/Source/Inputs/RotateSync.js","../../Utilities/Timer":"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js"}],"/Users/joseph/code/touchRunner/Source/Game/AjaxLoader.js":[function(require,module,exports){
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
},{"./keymap.js":"/Users/joseph/code/touchRunner/Source/Inputs/keymap.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/RotateSync.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */
    var TwoFingerSync = require('./TwoFingerSync');

    /**
     * Handles piped in two-finger touch events to increase or decrease scale via pinching / expanding.
     *   Emits 'start', 'update' and 'end' events an object with position, velocity, touch ids, and angle.
     *   Useful for determining a rotation factor from initial two-finger touch.
     *
     * @class RotateSync
     * @extends TwoFingerSync
     * @constructor
     * @param {Object} options default options overrides
     * @param {Number} [options.scale] scale velocity by this factor
     */

    function RotateSync(element) {
        TwoFingerSync.call(this, element);

        this.options = {};
        this.options.scale = 1;

        this._angle = 0;
        this._previousAngle = 0;
    }

    RotateSync.prototype = Object.create(TwoFingerSync.prototype);
    RotateSync.prototype.constructor = RotateSync;

    RotateSync.DEFAULT_OPTIONS = {
        scale : 1
    };

    RotateSync.prototype._startUpdate = function _startUpdate(event) {
        this._angle = 0;
        this._previousAngle = TwoFingerSync.calculateAngle(this.posA, this.posB);
        var center = TwoFingerSync.calculateCenter(this.posA, this.posB);
        this._eventOutput.emit('start', {
            count: event.touches.length,
            angle: this._angle,
            center: center,
            touches: [this.touchAId, this.touchBId]
        });
    };

    RotateSync.prototype._moveUpdate = function _moveUpdate(diffTime) {
        var scale = this.options.scale;

        var currAngle = TwoFingerSync.calculateAngle(this.posA, this.posB);
        var center = TwoFingerSync.calculateCenter(this.posA, this.posB);

        var diffTheta = scale * (currAngle - this._previousAngle);
        var velTheta = diffTheta / diffTime;

        this._angle += diffTheta;

        this._eventOutput.emit('update', {
            delta : diffTheta,
            velocity: velTheta,
            angle: this._angle,
            center: center,
            touches: [this.touchAId, this.touchBId]
        });

        this._previousAngle = currAngle;
    };

    /**
     * Return entire options dictionary, including defaults.
     *
     * @method getOptions
     * @return {Object} configuration options
     */
    RotateSync.prototype.getOptions = function getOptions() {
        return this.options;
    };

    /**
     * Set internal options, overriding any default options
     *
     * @method setOptions
     *
     * @param {Object} [options] overrides of default options
     * @param {Number} [options.scale] scale velocity by this factor
     */
    RotateSync.prototype.setOptions = function setOptions(options) {
        return this._optionsManager.setOptions(options);
    };

    module.exports = RotateSync;

},{"./TwoFingerSync":"/Users/joseph/code/touchRunner/Source/Inputs/TwoFingerSync.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/TouchHandler.js":[function(require,module,exports){
var Timer = require('../Utilities/Timer');

module.exports = {
	_position: [0, 0],
	_events: {
		"move": [],
		"rotate": []
	},
	_touchCount: 0,
	_twoTouch: false,
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

		this._scrollable.ontouchmove = this.handleTouchMove.bind(this);
		this._scrollable.onscroll = this.handleScroll.bind(this);
	},

	on: function on(eventName, callback) {
		if(!this._events[eventName]) throw "Invalid eventName: " + eventName;

		this._events[eventName].push(callback);
	},

	handleTouchMove: function handleTouchMove (e) {
		if(e.targetTouches.length === 2) {
			e.preventDefault();
			e.stopPropagation();
			if(this._twoTouch) {
				this.handleRotation(e.targetTouches);
			} else {
				this.initTwoTouch(e.targetTouches);
			}
		}
		else if(this._twoTouch) this._twoTouch = false;
	},

	initTwoTouch: function initTwoTouch (touches) {
		this._twoTouch = true;
		this.startPositions = [
			[touches[0].pageX, touches[0].pageY],
			[touches[1].pageX, touches[1].pageY]
		];
	},

	handleRotation: function handleRotation (touches) {
		var deltaX;
		var deltaY;

		deltaX = Math.abs(this.startPositions[0][0] - touches[0].pageX)
			   + Math.abs(this.startPositions[1][0] - touches[1].pageX);
		deltaY = Math.abs(this.startPositions[0][1] - touches[0].pageY)
			   + Math.abs(this.startPositions[1][1] - touches[1].pageY);

		var theta = (deltaY + deltaX) / 200;

		for (var i = 0; i < this._events["rotate"].length; i++) {
			this._events["rotate"][i](theta);
		}
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
	}
}
},{"../Utilities/Timer":"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/TwoFingerSync.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */
    var EventHandler = require('../Events/EventHandler');

    /**
     * Helper to PinchSync, RotateSync, and ScaleSync.  Generalized handling of
     *   two-finger touch events.
     *   This class is meant to be overridden and not used directly.
     *
     * @class TwoFingerSync
     * @constructor
     */
    function TwoFingerSync(element) {
        this.element = element;
        if(!this.element) throw "No element provided!";

        this._eventOutput = new EventHandler();

        EventHandler.setOutputHandler(this, this._eventOutput);

        this.touchAEnabled = false;
        this.touchAId = 0;
        this.posA = null;
        this.timestampA = 0;
        this.touchBEnabled = false;
        this.touchBId = 0;
        this.posB = null;
        this.timestampB = 0;

        this.element.addEventListener('touchstart', this.handleStart.bind(this));
        this.element.addEventListener('touchmove', this.handleMove.bind(this));
        this.element.addEventListener('touchend', this.handleEnd.bind(this));
        this.element.addEventListener('touchcancel', this.handleEnd.bind(this));
    }

    TwoFingerSync.calculateAngle = function(posA, posB) {
        var diffX = posB[0] - posA[0];
        var diffY = posB[1] - posA[1];
        return Math.atan2(diffY, diffX);
    };

    TwoFingerSync.calculateDistance = function(posA, posB) {
        var diffX = posB[0] - posA[0];
        var diffY = posB[1] - posA[1];
        return Math.sqrt(diffX * diffX + diffY * diffY);
    };

    TwoFingerSync.calculateCenter = function(posA, posB) {
        return [(posA[0] + posB[0]) / 2.0, (posA[1] + posB[1]) / 2.0];
    };

    var _now = Date.now;

    // private
    TwoFingerSync.prototype.handleStart = function handleStart(event) {
        event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            if (!this.touchAEnabled) {
                this.touchAId = touch.identifier;
                this.touchAEnabled = true;
                this.posA = [touch.pageX, touch.pageY];
                this.timestampA = _now();
            }
            else if (!this.touchBEnabled) {
                this.touchBId = touch.identifier;
                this.touchBEnabled = true;
                this.posB = [touch.pageX, touch.pageY];
                this.timestampB = _now();
                this._startUpdate(event);
            }
        }
    };

    // private
    TwoFingerSync.prototype.handleMove = function handleMove(event) {
        event.preventDefault();
        if (!(this.touchAEnabled && this.touchBEnabled)) return;
        var prevTimeA = this.timestampA;
        var prevTimeB = this.timestampB;
        var diffTime;
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            if (touch.identifier === this.touchAId) {
                this.posA = [touch.pageX, touch.pageY];
                this.timestampA = _now();
                diffTime = this.timestampA - prevTimeA;
            }
            else if (touch.identifier === this.touchBId) {
                this.posB = [touch.pageX, touch.pageY];
                this.timestampB = _now();
                diffTime = this.timestampB - prevTimeB;
            }
        }
        if (diffTime) this._moveUpdate(diffTime);
    };

    // private
    TwoFingerSync.prototype.handleEnd = function handleEnd(event) {
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            if (touch.identifier === this.touchAId || touch.identifier === this.touchBId) {
                if (this.touchAEnabled && this.touchBEnabled) {
                    this._eventOutput.emit('end', {
                        touches : [this.touchAId, this.touchBId],
                        angle   : this._angle
                    });
                }
                this.touchAEnabled = false;
                this.touchAId = 0;
                this.touchBEnabled = false;
                this.touchBId = 0;
            }
        }
    };

    module.exports = TwoFingerSync;

},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js"}],"/Users/joseph/code/touchRunner/Source/Inputs/keymap.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js","../GL/GL":"/Users/joseph/code/touchRunner/Source/GL/GL.js","../Inputs/KeyHandler":"/Users/joseph/code/touchRunner/Source/Inputs/KeyHandler.js","../Inputs/TouchHandler":"/Users/joseph/code/touchRunner/Source/Inputs/TouchHandler.js"}],"/Users/joseph/code/touchRunner/Source/Transitions/Easing.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

/*
 * A library of curves which map an animation explicitly as a function of time.
 *
 * @class Easing
 */
var Easing = {

    /**
     * @property inQuad
     * @static
     */
    inQuad: function(t) {
        return t*t;
    },

    /**
     * @property outQuad
     * @static
     */
    outQuad: function(t) {
        return -(t-=1)*t+1;
    },

    /**
     * @property inOutQuad
     * @static
     */
    inOutQuad: function(t) {
        if ((t/=.5) < 1) return .5*t*t;
        return -.5*((--t)*(t-2) - 1);
    },

    /**
     * @property inCubic
     * @static
     */
    inCubic: function(t) {
        return t*t*t;
    },

    /**
     * @property outCubic
     * @static
     */
    outCubic: function(t) {
        return ((--t)*t*t + 1);
    },

    /**
     * @property inOutCubic
     * @static
     */
    inOutCubic: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t;
        return .5*((t-=2)*t*t + 2);
    },

    /**
     * @property inQuart
     * @static
     */
    inQuart: function(t) {
        return t*t*t*t;
    },

    /**
     * @property outQuart
     * @static
     */
    outQuart: function(t) {
        return -((--t)*t*t*t - 1);
    },

    /**
     * @property inOutQuart
     * @static
     */
    inOutQuart: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t*t;
        return -.5 * ((t-=2)*t*t*t - 2);
    },

    /**
     * @property inQuint
     * @static
     */
    inQuint: function(t) {
        return t*t*t*t*t;
    },

    /**
     * @property outQuint
     * @static
     */
    outQuint: function(t) {
        return ((--t)*t*t*t*t + 1);
    },

    /**
     * @property inOutQuint
     * @static
     */
    inOutQuint: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t*t*t;
        return .5*((t-=2)*t*t*t*t + 2);
    },

    /**
     * @property inSine
     * @static
     */
    inSine: function(t) {
        return -1.0*Math.cos(t * (Math.PI/2)) + 1.0;
    },

    /**
     * @property outSine
     * @static
     */
    outSine: function(t) {
        return Math.sin(t * (Math.PI/2));
    },

    /**
     * @property inOutSine
     * @static
     */
    inOutSine: function(t) {
        return -.5*(Math.cos(Math.PI*t) - 1);
    },

    /**
     * @property inExpo
     * @static
     */
    inExpo: function(t) {
        return (t===0) ? 0.0 : Math.pow(2, 10 * (t - 1));
    },

    /**
     * @property outExpo
     * @static
     */
    outExpo: function(t) {
        return (t===1.0) ? 1.0 : (-Math.pow(2, -10 * t) + 1);
    },

    /**
     * @property inOutExpo
     * @static
     */
    inOutExpo: function(t) {
        if (t===0) return 0.0;
        if (t===1.0) return 1.0;
        if ((t/=.5) < 1) return .5 * Math.pow(2, 10 * (t - 1));
        return .5 * (-Math.pow(2, -10 * --t) + 2);
    },

    /**
     * @property inCirc
     * @static
     */
    inCirc: function(t) {
        return -(Math.sqrt(1 - t*t) - 1);
    },

    /**
     * @property outCirc
     * @static
     */
    outCirc: function(t) {
        return Math.sqrt(1 - (--t)*t);
    },

    /**
     * @property inOutCirc
     * @static
     */
    inOutCirc: function(t) {
        if ((t/=.5) < 1) return -.5 * (Math.sqrt(1 - t*t) - 1);
        return .5 * (Math.sqrt(1 - (t-=2)*t) + 1);
    },

    /**
     * @property inElastic
     * @static
     */
    inElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if (t===1) return 1.0;  if (!p) p=.3;
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/ p));
    },

    /**
     * @property outElastic
     * @static
     */
    outElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if (t===1) return 1.0;  if (!p) p=.3;
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        return a*Math.pow(2,-10*t) * Math.sin((t-s)*(2*Math.PI)/p) + 1.0;
    },

    /**
     * @property inOutElastic
     * @static
     */
    inOutElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if ((t/=.5)===2) return 1.0;  if (!p) p=(.3*1.5);
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/p));
        return a*Math.pow(2,-10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/p)*.5 + 1.0;
    },

    /**
     * @property inBack
     * @static
     */
    inBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        return t*t*((s+1)*t - s);
    },

    /**
     * @property outBack
     * @static
     */
    outBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        return ((--t)*t*((s+1)*t + s) + 1);
    },

    /**
     * @property inOutBack
     * @static
     */
    inOutBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        if ((t/=.5) < 1) return .5*(t*t*(((s*=(1.525))+1)*t - s));
        return .5*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2);
    },

    /**
     * @property inBounce
     * @static
     */
    inBounce: function(t) {
        return 1.0 - Easing.outBounce(1.0-t);
    },

    /**
     * @property outBounce
     * @static
     */
    outBounce: function(t) {
        if (t < (1/2.75)) {
            return (7.5625*t*t);
        } else if (t < (2/2.75)) {
            return (7.5625*(t-=(1.5/2.75))*t + .75);
        } else if (t < (2.5/2.75)) {
            return (7.5625*(t-=(2.25/2.75))*t + .9375);
        } else {
            return (7.5625*(t-=(2.625/2.75))*t + .984375);
        }
    },

    /**
     * @property inOutBounce
     * @static
     */
    inOutBounce: function(t) {
        if (t < .5) return Easing.inBounce(t*2) * .5;
        return Easing.outBounce(t*2-1.0) * .5 + .5;
    }
};

module.exports = Easing;

},{}],"/Users/joseph/code/touchRunner/Source/Transitions/MultipleTransition.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Utility = require('./Utility');

/**
 * Transition meta-method to support transitioning multiple
 *   values with scalar-only methods.
 *
 *
 * @class MultipleTransition
 * @constructor
 *
 * @param {Object} method Transionable class to multiplex
 */
function MultipleTransition(method) {
    this.method = method;
    this._instances = [];
    this.state = [];
}

MultipleTransition.SUPPORTS_MULTIPLE = true;

/**
 * Get the state of each transition.
 *
 * @method get
 *
 * @return state {Number|Array} state array
 */
MultipleTransition.prototype.get = function get() {
    for (var i = 0; i < this._instances.length; i++) {
        this.state[i] = this._instances[i].get();
    }
    return this.state;
};

/**
 * Set the end states with a shared transition, with optional callback.
 *
 * @method set
 *
 * @param {Number|Array} endState Final State.  Use a multi-element argument for multiple transitions.
 * @param {Object} transition Transition definition, shared among all instances
 * @param {Function} callback called when all endStates have been reached.
 */
MultipleTransition.prototype.set = function set(endState, transition, callback) {
    var _allCallback = Utility.after(endState.length, callback);
    for (var i = 0; i < endState.length; i++) {
        if (!this._instances[i]) this._instances[i] = new (this.method)();
        this._instances[i].set(endState[i], transition, _allCallback);
    }
};

/**
 * Reset all transitions to start state.
 *
 * @method reset
 *
 * @param  {Number|Array} startState Start state
 */
MultipleTransition.prototype.reset = function reset(startState) {
    for (var i = 0; i < startState.length; i++) {
        if (!this._instances[i]) this._instances[i] = new (this.method)();
        this._instances[i].reset(startState[i]);
    }
};

module.exports = MultipleTransition;

},{"./Utility":"/Users/joseph/code/touchRunner/Source/Transitions/Utility.js"}],"/Users/joseph/code/touchRunner/Source/Transitions/Transitionable.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MultipleTransition = require('./MultipleTransition');
var TweenTransition = require('./TweenTransition');
var Easing = require('./Easing');

/**
 * A state maintainer for a smooth transition between
 *    numerically-specified states. Example numeric states include floats or
 *    Transform objects.
 *
 * An initial state is set with the constructor or set(startState). A
 *    corresponding end state and transition are set with set(endState,
 *    transition). Subsequent calls to set(endState, transition) begin at
 *    the last state. Calls to get(timestamp) provide the interpolated state
 *    along the way.
 *
 * Note that there is no event loop here - calls to get() are the only way
 *    to find state projected to the current (or provided) time and are
 *    the only way to trigger callbacks. Usually this kind of object would
 *    be part of the render() path of a visible component.
 *
 * @class Transitionable
 * @constructor
 * @param {number|Array.Number|Object.<number|string, number>} start
 *    beginning state
 */
function Transitionable(start) {
    this.currentAction = null;
    this.actionQueue = [];
    this.callbackQueue = [];

    this.state = 0;
    this.velocity = undefined;
    this._callback = undefined;
    this._engineInstance = null;
    this._currentMethod = null;

    this.set(start);
}

var transitionMethods = {};

Transitionable.registerMethod = function registerMethod(name, engineClass) {
    if (!(name in transitionMethods)) {
        transitionMethods[name] = engineClass;
        return true;
    }
    else return false;
};

Transitionable.unregisterMethod = function unregisterMethod(name) {
    if (name in transitionMethods) {
        delete transitionMethods[name];
        return true;
    }
    else return false;
};

function _loadNext() {
    if (this._callback) {
        var callback = this._callback;
        this._callback = undefined;
        callback();
    }
    if (this.actionQueue.length <= 0) {
        this.set(this.get()); // no update required
        return;
    }
    this.currentAction = this.actionQueue.shift();
    this._callback = this.callbackQueue.shift();

    var method = null;
    var endValue = this.currentAction[0];
    var transition = this.currentAction[1];
    if (transition instanceof Object && transition.method) {
        method = transition.method;
        if (typeof method === 'string') method = transitionMethods[method];
    }
    else {
        method = TweenTransition;
    }

    if (this._currentMethod !== method) {
        if (!(endValue instanceof Object) || method.SUPPORTS_MULTIPLE === true || endValue.length <= method.SUPPORTS_MULTIPLE) {
            this._engineInstance = new method();
        }
        else {
            this._engineInstance = new MultipleTransition(method);
        }
        this._currentMethod = method;
    }

    this._engineInstance.reset(this.state, this.velocity);
    if (this.velocity !== undefined) transition.velocity = this.velocity;
    this._engineInstance.set(endValue, transition, _loadNext.bind(this));
}

/**
 * Add transition to end state to the queue of pending transitions. Special
 *    Use: calling without a transition resets the object to that state with
 *    no pending actions
 *
 * @method set
 *
 * @param {number|FamousMatrix|Array.Number|Object.<number, number>} endState
 *    end state to which we interpolate
 * @param {transition=} transition object of type {duration: number, curve:
 *    f[0,1] -> [0,1] or name}. If transition is omitted, change will be
 *    instantaneous.
 * @param {function()=} callback Zero-argument function to call on observed
 *    completion (t=1)
 */
Transitionable.prototype.set = function set(endState, transition, callback) {
    if (!transition) {
        this.reset(endState);
        if (callback) callback();
        return this;
    }

    var action = [endState, transition];
    this.actionQueue.push(action);
    this.callbackQueue.push(callback);
    if (!this.currentAction) _loadNext.call(this);
    return this;
};

/**
 * Cancel all transitions and reset to a stable state
 *
 * @method reset
 *
 * @param {number|Array.Number|Object.<number, number>} startState
 *    stable state to set to
 */
Transitionable.prototype.reset = function reset(startState, startVelocity) {
    this._currentMethod = null;
    this._engineInstance = null;
    this._callback = undefined;
    this.state = startState;
    this.velocity = startVelocity;
    this.currentAction = null;
    this.actionQueue = [];
    this.callbackQueue = [];
};

/**
 * Add delay action to the pending action queue queue.
 *
 * @method delay
 *
 * @param {number} duration delay time (ms)
 * @param {function} callback Zero-argument function to call on observed
 *    completion (t=1)
 */
Transitionable.prototype.delay = function delay(duration, callback) {
    this.set(this.get(), {duration: duration,
        curve: function() {
            return 0;
        }},
        callback
    );
};

/**
 * Get interpolated state of current action at provided time. If the last
 *    action has completed, invoke its callback.
 *
 * @method get
 *
 * @param {number=} timestamp Evaluate the curve at a normalized version of this
 *    time. If omitted, use current time. (Unix epoch time)
 * @return {number|Object.<number|string, number>} beginning state
 *    interpolated to this point in time.
 */
Transitionable.prototype.get = function get(timestamp) {
    if (this._engineInstance) {
        if (this._engineInstance.getVelocity)
            this.velocity = this._engineInstance.getVelocity();
        this.state = this._engineInstance.get(timestamp);
    }
    return this.state;
};

/**
 * Is there at least one action pending completion?
 *
 * @method isActive
 *
 * @return {boolean}
 */
Transitionable.prototype.isActive = function isActive() {
    return !!this.currentAction;
};

/**
 * Halt transition at current state and erase all pending actions.
 *
 * @method halt
 */
Transitionable.prototype.halt = function halt() {
    this.set(this.get());
};

module.exports = Transitionable;

},{"./Easing":"/Users/joseph/code/touchRunner/Source/Transitions/Easing.js","./MultipleTransition":"/Users/joseph/code/touchRunner/Source/Transitions/MultipleTransition.js","./TweenTransition":"/Users/joseph/code/touchRunner/Source/Transitions/TweenTransition.js"}],"/Users/joseph/code/touchRunner/Source/Transitions/TweenTransition.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

/**
 *
 * A state maintainer for a smooth transition between
 *    numerically-specified states.  Example numeric states include floats or
 *    Transfornm objects.
 *
 *    An initial state is set with the constructor or set(startValue). A
 *    corresponding end state and transition are set with set(endValue,
 *    transition). Subsequent calls to set(endValue, transition) begin at
 *    the last state. Calls to get(timestamp) provide the _interpolated state
 *    along the way.
 *
 *   Note that there is no event loop here - calls to get() are the only way
 *    to find out state projected to the current (or provided) time and are
 *    the only way to trigger callbacks. Usually this kind of object would
 *    be part of the render() path of a visible component.
 *
 * @class TweenTransition
 * @constructor
 *
 * @param {Object} options TODO
 *    beginning state
 */
function TweenTransition(options) {
    this.options = Object.create(TweenTransition.DEFAULT_OPTIONS);
    if (options) this.setOptions(options);

    this._startTime = 0;
    this._startValue = 0;
    this._updateTime = 0;
    this._endValue = 0;
    this._curve = undefined;
    this._duration = 0;
    this._active = false;
    this._callback = undefined;
    this.state = 0;
    this.velocity = undefined;
}

/**
 * Transition curves mapping independent variable t from domain [0,1] to a
 *    range within [0,1]. Includes functions 'linear', 'easeIn', 'easeOut',
 *    'easeInOut', 'easeOutBounce', 'spring'.
 *
 * @property {object} Curve
 * @final
 */
TweenTransition.Curves = {
    linear: function(t) {
        return t;
    },
    easeIn: function(t) {
        return t*t;
    },
    easeOut: function(t) {
        return t*(2-t);
    },
    easeInOut: function(t) {
        if (t <= 0.5) return 2*t*t;
        else return -2*t*t + 4*t - 1;
    },
    easeOutBounce: function(t) {
        return t*(3 - 2*t);
    },
    spring: function(t) {
        return (1 - t) * Math.sin(6 * Math.PI * t) + t;
    }
};

TweenTransition.SUPPORTS_MULTIPLE = true;
TweenTransition.DEFAULT_OPTIONS = {
    curve: TweenTransition.Curves.linear,
    duration: 500,
    speed: 0 /* considered only if positive */
};

var registeredCurves = {
    inQuad: function(t) {
        return t*t;
    },
    outQuad: function(t) {
        return -(t-=1)*t+1;
    },
    inOutQuad: function(t) {
        if ((t/=.5) < 1) return .5*t*t;
        return -.5*((--t)*(t-2) - 1);
    },
    inCubic: function(t) {
        return t*t*t;
    },
    outCubic: function(t) {
        return ((--t)*t*t + 1);
    },
    inOutCubic: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t;
        return .5*((t-=2)*t*t + 2);
    },
    inQuart: function(t) {
        return t*t*t*t;
    },
    outQuart: function(t) {
        return -((--t)*t*t*t - 1);
    },
    inOutQuart: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t*t;
        return -.5 * ((t-=2)*t*t*t - 2);
    },
    inQuint: function(t) {
        return t*t*t*t*t;
    },
    outQuint: function(t) {
        return ((--t)*t*t*t*t + 1);
    },
    inOutQuint: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t*t*t;
        return .5*((t-=2)*t*t*t*t + 2);
    },
    inSine: function(t) {
        return -1.0*Math.cos(t * (Math.PI/2)) + 1.0;
    },
    outSine: function(t) {
        return Math.sin(t * (Math.PI/2));
    },
    inOutSine: function(t) {
        return -.5*(Math.cos(Math.PI*t) - 1);
    },
    inExpo: function(t) {
        return (t===0) ? 0.0 : Math.pow(2, 10 * (t - 1));
    },
    outExpo: function(t) {
        return (t===1.0) ? 1.0 : (-Math.pow(2, -10 * t) + 1);
    },
    inOutExpo: function(t) {
        if (t===0) return 0.0;
        if (t===1.0) return 1.0;
        if ((t/=.5) < 1) return .5 * Math.pow(2, 10 * (t - 1));
        return .5 * (-Math.pow(2, -10 * --t) + 2);
    },
    inCirc: function(t) {
        return -(Math.sqrt(1 - t*t) - 1);
    },
    outCirc: function(t) {
        return Math.sqrt(1 - (--t)*t);
    },
    inOutCirc: function(t) {
        if ((t/=.5) < 1) return -.5 * (Math.sqrt(1 - t*t) - 1);
        return .5 * (Math.sqrt(1 - (t-=2)*t) + 1);
    },
    inElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if (t===1) return 1.0;  if (!p) p=.3;
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/ p));
    },
    outElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if (t===1) return 1.0;  if (!p) p=.3;
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        return a*Math.pow(2,-10*t) * Math.sin((t-s)*(2*Math.PI)/p) + 1.0;
    },
    inOutElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if ((t/=.5)===2) return 1.0;  if (!p) p=(.3*1.5);
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/p));
        return a*Math.pow(2,-10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/p)*.5 + 1.0;
    },
    inBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        return t*t*((s+1)*t - s);
    },
    outBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        return ((--t)*t*((s+1)*t + s) + 1);
    },
    inOutBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        if ((t/=.5) < 1) return .5*(t*t*(((s*=(1.525))+1)*t - s));
        return .5*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2);
    },
    inBounce: function(t) {
        return 1.0 - Easing.outBounce(1.0-t);
    },
    outBounce: function(t) {
        if (t < (1/2.75)) {
            return (7.5625*t*t);
        } else if (t < (2/2.75)) {
            return (7.5625*(t-=(1.5/2.75))*t + .75);
        } else if (t < (2.5/2.75)) {
            return (7.5625*(t-=(2.25/2.75))*t + .9375);
        } else {
            return (7.5625*(t-=(2.625/2.75))*t + .984375);
        }
    },
    inOutBounce: function(t) {
        if (t < .5) return Easing.inBounce(t*2) * .5;
        return Easing.outBounce(t*2-1.0) * .5 + .5;
    }
};

/**
 * Add "unit" curve to internal dictionary of registered curves.
 *
 * @method registerCurve
 *
 * @static
 *
 * @param {string} curveName dictionary key
 * @param {unitCurve} curve function of one numeric variable mapping [0,1]
 *    to range inside [0,1]
 * @return {boolean} false if key is taken, else true
 */
TweenTransition.registerCurve = function registerCurve(curveName, curve) {
    if (!registeredCurves[curveName]) {
        registeredCurves[curveName] = curve;
        return true;
    }
    else {
        return false;
    }
};

/**
 * Remove object with key "curveName" from internal dictionary of registered
 *    curves.
 *
 * @method unregisterCurve
 *
 * @static
 *
 * @param {string} curveName dictionary key
 * @return {boolean} false if key has no dictionary value
 */
TweenTransition.unregisterCurve = function unregisterCurve(curveName) {
    if (registeredCurves[curveName]) {
        delete registeredCurves[curveName];
        return true;
    }
    else {
        return false;
    }
};

/**
 * Retrieve function with key "curveName" from internal dictionary of
 *    registered curves. Default curves are defined in the
 *    TweenTransition.Curves array, where the values represent
 *    unitCurve functions.
 *
 * @method getCurve
 *
 * @static
 *
 * @param {string} curveName dictionary key
 * @return {unitCurve} curve function of one numeric variable mapping [0,1]
 *    to range inside [0,1]
 */
TweenTransition.getCurve = function getCurve(curveName) {
    var curve = registeredCurves[curveName];
    if (curve !== undefined) return curve;
    else throw new Error('curve not registered');
};

/**
 * Retrieve all available curves.
 *
 * @method getCurves
 *
 * @static
 *
 * @return {object} curve functions of one numeric variable mapping [0,1]
 *    to range inside [0,1]
 */
TweenTransition.getCurves = function getCurves() {
    return registeredCurves;
};

 // Interpolate: If a linear function f(0) = a, f(1) = b, then return f(t)
function _interpolate(a, b, t) {
    return ((1 - t) * a) + (t * b);
}

function _clone(obj) {
    if (obj instanceof Object) {
        if (obj instanceof Array) return obj.slice(0);
        else return Object.create(obj);
    }
    else return obj;
}

// Fill in missing properties in "transition" with those in defaultTransition, and
//   convert internal named curve to function object, returning as new
//   object.
function _normalize(transition, defaultTransition) {
    var result = {curve: defaultTransition.curve};
    if (defaultTransition.duration) result.duration = defaultTransition.duration;
    if (defaultTransition.speed) result.speed = defaultTransition.speed;
    if (transition instanceof Object) {
        if (transition.duration !== undefined) result.duration = transition.duration;
        if (transition.curve) result.curve = transition.curve;
        if (transition.speed) result.speed = transition.speed;
    }
    if (typeof result.curve === 'string') result.curve = TweenTransition.getCurve(result.curve);
    return result;
}

/**
 * Set internal options, overriding any default options.
 *
 * @method setOptions
 *
 *
 * @param {Object} options options object
 * @param {Object} [options.curve] function mapping [0,1] to [0,1] or identifier
 * @param {Number} [options.duration] duration in ms
 * @param {Number} [options.speed] speed in pixels per ms
 */
TweenTransition.prototype.setOptions = function setOptions(options) {
    if (options.curve !== undefined) this.options.curve = options.curve;
    if (options.duration !== undefined) this.options.duration = options.duration;
    if (options.speed !== undefined) this.options.speed = options.speed;
};

/**
 * Add transition to end state to the queue of pending transitions. Special
 *    Use: calling without a transition resets the object to that state with
 *    no pending actions
 *
 * @method set
 *
 *
 * @param {number|FamousMatrix|Array.Number|Object.<number, number>} endValue
 *    end state to which we _interpolate
 * @param {transition=} transition object of type {duration: number, curve:
 *    f[0,1] -> [0,1] or name}. If transition is omitted, change will be
 *    instantaneous.
 * @param {function()=} callback Zero-argument function to call on observed
 *    completion (t=1)
 */
TweenTransition.prototype.set = function set(endValue, transition, callback) {
    if (!transition) {
        this.reset(endValue);
        if (callback) callback();
        return;
    }

    this._startValue = _clone(this.get());
    transition = _normalize(transition, this.options);
    if (transition.speed) {
        var startValue = this._startValue;
        if (startValue instanceof Object) {
            var variance = 0;
            for (var i in startValue) variance += (endValue[i] - startValue[i]) * (endValue[i] - startValue[i]);
            transition.duration = Math.sqrt(variance) / transition.speed;
        }
        else {
            transition.duration = Math.abs(endValue - startValue) / transition.speed;
        }
    }

    this._startTime = Date.now();
    this._endValue = _clone(endValue);
    this._startVelocity = _clone(transition.velocity);
    this._duration = transition.duration;
    this._curve = transition.curve;
    this._active = true;
    this._callback = callback;
};

/**
 * Cancel all transitions and reset to a stable state
 *
 * @method reset
 *
 * @param {number|Array.Number|Object.<number, number>} startValue
 *    starting state
 * @param {number} startVelocity
 *    starting velocity
 */
TweenTransition.prototype.reset = function reset(startValue, startVelocity) {
    if (this._callback) {
        var callback = this._callback;
        this._callback = undefined;
        callback();
    }
    this.state = _clone(startValue);
    this.velocity = _clone(startVelocity);
    this._startTime = 0;
    this._duration = 0;
    this._updateTime = 0;
    this._startValue = this.state;
    this._startVelocity = this.velocity;
    this._endValue = this.state;
    this._active = false;
};

/**
 * Get current velocity
 *
 * @method getVelocity
 *
 * @returns {Number} velocity
 */
TweenTransition.prototype.getVelocity = function getVelocity() {
    return this.velocity;
};

/**
 * Get interpolated state of current action at provided time. If the last
 *    action has completed, invoke its callback.
 *
 * @method get
 *
 *
 * @param {number=} timestamp Evaluate the curve at a normalized version of this
 *    time. If omitted, use current time. (Unix epoch time)
 * @return {number|Object.<number|string, number>} beginning state
 *    _interpolated to this point in time.
 */
TweenTransition.prototype.get = function get(timestamp) {
    this.update(timestamp);
    return this.state;
};

function _calculateVelocity(current, start, curve, duration, t) {
    var velocity;
    var eps = 1e-7;
    var speed = (curve(t) - curve(t - eps)) / eps;
    if (current instanceof Array) {
        velocity = [];
        for (var i = 0; i < current.length; i++){
            if (typeof current[i] === 'number')
                velocity[i] = speed * (current[i] - start[i]) / duration;
            else
                velocity[i] = 0;
        }

    }
    else velocity = speed * (current - start) / duration;
    return velocity;
}

function _calculateState(start, end, t) {
    var state;
    if (start instanceof Array) {
        state = [];
        for (var i = 0; i < start.length; i++) {
            if (typeof start[i] === 'number')
                state[i] = _interpolate(start[i], end[i], t);
            else
                state[i] = start[i];
        }
    }
    else state = _interpolate(start, end, t);
    return state;
}

/**
 * Update internal state to the provided timestamp. This may invoke the last
 *    callback and begin a new action.
 *
 * @method update
 *
 *
 * @param {number=} timestamp Evaluate the curve at a normalized version of this
 *    time. If omitted, use current time. (Unix epoch time)
 */
TweenTransition.prototype.update = function update(timestamp) {
    if (!this._active) {
        if (this._callback) {
            var callback = this._callback;
            this._callback = undefined;
            callback();
        }
        return;
    }

    if (!timestamp) timestamp = Date.now();
    if (this._updateTime >= timestamp) return;
    this._updateTime = timestamp;

    var timeSinceStart = timestamp - this._startTime;
    if (timeSinceStart >= this._duration) {
        this.state = this._endValue;
        this.velocity = _calculateVelocity(this.state, this._startValue, this._curve, this._duration, 1);
        this._active = false;
    }
    else if (timeSinceStart < 0) {
        this.state = this._startValue;
        this.velocity = this._startVelocity;
    }
    else {
        var t = timeSinceStart / this._duration;
        this.state = _calculateState(this._startValue, this._endValue, this._curve(t));
        this.velocity = _calculateVelocity(this.state, this._startValue, this._curve, this._duration, t);
    }
};

/**
 * Is there at least one action pending completion?
 *
 * @method isActive
 *
 *
 * @return {boolean}
 */
TweenTransition.prototype.isActive = function isActive() {
    return this._active;
};

/**
 * Halt transition at current state and erase all pending actions.
 *
 * @method halt
 *
 */
TweenTransition.prototype.halt = function halt() {
    this.reset(this.get());
};

// Register all the default curves
TweenTransition.registerCurve('linear', TweenTransition.Curves.linear);
TweenTransition.registerCurve('easeIn', TweenTransition.Curves.easeIn);
TweenTransition.registerCurve('easeOut', TweenTransition.Curves.easeOut);
TweenTransition.registerCurve('easeInOut', TweenTransition.Curves.easeInOut);
TweenTransition.registerCurve('easeOutBounce', TweenTransition.Curves.easeOutBounce);
TweenTransition.registerCurve('spring', TweenTransition.Curves.spring);

TweenTransition.customCurve = function customCurve(v1, v2) {
    v1 = v1 || 0; v2 = v2 || 0;
    return function(t) {
        return v1*t + (-2*v1 - v2 + 3)*t*t + (v1 + v2 - 2)*t*t*t;
    };
};

module.exports = TweenTransition;

},{}],"/Users/joseph/code/touchRunner/Source/Transitions/Utility.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

    /**
     * This namespace holds standalone functionality.
     *  Currently includes name mapping for transition curves,
     *  name mapping for origin pairs, and the after() function.
     *
     * @class Utility
     * @static
     */
    var Utility = {};

    /**
     * Table of direction array positions
     *
     * @property {object} Direction
     * @final
     */
    Utility.Direction = {
        X: 0,
        Y: 1,
        Z: 2
    };

    /**
     * Return wrapper around callback function. Once the wrapper is called N
     *   times, invoke the callback function. Arguments and scope preserved.
     *
     * @method after
     *
     * @param {number} count number of calls before callback function invoked
     * @param {Function} callback wrapped callback function
     *
     * @return {function} wrapped callback with coundown feature
     */
    Utility.after = function after(count, callback) {
        var counter = count;
        return function() {
            counter--;
            if (counter === 0) callback.apply(this, arguments);
        };
    };

    /**
     * Load a URL and return its contents in a callback
     *
     * @method loadURL
     *
     * @param {string} url URL of object
     * @param {function} callback callback to dispatch with content
     */
    Utility.loadURL = function loadURL(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function onreadystatechange() {
            if (this.readyState === 4) {
                if (callback) callback(this.responseText);
            }
        };
        xhr.open('GET', url);
        xhr.send();
    };

    /**
     * Create a document fragment from a string of HTML
     *
     * @method createDocumentFragmentFromHTML
     *
     * @param {string} html HTML to convert to DocumentFragment
     *
     * @return {DocumentFragment} DocumentFragment representing input HTML
     */
    Utility.createDocumentFragmentFromHTML = function createDocumentFragmentFromHTML(html) {
        var element = document.createElement('div');
        element.innerHTML = html;
        var result = document.createDocumentFragment();
        while (element.hasChildNodes()) result.appendChild(element.firstChild);
        return result;
    };

    /*
     *  Deep clone an object.
     *  @param b {Object} Object to clone
     *  @return a {Object} Cloned object.
     */
    Utility.clone = function clone(b) {
        var a;
        if (typeof b === 'object') {
            a = (b instanceof Array) ? [] : {};
            for (var key in b) {
                if (typeof b[key] === 'object' && b[key] !== null) {
                    if (b[key] instanceof Array) {
                        a[key] = new Array(b[key].length);
                        for (var i = 0; i < b[key].length; i++) {
                            a[key][i] = Utility.clone(b[key][i]);
                        }
                    }
                    else {
                      a[key] = Utility.clone(b[key]);
                    }
                }
                else {
                    a[key] = b[key];
                }
            }
        }
        else {
            a = b;
        }
        return a;
    };

    module.exports = Utility;

},{}],"/Users/joseph/code/touchRunner/Source/Utilities/Timer.js":[function(require,module,exports){
module.exports = {
	_once: [],
	_every: [],
	_getter: performance || Date,

	update: function update(){
		var currentTime = this._getter.now();
		var timerEvent;
		var newElapsedTime = currentTime - this._initialTime;

		if(!this._initialTime) this._initialTime = currentTime;
		
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
},{"./Events/EventHandler":"/Users/joseph/code/touchRunner/Source/Events/EventHandler.js","./Game/AjaxLoader":"/Users/joseph/code/touchRunner/Source/Game/AjaxLoader.js","./Game/Engine":"/Users/joseph/code/touchRunner/Source/Game/Engine.js","./Game/ImageLoader":"/Users/joseph/code/touchRunner/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/joseph/code/touchRunner/Source/Game/Viewport.js","./States/Loading":"/Users/joseph/code/touchRunner/Source/States/Loading.js","./States/Menu":"/Users/joseph/code/touchRunner/Source/States/Menu.js","./States/Playing":"/Users/joseph/code/touchRunner/Source/States/Playing.js"}]},{},["/Users/joseph/code/touchRunner/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9FdmVudHMvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9FdmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HTC9HTC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvR0wvU3ByaXRlcy9DaGFyYWN0ZXJTcHJpdGUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL0dML1Nwcml0ZXMvRW5lbXlTcHJpdGVDb2xsZWN0aW9uLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HTC9TcHJpdGVzL1dvcmxkU3ByaXRlLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HYW1lL0FqYXhMb2FkZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL0dhbWUvRW5naW5lLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HYW1lL0ltYWdlTG9hZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9HYW1lL1ZpZXdwb3J0LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9JbnB1dHMvS2V5SGFuZGxlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvSW5wdXRzL1JvdGF0ZVN5bmMuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL0lucHV0cy9Ub3VjaEhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL0lucHV0cy9Ud29GaW5nZXJTeW5jLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9JbnB1dHMva2V5bWFwLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9TdGF0ZXMvTG9hZGluZy5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvU3RhdGVzL01lbnUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL1N0YXRlcy9QbGF5aW5nLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9UcmFuc2l0aW9ucy9FYXNpbmcuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL1RyYW5zaXRpb25zL011bHRpcGxlVHJhbnNpdGlvbi5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvVHJhbnNpdGlvbnMvVHJhbnNpdGlvbmFibGUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvdG91Y2hSdW5uZXIvU291cmNlL1RyYW5zaXRpb25zL1R3ZWVuVHJhbnNpdGlvbi5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvVHJhbnNpdGlvbnMvVXRpbGl0eS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS90b3VjaFJ1bm5lci9Tb3VyY2UvVXRpbGl0aWVzL1RpbWVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL3RvdWNoUnVubmVyL1NvdXJjZS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25pQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7IiwidmFyIEltYWdlTG9hZGVyICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0dhbWUvSW1hZ2VMb2FkZXInKTtcbnZhciBBamF4TG9hZGVyICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9HYW1lL0FqYXhMb2FkZXInKTtcbnZhciBUaW1lciAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9VdGlsaXRpZXMvVGltZXInKTtcbnZhciBXb3JsZFNwcml0ZSAgICAgICAgICAgPSByZXF1aXJlKCcuL1Nwcml0ZXMvV29ybGRTcHJpdGUnKTtcbnZhciBDaGFyYWN0ZXJTcHJpdGUgICAgICAgPSByZXF1aXJlKCcuL1Nwcml0ZXMvQ2hhcmFjdGVyU3ByaXRlJyk7XG52YXIgRW5lbXlTcHJpdGVDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi9TcHJpdGVzL0VuZW15U3ByaXRlQ29sbGVjdGlvbicpO1xudmFyIFJvdGF0ZVN5bmMgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0lucHV0cy9Sb3RhdGVTeW5jJyk7XG4vLyB2YXIgTWFwR2VuZXJhdG9yICAgICAgICAgID0gcmVxdWlyZSgnLi4vSW5wdXRzL01hcEdlbmVyYXRvcicpO1xuXG5mdW5jdGlvbiBSZW5kZXJlciAob3B0aW9ucykge1xuICAgIHRoaXMuY2FudmFzID0gb3B0aW9ucy5jYW52YXM7XG4gICAgdGhpcy5nbCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKTtcbiAgICB0aGlzLmdsLnZpZXdwb3J0V2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICB0aGlzLmdsLnZpZXdwb3J0SGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuXG4gICAgdGhpcy5pbml0U2hhZGVycygpO1xuICAgIHRoaXMuaW5pdFRleHR1cmVzKG9wdGlvbnMudGV4dHVyZXMpO1xuXG4gICAgaW5pdE1hdHJpY2VzLmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLndvcmxkUm90YXRpb24gPSAwO1xuICAgIHRoaXMud29ybGRUcmFuc2xhdGlvbiA9IFswLCAwXTtcbiAgICB0aGlzLnRyYW5zbGF0ZVJhdGUgPSBbMCwgLTFdO1xuICAgIHRoaXMuc3RhckNvb3JkcyA9IFtdO1xuICAgIHRoaXMuc2hpcFNpemUgPSAwLjI7XG5cbiAgICB0aGlzLmdsLmVuYWJsZSh0aGlzLmdsLkJMRU5EKTtcblxuICAgIHRoaXMuZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xuICAgIHRoaXMuZ2wuYmxlbmRGdW5jKHRoaXMuZ2wuU1JDX0FMUEhBLCB0aGlzLmdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuXG4gICAgdGhpcy5fcm90YXRlU3luYyA9IG5ldyBSb3RhdGVTeW5jKHdpbmRvdyk7XG4gICAgdGhpcy5fcm90YXRlU3luYy5vbigndXBkYXRlJywgdGhpcy5oYW5kbGVSb3RhdGlvbi5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9yb3RhdGVTeW5jLm9uKCdlbmQnLCB0aGlzLmhhbmRsZUVuZC5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuc3ByaXRlcyA9IFtdO1xuICAgIGluaXRTcHJpdGVzLmNhbGwodGhpcyk7XG5cbiAgICB2YXIgcG9pbnRzID0gW107XG4gICAgd2luZG93Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBwb2ludHMucHVzaChbKCgoZS5jbGllbnRYIC8gaW5uZXJXaWR0aCkgKiAyKSAtIDEpICsgdGhpcy53b3JsZFRyYW5zbGF0aW9uWzBdLCAoMSAtICgoZS5jbGllbnRZIC8gaW5uZXJIZWlnaHQpICogMikpICsgdGhpcy53b3JsZFRyYW5zbGF0aW9uWzFdXSk7XG4gICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHBvaW50cykpO1xuICAgIH0uYmluZCh0aGlzKVxufVxuXG5zeW5jQWN0aXZlID0gdHJ1ZTtcblJlbmRlcmVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICBpZighc3luY0FjdGl2ZSkgcmV0dXJuO1xuXG4gICAgdGhpcy53b3JsZFRyYW5zbGF0aW9uWzBdICs9IDAuMDAzICogdGhpcy50cmFuc2xhdGVSYXRlWzBdO1xuICAgIHRoaXMud29ybGRUcmFuc2xhdGlvblsxXSArPSAwLjAwMyAqIHRoaXMudHJhbnNsYXRlUmF0ZVsxXTtcblxuICAgIGlmKHRoaXMuY29sbGlzaW9uRGV0ZWN0ZWQoKSkge1xuICAgICAgICB0aGlzLmNoYXJhY3RlclNwcml0ZS5oYW5kbGVDb2xsaXNpb24oKTtcbiAgICAgICAgc3luY0FjdGl2ZSA9IGZhbHNlO1xuICAgIH1cbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZVJvdGF0aW9uID0gZnVuY3Rpb24gaGFuZGxlUm90YXRpb24gKGUpIHtcbiAgICB0aGlzLndvcmxkUm90YXRpb24gKz0gZS5kZWx0YTtcblxuICAgIHZhciBuZXdYID0gLU1hdGguc2luKHRoaXMud29ybGRSb3RhdGlvbik7XG4gICAgdmFyIG5ld1kgPSAtTWF0aC5jb3ModGhpcy53b3JsZFJvdGF0aW9uKTtcblxuICAgIHRoaXMudHJhbnNsYXRlUmF0ZSA9IFtuZXdYLCBuZXdZXTtcblxuICAgIHRoaXMud29ybGRTcHJpdGUucm90YXRpb24gPSB0aGlzLndvcmxkUm90YXRpb247XG4gICAgdGhpcy5lbmVteVNwcml0ZXMud29ybGRSb3RhdGlvbiA9IHRoaXMud29ybGRSb3RhdGlvbjtcbiAgICB0aGlzLmNoYXJhY3RlclNwcml0ZS51cGRhdGVSb3QoZSk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5jb2xsaXNpb25EZXRlY3RlZCA9IGZ1bmN0aW9uIGNvbGxpc2lvbkRldGVjdGVkKCkge1xuICAgIHZhciBoYWxmU2hpcFNpemUgPSB0aGlzLnNoaXBTaXplICogMC41O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0YXJDb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYodGhpcy5zdGFyQ29vcmRzW2ldWzBdIDwgKHRoaXMud29ybGRUcmFuc2xhdGlvblswXSArIGhhbGZTaGlwU2l6ZSkpe1xuICAgICAgICAgICAgaWYodGhpcy5zdGFyQ29vcmRzW2ldWzBdID4gKHRoaXMud29ybGRUcmFuc2xhdGlvblswXSAtIGhhbGZTaGlwU2l6ZSkpe1xuICAgICAgICAgICAgICAgIGlmKC10aGlzLnN0YXJDb29yZHNbaV1bMV0gPCAodGhpcy53b3JsZFRyYW5zbGF0aW9uWzFdICsgaGFsZlNoaXBTaXplKSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKC10aGlzLnN0YXJDb29yZHNbaV1bMV0gPiAodGhpcy53b3JsZFRyYW5zbGF0aW9uWzFdIC0gaGFsZlNoaXBTaXplKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZUVuZCA9IGZ1bmN0aW9uIGhhbmRsZUVuZCAoKSB7XG4gICAgdGhpcy5jaGFyYWN0ZXJTcHJpdGUuc2V0dGxlKCk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdGhpcy5nbC52aWV3cG9ydCgwLCAwLCB0aGlzLmdsLnZpZXdwb3J0V2lkdGgsIHRoaXMuZ2wudmlld3BvcnRIZWlnaHQpO1xuICAgIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUIHwgdGhpcy5nbC5ERVBUSF9CVUZGRVJfQklUKTtcblxuICAgIC8qIElOSVRJQUxJWkUgTVYgTUFUUklYICovXG4gICAgbWF0NC5wZXJzcGVjdGl2ZSg0NSwgdGhpcy5nbC52aWV3cG9ydFdpZHRoIC8gdGhpcy5nbC52aWV3cG9ydEhlaWdodCwgMC4xLCAxMDAuMCwgdGhpcy5wTWF0cml4KTtcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYodGhpcy5zaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5wTWF0cml4KTtcblxuICAgIG1hdDQuaWRlbnRpdHkodGhpcy5tdk1hdHJpeCk7XG5cbiAgICAvKiBTRVQgVU5JRk9STVMgKi9cbiAgICB0aGlzLmdsLnVuaWZvcm0xZih0aGlzLnNoYWRlclByb2dyYW0ucmVzb2x1dGlvbiwgaW5uZXJIZWlnaHQgLyBpbm5lcldpZHRoKTtcblxuICAgIC8qIFJFTkRFUiBXT1JMRCAqL1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zcHJpdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuc3ByaXRlc1tpXS51cGRhdGUoKTtcbiAgICAgICAgdGhpcy5zcHJpdGVzW2ldLnJlbmRlcigpO1xuICAgIH1cbiAgICAvLyB0aGlzLmVuZW15U3ByaXRlcy5yZW5kZXIoKTtcbn0gICBcblxuUmVuZGVyZXIucHJvdG90eXBlLmluaXRTaGFkZXJzID0gZnVuY3Rpb24gaW5pdFNoYWRlcnMocmVzcG9uc2VBcnJheSkge1xuXHR2YXIgdmVydGV4U2hhZGVyRGF0YSA9IEFqYXhMb2FkZXIuZ2V0KCcuLi9TaGFkZXJzL1ZlcnRleFNoYWRlci5nbHNsJyk7XG5cdHZhciBmcmFnbWVudFNoYWRlckRhdGEgPSBBamF4TG9hZGVyLmdldCgnLi4vU2hhZGVycy9GcmFnbWVudFNoYWRlci5nbHNsJyk7XG5cbiAgICB2ZXJ0ZXhTaGFkZXIgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcih0aGlzLmdsLlZFUlRFWF9TSEFERVIpO1xuICAgIGZyYWdtZW50U2hhZGVyID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIodGhpcy5nbC5GUkFHTUVOVF9TSEFERVIpO1xuXG4gICAgdGhpcy5nbC5zaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyLCB2ZXJ0ZXhTaGFkZXJEYXRhKTtcbiAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIodmVydGV4U2hhZGVyKTtcblxuICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyLCBmcmFnbWVudFNoYWRlckRhdGEpO1xuICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgICB0aGlzLnNoYWRlclByb2dyYW0gPSB0aGlzLmdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICB0aGlzLmdsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gICAgdGhpcy5nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG4gICAgdGhpcy5nbC5saW5rUHJvZ3JhbSh0aGlzLnNoYWRlclByb2dyYW0pO1xuXG4gICAgaWYgKCF0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB0aGlzLmdsLkxJTktfU1RBVFVTKSkgY29uc29sZS5sb2coXCJDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzXCIpO1xuXG4gICAgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICB0aGlzLnNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUgPSB0aGlzLmdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJhVmVydGV4UG9zaXRpb25cIik7XG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLnNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xuXG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSA9IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcImFUZXh0dXJlQ29vcmRcIik7XG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLnNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcblxuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS5wTWF0cml4VW5pZm9ybSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJ1UE1hdHJpeFwiKTtcbiAgICB0aGlzLnNoYWRlclByb2dyYW0ubXZNYXRyaXhVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVNVk1hdHJpeFwiKTtcbiAgICB0aGlzLnNoYWRlclByb2dyYW0uc2FtcGxlclVuaWZvcm0gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwidVNhbXBsZXJcIik7XG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtLnNwcml0ZUNvb3JkID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVTcHJpdGVDb29yZFwiKTtcbiAgICB0aGlzLnNoYWRlclByb2dyYW0uc3ByaXRlUm90ID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVTcHJpdGVSb3RcIik7XG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtLnJlc29sdXRpb24gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwidVJlc29sdXRpb25cIik7XG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtLmRyYXdTdGF0ZSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJ1RHJhd1N0YXRlXCIpO1xuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS5lbmVteVBvc2l0aW9ucyA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJ1RW5lbXlQb3NpdGlvbnNcIik7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5pbml0VGV4dHVyZXMgPSBmdW5jdGlvbiBpbml0VGV4dHVyZXModGV4dHVyZXMpIHtcbiAgICB0aGlzLnRleHR1cmVzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgXHR0aGlzLnRleHR1cmVzW2ldID0gdGhpcy5nbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgXHR0aGlzLnRleHR1cmVzW2ldLmltYWdlID0gSW1hZ2VMb2FkZXIuZ2V0KHRleHR1cmVzW2ldKTtcbiAgICAgICAgLy8gdGhpcy5nbC5waXhlbFN0b3JlaSh0aGlzLmdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICAgICAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlc1tpXSk7XG4gICAgICAgIHRoaXMuZ2wudGV4SW1hZ2UyRCh0aGlzLmdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZ2wuUkdCQSwgdGhpcy5nbC5SR0JBLCB0aGlzLmdsLlVOU0lHTkVEX0JZVEUsIHRoaXMudGV4dHVyZXNbaV0uaW1hZ2UpO1xuICAgICAgICB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5nbC5MSU5FQVIpO1xuICAgICAgICAvLyB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5nbC5MSU5FQVJfTUlQTUFQX0xJTkVBUik7XG4gICAgICAgIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLmdsLkxJTkVBUik7XG4gICAgICAgIHRoaXMuZ2wuZ2VuZXJhdGVNaXBtYXAodGhpcy5nbC5URVhUVVJFXzJEKTtcblxuICAgICAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaW5pdFNwcml0ZXMgKCkge1xuICAgIHZhciBOVU1FTkVNSUVTID0gNDA7XG5cbiAgICB0aGlzLndvcmxkU3ByaXRlID0gbmV3IFdvcmxkU3ByaXRlKHtcbiAgICAgICAgZ2w6IHRoaXMuZ2wsXG4gICAgICAgIGNhbnZhczogdGhpcy5jYW52YXMsXG4gICAgICAgIHRleHR1cmU6IHRoaXMudGV4dHVyZXNbMF0sXG4gICAgICAgIHNoYWRlclByb2dyYW06IHRoaXMuc2hhZGVyUHJvZ3JhbSxcbiAgICAgICAgcE1hdHJpeDogdGhpcy5wTWF0cml4LFxuICAgICAgICBzcHJpdGVDb29yZDogdGhpcy53b3JsZFRyYW5zbGF0aW9uLFxuICAgICAgICB3b3JsZFJvdGF0aW9uOiB0aGlzLndvcmxkUm90YXRpb25cbiAgICB9KTtcblxuICAgIHRoaXMuY2hhcmFjdGVyU3ByaXRlID0gbmV3IENoYXJhY3RlclNwcml0ZSh7XG4gICAgICAgIGdsOiB0aGlzLmdsLFxuICAgICAgICBjYW52YXM6IHRoaXMuY2FudmFzLFxuICAgICAgICB0ZXh0dXJlOiB0aGlzLnRleHR1cmVzWzFdLFxuICAgICAgICBzaGFkZXJQcm9ncmFtOiB0aGlzLnNoYWRlclByb2dyYW0sXG4gICAgICAgIHBNYXRyaXg6IHRoaXMucE1hdHJpeCxcbiAgICAgICAgc2l6ZTogdGhpcy5zaGlwU2l6ZVxuICAgIH0pO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICAgIHRoaXMuc3RhckNvb3Jkcy5wdXNoKFswLjQsIGkgKiAwLjI1XSwgWy0wLjQsIGkgKiAwLjI1XSk7XG4gICAgfVxuXG4gICAgdGhpcy5lbmVteVNwcml0ZXMgPSBuZXcgRW5lbXlTcHJpdGVDb2xsZWN0aW9uKHtcbiAgICAgICAgZ2w6IHRoaXMuZ2wsXG4gICAgICAgIGNhbnZhczogdGhpcy5jYW52YXMsXG4gICAgICAgIHRleHR1cmU6IHRoaXMudGV4dHVyZXNbMl0sXG4gICAgICAgIHNoYWRlclByb2dyYW06IHRoaXMuc2hhZGVyUHJvZ3JhbSxcbiAgICAgICAgcE1hdHJpeDogdGhpcy5wTWF0cml4LFxuICAgICAgICBwb3NpdGlvbnM6IHRoaXMuc3RhckNvb3JkcyxcbiAgICAgICAgd29ybGRUcmFuc2xhdGlvbjogdGhpcy53b3JsZFRyYW5zbGF0aW9uXG4gICAgfSk7XG5cbiAgICB0aGlzLnNwcml0ZXMucHVzaCh0aGlzLndvcmxkU3ByaXRlKTtcbiAgICB0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmNoYXJhY3RlclNwcml0ZSk7XG4gICAgdGhpcy5zcHJpdGVzLnB1c2godGhpcy5lbmVteVNwcml0ZXMpO1xufVxuXG5mdW5jdGlvbiBpbml0TWF0cmljZXMgKCkge1xuICAgIHRoaXMubXZNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xuICAgIHRoaXMubXZNYXRyaXhTdGFjayA9IFtdO1xuICAgIHRoaXMucE1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7IiwidmFyIFRyYW5zaXRpb25hYmxlID0gcmVxdWlyZSgnLi4vLi4vVHJhbnNpdGlvbnMvVHJhbnNpdGlvbmFibGUnKTtcblxuZnVuY3Rpb24gQ2hhcmFjdGVyU3ByaXRlIChvcHRpb25zKSB7XG5cdHRoaXMuZ2wgICAgICAgICAgICA9IG9wdGlvbnMuZ2w7XG5cdHRoaXMuc2hhZGVyUHJvZ3JhbSA9IG9wdGlvbnMuc2hhZGVyUHJvZ3JhbTtcblx0dGhpcy50ZXh0dXJlICAgICAgID0gb3B0aW9ucy50ZXh0dXJlO1xuXG5cdHRoaXMubWF0cml4ICAgICAgPSBtYXQ0LmNyZWF0ZSgpO1xuXHR0aGlzLnBvc2l0aW9uICAgID0gbmV3IFRyYW5zaXRpb25hYmxlKFswLjAsIDAuMCwgLTEuNV0pO1xuXHR0aGlzLnNwcml0ZUNvb3JkID0gWzAuMCwgMC4wXTtcblx0dGhpcy5zcHJpdGVSb3QgICA9IDA7XG5cdHRoaXMucm90YXRpb24gICAgPSBuZXcgVHJhbnNpdGlvbmFibGUoMCk7XG5cdHRoaXMuc2V0dGxlUmF0ZSAgPSAwLjE7XG5cblx0aW5pdEJ1ZmZlcnMuY2FsbCh0aGlzKTtcbn1cblxuQ2hhcmFjdGVyU3ByaXRlLk9QVElPTlMgPSB7XG5cdHNwaW5PdXRBbmltYXRpb246IHtkdXJhdGlvbjogMTAwMH1cbn1cblxuQ2hhcmFjdGVyU3ByaXRlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG5cbn1cblxuQ2hhcmFjdGVyU3ByaXRlLnByb3RvdHlwZS51cGRhdGVSb3QgPSBmdW5jdGlvbiB1cGRhdGVSb3QodGhldGEpIHtcblx0dGhpcy5yb3RhdGlvbi5oYWx0KCk7XG5cdHRoaXMucm90YXRpb24uc2V0KC10aGV0YS5hbmdsZSAlIE1hdGguUEkpO1xuXHQvLyBjb25zb2xlLmxvZyh0aGV0YS5hbmdsZSlcblx0Ly8gdGhpcy5yb3RhdGlvbi5zZXQoMCwge2R1cmF0aW9uOiAxMDB9KTtcbn1cblxuQ2hhcmFjdGVyU3ByaXRlLnByb3RvdHlwZS5oYW5kbGVDb2xsaXNpb24gPSBmdW5jdGlvbiBoYW5kbGVDb2xsaXNpb24oKSB7XG5cdHRoaXMucm90YXRpb24uaGFsdCgpO1xuXHR0aGlzLnBvc2l0aW9uLmhhbHQoKTtcblx0dGhpcy5wb3NpdGlvbi5zZXQoWzAuMCwgMS4wLCAtMS41XSwge2R1cmF0aW9uOiAxNDAwfSk7XG5cdHRoaXMucm90YXRpb24uc2V0KE1hdGguUEkgKiAxMCwge2R1cmF0aW9uOiAxNDAwfSk7XG59XG5cbkNoYXJhY3RlclNwcml0ZS5wcm90b3R5cGUuc2V0dGxlID0gZnVuY3Rpb24gc2V0dGxlKCkge1xuXHR0aGlzLnJvdGF0aW9uLnNldCgwLCB7ZHVyYXRpb246IDEwMDAsIGN1cnZlOiAnb3V0UXVhcnQnfSk7XG59XG5cbkNoYXJhY3RlclNwcml0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRtYXQ0LmlkZW50aXR5KHRoaXMubWF0cml4KTtcbiAgICBtYXQ0LnRyYW5zbGF0ZSh0aGlzLm1hdHJpeCwgdGhpcy5wb3NpdGlvbi5nZXQoKSk7XG4gICAgbWF0NC5yb3RhdGUodGhpcy5tYXRyaXgsIC10aGlzLnJvdGF0aW9uLmdldCgpLCBbMCwgMC4wLCAwLjRdKTtcblxuICAgIC8qIFNDQUxFRCBUTyBXSU5ET1cgKi9cbiAgICB0aGlzLmdsLnVuaWZvcm0xaSh0aGlzLnNoYWRlclByb2dyYW0uZHJhd1N0YXRlLCAxKTtcblxuICAgIC8qIFNFVCBURVhUVVJFICovXG4gICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRTApO1xuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHRoaXMuc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSwgMCk7XG5cbiAgICAvKiBCSU5EIFRFWFRVUkUgQ09PUkRJTkFURVMgKi9cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMudGV4dHVyZUJ1ZmZlcik7XG4gICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuc2hhZGVyUHJvZ3JhbS50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIHRoaXMudGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgLyogQklORCBQT1NJVElPTiBDT09SRElOQVRFUyAqL1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgdGhpcy5wb3NpdGlvbkJ1ZmZlcik7XG4gICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgdGhpcy5wb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgLyogU0VUIFVOSUZPUk1TICovXG4gICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS5tdk1hdHJpeFVuaWZvcm0sIGZhbHNlLCB0aGlzLm1hdHJpeCk7XG4gICAgdGhpcy5nbC51bmlmb3JtMmYodGhpcy5zaGFkZXJQcm9ncmFtLnNwcml0ZUNvb3JkLCB0aGlzLnNwcml0ZUNvb3JkWzBdLCB0aGlzLnNwcml0ZUNvb3JkWzFdKTtcbiAgICB0aGlzLmdsLnVuaWZvcm0xZih0aGlzLnNoYWRlclByb2dyYW0ucmVzb2x1dGlvbiwgaW5uZXJIZWlnaHQgLyBpbm5lcldpZHRoKTtcbiAgICB0aGlzLmdsLnVuaWZvcm0xZih0aGlzLnNoYWRlclByb2dyYW0uc3ByaXRlUm90LCAwKTtcblxuICAgIC8qIERSQVcgKi9cbiAgICB0aGlzLmdsLmRyYXdBcnJheXModGhpcy5nbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5wb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyk7XG59XG5cbmZ1bmN0aW9uIGluaXRCdWZmZXJzKCkge1xuXHR0aGlzLnBvc2l0aW9uQnVmZmVyID0gdGhpcy5nbC5jcmVhdGVCdWZmZXIoKTtcblx0dGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnBvc2l0aW9uQnVmZmVyKTtcblx0dGhpcy5wb3NpdGlvblZlcnRpY2VzID0gW1xuXHRcdC0wLjEsICAwLjEwLCAwLjAsXG5cdFx0IDAuMSwgIDAuMTAsIDAuMCxcblx0XHQtMC4xLCAtMC4xMCwgMC4wLFxuXHRcdCAwLjEsIC0wLjEwLCAwLjBcblx0XTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb3NpdGlvblZlcnRpY2VzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG4gICAgdGhpcy5wb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSA9IDM7XG4gICAgdGhpcy5wb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyA9IDQ7XG5cbiAgICB0aGlzLnRleHR1cmVCdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMudGV4dHVyZUJ1ZmZlcik7XG5cdHRoaXMudGV4dHVyZVZlcnRpY2VzID0gW1xuXHRcdDAuMCwgMC4wLFxuXHRcdDAuMTksIDAuMCxcblx0XHQwLjAsIDAuMjUsXG5cdFx0MC4xOSwgMC4yNVxuXHRdO1xuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0aGlzLnRleHR1cmVWZXJ0aWNlcyksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xuICAgIHRoaXMudGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSA9IDI7XG4gICAgdGhpcy50ZXh0dXJlQnVmZmVyLm51bUl0ZW1zID0gNDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFyYWN0ZXJTcHJpdGU7IiwiXG5mdW5jdGlvbiBFbmVteVNwcml0ZUNvbGxlY3Rpb24gKG9wdGlvbnMpIHtcblx0dGhpcy5nbCAgICAgICAgICAgID0gb3B0aW9ucy5nbDtcblx0dGhpcy5zaGFkZXJQcm9ncmFtID0gb3B0aW9ucy5zaGFkZXJQcm9ncmFtO1xuXHR0aGlzLnRleHR1cmUgICAgICAgPSBvcHRpb25zLnRleHR1cmU7XG5cblx0dGhpcy5tYXRyaXggICAgICAgICAgID0gbWF0NC5jcmVhdGUoKTtcblx0dGhpcy5wb3NpdGlvbiAgICAgICAgID0gWzAuMCwgMC4wLCAtMS41XTtcblx0dGhpcy5zcHJpdGVDb29yZCAgICAgID0gWzAuMCwgMC4wXTtcblx0dGhpcy5zcHJpdGVSb3QgICAgICAgID0gMDtcbiAgICB0aGlzLndvcmxkUm90YXRpb24gICAgPSAwO1xuICAgIHRoaXMud29ybGRUcmFuc2xhdGlvbiA9IG9wdGlvbnMud29ybGRUcmFuc2xhdGlvbjtcblxuICAgIHRoaXMuZW5lbWllcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5lbmVtaWVzW2ldID0ge1xuICAgICAgICAgICAgdHJhbnNsYXRpb246IG9wdGlvbnMucG9zaXRpb25zW2ldLFxuICAgICAgICAgICAgcm90YXRpb246IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJLFxuICAgICAgICAgICAgcm90YXRpb25SYXRlOiAwLjA4XG4gICAgICAgIH1cbiAgICB9XG5cblx0aW5pdEJ1ZmZlcnMuY2FsbCh0aGlzKTtcbn1cblxuRW5lbXlTcHJpdGVDb2xsZWN0aW9uLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVuZW1pZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5lbmVtaWVzW2ldLnJvdGF0aW9uICs9IHRoaXMuZW5lbWllc1tpXS5yb3RhdGlvblJhdGU7XG4gICAgfVxufVxuXG5FbmVteVNwcml0ZUNvbGxlY3Rpb24ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAvKiBTQ0FMRUQgVE8gV0lORE9XICovXG4gICAgdGhpcy5nbC51bmlmb3JtMWkodGhpcy5zaGFkZXJQcm9ncmFtLmRyYXdTdGF0ZSwgMik7XG5cbiAgICAvKiBTRVQgVEVYVFVSRSAqL1xuICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwKTtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLmdsLnVuaWZvcm0xaSh0aGlzLnNoYWRlclByb2dyYW0uc2FtcGxlclVuaWZvcm0sIDApO1xuXG4gICAgLyogQklORCBURVhUVVJFIENPT1JESU5BVEVTICovXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnRleHR1cmVCdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLnNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlLCB0aGlzLnRleHR1cmVCdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIC8qIEJJTkQgUE9TSVRJT04gQ09PUkRJTkFURVMgKi9cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMucG9zaXRpb25CdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLnNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIHRoaXMucG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIC8qIEZPUiBBTEwgRU5FTUlFUyAqL1xuICAgIHZhciBlbmVteTtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5lbmVtaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVuZW15ID0gdGhpcy5lbmVtaWVzW2ldO1xuICAgICAgICBtYXQ0LmlkZW50aXR5KHRoaXMubWF0cml4KTtcbiAgICAgICAgbWF0NC5yb3RhdGUodGhpcy5tYXRyaXgsIHRoaXMud29ybGRSb3RhdGlvbiwgWzAsIDAuMCwgLTFdKTtcbiAgICAgICAgbWF0NC50cmFuc2xhdGUodGhpcy5tYXRyaXgsIFtcbiAgICAgICAgICAgIGVuZW15LnRyYW5zbGF0aW9uWzBdIC0gdGhpcy53b3JsZFRyYW5zbGF0aW9uWzBdLFxuICAgICAgICAgICAgZW5lbXkudHJhbnNsYXRpb25bMV0gKyB0aGlzLndvcmxkVHJhbnNsYXRpb25bMV0sXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWzJdXG4gICAgICAgIF0pO1xuICAgICAgICBtYXQ0LnJvdGF0ZSh0aGlzLm1hdHJpeCwgLWVuZW15LnJvdGF0aW9uLCBbMCwgMC4wLCAxXSk7XG5cbiAgICAgICAgLyogU0VUIFVOSUZPUk1TICovXG4gICAgICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdih0aGlzLnNoYWRlclByb2dyYW0ubXZNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5tYXRyaXgpO1xuICAgICAgICB0aGlzLmdsLnVuaWZvcm0yZih0aGlzLnNoYWRlclByb2dyYW0uc3ByaXRlQ29vcmQsIHRoaXMuc3ByaXRlQ29vcmRbMF0sIHRoaXMuc3ByaXRlQ29vcmRbMV0pO1xuICAgICAgICB0aGlzLmdsLnVuaWZvcm0xZih0aGlzLnNoYWRlclByb2dyYW0ucmVzb2x1dGlvbiwgaW5uZXJIZWlnaHQgLyBpbm5lcldpZHRoKTtcbiAgICAgICAgdGhpcy5nbC51bmlmb3JtMWYodGhpcy5zaGFkZXJQcm9ncmFtLnNwcml0ZVJvdCwgMCk7XG4gICAgICAgIFxuICAgICAgICAvKiBEUkFXICovXG4gICAgICAgIHRoaXMuZ2wuZHJhd0FycmF5cyh0aGlzLmdsLlRSSUFOR0xFX1NUUklQLCAwLCB0aGlzLnBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRCdWZmZXJzKCkge1xuICAgIHZhciBlUG9zO1xuICAgIHZhciB2ZXJ0aWNlcztcbiAgICB2YXIgdGV4dHVyZVZlcnRpY2VzO1xuXG5cdHRoaXMucG9zaXRpb25CdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMucG9zaXRpb25CdWZmZXIpO1xuICAgIHRoaXMucG9zaXRpb25CdWZmZXIuaXRlbVNpemUgPSAzO1xuICAgIHRoaXMucG9zaXRpb25CdWZmZXIubnVtSXRlbXMgPSA0O1xuXHR2ZXJ0aWNlcyA9IFtcbiAgICAgICAgLTAuMDM3LCAgMC4wMzcsIDAuMCxcbiAgICAgICAgIDAuMDM3LCAgMC4wMzcsIDAuMCxcbiAgICAgICAgLTAuMDM3LCAtMC4wMzcsIDAuMCxcbiAgICAgICAgIDAuMDM3LCAtMC4wMzcsIDAuMFxuICAgIF07XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG5cbiAgICB0aGlzLnRleHR1cmVCdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMudGV4dHVyZUJ1ZmZlcik7XG4gICAgdGhpcy50ZXh0dXJlQnVmZmVyLml0ZW1TaXplID0gMjtcbiAgICB0aGlzLnRleHR1cmVCdWZmZXIubnVtSXRlbXMgPSA0O1xuICAgIHRleHR1cmVWZXJ0aWNlcyA9IFtcbiAgICAgICAgMC4zNCwgMC4wMjUsXG4gICAgICAgIDAuNDEzLCAwLjAyNSxcbiAgICAgICAgMC4zNCwgMC4xLFxuICAgICAgICAwLjQxMywgMC4xXG4gICAgXTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZVZlcnRpY2VzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW5lbXlTcHJpdGVDb2xsZWN0aW9uOyIsInZhciBUaW1lciA9IHJlcXVpcmUoJy4uLy4uL1V0aWxpdGllcy9UaW1lcicpO1xudmFyIFJvdGF0ZVN5bmMgPSByZXF1aXJlKCcuLi8uLi9JbnB1dHMvUm90YXRlU3luYycpO1xuXG5mdW5jdGlvbiBXb3JsZFNwcml0ZSAob3B0aW9ucykge1xuXHR0aGlzLmdsID0gb3B0aW9ucy5nbDtcblx0dGhpcy5zaGFkZXJQcm9ncmFtID0gb3B0aW9ucy5zaGFkZXJQcm9ncmFtO1xuXHR0aGlzLnRleHR1cmUgPSBvcHRpb25zLnRleHR1cmU7XG5cblx0dGhpcy5yb3RhdGlvbiA9IDA7XG5cdHRoaXMubWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcblx0dGhpcy5wb3NpdGlvbiA9IFswLCAwLCAtMl07XG5cdHRoaXMuc3ByaXRlQ29vcmQgPSBvcHRpb25zLnNwcml0ZUNvb3JkO1xuXHR0aGlzLnRyYW5zbGF0ZVNjYWxlID0gMC4wNTtcblxuXHRpbml0QnVmZmVycy5jYWxsKHRoaXMpO1xufVxuXG5Xb3JsZFNwcml0ZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xufVxuXHRcbldvcmxkU3ByaXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdG1hdDQuaWRlbnRpdHkodGhpcy5tYXRyaXgpO1xuICAgIG1hdDQudHJhbnNsYXRlKHRoaXMubWF0cml4LCBbdGhpcy5wb3NpdGlvblswXSwgdGhpcy5wb3NpdGlvblsxXSwgdGhpcy5wb3NpdGlvblsyXV0pO1xuXG4gICAgLyogU0NBTEVEIFRPIFdJTkRPVyAqL1xuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHRoaXMuc2hhZGVyUHJvZ3JhbS5kcmF3U3RhdGUsIDApO1xuXG4gICAgLyogU0VUIFRFWFRVUkUgKi9cbiAgICB0aGlzLmdsLmFjdGl2ZVRleHR1cmUodGhpcy5nbC5URVhUVVJFMCk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWkodGhpcy5zaGFkZXJQcm9ncmFtLnNhbXBsZXJVbmlmb3JtLCAwKTtcblxuICAgIC8qIEJJTkQgVEVYVFVSRSBDT09SRElOQVRFUyAqL1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQnVmZmVyKTtcbiAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5zaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgdGhpcy50ZXh0dXJlQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAvKiBCSU5EIFBPU0lUSU9OIENPT1JESU5BVEVTICovXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnBvc2l0aW9uQnVmZmVyKTtcbiAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5zaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCB0aGlzLnBvc2l0aW9uQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAvKiBTRVQgVU5JRk9STVMgKi9cbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYodGhpcy5zaGFkZXJQcm9ncmFtLm12TWF0cml4VW5pZm9ybSwgZmFsc2UsIHRoaXMubWF0cml4KTtcbiAgICB0aGlzLmdsLnVuaWZvcm0yZih0aGlzLnNoYWRlclByb2dyYW0uc3ByaXRlQ29vcmQsIHRoaXMuc3ByaXRlQ29vcmRbMF0gKiB0aGlzLnRyYW5zbGF0ZVNjYWxlLCB0aGlzLnNwcml0ZUNvb3JkWzFdICogdGhpcy50cmFuc2xhdGVTY2FsZSk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWYodGhpcy5zaGFkZXJQcm9ncmFtLnJlc29sdXRpb24sIGlubmVySGVpZ2h0IC8gaW5uZXJXaWR0aCk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWYodGhpcy5zaGFkZXJQcm9ncmFtLnNwcml0ZVJvdCwgdGhpcy5yb3RhdGlvbik7XG5cbiAgICAvKiBEUkFXICovXG4gICAgdGhpcy5nbC5kcmF3QXJyYXlzKHRoaXMuZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMucG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xufVxuXG5mdW5jdGlvbiBpbml0QnVmZmVycygpIHtcblx0dmFyIGFzcGVjdFJhdGlvID0gaW5uZXJIZWlnaHQgLyBpbm5lcldpZHRoO1xuXG5cdHRoaXMucG9zaXRpb25CdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMucG9zaXRpb25CdWZmZXIpO1xuXHR0aGlzLnBvc2l0aW9uVmVydGljZXMgPSBbXG5cdFx0LTIuNSwgIDIuNSAqIGFzcGVjdFJhdGlvLCAwLjAsXG5cdFx0IDIuNSwgIDIuNSAqIGFzcGVjdFJhdGlvLCAwLjAsXG5cdFx0LTIuNSwgLTIuNSAqIGFzcGVjdFJhdGlvLCAwLjAsXG5cdFx0IDIuNSwgLTIuNSAqIGFzcGVjdFJhdGlvLCAwLjBcblx0XTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb3NpdGlvblZlcnRpY2VzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG4gICAgdGhpcy5wb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSA9IDM7XG4gICAgdGhpcy5wb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyA9IDQ7XG5cbiAgICB0aGlzLnRleHR1cmVCdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHRoaXMudGV4dHVyZUJ1ZmZlcik7XG5cdHRoaXMudGV4dHVyZVZlcnRpY2VzID0gW1xuXHRcdDAuMCwgMC4wLFxuXHRcdDEuMCwgMC4wLFxuXHRcdDAuMCwgMS4wICogYXNwZWN0UmF0aW8sXG5cdFx0MS4wLCAxLjAgKiBhc3BlY3RSYXRpb1xuXHRdO1xuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0aGlzLnRleHR1cmVWZXJ0aWNlcyksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xuICAgIHRoaXMudGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSA9IDI7XG4gICAgdGhpcy50ZXh0dXJlQnVmZmVyLm51bUl0ZW1zID0gNDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXb3JsZFNwcml0ZTsiLCJ2YXIgQVNTRVRfVFlQRSA9ICdkYXRhJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFRleHRMb2FkZXIgID0ge307XG52YXIgU3RvcmFnZSAgPSB7fTtcblxuVGV4dExvYWRlci5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5UZXh0TG9hZGVyLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihUZXh0TG9hZGVyLCBUZXh0TG9hZGVyLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoVGV4dExvYWRlciwgVGV4dExvYWRlci5ldmVudE91dHB1dCk7XG5cblRleHRMb2FkZXIubG9hZCA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgdmFyIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICBpZiAoIVN0b3JhZ2Vbc291cmNlXSlcbiAgICB7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3Qub3BlbignR0VUJywgc291cmNlKTtcbiAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICBpZihyZXNwb25zZS5jdXJyZW50VGFyZ2V0LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBTdG9yYWdlW3NvdXJjZV0gPSByZXNwb25zZS5jdXJyZW50VGFyZ2V0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICBmaW5pc2hlZExvYWRpbmcoc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9XG59O1xuXG5UZXh0TG9hZGVyLmdldCAgPSBmdW5jdGlvbiBnZXQoc291cmNlKVxue1xuICAgIHJldHVybiBTdG9yYWdlW3NvdXJjZV07XG59O1xuXG5UZXh0TG9hZGVyLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKVxue1xuICAgIHJldHVybiBBU1NFVF9UWVBFO1xufTtcblxuZnVuY3Rpb24gZmluaXNoZWRMb2FkaW5nKHNvdXJjZSlcbntcbiAgICBUZXh0TG9hZGVyLmV2ZW50T3V0cHV0LmVtaXQoJ2RvbmVMb2FkaW5nJywge3NvdXJjZTogc291cmNlLCB0eXBlOiBBU1NFVF9UWVBFfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dExvYWRlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xudmFyIFRpbWVyICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL1V0aWxpdGllcy9UaW1lcicpO1xuXG52YXIgRW5naW5lICAgICAgICAgICAgID0ge307XG5cbkVuZ2luZS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5FbmdpbmUuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoRW5naW5lLCBFbmdpbmUuZXZlbnRPdXRwdXQpO1xuXG5FbmdpbmUuY3VycmVudFN0YXRlID0gbnVsbDtcblxuRW5naW5lLnNldFN0YXRlICAgICA9IGZ1bmN0aW9uIHNldFN0YXRlKHN0YXRlKVxue1xuXHRpZiAoc3RhdGUuaW5pdGlhbGl6ZSkgc3RhdGUuaW5pdGlhbGl6ZSgpO1xuXHRcblx0aWYgKHRoaXMuY3VycmVudFN0YXRlKVxuXHR7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUudW5waXBlKEVuZ2luZS5ldmVudElucHV0KTtcblx0XHR0aGlzLmN1cnJlbnRTdGF0ZS5oaWRlKCk7XG5cdH1cblxuXHRzdGF0ZS5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG5cdHN0YXRlLnNob3coKTtcblxuXHR0aGlzLmN1cnJlbnRTdGF0ZSA9IHN0YXRlO1xufTtcblxuRW5naW5lLnN0ZXAgICAgICAgICA9IGZ1bmN0aW9uIHN0ZXAodGltZSlcbntcblx0VGltZXIudXBkYXRlKCk7XG5cdHZhciBzdGF0ZSA9IEVuZ2luZS5jdXJyZW50U3RhdGU7XG5cdGlmIChzdGF0ZSlcblx0e1xuXHRcdGlmIChzdGF0ZS51cGRhdGUpIHN0YXRlLnVwZGF0ZSgpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuZ2luZTsiLCJ2YXIgQVNTRVRfVFlQRSA9ICdpbWFnZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBJbWFnZUxvYWRlciAgPSB7fTtcbnZhciBJbWFnZXMgICAgICAgPSB7fTtcblxuSW1hZ2VMb2FkZXIuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudE91dHB1dCk7XG5cbkltYWdlTG9hZGVyLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIHZhciBzb3VyY2UgPSBhc3NldC5zb3VyY2U7XG4gICAgaWYgKCFJbWFnZXNbc291cmNlXSlcbiAgICB7XG4gICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZS5zcmMgPSBzb3VyY2U7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZmluaXNoZWRMb2FkaW5nKHNvdXJjZSk7XG4gICAgICAgIH07XG4gICAgICAgIEltYWdlc1tzb3VyY2VdID0gaW1hZ2U7XG4gICAgfVxufTtcblxuSW1hZ2VMb2FkZXIuZ2V0ICA9IGZ1bmN0aW9uIGdldChzb3VyY2UpXG57XG4gICAgcmV0dXJuIEltYWdlc1tzb3VyY2VdO1xufTtcblxuSW1hZ2VMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0LmVtaXQoJ2RvbmVMb2FkaW5nJywge3NvdXJjZTogc291cmNlLCB0eXBlOiBBU1NFVF9UWVBFfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMb2FkZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFZpZXdwb3J0ID0ge307XG5cblZpZXdwb3J0LmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblZpZXdwb3J0LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRPdXRwdXQpO1xuXG53aW5kb3cub25yZXNpemUgPSBoYW5kbGVSZXNpemU7XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG5cdFZpZXdwb3J0LmV2ZW50T3V0cHV0LmVtaXQoJ3Jlc2l6ZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdwb3J0OyIsInZhciBLRVlfTUFQID0gcmVxdWlyZSgnLi9rZXltYXAuanMnKTtcbnZhciBLZXlIYW5kbGVyID0ge307XG5cbktleUhhbmRsZXIuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XG5cdHRoaXMuX2FjdGl2ZUtleXMgPSB7fTtcblx0dGhpcy5faGFuZGxlcnMgPSB7fTtcblx0dGhpcy5fdXBkYXRlRm5zID0gW107XG5cdHRoaXMuX3ByZXNzID0ge307XG5cblx0dGhpcy5FVkVOVFRZUEVTID0ge1xuXHRcdCdQUkVTUycgOiB0aGlzLl9wcmVzc1xuXHR9XG5cblx0dGhpcy5ib3VuZEtleURvd24gPSByZWdpc3RlcktleURvd24uYmluZCh0aGlzKTtcblx0dGhpcy5ib3VuZEtleVVwID0gcmVnaXN0ZXJLZXlVcC5iaW5kKHRoaXMpO1xuXG5cdGRvY3VtZW50Lm9ua2V5ZG93biA9IHRoaXMuYm91bmRLZXlEb3duO1xuXHRkb2N1bWVudC5vbmtleXVwID0gdGhpcy5ib3VuZEtleVVwO1xufVxuXG5LZXlIYW5kbGVyLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcblx0dmFyIGhhbmRsZXJzO1xuXHR2YXIgaGFuZGxlcnNMZW5ndGg7XG5cdHZhciB1cGRhdGVzTGVuZ3RoID0gdGhpcy5fdXBkYXRlRm5zLmxlbmd0aDtcblx0dmFyIGk7XG5cdFxuXHRmb3IodmFyIGtleSBpbiB0aGlzLl9hY3RpdmVLZXlzKXtcblx0XHRpZih0aGlzLl9hY3RpdmVLZXlzW2tleV0gPT09IHRydWUpe1xuXHRcdFx0aGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVyc1trZXldO1xuXHRcdFx0aWYoaGFuZGxlcnMpIHtcblx0XHRcdFx0aGFuZGxlcnNMZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7XG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBoYW5kbGVyc0xlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aGFuZGxlcnNbaV0oKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdXBkYXRlc0xlbmd0aDsgaSsrKSB7XG5cdFx0dGhpcy5fdXBkYXRlRm5zW2ldKHRoaXMuX2FjdGl2ZUtleXMpO1xuXHR9XG59XG5cbktleUhhbmRsZXIub24gPSBmdW5jdGlvbiBvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGV2ZW50TmFtZSA9IGV2ZW50TmFtZS50b1VwcGVyQ2FzZSgpO1xuXHRpZiggZXZlbnROYW1lLmluZGV4T2YoJzonKSAhPT0gLTEgKSB7XG5cdFx0dmFyIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5zcGxpdCgnOicpO1xuXHRcdHZhciBrZXkgPSBldmVudE5hbWVbMF07XG5cdFx0dmFyIHR5cGUgPSBldmVudE5hbWVbMV07XG5cdFx0dmFyIHN0b3JhZ2UgPSB0aGlzLkVWRU5UVFlQRVNbZXZlbnROYW1lWzFdXTtcblx0XHRpZiggIXN0b3JhZ2UgKSB0aHJvdyBcImludmFsaWQgZXZlbnRUeXBlXCI7XG5cdFx0aWYoICFzdG9yYWdlW2tleV0gKSBzdG9yYWdlW2tleV0gPSBbXTtcblx0XHRzdG9yYWdlW2tleV0ucHVzaChjYWxsYmFjayk7XG5cdH1cblx0ZWxzZSBpZiggS0VZX01BUC5sZXR0ZXJzW2V2ZW50TmFtZV0gKSB7XG5cdFx0aWYoIXRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0pIHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcblx0XHR0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuXHR9XG5cdGVsc2UgaWYgKGV2ZW50TmFtZSA9PT0gXCJVUERBVEVcIikge1xuXHRcdHRoaXMuX3VwZGF0ZUZucy5wdXNoKGNhbGxiYWNrKTtcblx0fVxuXHRlbHNlIHRocm93IFwiaW52YWxpZCBldmVudE5hbWVcIjtcbn1cblxuS2V5SGFuZGxlci5vZmYgPSBmdW5jdGlvbiBvZmYoa2V5LCBjYWxsYmFjaykge1xuXHR2YXIgY2FsbGJhY2tJbmRleDtcblx0dmFyIGNhbGxiYWNrcztcblxuXHRpZih0aGlzLl9oYW5kbGVyc1trZXldKSB7XG5cdFx0Y2FsbGJhY2tzID0gdGhpcy5faGFuZGxlcnNba2V5XTtcblx0XHRjYWxsYmFja0luZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuXHRcdGlmKGNhbGxiYWNrSW5kZXggIT09IC0xKSB7XG5cdFx0XHRjYWxsYmFja3Muc3BsaWNlKGNhbGxiYWNrSW5kZXgsIDEpO1xuXHRcdFx0aWYoIWNhbGxiYWNrcy5sZW5ndGgpIHtcblx0XHRcdFx0ZGVsZXRlIGNhbGxiYWNrcztcblx0XHRcdFx0ZGVsZXRlIHRoaXMuX2FjdGl2ZUtleXNba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJLZXlEb3duKGV2ZW50KSB7XG5cdHZhciBrZXlOYW1lID0gS0VZX01BUC5rZXlzW2V2ZW50LmtleUNvZGVdO1xuXHR2YXIgcHJlc3NFdmVudHMgPSB0aGlzLl9wcmVzc1trZXlOYW1lXTtcblx0aWYgKGtleU5hbWUpIHRoaXMuX2FjdGl2ZUtleXNba2V5TmFtZV0gPSB0cnVlO1xuXHRpZiAocHJlc3NFdmVudHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHByZXNzRXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRwcmVzc0V2ZW50c1tpXSgpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZWdpc3RlcktleVVwKGV2ZW50KSB7XG5cdHZhciBrZXlOYW1lID0gS0VZX01BUC5rZXlzW2V2ZW50LmtleUNvZGVdO1xuXHRpZiAoa2V5TmFtZSkgdGhpcy5fYWN0aXZlS2V5c1trZXlOYW1lXSA9IGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEtleUhhbmRsZXI7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogbWFya0BmYW1vLnVzXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuICAgIHZhciBUd29GaW5nZXJTeW5jID0gcmVxdWlyZSgnLi9Ud29GaW5nZXJTeW5jJyk7XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIHBpcGVkIGluIHR3by1maW5nZXIgdG91Y2ggZXZlbnRzIHRvIGluY3JlYXNlIG9yIGRlY3JlYXNlIHNjYWxlIHZpYSBwaW5jaGluZyAvIGV4cGFuZGluZy5cbiAgICAgKiAgIEVtaXRzICdzdGFydCcsICd1cGRhdGUnIGFuZCAnZW5kJyBldmVudHMgYW4gb2JqZWN0IHdpdGggcG9zaXRpb24sIHZlbG9jaXR5LCB0b3VjaCBpZHMsIGFuZCBhbmdsZS5cbiAgICAgKiAgIFVzZWZ1bCBmb3IgZGV0ZXJtaW5pbmcgYSByb3RhdGlvbiBmYWN0b3IgZnJvbSBpbml0aWFsIHR3by1maW5nZXIgdG91Y2guXG4gICAgICpcbiAgICAgKiBAY2xhc3MgUm90YXRlU3luY1xuICAgICAqIEBleHRlbmRzIFR3b0ZpbmdlclN5bmNcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBkZWZhdWx0IG9wdGlvbnMgb3ZlcnJpZGVzXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnNjYWxlXSBzY2FsZSB2ZWxvY2l0eSBieSB0aGlzIGZhY3RvclxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gUm90YXRlU3luYyhlbGVtZW50KSB7XG4gICAgICAgIFR3b0ZpbmdlclN5bmMuY2FsbCh0aGlzLCBlbGVtZW50KTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnNjYWxlID0gMTtcblxuICAgICAgICB0aGlzLl9hbmdsZSA9IDA7XG4gICAgICAgIHRoaXMuX3ByZXZpb3VzQW5nbGUgPSAwO1xuICAgIH1cblxuICAgIFJvdGF0ZVN5bmMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUd29GaW5nZXJTeW5jLnByb3RvdHlwZSk7XG4gICAgUm90YXRlU3luYy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBSb3RhdGVTeW5jO1xuXG4gICAgUm90YXRlU3luYy5ERUZBVUxUX09QVElPTlMgPSB7XG4gICAgICAgIHNjYWxlIDogMVxuICAgIH07XG5cbiAgICBSb3RhdGVTeW5jLnByb3RvdHlwZS5fc3RhcnRVcGRhdGUgPSBmdW5jdGlvbiBfc3RhcnRVcGRhdGUoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5fYW5nbGUgPSAwO1xuICAgICAgICB0aGlzLl9wcmV2aW91c0FuZ2xlID0gVHdvRmluZ2VyU3luYy5jYWxjdWxhdGVBbmdsZSh0aGlzLnBvc0EsIHRoaXMucG9zQik7XG4gICAgICAgIHZhciBjZW50ZXIgPSBUd29GaW5nZXJTeW5jLmNhbGN1bGF0ZUNlbnRlcih0aGlzLnBvc0EsIHRoaXMucG9zQik7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3N0YXJ0Jywge1xuICAgICAgICAgICAgY291bnQ6IGV2ZW50LnRvdWNoZXMubGVuZ3RoLFxuICAgICAgICAgICAgYW5nbGU6IHRoaXMuX2FuZ2xlLFxuICAgICAgICAgICAgY2VudGVyOiBjZW50ZXIsXG4gICAgICAgICAgICB0b3VjaGVzOiBbdGhpcy50b3VjaEFJZCwgdGhpcy50b3VjaEJJZF1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIFJvdGF0ZVN5bmMucHJvdG90eXBlLl9tb3ZlVXBkYXRlID0gZnVuY3Rpb24gX21vdmVVcGRhdGUoZGlmZlRpbWUpIHtcbiAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5vcHRpb25zLnNjYWxlO1xuXG4gICAgICAgIHZhciBjdXJyQW5nbGUgPSBUd29GaW5nZXJTeW5jLmNhbGN1bGF0ZUFuZ2xlKHRoaXMucG9zQSwgdGhpcy5wb3NCKTtcbiAgICAgICAgdmFyIGNlbnRlciA9IFR3b0ZpbmdlclN5bmMuY2FsY3VsYXRlQ2VudGVyKHRoaXMucG9zQSwgdGhpcy5wb3NCKTtcblxuICAgICAgICB2YXIgZGlmZlRoZXRhID0gc2NhbGUgKiAoY3VyckFuZ2xlIC0gdGhpcy5fcHJldmlvdXNBbmdsZSk7XG4gICAgICAgIHZhciB2ZWxUaGV0YSA9IGRpZmZUaGV0YSAvIGRpZmZUaW1lO1xuXG4gICAgICAgIHRoaXMuX2FuZ2xlICs9IGRpZmZUaGV0YTtcblxuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCd1cGRhdGUnLCB7XG4gICAgICAgICAgICBkZWx0YSA6IGRpZmZUaGV0YSxcbiAgICAgICAgICAgIHZlbG9jaXR5OiB2ZWxUaGV0YSxcbiAgICAgICAgICAgIGFuZ2xlOiB0aGlzLl9hbmdsZSxcbiAgICAgICAgICAgIGNlbnRlcjogY2VudGVyLFxuICAgICAgICAgICAgdG91Y2hlczogW3RoaXMudG91Y2hBSWQsIHRoaXMudG91Y2hCSWRdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3ByZXZpb3VzQW5nbGUgPSBjdXJyQW5nbGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBlbnRpcmUgb3B0aW9ucyBkaWN0aW9uYXJ5LCBpbmNsdWRpbmcgZGVmYXVsdHMuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIGdldE9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgICAqL1xuICAgIFJvdGF0ZVN5bmMucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiBnZXRPcHRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXQgaW50ZXJuYWwgb3B0aW9ucywgb3ZlcnJpZGluZyBhbnkgZGVmYXVsdCBvcHRpb25zXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHNldE9wdGlvbnNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gb3ZlcnJpZGVzIG9mIGRlZmF1bHQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5zY2FsZV0gc2NhbGUgdmVsb2NpdHkgYnkgdGhpcyBmYWN0b3JcbiAgICAgKi9cbiAgICBSb3RhdGVTeW5jLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFJvdGF0ZVN5bmM7XG4iLCJ2YXIgVGltZXIgPSByZXF1aXJlKCcuLi9VdGlsaXRpZXMvVGltZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdF9wb3NpdGlvbjogWzAsIDBdLFxuXHRfZXZlbnRzOiB7XG5cdFx0XCJtb3ZlXCI6IFtdLFxuXHRcdFwicm90YXRlXCI6IFtdXG5cdH0sXG5cdF90b3VjaENvdW50OiAwLFxuXHRfdHdvVG91Y2g6IGZhbHNlLFxuXHRpbml0OiBmdW5jdGlvbiBpbml0ICgpIHtcblx0XHR0aGlzLl9zY3JvbGxhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5zdHlsZS50b3AgPSAnMHB4Jztcblx0XHR0aGlzLl9zY3JvbGxhYmxlLnN0eWxlLmxlZnQgPSAnMHB4Jztcblx0XHR0aGlzLl9zY3JvbGxhYmxlLnN0eWxlLndpZHRoID0gaW5uZXJXaWR0aCArICdweCc7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5zdHlsZS5oZWlnaHQgPSBpbm5lckhlaWdodCArICdweCc7XG5cdFx0dGhpcy5fc2Nyb2xsYWJsZS5zdHlsZS5vdmVyZmxvd1kgPSAnc2Nyb2xsJztcbiAgICBcdHRoaXMuX3Njcm9sbGFibGUuc3R5bGUud2Via2l0T3ZlcmZsb3dTY3JvbGxpbmcgPSAndG91Y2gnO1xuXG5cdFx0dGhpcy5faW5zZXJ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dGhpcy5faW5zZXJ0LnN0eWxlLndpZHRoID0gKGlubmVyV2lkdGggKiAyKSArICdweCc7XG5cdFx0dGhpcy5faW5zZXJ0LnN0eWxlLmhlaWdodCA9IChpbm5lckhlaWdodCAqIDIpICsgJ3B4JztcblxuXHRcdHRoaXMuX3Njcm9sbGFibGUuYXBwZW5kQ2hpbGQodGhpcy5faW5zZXJ0KTtcblxuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5fc2Nyb2xsYWJsZSk7XG5cblx0XHR0aGlzLl9zY3JvbGxhYmxlLm9udG91Y2htb3ZlID0gdGhpcy5oYW5kbGVUb3VjaE1vdmUuYmluZCh0aGlzKTtcblx0XHR0aGlzLl9zY3JvbGxhYmxlLm9uc2Nyb2xsID0gdGhpcy5oYW5kbGVTY3JvbGwuYmluZCh0aGlzKTtcblx0fSxcblxuXHRvbjogZnVuY3Rpb24gb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRcdGlmKCF0aGlzLl9ldmVudHNbZXZlbnROYW1lXSkgdGhyb3cgXCJJbnZhbGlkIGV2ZW50TmFtZTogXCIgKyBldmVudE5hbWU7XG5cblx0XHR0aGlzLl9ldmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcblx0fSxcblxuXHRoYW5kbGVUb3VjaE1vdmU6IGZ1bmN0aW9uIGhhbmRsZVRvdWNoTW92ZSAoZSkge1xuXHRcdGlmKGUudGFyZ2V0VG91Y2hlcy5sZW5ndGggPT09IDIpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRpZih0aGlzLl90d29Ub3VjaCkge1xuXHRcdFx0XHR0aGlzLmhhbmRsZVJvdGF0aW9uKGUudGFyZ2V0VG91Y2hlcyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmluaXRUd29Ub3VjaChlLnRhcmdldFRvdWNoZXMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIGlmKHRoaXMuX3R3b1RvdWNoKSB0aGlzLl90d29Ub3VjaCA9IGZhbHNlO1xuXHR9LFxuXG5cdGluaXRUd29Ub3VjaDogZnVuY3Rpb24gaW5pdFR3b1RvdWNoICh0b3VjaGVzKSB7XG5cdFx0dGhpcy5fdHdvVG91Y2ggPSB0cnVlO1xuXHRcdHRoaXMuc3RhcnRQb3NpdGlvbnMgPSBbXG5cdFx0XHRbdG91Y2hlc1swXS5wYWdlWCwgdG91Y2hlc1swXS5wYWdlWV0sXG5cdFx0XHRbdG91Y2hlc1sxXS5wYWdlWCwgdG91Y2hlc1sxXS5wYWdlWV1cblx0XHRdO1xuXHR9LFxuXG5cdGhhbmRsZVJvdGF0aW9uOiBmdW5jdGlvbiBoYW5kbGVSb3RhdGlvbiAodG91Y2hlcykge1xuXHRcdHZhciBkZWx0YVg7XG5cdFx0dmFyIGRlbHRhWTtcblxuXHRcdGRlbHRhWCA9IE1hdGguYWJzKHRoaXMuc3RhcnRQb3NpdGlvbnNbMF1bMF0gLSB0b3VjaGVzWzBdLnBhZ2VYKVxuXHRcdFx0ICAgKyBNYXRoLmFicyh0aGlzLnN0YXJ0UG9zaXRpb25zWzFdWzBdIC0gdG91Y2hlc1sxXS5wYWdlWCk7XG5cdFx0ZGVsdGFZID0gTWF0aC5hYnModGhpcy5zdGFydFBvc2l0aW9uc1swXVsxXSAtIHRvdWNoZXNbMF0ucGFnZVkpXG5cdFx0XHQgICArIE1hdGguYWJzKHRoaXMuc3RhcnRQb3NpdGlvbnNbMV1bMV0gLSB0b3VjaGVzWzFdLnBhZ2VZKTtcblxuXHRcdHZhciB0aGV0YSA9IChkZWx0YVkgKyBkZWx0YVgpIC8gMjAwO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ldmVudHNbXCJyb3RhdGVcIl0ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuX2V2ZW50c1tcInJvdGF0ZVwiXVtpXSh0aGV0YSk7XG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZVNjcm9sbDogZnVuY3Rpb24gaGFuZGxlU2Nyb2xsKGUpIHtcblx0XHR2YXIgb2Zmc2V0ID0gW1xuXHRcdFx0dGhpcy5fcG9zaXRpb25bMF0gLSB0aGlzLl9zY3JvbGxhYmxlLnNjcm9sbExlZnQsXG5cdFx0XHR0aGlzLl9wb3NpdGlvblsxXSAtIHRoaXMuX3Njcm9sbGFibGUuc2Nyb2xsVG9wXG5cdFx0XTtcblx0XHR2YXIgdG91Y2hNb3ZlRXZlbnRzID0gdGhpcy5fZXZlbnRzW1wibW92ZVwiXTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRvdWNoTW92ZUV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG91Y2hNb3ZlRXZlbnRzW2ldKG9mZnNldCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fcG9zaXRpb24gPSBbdGhpcy5fc2Nyb2xsYWJsZS5zY3JvbGxMZWZ0LCB0aGlzLl9zY3JvbGxhYmxlLnNjcm9sbFRvcF07XG5cdH1cbn0iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyOiBtYXJrQGZhbW8udXNcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG4gICAgdmFyIEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxuICAgIC8qKlxuICAgICAqIEhlbHBlciB0byBQaW5jaFN5bmMsIFJvdGF0ZVN5bmMsIGFuZCBTY2FsZVN5bmMuICBHZW5lcmFsaXplZCBoYW5kbGluZyBvZlxuICAgICAqICAgdHdvLWZpbmdlciB0b3VjaCBldmVudHMuXG4gICAgICogICBUaGlzIGNsYXNzIGlzIG1lYW50IHRvIGJlIG92ZXJyaWRkZW4gYW5kIG5vdCB1c2VkIGRpcmVjdGx5LlxuICAgICAqXG4gICAgICogQGNsYXNzIFR3b0ZpbmdlclN5bmNcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBUd29GaW5nZXJTeW5jKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgaWYoIXRoaXMuZWxlbWVudCkgdGhyb3cgXCJObyBlbGVtZW50IHByb3ZpZGVkIVwiO1xuXG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG4gICAgICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50T3V0cHV0KTtcblxuICAgICAgICB0aGlzLnRvdWNoQUVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50b3VjaEFJZCA9IDA7XG4gICAgICAgIHRoaXMucG9zQSA9IG51bGw7XG4gICAgICAgIHRoaXMudGltZXN0YW1wQSA9IDA7XG4gICAgICAgIHRoaXMudG91Y2hCRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRvdWNoQklkID0gMDtcbiAgICAgICAgdGhpcy5wb3NCID0gbnVsbDtcbiAgICAgICAgdGhpcy50aW1lc3RhbXBCID0gMDtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuaGFuZGxlU3RhcnQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLmhhbmRsZU1vdmUuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuaGFuZGxlRW5kLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLmhhbmRsZUVuZC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICBUd29GaW5nZXJTeW5jLmNhbGN1bGF0ZUFuZ2xlID0gZnVuY3Rpb24ocG9zQSwgcG9zQikge1xuICAgICAgICB2YXIgZGlmZlggPSBwb3NCWzBdIC0gcG9zQVswXTtcbiAgICAgICAgdmFyIGRpZmZZID0gcG9zQlsxXSAtIHBvc0FbMV07XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKGRpZmZZLCBkaWZmWCk7XG4gICAgfTtcblxuICAgIFR3b0ZpbmdlclN5bmMuY2FsY3VsYXRlRGlzdGFuY2UgPSBmdW5jdGlvbihwb3NBLCBwb3NCKSB7XG4gICAgICAgIHZhciBkaWZmWCA9IHBvc0JbMF0gLSBwb3NBWzBdO1xuICAgICAgICB2YXIgZGlmZlkgPSBwb3NCWzFdIC0gcG9zQVsxXTtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChkaWZmWCAqIGRpZmZYICsgZGlmZlkgKiBkaWZmWSk7XG4gICAgfTtcblxuICAgIFR3b0ZpbmdlclN5bmMuY2FsY3VsYXRlQ2VudGVyID0gZnVuY3Rpb24ocG9zQSwgcG9zQikge1xuICAgICAgICByZXR1cm4gWyhwb3NBWzBdICsgcG9zQlswXSkgLyAyLjAsIChwb3NBWzFdICsgcG9zQlsxXSkgLyAyLjBdO1xuICAgIH07XG5cbiAgICB2YXIgX25vdyA9IERhdGUubm93O1xuXG4gICAgLy8gcHJpdmF0ZVxuICAgIFR3b0ZpbmdlclN5bmMucHJvdG90eXBlLmhhbmRsZVN0YXJ0ID0gZnVuY3Rpb24gaGFuZGxlU3RhcnQoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgICAgICBpZiAoIXRoaXMudG91Y2hBRW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBSWQgPSB0b3VjaC5pZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBRW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NBID0gW3RvdWNoLnBhZ2VYLCB0b3VjaC5wYWdlWV07XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lc3RhbXBBID0gX25vdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIXRoaXMudG91Y2hCRW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hCSWQgPSB0b3VjaC5pZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hCRW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NCID0gW3RvdWNoLnBhZ2VYLCB0b3VjaC5wYWdlWV07XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lc3RhbXBCID0gX25vdygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0VXBkYXRlKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBwcml2YXRlXG4gICAgVHdvRmluZ2VyU3luYy5wcm90b3R5cGUuaGFuZGxlTW92ZSA9IGZ1bmN0aW9uIGhhbmRsZU1vdmUoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKCEodGhpcy50b3VjaEFFbmFibGVkICYmIHRoaXMudG91Y2hCRW5hYmxlZCkpIHJldHVybjtcbiAgICAgICAgdmFyIHByZXZUaW1lQSA9IHRoaXMudGltZXN0YW1wQTtcbiAgICAgICAgdmFyIHByZXZUaW1lQiA9IHRoaXMudGltZXN0YW1wQjtcbiAgICAgICAgdmFyIGRpZmZUaW1lO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgICAgIGlmICh0b3VjaC5pZGVudGlmaWVyID09PSB0aGlzLnRvdWNoQUlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3NBID0gW3RvdWNoLnBhZ2VYLCB0b3VjaC5wYWdlWV07XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lc3RhbXBBID0gX25vdygpO1xuICAgICAgICAgICAgICAgIGRpZmZUaW1lID0gdGhpcy50aW1lc3RhbXBBIC0gcHJldlRpbWVBO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodG91Y2guaWRlbnRpZmllciA9PT0gdGhpcy50b3VjaEJJZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zQiA9IFt0b3VjaC5wYWdlWCwgdG91Y2gucGFnZVldO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZXN0YW1wQiA9IF9ub3coKTtcbiAgICAgICAgICAgICAgICBkaWZmVGltZSA9IHRoaXMudGltZXN0YW1wQiAtIHByZXZUaW1lQjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlmZlRpbWUpIHRoaXMuX21vdmVVcGRhdGUoZGlmZlRpbWUpO1xuICAgIH07XG5cbiAgICAvLyBwcml2YXRlXG4gICAgVHdvRmluZ2VyU3luYy5wcm90b3R5cGUuaGFuZGxlRW5kID0gZnVuY3Rpb24gaGFuZGxlRW5kKGV2ZW50KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICAgICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMudG91Y2hBSWQgfHwgdG91Y2guaWRlbnRpZmllciA9PT0gdGhpcy50b3VjaEJJZCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoQUVuYWJsZWQgJiYgdGhpcy50b3VjaEJFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ2VuZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdWNoZXMgOiBbdGhpcy50b3VjaEFJZCwgdGhpcy50b3VjaEJJZF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhbmdsZSAgIDogdGhpcy5fYW5nbGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBSWQgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hCRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hCSWQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gVHdvRmluZ2VyU3luYztcbiIsIm1vZHVsZS5leHBvcnRzID0gXG57XG4gICdsZXR0ZXJzJyA6IHtcbiAgICAgJ0EnOiA2NSxcbiAgICAgJ0InOiA2NixcbiAgICAgJ0MnOiA2NyxcbiAgICAgJ0QnOiA2OCxcbiAgICAgJ0UnOiA2OSxcbiAgICAgJ0YnOiA3MCxcbiAgICAgJ0cnOiA3MSxcbiAgICAgJ0gnOiA3MixcbiAgICAgJ0knOiA3MyxcbiAgICAgJ0onOiA3NCxcbiAgICAgJ0snOiA3NSxcbiAgICAgJ0wnOiA3NixcbiAgICAgJ00nOiA3NyxcbiAgICAgJ04nOiA3OCxcbiAgICAgJ08nOiA3OSxcbiAgICAgJ1AnOiA4MCxcbiAgICAgJ1EnOiA4MSxcbiAgICAgJ1InOiA4MixcbiAgICAgJ1MnOiA4MyxcbiAgICAgJ1QnOiA4NCxcbiAgICAgJ1UnOiA4NSxcbiAgICAgJ1YnOiA4NixcbiAgICAgJ1cnOiA4NyxcbiAgICAgJ1gnOiA4OCxcbiAgICAgJ1knOiA4OSxcbiAgICAgJ1onOiA5MCxcbiAgICAgJ0VOVEVSJzogMTMsXG4gICAgICdTSElGVCc6IDE2LFxuICAgICAnRVNDJzogMjcsXG4gICAgICdTUEFDRSc6IDMyLFxuICAgICAnTEVGVCc6IDM3LFxuICAgICAnVVAnOiAzOCxcbiAgICAgJ1JJR0hUJzogMzksXG4gICAgICdET1dOJyA6IDQwXG4gIH0sXG4gICdrZXlzJyA6IHtcbiAgICAgNjUgOiAnQScsXG4gICAgIDY2IDogJ0InLFxuICAgICA2NyA6ICdDJyxcbiAgICAgNjggOiAnRCcsXG4gICAgIDY5IDogJ0UnLFxuICAgICA3MCA6ICdGJyxcbiAgICAgNzEgOiAnRycsXG4gICAgIDcyIDogJ0gnLFxuICAgICA3MyA6ICdJJyxcbiAgICAgNzQgOiAnSicsXG4gICAgIDc1IDogJ0snLFxuICAgICA3NiA6ICdMJyxcbiAgICAgNzcgOiAnTScsXG4gICAgIDc4IDogJ04nLFxuICAgICA3OSA6ICdPJyxcbiAgICAgODAgOiAnUCcsXG4gICAgIDgxIDogJ1EnLFxuICAgICA4MiA6ICdSJyxcbiAgICAgODMgOiAnUycsXG4gICAgIDg0IDogJ1QnLFxuICAgICA4NSA6ICdVJyxcbiAgICAgODYgOiAnVicsXG4gICAgIDg3IDogJ1cnLFxuICAgICA4OCA6ICdYJyxcbiAgICAgODkgOiAnWScsXG4gICAgIDkwIDogJ1onLFxuICAgICAxMyA6ICdFTlRFUicsXG4gICAgIDE2IDogJ1NISUZUJyxcbiAgICAgMjcgOiAnRVNDJyxcbiAgICAgMzIgOiAnU1BBQ0UnLFxuICAgICAzNyA6ICdMRUZUJyxcbiAgICAgMzggOiAnVVAnLFxuICAgICAzOSA6ICdSSUdIVCcsXG4gICAgIDQwIDogJ0RPV04nXG4gIH1cbn0iLCJ2YXIgQ09NUExFVEUgPSBcImNvbXBsZXRlXCI7XG52YXIgTE9BRF9TVEFSVEVEID0gXCJzdGFydExvYWRpbmdcIjtcbnZhciBMT0FEX0NPTVBMRVRFRCA9IFwiZG9uZUxvYWRpbmdcIjtcbnZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIExvYWRpbmcgICAgICAgICAgPSB7fTtcbnZhciBib2R5UmVhZHkgICAgICAgID0gZmFsc2U7XG52YXIgYXNzZXRTdGFjayAgICAgICA9IFtdO1xudmFyIGxvYWRlclJlZ2lzdHJ5ICAgPSB7fTtcbnZhciBjb250YWluZXIgICAgICAgID0gbnVsbDtcbnZhciBzcGxhc2hTY3JlZW4gICAgID0gbmV3IEltYWdlKCk7XG5zcGxhc2hTY3JlZW4uc3JjICAgICA9ICcuLi8uLi9Bc3NldHMvTG9hZGluZy4uLi5wbmcnO1xuc3BsYXNoU2NyZWVuLndpZHRoICAgPSBzcGxhc2hXaWR0aCA9IDUwMDtcbnNwbGFzaFNjcmVlbi5oZWlnaHQgID0gc3BsYXNoSGVpZ2h0ID0gMTYwO1xuTG9hZGluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5Mb2FkaW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTG9hZGluZywgTG9hZGluZy5ldmVudE91dHB1dCk7XG5cbkxvYWRpbmcuZXZlbnRJbnB1dC5vbihMT0FEX0NPTVBMRVRFRCwgaGFuZGxlQ29tcGxldGVkTG9hZCk7XG5Mb2FkaW5nLmV2ZW50SW5wdXQub24oJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbkxvYWRpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuICAgIGlmICghY29udGFpbmVyKVxuICAgIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmcnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHNwbGFzaFNjcmVlbik7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtIChzcGxhc2hIZWlnaHQgKiAwLjUpICsgJ3B4JztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4JztcbiAgICB9XG4gICAgaWYgKGFzc2V0U3RhY2subGVuZ3RoKVxuICAgIHtcbiAgICAgICAgdGhpcy5ldmVudE91dHB1dC5lbWl0KExPQURfU1RBUlRFRCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXNzZXRTdGFjay5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGFzc2V0ICA9IGFzc2V0U3RhY2tbaV07XG4gICAgICAgICAgICB2YXIgbG9hZGVyID0gYXNzZXQudHlwZTtcbiAgICAgICAgICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlcl0ubG9hZChhc3NldCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Mb2FkaW5nLmxvYWQgICAgICAgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIGlmKEFycmF5LmlzQXJyYXkoYXNzZXQpKVxuICAgIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXNzZXRTdGFjaywgYXNzZXQpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBhc3NldFN0YWNrLnB1c2goYXNzZXQpO1xuICAgIH1cbn07XG5cbkxvYWRpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbkxvYWRpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbkxvYWRpbmcucmVnaXN0ZXIgICA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGxvYWRlcilcbntcbiAgICB2YXIgbG9hZGVyTmFtZSAgICAgICAgICAgICA9IGxvYWRlci50b1N0cmluZygpO1xuICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlck5hbWVdID0gbG9hZGVyO1xuICAgIGxvYWRlci5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVDb21wbGV0ZWRMb2FkKGRhdGEpXG57XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpXG4gICAge1xuICAgICAgICB2YXIgc291cmNlID0gZGF0YS5zb3VyY2U7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGFzc2V0U3RhY2suaW5kZXhPZihzb3VyY2UpO1xuICAgICAgICBpZiAobG9jYXRpb24pIGFzc2V0U3RhY2suc3BsaWNlKGxvY2F0aW9uLCAxKTtcbiAgICAgICAgaWYgKCFhc3NldFN0YWNrLmxlbmd0aCkgTG9hZGluZy5ldmVudE91dHB1dC5lbWl0KExPQURfQ09NUExFVEVEKTtcbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nOyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIE1lbnUgICAgICAgICAgPSB7fTtcblxuTWVudS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5NZW51LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudE91dHB1dCk7XG5cbk1lbnUuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxudmFyIG1lbnVFbGVtZW50ID0gbnVsbCxcbmNvbnRhaW5lciAgICAgICA9IG51bGwsXG5uZXdHYW1lICAgICAgICAgPSBudWxsO1xuXG5NZW51LmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudScpO1xuICAgIG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIG5ld0dhbWUgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3R2FtZS5vbmNsaWNrID0gc3RhcnROZXdHYW1lO1xuICAgIG5ld0dhbWUuaW5uZXJIVE1MID0gJ05ldyBHYW1lJztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRTaXplID0gJzUwcHgnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udEZhbWlseSA9ICdIZWx2ZXRpY2EnO1xuICAgIG5ld0dhbWUuc3R5bGUuY29sb3IgPSAnI0ZGRic7XG4gICAgbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3R2FtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG1lbnVFbGVtZW50KTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn07XG5cbk1lbnUuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbk1lbnUuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn1cblxuZnVuY3Rpb24gc3RhcnROZXdHYW1lKClcbntcbiAgICBNZW51LmV2ZW50T3V0cHV0LmVtaXQoJ25ld0dhbWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51OyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFBsYXlpbmcgICAgICAgICAgICAgICA9IHt9O1xudmFyIEtleUhhbmRsZXIgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0lucHV0cy9LZXlIYW5kbGVyJyk7XG52YXIgVG91Y2hIYW5kbGVyICAgICAgICAgID0gcmVxdWlyZSgnLi4vSW5wdXRzL1RvdWNoSGFuZGxlcicpO1xudmFyIFJlbmRlcmVyICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0dML0dMJyk7XG5cblBsYXlpbmcuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuUGxheWluZy5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoUGxheWluZywgUGxheWluZy5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFBsYXlpbmcsIFBsYXlpbmcuZXZlbnRPdXRwdXQpO1xuXG5QbGF5aW5nLmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcblx0dGhpcy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVuZGVyZXInKTtcblx0dGhpcy5jYW52YXMud2lkdGggPSBpbm5lcldpZHRoO1xuXHR0aGlzLmNhbnZhcy5oZWlnaHQgPSBpbm5lckhlaWdodDtcblx0S2V5SGFuZGxlci5pbml0KCk7XG5cdC8vIFRvdWNoSGFuZGxlci5pbml0KCk7XG5cdHRoaXMucmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoe1xuXHRcdGNhbnZhczogdGhpcy5jYW52YXMsXG5cdFx0dGV4dHVyZXM6IFtcblx0XHRcdCcuLi9Bc3NldHMvc3BhY2UxLmpwZycsXG5cdFx0XHQnLi4vQXNzZXRzL3NwYWNlc2hpcC5wbmcnLFxuXHRcdFx0Jy4uL0Fzc2V0cy9lbmVteVNwcml0ZXMucG5nJ1xuXHRcdFx0Ly8gJy4uL0Fzc2V0cy9jcmF0ZS5naWYnXG5cdFx0XVxuXHR9KTtcbn07XG5cblBsYXlpbmcudXBkYXRlICAgICA9IGZ1bmN0aW9uIHVwZGF0ZSgpXG57XG5cdEtleUhhbmRsZXIudXBkYXRlKCk7XG5cdC8vIFRvdWNoSGFuZGxlci51cGRhdGUoKTtcblx0dGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbn07XG5cblBsYXlpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xufTtcblxuUGxheWluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlpbmc7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogZGF2aWRAZmFtby51c1xuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICogQSBsaWJyYXJ5IG9mIGN1cnZlcyB3aGljaCBtYXAgYW4gYW5pbWF0aW9uIGV4cGxpY2l0bHkgYXMgYSBmdW5jdGlvbiBvZiB0aW1lLlxuICpcbiAqIEBjbGFzcyBFYXNpbmdcbiAqL1xudmFyIEVhc2luZyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBpblF1YWRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgaW5RdWFkOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0KnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBvdXRRdWFkXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIG91dFF1YWQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIC0odC09MSkqdCsxO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5PdXRRdWFkXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluT3V0UXVhZDogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSp0KnQ7XG4gICAgICAgIHJldHVybiAtLjUqKCgtLXQpKih0LTIpIC0gMSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBpbkN1YmljXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluQ3ViaWM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdCp0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgb3V0Q3ViaWNcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgb3V0Q3ViaWM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuICgoLS10KSp0KnQgKyAxKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluT3V0Q3ViaWNcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgaW5PdXRDdWJpYzogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSp0KnQqdDtcbiAgICAgICAgcmV0dXJuIC41KigodC09MikqdCp0ICsgMik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBpblF1YXJ0XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluUXVhcnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdCp0KnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBvdXRRdWFydFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBvdXRRdWFydDogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLSgoLS10KSp0KnQqdCAtIDEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5PdXRRdWFydFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbk91dFF1YXJ0OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41KnQqdCp0KnQ7XG4gICAgICAgIHJldHVybiAtLjUgKiAoKHQtPTIpKnQqdCp0IC0gMik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBpblF1aW50XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluUXVpbnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdCp0KnQqdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IG91dFF1aW50XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIG91dFF1aW50OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAoKC0tdCkqdCp0KnQqdCArIDEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5PdXRRdWludFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbk91dFF1aW50OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41KnQqdCp0KnQqdDtcbiAgICAgICAgcmV0dXJuIC41KigodC09MikqdCp0KnQqdCArIDIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5TaW5lXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluU2luZTogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLTEuMCpNYXRoLmNvcyh0ICogKE1hdGguUEkvMikpICsgMS4wO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgb3V0U2luZVxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBvdXRTaW5lOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNpbih0ICogKE1hdGguUEkvMikpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5PdXRTaW5lXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluT3V0U2luZTogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLS41KihNYXRoLmNvcyhNYXRoLlBJKnQpIC0gMSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBpbkV4cG9cbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgaW5FeHBvOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAodD09PTApID8gMC4wIDogTWF0aC5wb3coMiwgMTAgKiAodCAtIDEpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IG91dEV4cG9cbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgb3V0RXhwbzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gKHQ9PT0xLjApID8gMS4wIDogKC1NYXRoLnBvdygyLCAtMTAgKiB0KSArIDEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5PdXRFeHBvXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluT3V0RXhwbzogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7XG4gICAgICAgIGlmICh0PT09MS4wKSByZXR1cm4gMS4wO1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSAqIE1hdGgucG93KDIsIDEwICogKHQgLSAxKSk7XG4gICAgICAgIHJldHVybiAuNSAqICgtTWF0aC5wb3coMiwgLTEwICogLS10KSArIDIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgaW5DaXJjXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluQ2lyYzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLShNYXRoLnNxcnQoMSAtIHQqdCkgLSAxKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IG91dENpcmNcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgb3V0Q2lyYzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KDEgLSAoLS10KSp0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluT3V0Q2lyY1xuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbk91dENpcmM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKCh0Lz0uNSkgPCAxKSByZXR1cm4gLS41ICogKE1hdGguc3FydCgxIC0gdCp0KSAtIDEpO1xuICAgICAgICByZXR1cm4gLjUgKiAoTWF0aC5zcXJ0KDEgLSAodC09MikqdCkgKyAxKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluRWxhc3RpY1xuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbkVsYXN0aWM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdmFyIHM9MS43MDE1ODt2YXIgcD0wO3ZhciBhPTEuMDtcbiAgICAgICAgaWYgKHQ9PT0wKSByZXR1cm4gMC4wOyAgaWYgKHQ9PT0xKSByZXR1cm4gMS4wOyAgaWYgKCFwKSBwPS4zO1xuICAgICAgICBzID0gcC8oMipNYXRoLlBJKSAqIE1hdGguYXNpbigxLjAvYSk7XG4gICAgICAgIHJldHVybiAtKGEqTWF0aC5wb3coMiwxMCoodC09MSkpICogTWF0aC5zaW4oKHQtcykqKDIqTWF0aC5QSSkvIHApKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IG91dEVsYXN0aWNcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgb3V0RWxhc3RpYzogZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgcz0xLjcwMTU4O3ZhciBwPTA7dmFyIGE9MS4wO1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7ICBpZiAodD09PTEpIHJldHVybiAxLjA7ICBpZiAoIXApIHA9LjM7XG4gICAgICAgIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKDEuMC9hKTtcbiAgICAgICAgcmV0dXJuIGEqTWF0aC5wb3coMiwtMTAqdCkgKiBNYXRoLnNpbigodC1zKSooMipNYXRoLlBJKS9wKSArIDEuMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluT3V0RWxhc3RpY1xuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbk91dEVsYXN0aWM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdmFyIHM9MS43MDE1ODt2YXIgcD0wO3ZhciBhPTEuMDtcbiAgICAgICAgaWYgKHQ9PT0wKSByZXR1cm4gMC4wOyAgaWYgKCh0Lz0uNSk9PT0yKSByZXR1cm4gMS4wOyAgaWYgKCFwKSBwPSguMyoxLjUpO1xuICAgICAgICBzID0gcC8oMipNYXRoLlBJKSAqIE1hdGguYXNpbigxLjAvYSk7XG4gICAgICAgIGlmICh0IDwgMSkgcmV0dXJuIC0uNSooYSpNYXRoLnBvdygyLDEwKih0LT0xKSkgKiBNYXRoLnNpbigodC1zKSooMipNYXRoLlBJKS9wKSk7XG4gICAgICAgIHJldHVybiBhKk1hdGgucG93KDIsLTEwKih0LT0xKSkgKiBNYXRoLnNpbigodC1zKSooMipNYXRoLlBJKS9wKSouNSArIDEuMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluQmFja1xuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbkJhY2s6IGZ1bmN0aW9uKHQsIHMpIHtcbiAgICAgICAgaWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDEuNzAxNTg7XG4gICAgICAgIHJldHVybiB0KnQqKChzKzEpKnQgLSBzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IG91dEJhY2tcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgb3V0QmFjazogZnVuY3Rpb24odCwgcykge1xuICAgICAgICBpZiAocyA9PT0gdW5kZWZpbmVkKSBzID0gMS43MDE1ODtcbiAgICAgICAgcmV0dXJuICgoLS10KSp0KigocysxKSp0ICsgcykgKyAxKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluT3V0QmFja1xuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbk91dEJhY2s6IGZ1bmN0aW9uKHQsIHMpIHtcbiAgICAgICAgaWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDEuNzAxNTg7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41Kih0KnQqKCgocyo9KDEuNTI1KSkrMSkqdCAtIHMpKTtcbiAgICAgICAgcmV0dXJuIC41KigodC09MikqdCooKChzKj0oMS41MjUpKSsxKSp0ICsgcykgKyAyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IGluQm91bmNlXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGluQm91bmNlOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAxLjAgLSBFYXNpbmcub3V0Qm91bmNlKDEuMC10KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IG91dEJvdW5jZVxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBvdXRCb3VuY2U6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKHQgPCAoMS8yLjc1KSkge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqdCp0KTtcbiAgICAgICAgfSBlbHNlIGlmICh0IDwgKDIvMi43NSkpIHtcbiAgICAgICAgICAgIHJldHVybiAoNy41NjI1Kih0LT0oMS41LzIuNzUpKSp0ICsgLjc1KTtcbiAgICAgICAgfSBlbHNlIGlmICh0IDwgKDIuNS8yLjc1KSkge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqKHQtPSgyLjI1LzIuNzUpKSp0ICsgLjkzNzUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqKHQtPSgyLjYyNS8yLjc1KSkqdCArIC45ODQzNzUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBpbk91dEJvdW5jZVxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBpbk91dEJvdW5jZTogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAodCA8IC41KSByZXR1cm4gRWFzaW5nLmluQm91bmNlKHQqMikgKiAuNTtcbiAgICAgICAgcmV0dXJuIEVhc2luZy5vdXRCb3VuY2UodCoyLTEuMCkgKiAuNSArIC41O1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWFzaW5nO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogZGF2aWRAZmFtby51c1xuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVXRpbGl0eSA9IHJlcXVpcmUoJy4vVXRpbGl0eScpO1xuXG4vKipcbiAqIFRyYW5zaXRpb24gbWV0YS1tZXRob2QgdG8gc3VwcG9ydCB0cmFuc2l0aW9uaW5nIG11bHRpcGxlXG4gKiAgIHZhbHVlcyB3aXRoIHNjYWxhci1vbmx5IG1ldGhvZHMuXG4gKlxuICpcbiAqIEBjbGFzcyBNdWx0aXBsZVRyYW5zaXRpb25cbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXRob2QgVHJhbnNpb25hYmxlIGNsYXNzIHRvIG11bHRpcGxleFxuICovXG5mdW5jdGlvbiBNdWx0aXBsZVRyYW5zaXRpb24obWV0aG9kKSB7XG4gICAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gICAgdGhpcy5faW5zdGFuY2VzID0gW107XG4gICAgdGhpcy5zdGF0ZSA9IFtdO1xufVxuXG5NdWx0aXBsZVRyYW5zaXRpb24uU1VQUE9SVFNfTVVMVElQTEUgPSB0cnVlO1xuXG4vKipcbiAqIEdldCB0aGUgc3RhdGUgb2YgZWFjaCB0cmFuc2l0aW9uLlxuICpcbiAqIEBtZXRob2QgZ2V0XG4gKlxuICogQHJldHVybiBzdGF0ZSB7TnVtYmVyfEFycmF5fSBzdGF0ZSBhcnJheVxuICovXG5NdWx0aXBsZVRyYW5zaXRpb24ucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2luc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLnN0YXRlW2ldID0gdGhpcy5faW5zdGFuY2VzW2ldLmdldCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBlbmQgc3RhdGVzIHdpdGggYSBzaGFyZWQgdHJhbnNpdGlvbiwgd2l0aCBvcHRpb25hbCBjYWxsYmFjay5cbiAqXG4gKiBAbWV0aG9kIHNldFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfEFycmF5fSBlbmRTdGF0ZSBGaW5hbCBTdGF0ZS4gIFVzZSBhIG11bHRpLWVsZW1lbnQgYXJndW1lbnQgZm9yIG11bHRpcGxlIHRyYW5zaXRpb25zLlxuICogQHBhcmFtIHtPYmplY3R9IHRyYW5zaXRpb24gVHJhbnNpdGlvbiBkZWZpbml0aW9uLCBzaGFyZWQgYW1vbmcgYWxsIGluc3RhbmNlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGVkIHdoZW4gYWxsIGVuZFN0YXRlcyBoYXZlIGJlZW4gcmVhY2hlZC5cbiAqL1xuTXVsdGlwbGVUcmFuc2l0aW9uLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoZW5kU3RhdGUsIHRyYW5zaXRpb24sIGNhbGxiYWNrKSB7XG4gICAgdmFyIF9hbGxDYWxsYmFjayA9IFV0aWxpdHkuYWZ0ZXIoZW5kU3RhdGUubGVuZ3RoLCBjYWxsYmFjayk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmRTdGF0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIXRoaXMuX2luc3RhbmNlc1tpXSkgdGhpcy5faW5zdGFuY2VzW2ldID0gbmV3ICh0aGlzLm1ldGhvZCkoKTtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnNldChlbmRTdGF0ZVtpXSwgdHJhbnNpdGlvbiwgX2FsbENhbGxiYWNrKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFJlc2V0IGFsbCB0cmFuc2l0aW9ucyB0byBzdGFydCBzdGF0ZS5cbiAqXG4gKiBAbWV0aG9kIHJlc2V0XG4gKlxuICogQHBhcmFtICB7TnVtYmVyfEFycmF5fSBzdGFydFN0YXRlIFN0YXJ0IHN0YXRlXG4gKi9cbk11bHRpcGxlVHJhbnNpdGlvbi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldChzdGFydFN0YXRlKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFydFN0YXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghdGhpcy5faW5zdGFuY2VzW2ldKSB0aGlzLl9pbnN0YW5jZXNbaV0gPSBuZXcgKHRoaXMubWV0aG9kKSgpO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0ucmVzZXQoc3RhcnRTdGF0ZVtpXSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNdWx0aXBsZVRyYW5zaXRpb247XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyOiBkYXZpZEBmYW1vLnVzXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBNdWx0aXBsZVRyYW5zaXRpb24gPSByZXF1aXJlKCcuL011bHRpcGxlVHJhbnNpdGlvbicpO1xudmFyIFR3ZWVuVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4vVHdlZW5UcmFuc2l0aW9uJyk7XG52YXIgRWFzaW5nID0gcmVxdWlyZSgnLi9FYXNpbmcnKTtcblxuLyoqXG4gKiBBIHN0YXRlIG1haW50YWluZXIgZm9yIGEgc21vb3RoIHRyYW5zaXRpb24gYmV0d2VlblxuICogICAgbnVtZXJpY2FsbHktc3BlY2lmaWVkIHN0YXRlcy4gRXhhbXBsZSBudW1lcmljIHN0YXRlcyBpbmNsdWRlIGZsb2F0cyBvclxuICogICAgVHJhbnNmb3JtIG9iamVjdHMuXG4gKlxuICogQW4gaW5pdGlhbCBzdGF0ZSBpcyBzZXQgd2l0aCB0aGUgY29uc3RydWN0b3Igb3Igc2V0KHN0YXJ0U3RhdGUpLiBBXG4gKiAgICBjb3JyZXNwb25kaW5nIGVuZCBzdGF0ZSBhbmQgdHJhbnNpdGlvbiBhcmUgc2V0IHdpdGggc2V0KGVuZFN0YXRlLFxuICogICAgdHJhbnNpdGlvbikuIFN1YnNlcXVlbnQgY2FsbHMgdG8gc2V0KGVuZFN0YXRlLCB0cmFuc2l0aW9uKSBiZWdpbiBhdFxuICogICAgdGhlIGxhc3Qgc3RhdGUuIENhbGxzIHRvIGdldCh0aW1lc3RhbXApIHByb3ZpZGUgdGhlIGludGVycG9sYXRlZCBzdGF0ZVxuICogICAgYWxvbmcgdGhlIHdheS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlcmUgaXMgbm8gZXZlbnQgbG9vcCBoZXJlIC0gY2FsbHMgdG8gZ2V0KCkgYXJlIHRoZSBvbmx5IHdheVxuICogICAgdG8gZmluZCBzdGF0ZSBwcm9qZWN0ZWQgdG8gdGhlIGN1cnJlbnQgKG9yIHByb3ZpZGVkKSB0aW1lIGFuZCBhcmVcbiAqICAgIHRoZSBvbmx5IHdheSB0byB0cmlnZ2VyIGNhbGxiYWNrcy4gVXN1YWxseSB0aGlzIGtpbmQgb2Ygb2JqZWN0IHdvdWxkXG4gKiAgICBiZSBwYXJ0IG9mIHRoZSByZW5kZXIoKSBwYXRoIG9mIGEgdmlzaWJsZSBjb21wb25lbnQuXG4gKlxuICogQGNsYXNzIFRyYW5zaXRpb25hYmxlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfEFycmF5Lk51bWJlcnxPYmplY3QuPG51bWJlcnxzdHJpbmcsIG51bWJlcj59IHN0YXJ0XG4gKiAgICBiZWdpbm5pbmcgc3RhdGVcbiAqL1xuZnVuY3Rpb24gVHJhbnNpdGlvbmFibGUoc3RhcnQpIHtcbiAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSBudWxsO1xuICAgIHRoaXMuYWN0aW9uUXVldWUgPSBbXTtcbiAgICB0aGlzLmNhbGxiYWNrUXVldWUgPSBbXTtcblxuICAgIHRoaXMuc3RhdGUgPSAwO1xuICAgIHRoaXMudmVsb2NpdHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fY2FsbGJhY2sgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fZW5naW5lSW5zdGFuY2UgPSBudWxsO1xuICAgIHRoaXMuX2N1cnJlbnRNZXRob2QgPSBudWxsO1xuXG4gICAgdGhpcy5zZXQoc3RhcnQpO1xufVxuXG52YXIgdHJhbnNpdGlvbk1ldGhvZHMgPSB7fTtcblxuVHJhbnNpdGlvbmFibGUucmVnaXN0ZXJNZXRob2QgPSBmdW5jdGlvbiByZWdpc3Rlck1ldGhvZChuYW1lLCBlbmdpbmVDbGFzcykge1xuICAgIGlmICghKG5hbWUgaW4gdHJhbnNpdGlvbk1ldGhvZHMpKSB7XG4gICAgICAgIHRyYW5zaXRpb25NZXRob2RzW25hbWVdID0gZW5naW5lQ2xhc3M7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbn07XG5cblRyYW5zaXRpb25hYmxlLnVucmVnaXN0ZXJNZXRob2QgPSBmdW5jdGlvbiB1bnJlZ2lzdGVyTWV0aG9kKG5hbWUpIHtcbiAgICBpZiAobmFtZSBpbiB0cmFuc2l0aW9uTWV0aG9kcykge1xuICAgICAgICBkZWxldGUgdHJhbnNpdGlvbk1ldGhvZHNbbmFtZV07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIF9sb2FkTmV4dCgpIHtcbiAgICBpZiAodGhpcy5fY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gdGhpcy5fY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuX2NhbGxiYWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5hY3Rpb25RdWV1ZS5sZW5ndGggPD0gMCkge1xuICAgICAgICB0aGlzLnNldCh0aGlzLmdldCgpKTsgLy8gbm8gdXBkYXRlIHJlcXVpcmVkXG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50QWN0aW9uID0gdGhpcy5hY3Rpb25RdWV1ZS5zaGlmdCgpO1xuICAgIHRoaXMuX2NhbGxiYWNrID0gdGhpcy5jYWxsYmFja1F1ZXVlLnNoaWZ0KCk7XG5cbiAgICB2YXIgbWV0aG9kID0gbnVsbDtcbiAgICB2YXIgZW5kVmFsdWUgPSB0aGlzLmN1cnJlbnRBY3Rpb25bMF07XG4gICAgdmFyIHRyYW5zaXRpb24gPSB0aGlzLmN1cnJlbnRBY3Rpb25bMV07XG4gICAgaWYgKHRyYW5zaXRpb24gaW5zdGFuY2VvZiBPYmplY3QgJiYgdHJhbnNpdGlvbi5tZXRob2QpIHtcbiAgICAgICAgbWV0aG9kID0gdHJhbnNpdGlvbi5tZXRob2Q7XG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykgbWV0aG9kID0gdHJhbnNpdGlvbk1ldGhvZHNbbWV0aG9kXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG1ldGhvZCA9IFR3ZWVuVHJhbnNpdGlvbjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY3VycmVudE1ldGhvZCAhPT0gbWV0aG9kKSB7XG4gICAgICAgIGlmICghKGVuZFZhbHVlIGluc3RhbmNlb2YgT2JqZWN0KSB8fCBtZXRob2QuU1VQUE9SVFNfTVVMVElQTEUgPT09IHRydWUgfHwgZW5kVmFsdWUubGVuZ3RoIDw9IG1ldGhvZC5TVVBQT1JUU19NVUxUSVBMRSkge1xuICAgICAgICAgICAgdGhpcy5fZW5naW5lSW5zdGFuY2UgPSBuZXcgbWV0aG9kKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9lbmdpbmVJbnN0YW5jZSA9IG5ldyBNdWx0aXBsZVRyYW5zaXRpb24obWV0aG9kKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jdXJyZW50TWV0aG9kID0gbWV0aG9kO1xuICAgIH1cblxuICAgIHRoaXMuX2VuZ2luZUluc3RhbmNlLnJlc2V0KHRoaXMuc3RhdGUsIHRoaXMudmVsb2NpdHkpO1xuICAgIGlmICh0aGlzLnZlbG9jaXR5ICE9PSB1bmRlZmluZWQpIHRyYW5zaXRpb24udmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5O1xuICAgIHRoaXMuX2VuZ2luZUluc3RhbmNlLnNldChlbmRWYWx1ZSwgdHJhbnNpdGlvbiwgX2xvYWROZXh0LmJpbmQodGhpcykpO1xufVxuXG4vKipcbiAqIEFkZCB0cmFuc2l0aW9uIHRvIGVuZCBzdGF0ZSB0byB0aGUgcXVldWUgb2YgcGVuZGluZyB0cmFuc2l0aW9ucy4gU3BlY2lhbFxuICogICAgVXNlOiBjYWxsaW5nIHdpdGhvdXQgYSB0cmFuc2l0aW9uIHJlc2V0cyB0aGUgb2JqZWN0IHRvIHRoYXQgc3RhdGUgd2l0aFxuICogICAgbm8gcGVuZGluZyBhY3Rpb25zXG4gKlxuICogQG1ldGhvZCBzZXRcbiAqXG4gKiBAcGFyYW0ge251bWJlcnxGYW1vdXNNYXRyaXh8QXJyYXkuTnVtYmVyfE9iamVjdC48bnVtYmVyLCBudW1iZXI+fSBlbmRTdGF0ZVxuICogICAgZW5kIHN0YXRlIHRvIHdoaWNoIHdlIGludGVycG9sYXRlXG4gKiBAcGFyYW0ge3RyYW5zaXRpb249fSB0cmFuc2l0aW9uIG9iamVjdCBvZiB0eXBlIHtkdXJhdGlvbjogbnVtYmVyLCBjdXJ2ZTpcbiAqICAgIGZbMCwxXSAtPiBbMCwxXSBvciBuYW1lfS4gSWYgdHJhbnNpdGlvbiBpcyBvbWl0dGVkLCBjaGFuZ2Ugd2lsbCBiZVxuICogICAgaW5zdGFudGFuZW91cy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKT19IGNhbGxiYWNrIFplcm8tYXJndW1lbnQgZnVuY3Rpb24gdG8gY2FsbCBvbiBvYnNlcnZlZFxuICogICAgY29tcGxldGlvbiAodD0xKVxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KGVuZFN0YXRlLCB0cmFuc2l0aW9uLCBjYWxsYmFjaykge1xuICAgIGlmICghdHJhbnNpdGlvbikge1xuICAgICAgICB0aGlzLnJlc2V0KGVuZFN0YXRlKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgYWN0aW9uID0gW2VuZFN0YXRlLCB0cmFuc2l0aW9uXTtcbiAgICB0aGlzLmFjdGlvblF1ZXVlLnB1c2goYWN0aW9uKTtcbiAgICB0aGlzLmNhbGxiYWNrUXVldWUucHVzaChjYWxsYmFjayk7XG4gICAgaWYgKCF0aGlzLmN1cnJlbnRBY3Rpb24pIF9sb2FkTmV4dC5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDYW5jZWwgYWxsIHRyYW5zaXRpb25zIGFuZCByZXNldCB0byBhIHN0YWJsZSBzdGF0ZVxuICpcbiAqIEBtZXRob2QgcmVzZXRcbiAqXG4gKiBAcGFyYW0ge251bWJlcnxBcnJheS5OdW1iZXJ8T2JqZWN0LjxudW1iZXIsIG51bWJlcj59IHN0YXJ0U3RhdGVcbiAqICAgIHN0YWJsZSBzdGF0ZSB0byBzZXQgdG9cbiAqL1xuVHJhbnNpdGlvbmFibGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoc3RhcnRTdGF0ZSwgc3RhcnRWZWxvY2l0eSkge1xuICAgIHRoaXMuX2N1cnJlbnRNZXRob2QgPSBudWxsO1xuICAgIHRoaXMuX2VuZ2luZUluc3RhbmNlID0gbnVsbDtcbiAgICB0aGlzLl9jYWxsYmFjayA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnN0YXRlID0gc3RhcnRTdGF0ZTtcbiAgICB0aGlzLnZlbG9jaXR5ID0gc3RhcnRWZWxvY2l0eTtcbiAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSBudWxsO1xuICAgIHRoaXMuYWN0aW9uUXVldWUgPSBbXTtcbiAgICB0aGlzLmNhbGxiYWNrUXVldWUgPSBbXTtcbn07XG5cbi8qKlxuICogQWRkIGRlbGF5IGFjdGlvbiB0byB0aGUgcGVuZGluZyBhY3Rpb24gcXVldWUgcXVldWUuXG4gKlxuICogQG1ldGhvZCBkZWxheVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBkZWxheSB0aW1lIChtcylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFplcm8tYXJndW1lbnQgZnVuY3Rpb24gdG8gY2FsbCBvbiBvYnNlcnZlZFxuICogICAgY29tcGxldGlvbiAodD0xKVxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiBkZWxheShkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICB0aGlzLnNldCh0aGlzLmdldCgpLCB7ZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICBjdXJ2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfX0sXG4gICAgICAgIGNhbGxiYWNrXG4gICAgKTtcbn07XG5cbi8qKlxuICogR2V0IGludGVycG9sYXRlZCBzdGF0ZSBvZiBjdXJyZW50IGFjdGlvbiBhdCBwcm92aWRlZCB0aW1lLiBJZiB0aGUgbGFzdFxuICogICAgYWN0aW9uIGhhcyBjb21wbGV0ZWQsIGludm9rZSBpdHMgY2FsbGJhY2suXG4gKlxuICogQG1ldGhvZCBnZXRcbiAqXG4gKiBAcGFyYW0ge251bWJlcj19IHRpbWVzdGFtcCBFdmFsdWF0ZSB0aGUgY3VydmUgYXQgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhpc1xuICogICAgdGltZS4gSWYgb21pdHRlZCwgdXNlIGN1cnJlbnQgdGltZS4gKFVuaXggZXBvY2ggdGltZSlcbiAqIEByZXR1cm4ge251bWJlcnxPYmplY3QuPG51bWJlcnxzdHJpbmcsIG51bWJlcj59IGJlZ2lubmluZyBzdGF0ZVxuICogICAgaW50ZXJwb2xhdGVkIHRvIHRoaXMgcG9pbnQgaW4gdGltZS5cbiAqL1xuVHJhbnNpdGlvbmFibGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCh0aW1lc3RhbXApIHtcbiAgICBpZiAodGhpcy5fZW5naW5lSW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VuZ2luZUluc3RhbmNlLmdldFZlbG9jaXR5KVxuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHRoaXMuX2VuZ2luZUluc3RhbmNlLmdldFZlbG9jaXR5KCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB0aGlzLl9lbmdpbmVJbnN0YW5jZS5nZXQodGltZXN0YW1wKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG59O1xuXG4vKipcbiAqIElzIHRoZXJlIGF0IGxlYXN0IG9uZSBhY3Rpb24gcGVuZGluZyBjb21wbGV0aW9uP1xuICpcbiAqIEBtZXRob2QgaXNBY3RpdmVcbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuaXNBY3RpdmUgPSBmdW5jdGlvbiBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gISF0aGlzLmN1cnJlbnRBY3Rpb247XG59O1xuXG4vKipcbiAqIEhhbHQgdHJhbnNpdGlvbiBhdCBjdXJyZW50IHN0YXRlIGFuZCBlcmFzZSBhbGwgcGVuZGluZyBhY3Rpb25zLlxuICpcbiAqIEBtZXRob2QgaGFsdFxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuaGFsdCA9IGZ1bmN0aW9uIGhhbHQoKSB7XG4gICAgdGhpcy5zZXQodGhpcy5nZXQoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zaXRpb25hYmxlO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogZGF2aWRAZmFtby51c1xuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqXG4gKiBBIHN0YXRlIG1haW50YWluZXIgZm9yIGEgc21vb3RoIHRyYW5zaXRpb24gYmV0d2VlblxuICogICAgbnVtZXJpY2FsbHktc3BlY2lmaWVkIHN0YXRlcy4gIEV4YW1wbGUgbnVtZXJpYyBzdGF0ZXMgaW5jbHVkZSBmbG9hdHMgb3JcbiAqICAgIFRyYW5zZm9ybm0gb2JqZWN0cy5cbiAqXG4gKiAgICBBbiBpbml0aWFsIHN0YXRlIGlzIHNldCB3aXRoIHRoZSBjb25zdHJ1Y3RvciBvciBzZXQoc3RhcnRWYWx1ZSkuIEFcbiAqICAgIGNvcnJlc3BvbmRpbmcgZW5kIHN0YXRlIGFuZCB0cmFuc2l0aW9uIGFyZSBzZXQgd2l0aCBzZXQoZW5kVmFsdWUsXG4gKiAgICB0cmFuc2l0aW9uKS4gU3Vic2VxdWVudCBjYWxscyB0byBzZXQoZW5kVmFsdWUsIHRyYW5zaXRpb24pIGJlZ2luIGF0XG4gKiAgICB0aGUgbGFzdCBzdGF0ZS4gQ2FsbHMgdG8gZ2V0KHRpbWVzdGFtcCkgcHJvdmlkZSB0aGUgX2ludGVycG9sYXRlZCBzdGF0ZVxuICogICAgYWxvbmcgdGhlIHdheS5cbiAqXG4gKiAgIE5vdGUgdGhhdCB0aGVyZSBpcyBubyBldmVudCBsb29wIGhlcmUgLSBjYWxscyB0byBnZXQoKSBhcmUgdGhlIG9ubHkgd2F5XG4gKiAgICB0byBmaW5kIG91dCBzdGF0ZSBwcm9qZWN0ZWQgdG8gdGhlIGN1cnJlbnQgKG9yIHByb3ZpZGVkKSB0aW1lIGFuZCBhcmVcbiAqICAgIHRoZSBvbmx5IHdheSB0byB0cmlnZ2VyIGNhbGxiYWNrcy4gVXN1YWxseSB0aGlzIGtpbmQgb2Ygb2JqZWN0IHdvdWxkXG4gKiAgICBiZSBwYXJ0IG9mIHRoZSByZW5kZXIoKSBwYXRoIG9mIGEgdmlzaWJsZSBjb21wb25lbnQuXG4gKlxuICogQGNsYXNzIFR3ZWVuVHJhbnNpdGlvblxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVE9ET1xuICogICAgYmVnaW5uaW5nIHN0YXRlXG4gKi9cbmZ1bmN0aW9uIFR3ZWVuVHJhbnNpdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmNyZWF0ZShUd2VlblRyYW5zaXRpb24uREVGQVVMVF9PUFRJT05TKTtcbiAgICBpZiAob3B0aW9ucykgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fc3RhcnRUaW1lID0gMDtcbiAgICB0aGlzLl9zdGFydFZhbHVlID0gMDtcbiAgICB0aGlzLl91cGRhdGVUaW1lID0gMDtcbiAgICB0aGlzLl9lbmRWYWx1ZSA9IDA7XG4gICAgdGhpcy5fY3VydmUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fZHVyYXRpb24gPSAwO1xuICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuX2NhbGxiYWNrID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuc3RhdGUgPSAwO1xuICAgIHRoaXMudmVsb2NpdHkgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbiBjdXJ2ZXMgbWFwcGluZyBpbmRlcGVuZGVudCB2YXJpYWJsZSB0IGZyb20gZG9tYWluIFswLDFdIHRvIGFcbiAqICAgIHJhbmdlIHdpdGhpbiBbMCwxXS4gSW5jbHVkZXMgZnVuY3Rpb25zICdsaW5lYXInLCAnZWFzZUluJywgJ2Vhc2VPdXQnLFxuICogICAgJ2Vhc2VJbk91dCcsICdlYXNlT3V0Qm91bmNlJywgJ3NwcmluZycuXG4gKlxuICogQHByb3BlcnR5IHtvYmplY3R9IEN1cnZlXG4gKiBAZmluYWxcbiAqL1xuVHdlZW5UcmFuc2l0aW9uLkN1cnZlcyA9IHtcbiAgICBsaW5lYXI6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfSxcbiAgICBlYXNlSW46IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdDtcbiAgICB9LFxuICAgIGVhc2VPdXQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqKDItdCk7XG4gICAgfSxcbiAgICBlYXNlSW5PdXQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKHQgPD0gMC41KSByZXR1cm4gMip0KnQ7XG4gICAgICAgIGVsc2UgcmV0dXJuIC0yKnQqdCArIDQqdCAtIDE7XG4gICAgfSxcbiAgICBlYXNlT3V0Qm91bmNlOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0KigzIC0gMip0KTtcbiAgICB9LFxuICAgIHNwcmluZzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gKDEgLSB0KSAqIE1hdGguc2luKDYgKiBNYXRoLlBJICogdCkgKyB0O1xuICAgIH1cbn07XG5cblR3ZWVuVHJhbnNpdGlvbi5TVVBQT1JUU19NVUxUSVBMRSA9IHRydWU7XG5Ud2VlblRyYW5zaXRpb24uREVGQVVMVF9PUFRJT05TID0ge1xuICAgIGN1cnZlOiBUd2VlblRyYW5zaXRpb24uQ3VydmVzLmxpbmVhcixcbiAgICBkdXJhdGlvbjogNTAwLFxuICAgIHNwZWVkOiAwIC8qIGNvbnNpZGVyZWQgb25seSBpZiBwb3NpdGl2ZSAqL1xufTtcblxudmFyIHJlZ2lzdGVyZWRDdXJ2ZXMgPSB7XG4gICAgaW5RdWFkOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0KnQ7XG4gICAgfSxcbiAgICBvdXRRdWFkOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAtKHQtPTEpKnQrMTtcbiAgICB9LFxuICAgIGluT3V0UXVhZDogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSp0KnQ7XG4gICAgICAgIHJldHVybiAtLjUqKCgtLXQpKih0LTIpIC0gMSk7XG4gICAgfSxcbiAgICBpbkN1YmljOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0KnQqdDtcbiAgICB9LFxuICAgIG91dEN1YmljOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAoKC0tdCkqdCp0ICsgMSk7XG4gICAgfSxcbiAgICBpbk91dEN1YmljOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41KnQqdCp0O1xuICAgICAgICByZXR1cm4gLjUqKCh0LT0yKSp0KnQgKyAyKTtcbiAgICB9LFxuICAgIGluUXVhcnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdCp0KnQ7XG4gICAgfSxcbiAgICBvdXRRdWFydDogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLSgoLS10KSp0KnQqdCAtIDEpO1xuICAgIH0sXG4gICAgaW5PdXRRdWFydDogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSp0KnQqdCp0O1xuICAgICAgICByZXR1cm4gLS41ICogKCh0LT0yKSp0KnQqdCAtIDIpO1xuICAgIH0sXG4gICAgaW5RdWludDogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdCp0KnQqdCp0O1xuICAgIH0sXG4gICAgb3V0UXVpbnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuICgoLS10KSp0KnQqdCp0ICsgMSk7XG4gICAgfSxcbiAgICBpbk91dFF1aW50OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41KnQqdCp0KnQqdDtcbiAgICAgICAgcmV0dXJuIC41KigodC09MikqdCp0KnQqdCArIDIpO1xuICAgIH0sXG4gICAgaW5TaW5lOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAtMS4wKk1hdGguY29zKHQgKiAoTWF0aC5QSS8yKSkgKyAxLjA7XG4gICAgfSxcbiAgICBvdXRTaW5lOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNpbih0ICogKE1hdGguUEkvMikpO1xuICAgIH0sXG4gICAgaW5PdXRTaW5lOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAtLjUqKE1hdGguY29zKE1hdGguUEkqdCkgLSAxKTtcbiAgICB9LFxuICAgIGluRXhwbzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gKHQ9PT0wKSA/IDAuMCA6IE1hdGgucG93KDIsIDEwICogKHQgLSAxKSk7XG4gICAgfSxcbiAgICBvdXRFeHBvOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAodD09PTEuMCkgPyAxLjAgOiAoLU1hdGgucG93KDIsIC0xMCAqIHQpICsgMSk7XG4gICAgfSxcbiAgICBpbk91dEV4cG86IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKHQ9PT0wKSByZXR1cm4gMC4wO1xuICAgICAgICBpZiAodD09PTEuMCkgcmV0dXJuIDEuMDtcbiAgICAgICAgaWYgKCh0Lz0uNSkgPCAxKSByZXR1cm4gLjUgKiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpO1xuICAgICAgICByZXR1cm4gLjUgKiAoLU1hdGgucG93KDIsIC0xMCAqIC0tdCkgKyAyKTtcbiAgICB9LFxuICAgIGluQ2lyYzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLShNYXRoLnNxcnQoMSAtIHQqdCkgLSAxKTtcbiAgICB9LFxuICAgIG91dENpcmM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgxIC0gKC0tdCkqdCk7XG4gICAgfSxcbiAgICBpbk91dENpcmM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKCh0Lz0uNSkgPCAxKSByZXR1cm4gLS41ICogKE1hdGguc3FydCgxIC0gdCp0KSAtIDEpO1xuICAgICAgICByZXR1cm4gLjUgKiAoTWF0aC5zcXJ0KDEgLSAodC09MikqdCkgKyAxKTtcbiAgICB9LFxuICAgIGluRWxhc3RpYzogZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgcz0xLjcwMTU4O3ZhciBwPTA7dmFyIGE9MS4wO1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7ICBpZiAodD09PTEpIHJldHVybiAxLjA7ICBpZiAoIXApIHA9LjM7XG4gICAgICAgIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKDEuMC9hKTtcbiAgICAgICAgcmV0dXJuIC0oYSpNYXRoLnBvdygyLDEwKih0LT0xKSkgKiBNYXRoLnNpbigodC1zKSooMipNYXRoLlBJKS8gcCkpO1xuICAgIH0sXG4gICAgb3V0RWxhc3RpYzogZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgcz0xLjcwMTU4O3ZhciBwPTA7dmFyIGE9MS4wO1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7ICBpZiAodD09PTEpIHJldHVybiAxLjA7ICBpZiAoIXApIHA9LjM7XG4gICAgICAgIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKDEuMC9hKTtcbiAgICAgICAgcmV0dXJuIGEqTWF0aC5wb3coMiwtMTAqdCkgKiBNYXRoLnNpbigodC1zKSooMipNYXRoLlBJKS9wKSArIDEuMDtcbiAgICB9LFxuICAgIGluT3V0RWxhc3RpYzogZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgcz0xLjcwMTU4O3ZhciBwPTA7dmFyIGE9MS4wO1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7ICBpZiAoKHQvPS41KT09PTIpIHJldHVybiAxLjA7ICBpZiAoIXApIHA9KC4zKjEuNSk7XG4gICAgICAgIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKDEuMC9hKTtcbiAgICAgICAgaWYgKHQgPCAxKSByZXR1cm4gLS41KihhKk1hdGgucG93KDIsMTAqKHQtPTEpKSAqIE1hdGguc2luKCh0LXMpKigyKk1hdGguUEkpL3ApKTtcbiAgICAgICAgcmV0dXJuIGEqTWF0aC5wb3coMiwtMTAqKHQtPTEpKSAqIE1hdGguc2luKCh0LXMpKigyKk1hdGguUEkpL3ApKi41ICsgMS4wO1xuICAgIH0sXG4gICAgaW5CYWNrOiBmdW5jdGlvbih0LCBzKSB7XG4gICAgICAgIGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuICAgICAgICByZXR1cm4gdCp0KigocysxKSp0IC0gcyk7XG4gICAgfSxcbiAgICBvdXRCYWNrOiBmdW5jdGlvbih0LCBzKSB7XG4gICAgICAgIGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuICAgICAgICByZXR1cm4gKCgtLXQpKnQqKChzKzEpKnQgKyBzKSArIDEpO1xuICAgIH0sXG4gICAgaW5PdXRCYWNrOiBmdW5jdGlvbih0LCBzKSB7XG4gICAgICAgIGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSoodCp0KigoKHMqPSgxLjUyNSkpKzEpKnQgLSBzKSk7XG4gICAgICAgIHJldHVybiAuNSooKHQtPTIpKnQqKCgocyo9KDEuNTI1KSkrMSkqdCArIHMpICsgMik7XG4gICAgfSxcbiAgICBpbkJvdW5jZTogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gMS4wIC0gRWFzaW5nLm91dEJvdW5jZSgxLjAtdCk7XG4gICAgfSxcbiAgICBvdXRCb3VuY2U6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKHQgPCAoMS8yLjc1KSkge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqdCp0KTtcbiAgICAgICAgfSBlbHNlIGlmICh0IDwgKDIvMi43NSkpIHtcbiAgICAgICAgICAgIHJldHVybiAoNy41NjI1Kih0LT0oMS41LzIuNzUpKSp0ICsgLjc1KTtcbiAgICAgICAgfSBlbHNlIGlmICh0IDwgKDIuNS8yLjc1KSkge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqKHQtPSgyLjI1LzIuNzUpKSp0ICsgLjkzNzUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqKHQtPSgyLjYyNS8yLjc1KSkqdCArIC45ODQzNzUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbk91dEJvdW5jZTogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAodCA8IC41KSByZXR1cm4gRWFzaW5nLmluQm91bmNlKHQqMikgKiAuNTtcbiAgICAgICAgcmV0dXJuIEVhc2luZy5vdXRCb3VuY2UodCoyLTEuMCkgKiAuNSArIC41O1xuICAgIH1cbn07XG5cbi8qKlxuICogQWRkIFwidW5pdFwiIGN1cnZlIHRvIGludGVybmFsIGRpY3Rpb25hcnkgb2YgcmVnaXN0ZXJlZCBjdXJ2ZXMuXG4gKlxuICogQG1ldGhvZCByZWdpc3RlckN1cnZlXG4gKlxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjdXJ2ZU5hbWUgZGljdGlvbmFyeSBrZXlcbiAqIEBwYXJhbSB7dW5pdEN1cnZlfSBjdXJ2ZSBmdW5jdGlvbiBvZiBvbmUgbnVtZXJpYyB2YXJpYWJsZSBtYXBwaW5nIFswLDFdXG4gKiAgICB0byByYW5nZSBpbnNpZGUgWzAsMV1cbiAqIEByZXR1cm4ge2Jvb2xlYW59IGZhbHNlIGlmIGtleSBpcyB0YWtlbiwgZWxzZSB0cnVlXG4gKi9cblR3ZWVuVHJhbnNpdGlvbi5yZWdpc3RlckN1cnZlID0gZnVuY3Rpb24gcmVnaXN0ZXJDdXJ2ZShjdXJ2ZU5hbWUsIGN1cnZlKSB7XG4gICAgaWYgKCFyZWdpc3RlcmVkQ3VydmVzW2N1cnZlTmFtZV0pIHtcbiAgICAgICAgcmVnaXN0ZXJlZEN1cnZlc1tjdXJ2ZU5hbWVdID0gY3VydmU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbi8qKlxuICogUmVtb3ZlIG9iamVjdCB3aXRoIGtleSBcImN1cnZlTmFtZVwiIGZyb20gaW50ZXJuYWwgZGljdGlvbmFyeSBvZiByZWdpc3RlcmVkXG4gKiAgICBjdXJ2ZXMuXG4gKlxuICogQG1ldGhvZCB1bnJlZ2lzdGVyQ3VydmVcbiAqXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGN1cnZlTmFtZSBkaWN0aW9uYXJ5IGtleVxuICogQHJldHVybiB7Ym9vbGVhbn0gZmFsc2UgaWYga2V5IGhhcyBubyBkaWN0aW9uYXJ5IHZhbHVlXG4gKi9cblR3ZWVuVHJhbnNpdGlvbi51bnJlZ2lzdGVyQ3VydmUgPSBmdW5jdGlvbiB1bnJlZ2lzdGVyQ3VydmUoY3VydmVOYW1lKSB7XG4gICAgaWYgKHJlZ2lzdGVyZWRDdXJ2ZXNbY3VydmVOYW1lXSkge1xuICAgICAgICBkZWxldGUgcmVnaXN0ZXJlZEN1cnZlc1tjdXJ2ZU5hbWVdO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIGZ1bmN0aW9uIHdpdGgga2V5IFwiY3VydmVOYW1lXCIgZnJvbSBpbnRlcm5hbCBkaWN0aW9uYXJ5IG9mXG4gKiAgICByZWdpc3RlcmVkIGN1cnZlcy4gRGVmYXVsdCBjdXJ2ZXMgYXJlIGRlZmluZWQgaW4gdGhlXG4gKiAgICBUd2VlblRyYW5zaXRpb24uQ3VydmVzIGFycmF5LCB3aGVyZSB0aGUgdmFsdWVzIHJlcHJlc2VudFxuICogICAgdW5pdEN1cnZlIGZ1bmN0aW9ucy5cbiAqXG4gKiBAbWV0aG9kIGdldEN1cnZlXG4gKlxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjdXJ2ZU5hbWUgZGljdGlvbmFyeSBrZXlcbiAqIEByZXR1cm4ge3VuaXRDdXJ2ZX0gY3VydmUgZnVuY3Rpb24gb2Ygb25lIG51bWVyaWMgdmFyaWFibGUgbWFwcGluZyBbMCwxXVxuICogICAgdG8gcmFuZ2UgaW5zaWRlIFswLDFdXG4gKi9cblR3ZWVuVHJhbnNpdGlvbi5nZXRDdXJ2ZSA9IGZ1bmN0aW9uIGdldEN1cnZlKGN1cnZlTmFtZSkge1xuICAgIHZhciBjdXJ2ZSA9IHJlZ2lzdGVyZWRDdXJ2ZXNbY3VydmVOYW1lXTtcbiAgICBpZiAoY3VydmUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGN1cnZlO1xuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKCdjdXJ2ZSBub3QgcmVnaXN0ZXJlZCcpO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSBhbGwgYXZhaWxhYmxlIGN1cnZlcy5cbiAqXG4gKiBAbWV0aG9kIGdldEN1cnZlc1xuICpcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcmV0dXJuIHtvYmplY3R9IGN1cnZlIGZ1bmN0aW9ucyBvZiBvbmUgbnVtZXJpYyB2YXJpYWJsZSBtYXBwaW5nIFswLDFdXG4gKiAgICB0byByYW5nZSBpbnNpZGUgWzAsMV1cbiAqL1xuVHdlZW5UcmFuc2l0aW9uLmdldEN1cnZlcyA9IGZ1bmN0aW9uIGdldEN1cnZlcygpIHtcbiAgICByZXR1cm4gcmVnaXN0ZXJlZEN1cnZlcztcbn07XG5cbiAvLyBJbnRlcnBvbGF0ZTogSWYgYSBsaW5lYXIgZnVuY3Rpb24gZigwKSA9IGEsIGYoMSkgPSBiLCB0aGVuIHJldHVybiBmKHQpXG5mdW5jdGlvbiBfaW50ZXJwb2xhdGUoYSwgYiwgdCkge1xuICAgIHJldHVybiAoKDEgLSB0KSAqIGEpICsgKHQgKiBiKTtcbn1cblxuZnVuY3Rpb24gX2Nsb25lKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSByZXR1cm4gb2JqLnNsaWNlKDApO1xuICAgICAgICBlbHNlIHJldHVybiBPYmplY3QuY3JlYXRlKG9iaik7XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIG9iajtcbn1cblxuLy8gRmlsbCBpbiBtaXNzaW5nIHByb3BlcnRpZXMgaW4gXCJ0cmFuc2l0aW9uXCIgd2l0aCB0aG9zZSBpbiBkZWZhdWx0VHJhbnNpdGlvbiwgYW5kXG4vLyAgIGNvbnZlcnQgaW50ZXJuYWwgbmFtZWQgY3VydmUgdG8gZnVuY3Rpb24gb2JqZWN0LCByZXR1cm5pbmcgYXMgbmV3XG4vLyAgIG9iamVjdC5cbmZ1bmN0aW9uIF9ub3JtYWxpemUodHJhbnNpdGlvbiwgZGVmYXVsdFRyYW5zaXRpb24pIHtcbiAgICB2YXIgcmVzdWx0ID0ge2N1cnZlOiBkZWZhdWx0VHJhbnNpdGlvbi5jdXJ2ZX07XG4gICAgaWYgKGRlZmF1bHRUcmFuc2l0aW9uLmR1cmF0aW9uKSByZXN1bHQuZHVyYXRpb24gPSBkZWZhdWx0VHJhbnNpdGlvbi5kdXJhdGlvbjtcbiAgICBpZiAoZGVmYXVsdFRyYW5zaXRpb24uc3BlZWQpIHJlc3VsdC5zcGVlZCA9IGRlZmF1bHRUcmFuc2l0aW9uLnNwZWVkO1xuICAgIGlmICh0cmFuc2l0aW9uIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLmR1cmF0aW9uICE9PSB1bmRlZmluZWQpIHJlc3VsdC5kdXJhdGlvbiA9IHRyYW5zaXRpb24uZHVyYXRpb247XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLmN1cnZlKSByZXN1bHQuY3VydmUgPSB0cmFuc2l0aW9uLmN1cnZlO1xuICAgICAgICBpZiAodHJhbnNpdGlvbi5zcGVlZCkgcmVzdWx0LnNwZWVkID0gdHJhbnNpdGlvbi5zcGVlZDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZXN1bHQuY3VydmUgPT09ICdzdHJpbmcnKSByZXN1bHQuY3VydmUgPSBUd2VlblRyYW5zaXRpb24uZ2V0Q3VydmUocmVzdWx0LmN1cnZlKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFNldCBpbnRlcm5hbCBvcHRpb25zLCBvdmVycmlkaW5nIGFueSBkZWZhdWx0IG9wdGlvbnMuXG4gKlxuICogQG1ldGhvZCBzZXRPcHRpb25zXG4gKlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnMgb2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuY3VydmVdIGZ1bmN0aW9uIG1hcHBpbmcgWzAsMV0gdG8gWzAsMV0gb3IgaWRlbnRpZmllclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmR1cmF0aW9uXSBkdXJhdGlvbiBpbiBtc1xuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnNwZWVkXSBzcGVlZCBpbiBwaXhlbHMgcGVyIG1zXG4gKi9cblR3ZWVuVHJhbnNpdGlvbi5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmN1cnZlICE9PSB1bmRlZmluZWQpIHRoaXMub3B0aW9ucy5jdXJ2ZSA9IG9wdGlvbnMuY3VydmU7XG4gICAgaWYgKG9wdGlvbnMuZHVyYXRpb24gIT09IHVuZGVmaW5lZCkgdGhpcy5vcHRpb25zLmR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbjtcbiAgICBpZiAob3B0aW9ucy5zcGVlZCAhPT0gdW5kZWZpbmVkKSB0aGlzLm9wdGlvbnMuc3BlZWQgPSBvcHRpb25zLnNwZWVkO1xufTtcblxuLyoqXG4gKiBBZGQgdHJhbnNpdGlvbiB0byBlbmQgc3RhdGUgdG8gdGhlIHF1ZXVlIG9mIHBlbmRpbmcgdHJhbnNpdGlvbnMuIFNwZWNpYWxcbiAqICAgIFVzZTogY2FsbGluZyB3aXRob3V0IGEgdHJhbnNpdGlvbiByZXNldHMgdGhlIG9iamVjdCB0byB0aGF0IHN0YXRlIHdpdGhcbiAqICAgIG5vIHBlbmRpbmcgYWN0aW9uc1xuICpcbiAqIEBtZXRob2Qgc2V0XG4gKlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfEZhbW91c01hdHJpeHxBcnJheS5OdW1iZXJ8T2JqZWN0LjxudW1iZXIsIG51bWJlcj59IGVuZFZhbHVlXG4gKiAgICBlbmQgc3RhdGUgdG8gd2hpY2ggd2UgX2ludGVycG9sYXRlXG4gKiBAcGFyYW0ge3RyYW5zaXRpb249fSB0cmFuc2l0aW9uIG9iamVjdCBvZiB0eXBlIHtkdXJhdGlvbjogbnVtYmVyLCBjdXJ2ZTpcbiAqICAgIGZbMCwxXSAtPiBbMCwxXSBvciBuYW1lfS4gSWYgdHJhbnNpdGlvbiBpcyBvbWl0dGVkLCBjaGFuZ2Ugd2lsbCBiZVxuICogICAgaW5zdGFudGFuZW91cy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKT19IGNhbGxiYWNrIFplcm8tYXJndW1lbnQgZnVuY3Rpb24gdG8gY2FsbCBvbiBvYnNlcnZlZFxuICogICAgY29tcGxldGlvbiAodD0xKVxuICovXG5Ud2VlblRyYW5zaXRpb24ucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldChlbmRWYWx1ZSwgdHJhbnNpdGlvbiwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRyYW5zaXRpb24pIHtcbiAgICAgICAgdGhpcy5yZXNldChlbmRWYWx1ZSk7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3N0YXJ0VmFsdWUgPSBfY2xvbmUodGhpcy5nZXQoKSk7XG4gICAgdHJhbnNpdGlvbiA9IF9ub3JtYWxpemUodHJhbnNpdGlvbiwgdGhpcy5vcHRpb25zKTtcbiAgICBpZiAodHJhbnNpdGlvbi5zcGVlZCkge1xuICAgICAgICB2YXIgc3RhcnRWYWx1ZSA9IHRoaXMuX3N0YXJ0VmFsdWU7XG4gICAgICAgIGlmIChzdGFydFZhbHVlIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICB2YXIgdmFyaWFuY2UgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBzdGFydFZhbHVlKSB2YXJpYW5jZSArPSAoZW5kVmFsdWVbaV0gLSBzdGFydFZhbHVlW2ldKSAqIChlbmRWYWx1ZVtpXSAtIHN0YXJ0VmFsdWVbaV0pO1xuICAgICAgICAgICAgdHJhbnNpdGlvbi5kdXJhdGlvbiA9IE1hdGguc3FydCh2YXJpYW5jZSkgLyB0cmFuc2l0aW9uLnNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdHJhbnNpdGlvbi5kdXJhdGlvbiA9IE1hdGguYWJzKGVuZFZhbHVlIC0gc3RhcnRWYWx1ZSkgLyB0cmFuc2l0aW9uLnNwZWVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLl9lbmRWYWx1ZSA9IF9jbG9uZShlbmRWYWx1ZSk7XG4gICAgdGhpcy5fc3RhcnRWZWxvY2l0eSA9IF9jbG9uZSh0cmFuc2l0aW9uLnZlbG9jaXR5KTtcbiAgICB0aGlzLl9kdXJhdGlvbiA9IHRyYW5zaXRpb24uZHVyYXRpb247XG4gICAgdGhpcy5fY3VydmUgPSB0cmFuc2l0aW9uLmN1cnZlO1xuICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbn07XG5cbi8qKlxuICogQ2FuY2VsIGFsbCB0cmFuc2l0aW9ucyBhbmQgcmVzZXQgdG8gYSBzdGFibGUgc3RhdGVcbiAqXG4gKiBAbWV0aG9kIHJlc2V0XG4gKlxuICogQHBhcmFtIHtudW1iZXJ8QXJyYXkuTnVtYmVyfE9iamVjdC48bnVtYmVyLCBudW1iZXI+fSBzdGFydFZhbHVlXG4gKiAgICBzdGFydGluZyBzdGF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0VmVsb2NpdHlcbiAqICAgIHN0YXJ0aW5nIHZlbG9jaXR5XG4gKi9cblR3ZWVuVHJhbnNpdGlvbi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldChzdGFydFZhbHVlLCBzdGFydFZlbG9jaXR5KSB7XG4gICAgaWYgKHRoaXMuX2NhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IHRoaXMuX2NhbGxiYWNrO1xuICAgICAgICB0aGlzLl9jYWxsYmFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZSA9IF9jbG9uZShzdGFydFZhbHVlKTtcbiAgICB0aGlzLnZlbG9jaXR5ID0gX2Nsb25lKHN0YXJ0VmVsb2NpdHkpO1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IDA7XG4gICAgdGhpcy5fZHVyYXRpb24gPSAwO1xuICAgIHRoaXMuX3VwZGF0ZVRpbWUgPSAwO1xuICAgIHRoaXMuX3N0YXJ0VmFsdWUgPSB0aGlzLnN0YXRlO1xuICAgIHRoaXMuX3N0YXJ0VmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5O1xuICAgIHRoaXMuX2VuZFZhbHVlID0gdGhpcy5zdGF0ZTtcbiAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgdmVsb2NpdHlcbiAqXG4gKiBAbWV0aG9kIGdldFZlbG9jaXR5XG4gKlxuICogQHJldHVybnMge051bWJlcn0gdmVsb2NpdHlcbiAqL1xuVHdlZW5UcmFuc2l0aW9uLnByb3RvdHlwZS5nZXRWZWxvY2l0eSA9IGZ1bmN0aW9uIGdldFZlbG9jaXR5KCkge1xuICAgIHJldHVybiB0aGlzLnZlbG9jaXR5O1xufTtcblxuLyoqXG4gKiBHZXQgaW50ZXJwb2xhdGVkIHN0YXRlIG9mIGN1cnJlbnQgYWN0aW9uIGF0IHByb3ZpZGVkIHRpbWUuIElmIHRoZSBsYXN0XG4gKiAgICBhY3Rpb24gaGFzIGNvbXBsZXRlZCwgaW52b2tlIGl0cyBjYWxsYmFjay5cbiAqXG4gKiBAbWV0aG9kIGdldFxuICpcbiAqXG4gKiBAcGFyYW0ge251bWJlcj19IHRpbWVzdGFtcCBFdmFsdWF0ZSB0aGUgY3VydmUgYXQgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhpc1xuICogICAgdGltZS4gSWYgb21pdHRlZCwgdXNlIGN1cnJlbnQgdGltZS4gKFVuaXggZXBvY2ggdGltZSlcbiAqIEByZXR1cm4ge251bWJlcnxPYmplY3QuPG51bWJlcnxzdHJpbmcsIG51bWJlcj59IGJlZ2lubmluZyBzdGF0ZVxuICogICAgX2ludGVycG9sYXRlZCB0byB0aGlzIHBvaW50IGluIHRpbWUuXG4gKi9cblR3ZWVuVHJhbnNpdGlvbi5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KHRpbWVzdGFtcCkge1xuICAgIHRoaXMudXBkYXRlKHRpbWVzdGFtcCk7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG59O1xuXG5mdW5jdGlvbiBfY2FsY3VsYXRlVmVsb2NpdHkoY3VycmVudCwgc3RhcnQsIGN1cnZlLCBkdXJhdGlvbiwgdCkge1xuICAgIHZhciB2ZWxvY2l0eTtcbiAgICB2YXIgZXBzID0gMWUtNztcbiAgICB2YXIgc3BlZWQgPSAoY3VydmUodCkgLSBjdXJ2ZSh0IC0gZXBzKSkgLyBlcHM7XG4gICAgaWYgKGN1cnJlbnQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB2ZWxvY2l0eSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnJlbnQubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50W2ldID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eVtpXSA9IHNwZWVkICogKGN1cnJlbnRbaV0gLSBzdGFydFtpXSkgLyBkdXJhdGlvbjtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eVtpXSA9IDA7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICBlbHNlIHZlbG9jaXR5ID0gc3BlZWQgKiAoY3VycmVudCAtIHN0YXJ0KSAvIGR1cmF0aW9uO1xuICAgIHJldHVybiB2ZWxvY2l0eTtcbn1cblxuZnVuY3Rpb24gX2NhbGN1bGF0ZVN0YXRlKHN0YXJ0LCBlbmQsIHQpIHtcbiAgICB2YXIgc3RhdGU7XG4gICAgaWYgKHN0YXJ0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgc3RhdGUgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFydC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGFydFtpXSA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICAgICAgc3RhdGVbaV0gPSBfaW50ZXJwb2xhdGUoc3RhcnRbaV0sIGVuZFtpXSwgdCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3RhdGVbaV0gPSBzdGFydFtpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHN0YXRlID0gX2ludGVycG9sYXRlKHN0YXJ0LCBlbmQsIHQpO1xuICAgIHJldHVybiBzdGF0ZTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgaW50ZXJuYWwgc3RhdGUgdG8gdGhlIHByb3ZpZGVkIHRpbWVzdGFtcC4gVGhpcyBtYXkgaW52b2tlIHRoZSBsYXN0XG4gKiAgICBjYWxsYmFjayBhbmQgYmVnaW4gYSBuZXcgYWN0aW9uLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyPX0gdGltZXN0YW1wIEV2YWx1YXRlIHRoZSBjdXJ2ZSBhdCBhIG5vcm1hbGl6ZWQgdmVyc2lvbiBvZiB0aGlzXG4gKiAgICB0aW1lLiBJZiBvbWl0dGVkLCB1c2UgY3VycmVudCB0aW1lLiAoVW5peCBlcG9jaCB0aW1lKVxuICovXG5Ud2VlblRyYW5zaXRpb24ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSh0aW1lc3RhbXApIHtcbiAgICBpZiAoIXRoaXMuX2FjdGl2ZSkge1xuICAgICAgICBpZiAodGhpcy5fY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IHRoaXMuX2NhbGxiYWNrO1xuICAgICAgICAgICAgdGhpcy5fY2FsbGJhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRpbWVzdGFtcCkgdGltZXN0YW1wID0gRGF0ZS5ub3coKTtcbiAgICBpZiAodGhpcy5fdXBkYXRlVGltZSA+PSB0aW1lc3RhbXApIHJldHVybjtcbiAgICB0aGlzLl91cGRhdGVUaW1lID0gdGltZXN0YW1wO1xuXG4gICAgdmFyIHRpbWVTaW5jZVN0YXJ0ID0gdGltZXN0YW1wIC0gdGhpcy5fc3RhcnRUaW1lO1xuICAgIGlmICh0aW1lU2luY2VTdGFydCA+PSB0aGlzLl9kdXJhdGlvbikge1xuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5fZW5kVmFsdWU7XG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSBfY2FsY3VsYXRlVmVsb2NpdHkodGhpcy5zdGF0ZSwgdGhpcy5fc3RhcnRWYWx1ZSwgdGhpcy5fY3VydmUsIHRoaXMuX2R1cmF0aW9uLCAxKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRpbWVTaW5jZVN0YXJ0IDwgMCkge1xuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5fc3RhcnRWYWx1ZTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHRoaXMuX3N0YXJ0VmVsb2NpdHk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgdCA9IHRpbWVTaW5jZVN0YXJ0IC8gdGhpcy5fZHVyYXRpb247XG4gICAgICAgIHRoaXMuc3RhdGUgPSBfY2FsY3VsYXRlU3RhdGUodGhpcy5fc3RhcnRWYWx1ZSwgdGhpcy5fZW5kVmFsdWUsIHRoaXMuX2N1cnZlKHQpKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IF9jYWxjdWxhdGVWZWxvY2l0eSh0aGlzLnN0YXRlLCB0aGlzLl9zdGFydFZhbHVlLCB0aGlzLl9jdXJ2ZSwgdGhpcy5fZHVyYXRpb24sIHQpO1xuICAgIH1cbn07XG5cbi8qKlxuICogSXMgdGhlcmUgYXQgbGVhc3Qgb25lIGFjdGlvbiBwZW5kaW5nIGNvbXBsZXRpb24/XG4gKlxuICogQG1ldGhvZCBpc0FjdGl2ZVxuICpcbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5Ud2VlblRyYW5zaXRpb24ucHJvdG90eXBlLmlzQWN0aXZlID0gZnVuY3Rpb24gaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZTtcbn07XG5cbi8qKlxuICogSGFsdCB0cmFuc2l0aW9uIGF0IGN1cnJlbnQgc3RhdGUgYW5kIGVyYXNlIGFsbCBwZW5kaW5nIGFjdGlvbnMuXG4gKlxuICogQG1ldGhvZCBoYWx0XG4gKlxuICovXG5Ud2VlblRyYW5zaXRpb24ucHJvdG90eXBlLmhhbHQgPSBmdW5jdGlvbiBoYWx0KCkge1xuICAgIHRoaXMucmVzZXQodGhpcy5nZXQoKSk7XG59O1xuXG4vLyBSZWdpc3RlciBhbGwgdGhlIGRlZmF1bHQgY3VydmVzXG5Ud2VlblRyYW5zaXRpb24ucmVnaXN0ZXJDdXJ2ZSgnbGluZWFyJywgVHdlZW5UcmFuc2l0aW9uLkN1cnZlcy5saW5lYXIpO1xuVHdlZW5UcmFuc2l0aW9uLnJlZ2lzdGVyQ3VydmUoJ2Vhc2VJbicsIFR3ZWVuVHJhbnNpdGlvbi5DdXJ2ZXMuZWFzZUluKTtcblR3ZWVuVHJhbnNpdGlvbi5yZWdpc3RlckN1cnZlKCdlYXNlT3V0JywgVHdlZW5UcmFuc2l0aW9uLkN1cnZlcy5lYXNlT3V0KTtcblR3ZWVuVHJhbnNpdGlvbi5yZWdpc3RlckN1cnZlKCdlYXNlSW5PdXQnLCBUd2VlblRyYW5zaXRpb24uQ3VydmVzLmVhc2VJbk91dCk7XG5Ud2VlblRyYW5zaXRpb24ucmVnaXN0ZXJDdXJ2ZSgnZWFzZU91dEJvdW5jZScsIFR3ZWVuVHJhbnNpdGlvbi5DdXJ2ZXMuZWFzZU91dEJvdW5jZSk7XG5Ud2VlblRyYW5zaXRpb24ucmVnaXN0ZXJDdXJ2ZSgnc3ByaW5nJywgVHdlZW5UcmFuc2l0aW9uLkN1cnZlcy5zcHJpbmcpO1xuXG5Ud2VlblRyYW5zaXRpb24uY3VzdG9tQ3VydmUgPSBmdW5jdGlvbiBjdXN0b21DdXJ2ZSh2MSwgdjIpIHtcbiAgICB2MSA9IHYxIHx8IDA7IHYyID0gdjIgfHwgMDtcbiAgICByZXR1cm4gZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdjEqdCArICgtMip2MSAtIHYyICsgMykqdCp0ICsgKHYxICsgdjIgLSAyKSp0KnQqdDtcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUd2VlblRyYW5zaXRpb247XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyOiBtYXJrQGZhbW8udXNcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG5hbWVzcGFjZSBob2xkcyBzdGFuZGFsb25lIGZ1bmN0aW9uYWxpdHkuXG4gICAgICogIEN1cnJlbnRseSBpbmNsdWRlcyBuYW1lIG1hcHBpbmcgZm9yIHRyYW5zaXRpb24gY3VydmVzLFxuICAgICAqICBuYW1lIG1hcHBpbmcgZm9yIG9yaWdpbiBwYWlycywgYW5kIHRoZSBhZnRlcigpIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGNsYXNzIFV0aWxpdHlcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgdmFyIFV0aWxpdHkgPSB7fTtcblxuICAgIC8qKlxuICAgICAqIFRhYmxlIG9mIGRpcmVjdGlvbiBhcnJheSBwb3NpdGlvbnNcbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBEaXJlY3Rpb25cbiAgICAgKiBAZmluYWxcbiAgICAgKi9cbiAgICBVdGlsaXR5LkRpcmVjdGlvbiA9IHtcbiAgICAgICAgWDogMCxcbiAgICAgICAgWTogMSxcbiAgICAgICAgWjogMlxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gd3JhcHBlciBhcm91bmQgY2FsbGJhY2sgZnVuY3Rpb24uIE9uY2UgdGhlIHdyYXBwZXIgaXMgY2FsbGVkIE5cbiAgICAgKiAgIHRpbWVzLCBpbnZva2UgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLiBBcmd1bWVudHMgYW5kIHNjb3BlIHByZXNlcnZlZC5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgYWZ0ZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudCBudW1iZXIgb2YgY2FsbHMgYmVmb3JlIGNhbGxiYWNrIGZ1bmN0aW9uIGludm9rZWRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB3cmFwcGVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gd3JhcHBlZCBjYWxsYmFjayB3aXRoIGNvdW5kb3duIGZlYXR1cmVcbiAgICAgKi9cbiAgICBVdGlsaXR5LmFmdGVyID0gZnVuY3Rpb24gYWZ0ZXIoY291bnQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjb3VudGVyID0gY291bnQ7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvdW50ZXItLTtcbiAgICAgICAgICAgIGlmIChjb3VudGVyID09PSAwKSBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIGEgVVJMIGFuZCByZXR1cm4gaXRzIGNvbnRlbnRzIGluIGEgY2FsbGJhY2tcbiAgICAgKlxuICAgICAqIEBtZXRob2QgbG9hZFVSTFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVUkwgb2Ygb2JqZWN0XG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2sgdG8gZGlzcGF0Y2ggd2l0aCBjb250ZW50XG4gICAgICovXG4gICAgVXRpbGl0eS5sb2FkVVJMID0gZnVuY3Rpb24gbG9hZFVSTCh1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIG9ucmVhZHlzdGF0ZWNoYW5nZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRoaXMucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGRvY3VtZW50IGZyYWdtZW50IGZyb20gYSBzdHJpbmcgb2YgSFRNTFxuICAgICAqXG4gICAgICogQG1ldGhvZCBjcmVhdGVEb2N1bWVudEZyYWdtZW50RnJvbUhUTUxcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdG8gY29udmVydCB0byBEb2N1bWVudEZyYWdtZW50XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fSBEb2N1bWVudEZyYWdtZW50IHJlcHJlc2VudGluZyBpbnB1dCBIVE1MXG4gICAgICovXG4gICAgVXRpbGl0eS5jcmVhdGVEb2N1bWVudEZyYWdtZW50RnJvbUhUTUwgPSBmdW5jdGlvbiBjcmVhdGVEb2N1bWVudEZyYWdtZW50RnJvbUhUTUwoaHRtbCkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHZhciByZXN1bHQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgIHdoaWxlIChlbGVtZW50Lmhhc0NoaWxkTm9kZXMoKSkgcmVzdWx0LmFwcGVuZENoaWxkKGVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogIERlZXAgY2xvbmUgYW4gb2JqZWN0LlxuICAgICAqICBAcGFyYW0gYiB7T2JqZWN0fSBPYmplY3QgdG8gY2xvbmVcbiAgICAgKiAgQHJldHVybiBhIHtPYmplY3R9IENsb25lZCBvYmplY3QuXG4gICAgICovXG4gICAgVXRpbGl0eS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKGIpIHtcbiAgICAgICAgdmFyIGE7XG4gICAgICAgIGlmICh0eXBlb2YgYiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGEgPSAoYiBpbnN0YW5jZW9mIEFycmF5KSA/IFtdIDoge307XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYltrZXldID09PSAnb2JqZWN0JyAmJiBiW2tleV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJba2V5XSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhW2tleV0gPSBuZXcgQXJyYXkoYltrZXldLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJba2V5XS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFba2V5XVtpXSA9IFV0aWxpdHkuY2xvbmUoYltrZXldW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBhW2tleV0gPSBVdGlsaXR5LmNsb25lKGJba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhID0gYjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBVdGlsaXR5O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdF9vbmNlOiBbXSxcblx0X2V2ZXJ5OiBbXSxcblx0X2dldHRlcjogcGVyZm9ybWFuY2UgfHwgRGF0ZSxcblxuXHR1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSgpe1xuXHRcdHZhciBjdXJyZW50VGltZSA9IHRoaXMuX2dldHRlci5ub3coKTtcblx0XHR2YXIgdGltZXJFdmVudDtcblx0XHR2YXIgbmV3RWxhcHNlZFRpbWUgPSBjdXJyZW50VGltZSAtIHRoaXMuX2luaXRpYWxUaW1lO1xuXG5cdFx0aWYoIXRoaXMuX2luaXRpYWxUaW1lKSB0aGlzLl9pbml0aWFsVGltZSA9IGN1cnJlbnRUaW1lO1xuXHRcdFxuXHRcdHRoaXMuX2ZyYW1lRHVyYXRpb24gPSBuZXdFbGFwc2VkVGltZSAtIHRoaXMuX2VsYXBzZWQ7XG5cdFx0dGhpcy5fZWxhcHNlZCA9IGN1cnJlbnRUaW1lIC0gdGhpcy5faW5pdGlhbFRpbWU7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX29uY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKHRoaXMuX2VsYXBzZWQgPiB0aGlzLl9vbmNlW2ldLnRyaWdnZXIpIHtcblx0XHRcdFx0dGltZXJFdmVudCA9IHRoaXMuX29uY2VbaV07XG5cdFx0XHRcdHRpbWVyRXZlbnQuY2FsbGJhY2soKTtcblx0XHRcdFx0dGhpcy5fb25jZS5zcGxpY2UoaSwgMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ldmVyeS5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYodGhpcy5fZWxhcHNlZCA+IHRoaXMuX2V2ZXJ5W2ldLnRyaWdnZXIpIHtcblx0XHRcdFx0dGltZXJFdmVudCA9IHRoaXMuX2V2ZXJ5W2ldO1xuXHRcdFx0XHR0aW1lckV2ZW50LmNhbGxiYWNrKCk7XG5cdFx0XHRcdHRpbWVyRXZlbnQudHJpZ2dlciA9IHRoaXMuX2VsYXBzZWQgKyB0aW1lckV2ZW50LnRpbWVvdXRcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Z2V0RWxhcHNlZDogZnVuY3Rpb24gZ2V0RWxhcHNlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fZWxhcHNlZDtcblx0fSxcblxuXHRnZXRGcmFtZUR1cmF0aW9uOiBmdW5jdGlvbiBnZXRGcmFtZUR1cmF0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLl9mcmFtZUR1cmF0aW9uO1xuXHR9LFxuXG5cdGFmdGVyOiBmdW5jdGlvbiBhZnRlcihjYWxsYmFjaywgdGltZW91dCkge1xuXHRcdHRoaXMuX29uY2UucHVzaCh7XG5cdFx0XHRjYWxsYmFjazogY2FsbGJhY2ssXG5cdFx0XHR0cmlnZ2VyOiB0aGlzLl9lbGFwc2VkICsgdGltZW91dFxuXHRcdH0pO1xuXHR9LFxuXG5cdGV2ZXJ5OiBmdW5jdGlvbiBldmVyeShjYWxsYmFjaywgdGltZW91dCkge1xuXHRcdHRoaXMuX2V2ZXJ5LnB1c2goe1xuXHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrLFxuXHRcdFx0dHJpZ2dlcjogdGhpcy5fZWxhcHNlZCArIHRpbWVvdXQsXG5cdFx0XHR0aW1lb3V0OiB0aW1lb3V0XG5cdFx0fSlcblx0fVxufTsiLCJ2YXIgRW5naW5lICA9IHJlcXVpcmUoJy4vR2FtZS9FbmdpbmUnKTtcbnZhciBMb2FkaW5nID0gcmVxdWlyZSgnLi9TdGF0ZXMvTG9hZGluZycpO1xudmFyIE1lbnUgICAgPSByZXF1aXJlKCcuL1N0YXRlcy9NZW51Jyk7XG52YXIgUGxheWluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL1BsYXlpbmcnKTtcbnZhciBFdmVudEhhbmRsZXIgPSByZXF1aXJlKCcuL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBJbWFnZUxvYWRlciAgPSByZXF1aXJlKCcuL0dhbWUvSW1hZ2VMb2FkZXInKTtcbnZhciBBamF4TG9hZGVyICAgPSByZXF1aXJlKCcuL0dhbWUvQWpheExvYWRlcicpO1xudmFyIFZpZXdwb3J0ICAgICA9IHJlcXVpcmUoJy4vR2FtZS9WaWV3cG9ydCcpO1xuXG5cbnZhciBDb250cm9sbGVyID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5WaWV3cG9ydC5waXBlKE1lbnUpO1xuVmlld3BvcnQucGlwZShMb2FkaW5nKTtcblZpZXdwb3J0LnBpcGUoUGxheWluZyk7XG5cbkVuZ2luZS5waXBlKENvbnRyb2xsZXIpO1xuTWVudS5waXBlKENvbnRyb2xsZXIpO1xuTG9hZGluZy5waXBlKENvbnRyb2xsZXIpO1xuXG5Db250cm9sbGVyLm9uKCdkb25lTG9hZGluZycsIGdvVG9NZW51KTtcbkNvbnRyb2xsZXIub24oJ25ld0dhbWUnLCBzdGFydEdhbWUpO1xuXG52YXIgYXNzZXRzID0gW1xuXHR7XG5cdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRzb3VyY2U6ICcuLi9Bc3NldHMvY3JhdGUuZ2lmJyxcblx0XHRkYXRhOiB7fVxuXHR9LFxuXHR7XG5cdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRzb3VyY2U6ICcuLi9Bc3NldHMvc3BhY2VzaGlwLnBuZycsXG5cdFx0ZGF0YToge31cblx0fSxcblx0e1xuXHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0c291cmNlOiAnLi4vQXNzZXRzL3NwYWNlMS5qcGcnLFxuXHRcdGRhdGE6IHt9XG5cdH0sXG5cdHtcblx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdHNvdXJjZTogJy4uL0Fzc2V0cy9lbmVteVNwcml0ZXMucG5nJyxcblx0XHRkYXRhOiB7fVxuXHR9LFxuXHR7XG5cdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRzb3VyY2U6ICcuLi9Bc3NldHMvQ2hhcmFjdGVyLnBuZycsXG5cdFx0ZGF0YToge31cblx0fSxcblx0e1xuXHRcdHR5cGU6ICdkYXRhJyxcblx0XHRzb3VyY2U6ICcuLi9TaGFkZXJzL0ZyYWdtZW50U2hhZGVyLmdsc2wnLFxuXHRcdGRhdGE6IHt9XG5cdH0sXG5cdHtcblx0XHR0eXBlOiAnZGF0YScsXG5cdFx0c291cmNlOiAnLi4vU2hhZGVycy9WZXJ0ZXhTaGFkZXIuZ2xzbCcsXG5cdFx0ZGF0YToge31cblx0fVxuXVxuXG5Mb2FkaW5nLnJlZ2lzdGVyKEltYWdlTG9hZGVyKTtcbkxvYWRpbmcucmVnaXN0ZXIoQWpheExvYWRlcik7XG5Mb2FkaW5nLmxvYWQoYXNzZXRzKTtcblxuRW5naW5lLnNldFN0YXRlKExvYWRpbmcpO1xuXG5mdW5jdGlvbiBnb1RvTWVudSgpXG57XG4gICAgRW5naW5lLnNldFN0YXRlKE1lbnUpO1xufVxuXG5mdW5jdGlvbiBzdGFydEdhbWUoKVxue1xuXHRFbmdpbmUuc2V0U3RhdGUoUGxheWluZyk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKVxue1xuICAgIEVuZ2luZS5zdGVwKCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufVxuXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7Il19
