import {hash12, cnoise4, cnoise3} from './glslNoise.js';
import {PI} from './glslUtils.js';

// Position Target - MULTIPLE MOVING BUBBLES
function createPosTargetShader() {
    return `
        ${PI}
        ${hash12}
        ${cnoise3}

        uniform float time;

        void main() {
            float nPoints = resolution.x * resolution.y;
            float i = (gl_FragCoord.y * resolution.x) + gl_FragCoord.x;
            vec2 uv = gl_FragCoord.xy / resolution.xy;

            vec3 pos = vec3(0.0);

            // Assign each particle to a bubble (4 bubbles for clearer shapes)
            float particleHash = hash12(vec2(i * 0.001, i * 0.002));
            float numBubbles = 4.0;
            float bubbleId = floor(particleHash * numBubbles);

            // Time-based movement
            float t = time * 0.0001;
            float bubbleTime = t + bubbleId * 123.456;

            // Each bubble has its own motion pattern
            vec3 bubbleCenter;
            float bubbleSize;

            // Bubble center moves in 3D space with noise (slower, smoother movement)
            float bx = cnoise(vec3(bubbleId * 10.0, bubbleTime * 0.3, 0.0)) * 100.0;
            float by = cnoise(vec3(bubbleId * 10.0 + 50.0, bubbleTime * 0.3, 0.0)) * 100.0;
            float bz = cnoise(vec3(bubbleId * 10.0 + 100.0, bubbleTime * 0.3, 0.0)) * 80.0;
            bubbleCenter = vec3(bx, by, bz);

            // Bubble size oscillates over time (more stable size)
            float sizeNoise = cnoise(vec3(bubbleId * 5.0, bubbleTime * 0.4, 100.0));
            bubbleSize = 45.0 + sizeNoise * 15.0 + sin(bubbleTime * 1.5 + bubbleId) * 10.0;

            // Distribute particles on bubble surface
            float localT = fract(particleHash * numBubbles); // 0-1 within this bubble
            float phi = localT * PI * 2.0;
            float theta = acos(2.0 * localT - 1.0); // Uniform distribution

            // Base sphere position
            vec3 spherePos = vec3(
                sin(theta) * cos(phi),
                sin(theta) * sin(phi),
                cos(theta)
            );

            // Subtle organic deformation (less extreme)
            float deform = cnoise(spherePos * 0.8 + vec3(t * 0.2, bubbleId * 10.0, 0.0));
            deform = deform * 0.15 + 1.0; // Range: 0.85 to 1.15 (subtle)

            // Very subtle detail noise
            float n1 = hash12(vec2(i * 0.0234, bubbleId));
            float detail = cnoise(spherePos * 2.0 + vec3(t * 0.3, n1 * 20.0, bubbleId * 5.0));
            deform += detail * 0.08;

            // Apply deformation to radius
            float finalRad = bubbleSize * deform;

            // Position on bubble surface
            vec3 bubblePos = spherePos * finalRad;

            // Add to bubble center
            pos = bubbleCenter + bubblePos;

            gl_FragColor = vec4(pos, 1.0);
        }
    `;
}

// Acceleration - Same as original with entanglement
function createAccShader() {
    return `
        ${PI}
        ${cnoise4}
        ${hash12}

        uniform float time;
        uniform float syncIntensity;

        void main() {
            float nPoints = resolution.x * resolution.y;
            float i = (gl_FragCoord.y * resolution.x) + gl_FragCoord.x;
            vec2 uv = gl_FragCoord.xy / resolution.xy;

            vec3 a = vec3(0.0);
            vec4 p = texture2D(pos, uv);
            vec4 tar = texture2D(posTarget, uv);

            vec3 turb;
            float t = time * 0.0001;
            float n = hash12(uv * 0.02 + i);
            float s = .2;

            turb.x = cnoise(vec4(p.xyz * 0.006 + n * 35.4, t));
            turb.y = cnoise(vec4(p.xyz * 0.007 + n * 32.3, t));
            turb.z = cnoise(vec4(p.xyz * 0.006 + n * 43.3, t));
            turb *= pow(cnoise(vec4(p.xyz * 0.01, time * 0.0003)), 3.0) * s * 20.0;

            // Entanglement coupling
            if (syncIntensity > 0.01) {
                turb *= (1.0 + syncIntensity * 0.5);
            }

            a += turb;

            vec3 back = tar.xyz - p.xyz;
            back *= ((1.0 + pow(cnoise(vec4(tar.xyz * 0.002, time * 0.0001) ), 1.0)) / 2.0) * 0.003;
            a += back;

            vec3 collect;
            collect = p.xyz * -.0003;

            gl_FragColor = vec4(a, 1.0);
        }
    `;
}

// Velocity - Same as original
function createVelShader() {
    return `
        ${PI}

        uniform float time;

        void main() {
            float nPoints = resolution.x * resolution.y;
            float i = (gl_FragCoord.y * resolution.x) + gl_FragCoord.x;
            vec2 uv = gl_FragCoord.xy / resolution.xy;

            vec4 a = texture2D(acc, uv);
            vec4 v = texture2D(vel, uv);
            v += a;
            v *= .97;

            gl_FragColor = vec4(v.xyz, 1.0);
        }
    `;
}

// Position - Same as original
function createPosShader() {
    return `
        ${PI}

        uniform float time;
        uniform int frame;

        void main() {
            float nPoints = resolution.x * resolution.y;
            float i = (gl_FragCoord.y * resolution.x) + gl_FragCoord.x;
            vec2 uv = gl_FragCoord.xy / resolution.xy;

            vec4 p;

            if (frame < 2) {
                p = texture2D(posTarget, uv);
            } else {
                p = texture2D(pos, uv);
                p += texture2D(vel, uv);
            }

            gl_FragColor = vec4(p.xyz, 1.0);
        }
    `;
}

export {createPosTargetShader, createAccShader, createVelShader, createPosShader};
