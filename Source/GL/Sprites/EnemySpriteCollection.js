
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