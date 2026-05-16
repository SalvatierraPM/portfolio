import {hash12, cnoise4} from './glslNoise.js';
import {PI} from './glslUtils.js';

// Position Target - TEXT "MAWHI"
function createPosTargetShader() {
    return `
        ${PI}
        ${hash12}

        uniform float time;

        // Simple SDF for a character at position offset (BIGGER and THICKER)
        float sdChar(vec2 p, float charIndex, vec2 offset) {
            p -= offset;
            float d = 1e10;
            float thickness = 8.0; // Increased from 3.0 to 8.0

            // M
            if (charIndex < 0.5) {
                // Left vertical
                d = min(d, length(p - clamp(p, vec2(-40.0, -60.0), vec2(-40.0, 60.0))) - thickness);
                // Right vertical
                d = min(d, length(p - clamp(p, vec2(40.0, -60.0), vec2(40.0, 60.0))) - thickness);
                // Left diagonal
                vec2 a = vec2(-40.0, 60.0);
                vec2 b = vec2(0.0, 0.0);
                vec2 pa = p - a;
                vec2 ba = b - a;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Right diagonal
                a = vec2(0.0, 0.0);
                b = vec2(40.0, 60.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
            }
            // A
            else if (charIndex < 1.5) {
                // Left diagonal
                vec2 a = vec2(-40.0, -60.0);
                vec2 b = vec2(0.0, 60.0);
                vec2 pa = p - a;
                vec2 ba = b - a;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Right diagonal
                a = vec2(0.0, 60.0);
                b = vec2(40.0, -60.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Crossbar
                a = vec2(-20.0, 0.0);
                b = vec2(20.0, 0.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
            }
            // W
            else if (charIndex < 2.5) {
                // Left vertical
                d = min(d, length(p - clamp(p, vec2(-50.0, 60.0), vec2(-50.0, -30.0))) - thickness);
                // Right vertical
                d = min(d, length(p - clamp(p, vec2(50.0, 60.0), vec2(50.0, -30.0))) - thickness);
                // Left diagonal down
                vec2 a = vec2(-50.0, -30.0);
                vec2 b = vec2(-15.0, -60.0);
                vec2 pa = p - a;
                vec2 ba = b - a;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Middle up
                a = vec2(-15.0, -60.0);
                b = vec2(0.0, -30.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Middle down
                a = vec2(0.0, -30.0);
                b = vec2(15.0, -60.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Right diagonal up
                a = vec2(15.0, -60.0);
                b = vec2(50.0, -30.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
            }
            // H
            else if (charIndex < 3.5) {
                // Left vertical
                d = min(d, length(p - clamp(p, vec2(-35.0, -60.0), vec2(-35.0, 60.0))) - thickness);
                // Right vertical
                d = min(d, length(p - clamp(p, vec2(35.0, -60.0), vec2(35.0, 60.0))) - thickness);
                // Crossbar
                vec2 a = vec2(-35.0, 0.0);
                vec2 b = vec2(35.0, 0.0);
                vec2 pa = p - a;
                vec2 ba = b - a;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
            }
            // I
            else {
                // Vertical line
                d = min(d, length(p - clamp(p, vec2(0.0, -60.0), vec2(0.0, 60.0))) - thickness);
                // Top bar
                vec2 a = vec2(-20.0, 60.0);
                vec2 b = vec2(20.0, 60.0);
                vec2 pa = p - a;
                vec2 ba = b - a;
                float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
                // Bottom bar
                a = vec2(-20.0, -60.0);
                b = vec2(20.0, -60.0);
                pa = p - a;
                ba = b - a;
                h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d = min(d, length(pa - ba * h) - thickness);
            }

            return d;
        }

        void main() {
            float nPoints = resolution.x * resolution.y;
            float i = (gl_FragCoord.y * resolution.x) + gl_FragCoord.x;
            vec2 uv = gl_FragCoord.xy / resolution.xy;

            vec3 pos = vec3(0.0);

            // Assign particle: 50% to text, 50% to mini shapes
            float particleHash = hash12(vec2(i * 0.001, i * 0.002));
            float shapeChoice = floor(particleHash * 10.0); // 0-9

            // 0-4: Text letters (M,A,W,H,I)
            // 5: Circle, 6: Triangle, 7: Square, 8: Hexagon, 9: Bubble
            float letterIndex = shapeChoice; // For text letters

            // Random values
            float localHash = fract(particleHash * 10.0);
            float angle = localHash * PI * 2.0;
            float depthHash = hash12(vec2(i * 0.543, i * 0.987));
            float zDepth = (depthHash - 0.5) * 60.0;

            vec2 p;

            // TEXT LETTERS (shapeChoice 0-4)
            if (shapeChoice < 5.0) {
                float radius = hash12(vec2(i * 0.789, i * 0.234)) * 70.0;
                vec2 offset;
                if (letterIndex < 0.5) {
                    offset = vec2(-240.0, 0.0); // M
                } else if (letterIndex < 1.5) {
                    offset = vec2(-120.0, 0.0); // A
                } else if (letterIndex < 2.5) {
                    offset = vec2(0.0, 0.0); // W
                } else if (letterIndex < 3.5) {
                    offset = vec2(130.0, 0.0); // H
                } else {
                    offset = vec2(210.0, 0.0); // I
                }

                p = offset + vec2(cos(angle) * radius, sin(angle) * radius);
                float d = sdChar(p, letterIndex, offset);
                if (d > 0.0) {
                    float eps = 1.0;
                    float dx = sdChar(p + vec2(eps, 0.0), letterIndex, offset) - sdChar(p - vec2(eps, 0.0), letterIndex, offset);
                    float dy = sdChar(p + vec2(0.0, eps), letterIndex, offset) - sdChar(p - vec2(0.0, eps), letterIndex, offset);
                    vec2 gradient = normalize(vec2(dx, dy));
                    p -= gradient * d;
                }
            }
            // MINI SHAPES around the text
            else {
                float miniSize = 30.0; // Small shapes
                vec2 shapeCenter;

                // Position shapes around the text
                if (shapeChoice < 5.5) { // Circle - top left
                    shapeCenter = vec2(-200.0, 150.0);
                    float r = miniSize + hash12(vec2(i * 0.321, i)) * 10.0;
                    p = shapeCenter + vec2(cos(angle) * r, sin(angle) * r);
                }
                else if (shapeChoice < 6.5) { // Triangle - top right
                    shapeCenter = vec2(200.0, 150.0);
                    float t = localHash;
                    vec2 v1 = vec2(0.0, 1.0) * miniSize;
                    vec2 v2 = vec2(-0.866, -0.5) * miniSize;
                    vec2 v3 = vec2(0.866, -0.5) * miniSize;
                    if (t < 0.33) p = shapeCenter + mix(v1, v2, t / 0.33);
                    else if (t < 0.66) p = shapeCenter + mix(v2, v3, (t - 0.33) / 0.33);
                    else p = shapeCenter + mix(v3, v1, (t - 0.66) / 0.34);
                }
                else if (shapeChoice < 7.5) { // Square - bottom left
                    shapeCenter = vec2(-200.0, -150.0);
                    float t = localHash;
                    vec2 v1 = vec2(-1.0, 1.0) * miniSize;
                    vec2 v2 = vec2(1.0, 1.0) * miniSize;
                    vec2 v3 = vec2(1.0, -1.0) * miniSize;
                    vec2 v4 = vec2(-1.0, -1.0) * miniSize;
                    if (t < 0.25) p = shapeCenter + mix(v1, v2, t / 0.25);
                    else if (t < 0.5) p = shapeCenter + mix(v2, v3, (t - 0.25) / 0.25);
                    else if (t < 0.75) p = shapeCenter + mix(v3, v4, (t - 0.5) / 0.25);
                    else p = shapeCenter + mix(v4, v1, (t - 0.75) / 0.25);
                }
                else if (shapeChoice < 8.5) { // Hexagon - bottom right
                    shapeCenter = vec2(200.0, -150.0);
                    float t = localHash;
                    float angleOffset = PI / 6.0;
                    float hexAngle = angleOffset + t * PI * 2.0;
                    p = shapeCenter + vec2(cos(hexAngle), sin(hexAngle)) * miniSize;
                }
                else { // Bubble - center
                    shapeCenter = vec2(0.0, -200.0);
                    float theta = acos(2.0 * localHash - 1.0);
                    float phi = localHash * PI * 2.0;
                    vec3 spherePos = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
                    p = shapeCenter + spherePos.xy * miniSize * 0.8;
                    zDepth = spherePos.z * miniSize * 0.8;
                }
            }

            pos.xy = p;
            pos.z = zDepth;

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
            float s = .12; // Increased from .05 to .12 for more organic movement

            turb.x = cnoise(vec4(p.xyz * 0.006 + n * 35.4, t));
            turb.y = cnoise(vec4(p.xyz * 0.007 + n * 32.3, t));
            turb.z = cnoise(vec4(p.xyz * 0.006 + n * 43.3, t));
            turb *= pow(cnoise(vec4(p.xyz * 0.01, time * 0.0003)), 3.0) * s * 20.0;

            // Entanglement coupling
            if (syncIntensity > 0.01) {
                turb *= (1.0 + syncIntensity * 0.4); // Increased from 0.3 to 0.4
            }

            a += turb * 0.6; // Increased from 0.3 to 0.6 for more turbulence influence

            // Pull back to target position (balanced)
            vec3 back = tar.xyz - p.xyz;
            back *= ((1.0 + pow(cnoise(vec4(tar.xyz * 0.002, time * 0.0001) ), 1.0)) / 2.0) * 0.006; // Reduced from 0.008 to 0.006 to allow more freedom
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
