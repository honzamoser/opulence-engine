function getDivisor(t: string) {
    switch (t) {
        case "Float64Array": return 8;
        case "Float32Array": return 4;
        case "Uint32Array": return 4;
        case "Int32Array": return 4;
        case "Uint16Array": return 2;
        case "Int16Array": return 2;
        case "Uint8Array": return 1;
        case "Int8Array": return 1;
        default: return 4;
    }
}

export function typedArray(c, p) {
    return `   static get ${p.name}() {
        return ${c.name}.v${p.type.split("[]")[0]}.subarray(${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}, ${p.offset / getDivisor(p) + p.byteLength / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)})
    } 

    static set ${p.name}(v: ${p.jsType}) {
            ${(() => {
            if (p.length && p.length < 8) {
                let x = "";
                for (let i = 0; i < p.length!; i++) {
                    x += `${c.name}.v${p.type.split("[]")[0]}[${p.offset / getDivisor(p) + i} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}] = v[${i}]\n`
                }

                return x;
            } else {
                return `${c.name}.v${p.type.split("[]")[0]}.set(v, ${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)})\n`
            }
        })()}
        }

    static cpy_${p.name}(out: ${p.jsType}) {
         ${(() => {
            if (p.length && p.length < 8) {
                let x = "";
                for (let i = 0; i < p.length!; i++) {
                    x += ` out[${i}] = ${c.name}.v${p.type.split("[]")[0]}[${p.offset / getDivisor(p) + i} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}]\n`
                }

                return x;
            } else {
                return `out.set(${c.name}.v${p.type.split("[]")[0]}.subarray(${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}, ${p.offset / getDivisor(p) + p.byteLength / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}))\n`
            }

        })()}
    }`
}

