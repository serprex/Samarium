const canvas = document.getElementById('canvas');
const pov = document.getElementById('pov');
const info = document.getElementById('info');
const keystate = {};
const pstate = { x: 0, y: 0, dir: 0, speed: 0, accel: 0, mass: 100 };
const circle = [];
for (let i = 0; i < 182; i++) {
	const r = (Math.PI * i) / 90;
	circle.push(
		500 + 100 * Math.cos(r),
		500 + 100 * Math.sin(r),
		500 + 300 * Math.cos(r),
		500 + 300 * Math.sin(r),
	);
}
// prettier-ignore
const roads = [
	circle,
	[
		-10, 0, 10, 0, 
		-10, 1000, 10, 1000,
		0, 1100, 20, 1100,
		0, 1150, 30, 1150,
		30, 1250, 40, 1200,
		30, 1250, 1000, 1200,
		1100, 1250, 1100, 1210,
		1150, 1250, 1150, 1220,
		1175, 1250, 1200, 1230,
		1150, 100, 1200, 100,
		1000, 90, 1100, 90,
		1000, 80, 1050, 80,
		900, 70, 1000, 70,
		800, 60, 900, 60,
		50, 60, 100, 60,
		-10, 0, 10, 0,
	],
];
const trees = [];
for (let i = 0; i < 20; i++) {
	trees.push(50, 50 * i, 100, 50 * i);
}
document.addEventListener('keyup', e => {
	if (e.key.startsWith('Arrow')) e.preventDefault();
	if (e.key == 'ArrowLeft') {
		keystate.left = false;
	} else if (e.key == 'ArrowRight') {
		keystate.right = false;
	} else if (e.key == 'ArrowUp') {
		keystate.up = false;
	} else if (e.key == 'ArrowDown') {
		keystate.down = false;
	} else {
		keystate[e.key] = false;
	}
});
document.addEventListener('keydown', e => {
	if (e.key.startsWith('Arrow')) e.preventDefault();
	if (e.key == 'ArrowLeft') {
		keystate.left = true;
	} else if (e.key == 'ArrowRight') {
		keystate.right = true;
	} else if (e.key == 'ArrowUp') {
		keystate.up = true;
	} else if (e.key == 'ArrowDown') {
		keystate.down = true;
	} else {
		keystate[e.key] = true;
	}
});
document.addEventListener('keypress', e => {
	if (e.key === '`') {
		canvas.style.display = canvas.style.display === 'none' ? '' : 'none';
	}
});

const ctx = canvas.getContext('2d');
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(1, -1);
const gl = pov.getContext('webgl');
function rotate(x, y) {
	return [
		(x - pstate.x) * Math.cos(Math.PI / 2 - pstate.dir) -
			(y - pstate.y) * Math.sin(Math.PI / 2 - pstate.dir),
		(x - pstate.x) * Math.sin(Math.PI / 2 - pstate.dir) +
			(y - pstate.y) * Math.cos(Math.PI / 2 - pstate.dir),
	];
}

const VertexCode =
	'attribute vec3 colors;attribute vec3 coordinates;varying lowp vec3 vColor;void main(void){gl_Position = vec4(coordinates, coordinates.z);vColor=colors;}';
const vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, VertexCode);
gl.compileShader(vertShader);

const FragmentCode =
	'varying lowp vec3 vColor;void main(void){gl_FragColor = vec4(vColor,1.0);}';
