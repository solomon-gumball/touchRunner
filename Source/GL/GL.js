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