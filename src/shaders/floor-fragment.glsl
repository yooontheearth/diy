uniform sampler2D floorTexSampler;

varying vec2 texCoord;

void main(void){
	vec4 floorColor = texture2D(floorTexSampler, texCoord);
	gl_FragColor = vec4(floorColor.rgb, 1.0);
}