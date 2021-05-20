uniform bool isSelected;
uniform bool isPreSelected;
uniform bool isSnapBase;
varying vec3 LightIntensity;

struct LightInfo {
  vec3 Position; // Light position in eye coords.
  vec3 La;       // Ambient light intensity
  vec3 Ld;       // Diffuse light intensity
  vec3 Ls;       // Specular light intensity
};
uniform LightInfo Light;

struct MaterialInfo {
  vec3 Ka;            // Ambient reflectivity
  vec3 Kd;            // Diffuse reflectivity
  vec3 Ks;            // Specular reflectivity
  float Shininess;    // Specular shininess factor
};
uniform MaterialInfo Material;

void main(void) {
    vec3 tnorm = normalize(gl_NormalMatrix * gl_Normal);
    vec4 eyeCoords = gl_ModelViewMatrix * gl_Vertex;
    vec3 s = normalize(Light.Position - vec3(eyeCoords));
    vec3 v = normalize(-eyeCoords.xyz);
    vec3 r = reflect( -s, tnorm );
    float sDotN = max( dot(s,tnorm), 0.0 );
    vec3 ambientMaterial;
    if(isSnapBase){
        ambientMaterial = vec3(0.270, 0.945, 0.968);
    }
    else if(isSelected){
        ambientMaterial = vec3(0.0, 0.0, 1.0);
    }
    else if(isPreSelected){
        ambientMaterial = vec3(0.254, 1, 0.219);
    }
    else{
        ambientMaterial = Material.Ka;
    }
    vec3 ambient = Light.La * ambientMaterial;
    vec3 diffuse = Light.Ld * Material.Kd * sDotN;
    vec3 spec = vec3(0.0);
    if( sDotN > 0.0 )
       spec = Light.Ls * Material.Ks *
              pow( max( dot(r,v), 0.0 ), Material.Shininess );

    LightIntensity = ambient + diffuse + spec;
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}