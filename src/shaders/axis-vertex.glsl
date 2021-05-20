attribute float matIndex;
varying vec3 LightIntensity;

struct MaterialInfo {
  vec3 Ka;            // Ambient reflectivity
  vec3 Kd;            // Diffuse reflectivity
  vec3 Ks;            // Specular reflectivity
  float Shininess;    // Specular shininess factor
};
uniform MaterialInfo Material[4];

void main(void) {
    vec3 ambientMaterial = Material[int(matIndex)].Ka * 0.2;    // MEMO : ambient 1.0 is too strong, so make it less
    vec3 ambient = ambientMaterial;
    vec3 diffuse = Material[int(matIndex)].Kd ;

    LightIntensity = ambient + diffuse;
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}