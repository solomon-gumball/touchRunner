attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec2 uSpriteCoord;
uniform float uSpriteRot;
uniform float uResolution;
uniform int uDrawState;

varying vec2 vTextureCoord;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vec2 origin = vec2(0.5, 0.5);
    vec2 adjustedCoords = vec2(aTextureCoord.x, aTextureCoord.y);
    float newX;
    float newY;
    if(uDrawState == 0){
    	// adjustedCoords = vec2(adjustedCoords.x, adjustedCoords.y * uResolution);
	    newX = origin.x + (adjustedCoords.x - origin.x) * cos(uSpriteRot) - (adjustedCoords.y - origin.y) * -sin(uSpriteRot);
	    newY = origin.y + (adjustedCoords.x - origin.x) * -sin(uSpriteRot) + (adjustedCoords.y - origin.y) * cos(uSpriteRot);
    	adjustedCoords = vec2(newX, newY);
    }

    vTextureCoord = adjustedCoords + uSpriteCoord;
}