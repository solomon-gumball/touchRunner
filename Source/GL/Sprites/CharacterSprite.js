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