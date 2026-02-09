import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FlameShader() {
  const meshRef = useRef(null);

  const material = useRef(null);

  useEffect(() => {
    const uniforms = {
      iTime: { value: 0 },
      iResolution: {
        value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1),
      },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float iTime;
        uniform vec3 iResolution;

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
          vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
          a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
          a.xy = mix(a.xz, a.yw, f.y);
          return mix(a.x, a.y, f.z);
        }

        float sphere(vec3 p, vec4 spr) {
          return length(spr.xyz-p) - spr.w;
        }

        float flame(vec3 p) {
          float d = sphere(p*vec3(1.,.5,1.), vec4(.0,-1.,.0,1.));
          return d + (noise(p+vec3(.0,iTime*2.,.0)) 
                  + noise(p*3.)*.5)*.25*(p.y) ;
        }

        float scene(vec3 p) {
          return min(100.-length(p) , abs(flame(p)) );
        }

        vec4 raymarch(vec3 org, vec3 dir) {
          float d = 0.0, glow = 0.0, eps = 0.02;
          vec3 p = org;
          bool glowed = false;

          for(int i=0; i<64; i++) {
            d = scene(p) + eps;
            p += d * dir;
            if( d>eps ) {
              if(flame(p) < .0) glowed=true;
              if(glowed) glow = float(i)/64.;
            }
          }
          return vec4(p,glow);
        }

        void main() {
          vec2 fragCoord = gl_FragCoord.xy;
          vec2 v = -1.0 + 2.0 * fragCoord.xy / iResolution.xy;
          v.x *= iResolution.x/iResolution.y;

          vec3 org = vec3(0., -2., 4.);
          vec3 dir = normalize(vec3(v.x*1.6, -v.y, -1.5));

          vec4 p = raymarch(org, dir);
          float glow = p.w;

          vec4 col = mix(
            vec4(1.,.5,.1,1.),
            vec4(0.1,.5,1.,1.),
            p.y*.02+.4
          );

          gl_FragColor = mix(vec4(0.), col, pow(glow*2.,4.));
        }
      `,
    });

    material.current = shaderMaterial;

    if (meshRef.current) {
      meshRef.current.material = shaderMaterial;
    }

    const handleResize = () => {
      if (material.current) {
        material.current.uniforms.iResolution.value.set(
          window.innerWidth,
          window.innerHeight,
          1
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.iTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={(m) => {
          if (m && material.current) {
            m.uniforms = material.current.uniforms;
            m.vertexShader = material.current.vertexShader;
            m.fragmentShader = material.current.fragmentShader;
          }
        }}
      />
    </mesh>
  );
}

export function FlameEffect() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '600px',
        height: '600px',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas camera={{ position: [0, 0, 1], far: 1000 }}>
        <FlameShader />
      </Canvas>
    </div>
  );
}
