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