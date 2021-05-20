
attribute float selectedPoint;
uniform vec2 windowSize;
varying vec2 screenPos;
varying float radius;

void main() {
  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
  gl_PointSize = selectedPoint > 0.5 ? 20.0 : 10.0;

  // Convert position to window coordinates
  vec2 halfsize = vec2(windowSize.x, windowSize.y) * 0.5;
  screenPos = halfsize + ((gl_Position.xy / gl_Position.w) * halfsize);

  // Convert radius to window coordinates
  radius = gl_PointSize * 0.5;
}