uniform float currentAngle;
attribute float angle;
varying vec3 color;
vec3 kunpuColor = vec3(0.807, 0.905, 0.843);
vec3 aobaColor = vec3(0.294, 0.662, 0.196);

void main(void) {
    color = angle < currentAngle ? kunpuColor : aobaColor;
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}