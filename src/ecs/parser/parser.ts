const _input = `
RigidbodyComponent:
position: Vec3;
rotation: Vec3;
scale: Vec3;
matrix: Mat4;
name: &char[];
`

lexicalize(_input)

function lexicalize(input: string) {
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        console.log(char, char.charCodeAt(0));
    }
}