const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, FragmentCode);
gl.compileShader(fragShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

gl.clearColor(0, 0, 0, 1);
gl.viewport(0, 0, pov.width, pov.height);

const coord = gl.getAttribLocation(shaderProgram, 'coordinates');
const color = gl.getAttribLocation(shaderProgram, 'colors');
gl.enableVertexAttribArray(coord);
gl.enableVertexAttribArray(color);

const vertexBuffer = gl.createBuffer();
const indexBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();

function render() {
	if (canvas.style.display != 'none') {
		ctx.clearRect(-400, -300, 800, 600);
		ctx.strokeStyle = '#000';
		ctx.beginPath();
		ctx.moveTo(0, 20 - canvas.height / 2);
		ctx.lineTo(
			10 * (keystate.right | 0) - 10 * (keystate.left | 0),
			30 - canvas.height / 2,
		);
		ctx.moveTo(0, 0);
		ctx.lineTo(10 * Math.cos(pstate.dir), 10 * Math.sin(pstate.dir));
		ctx.stroke();
		ctx.beginPath();
		for (const road of roads) {
			const [r0, r1] = rotate(road[0], road[1]);
			ctx.moveTo(r0, r1);
			for (let i = 2; i < road.length; i += 2) {
				const [ri0, ri1] = rotate(road[i + 0], road[i + 1]);
				ctx.lineTo(ri0, ri1);
				ctx.stroke();
			}
		}
		for (let i = 0; i < trees.length; i += 2) {
			ctx.fillStyle = '#080';
			const [tx, ty] = rotate(trees[i + 0], trees[i + 1]);
			ctx.fillRect(tx - 2, ty - 2, 5, 5);
		}
	}
	const vertices = [],
		colors = [],
		indices = [];
	let vl = 0;
	for (const road of roads) {
		for (let i = 0; i < road.length; i += 4) {
			const [ri0, ri1] = rotate(road[i + 0], road[i + 1]);
			const [ri2, ri3] = rotate(road[i + 2], road[i + 3]);
			const [ri4, ri5] = rotate(road[i + 4], road[i + 5]);
			const [ri6, ri7] = rotate(road[i + 6], road[i + 7]);
			vertices.push(ri0, -1, ri1);
			vertices.push(ri2, -1, ri3);
			vertices.push(ri4, -1, ri5);
			vertices.push(ri6, -1, ri7);
			if (i & 8) {
				colors.push(0, 1, 1);
				colors.push(0, 1, 1);
				colors.push(0, 1, 1);
				colors.push(0, 1, 1);
			} else {
				colors.push(1, 0, 1);
				colors.push(1, 0, 1);
				colors.push(1, 0, 1);
				colors.push(1, 0, 1);
			}
			vl += 4;
			if (i > 0) {
				indices.push(vl - 4, vl - 3, vl - 2);
				indices.push(vl - 3, vl - 2, vl - 1);
			}
		}
	}
	for (let i = 0; i < trees.length; i += 2) {
		const [tx, ty] = rotate(trees[i + 0], trees[i + 1]);
		vertices.push(tx - 1 + Math.random() * 2, -4, ty - 1 + Math.random() * 2);
		vertices.push(tx - 1 + Math.random() * 2, 16, ty - 1 + Math.random() * 2);
		vertices.push(tx - 1 + Math.random() * 2, 0, ty - 1 + Math.random() * 2);
		colors.push(0, 0.5, 0);
		colors.push(0, 0.5, 0);
		colors.push(0, 0.5, 0);
		vl += 3;
		indices.push(vl - 3, vl - 2, vl - 1);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(
		gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(indices),
		gl.DYNAMIC_DRAW,
	);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

	info.textContent = `${pstate.x.toFixed(2)} ${pstate.y.toFixed(2)} ${(
		pstate.dir * 180
	).toFixed(2)} ${pstate.speed.toFixed(2)} ${pstate.accel.toFixed(2)} ${vl}`;
	requestAnimationFrame(render);
}

requestAnimationFrame(render);
setInterval(() => {
	if (keystate.up) {
		pstate.accel = 5 / 60;
	} else if (keystate.down) {
		pstate.accel = -3 / 60;
	} else {
		pstate.accel = 0;
	}
	if (pstate.speed > 0) {
		pstate.accel = Math.max(pstate.accel - 1 / 60, -pstate.speed);
	}
	if (pstate.speed < 0) {
		pstate.accel = Math.min(pstate.accel + 1 / 60, -pstate.speed);
	}
	pstate.speed += pstate.accel;
	if (pstate.speed > 1) pstate.speed = 1;
	if (pstate.speed < -0.5) pstate.speed = -0.5;
	if (pstate.speed > 0.2 || pstate.speed < -0.2) {
		if (keystate.left) {
			pstate.dir += Math.PI / 108;
		}
		if (keystate.right) {
			pstate.dir -= Math.PI / 108;
		}
	}
	const dx = Math.cos(pstate.dir) * pstate.speed;
	const dy = Math.sin(pstate.dir) * pstate.speed;
	pstate.x += dx;
	pstate.y += dy;
}, 15);
