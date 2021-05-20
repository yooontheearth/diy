uniform float time;
uniform bool isSelected;
varying vec4 color;

void main(void) {
	color = gl_Color;
	if(isSelected){
		color.r = 0.8;
		color.g = 0.4;
		color.b = 0.1;
	}
	vec3 waved = gl_Vertex.xyz + gl_Vertex.xyz * (sin(radians(time * 100.0)) * 0.05);
    gl_Position = gl_ModelViewProjectionMatrix * vec4(waved, 1.0);
}