uniform bool isSelected;
varying vec3 LightIntensity;

void main(void) {
    gl_FragColor = vec4(LightIntensity, isSelected ? 0.8 : 1.0);
}