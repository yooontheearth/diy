varying vec2 screenPos;
varying float radius;

void main() {
  if( distance(gl_FragCoord.xy, screenPos) > radius )
    discard;
  gl_FragData[0] = vec4(1.0, 0.9, 0.3, 0.9);
}