// Draws the app's icons (public/) from the logo of src/components/Logo.tsx:
// a rounded square with a check mark, in the default theme's colors.
// No dependency: the shapes are drawn with distance functions, antialiased by
// supersampling, and the PNGs encoded with Node's zlib.
// Run after changing the logo or its colors: pnpm --filter www icons
import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";

// Stationery's --primary and --primary-foreground (packages/themes)
const PRIMARY = [0xb4, 0x45, 0x1f];
const FOREGROUND = [0xff, 0xfd, 0xf8];

// The logo, in its 24 × 24 viewBox
const VIEWBOX = 24;
const CORNER_RADIUS = 6;
const CHECK = [
	[7, 12.5],
	[10.2, 15.7],
	[17, 8.8],
];
const CHECK_HALF_WIDTH = 1.2;
const SAMPLES = 4;

function insideRoundedSquare(x, y) {
	const r = CORNER_RADIUS;
	const dx = Math.max(r - x, 0, x - (VIEWBOX - r));
	const dy = Math.max(r - y, 0, y - (VIEWBOX - r));
	return dx * dx + dy * dy <= r * r;
}

function distanceToSegment(x, y, [ax, ay], [bx, by]) {
	const t = Math.max(
		0,
		Math.min(
			1,
			((x - ax) * (bx - ax) + (y - ay) * (by - ay)) /
				((bx - ax) ** 2 + (by - ay) ** 2),
		),
	);
	return Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay)));
}

function onCheck(x, y) {
	return (
		Math.min(
			distanceToSegment(x, y, CHECK[0], CHECK[1]),
			distanceToSegment(x, y, CHECK[1], CHECK[2]),
		) <= CHECK_HALF_WIDTH
	);
}

/**
 * RGBA pixels of the icon. `fullBleed`: the background fills the whole
 * square, for icons the system crops itself (maskable, Apple).
 */
function draw(size, fullBleed) {
	const pixels = Buffer.alloc(size * size * 4);
	const scale = VIEWBOX / size;
	for (let py = 0; py < size; py++) {
		for (let px = 0; px < size; px++) {
			let background = 0;
			let check = 0;
			for (let sy = 0; sy < SAMPLES; sy++) {
				for (let sx = 0; sx < SAMPLES; sx++) {
					const x = (px + (sx + 0.5) / SAMPLES) * scale;
					const y = (py + (sy + 0.5) / SAMPLES) * scale;
					if (onCheck(x, y)) {
						check++;
					} else if (fullBleed || insideRoundedSquare(x, y)) {
						background++;
					}
				}
			}
			const total = SAMPLES * SAMPLES;
			const alpha = (background + check) / total;
			const offset = (py * size + px) * 4;
			for (let channel = 0; channel < 3; channel++) {
				const color =
					alpha === 0
						? 0
						: (PRIMARY[channel] * background + FOREGROUND[channel] * check) /
							(background + check);
				pixels[offset + channel] = Math.round(color);
			}
			pixels[offset + 3] = Math.round(alpha * 255);
		}
	}
	return pixels;
}

function chunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));
	return Buffer.concat([length, body, crc]);
}

function png(size, pixels) {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(size, 0);
	header.writeUInt32BE(size, 4);
	header[8] = 8; // bits per channel
	header[9] = 6; // RGBA
	// Each row starts with its filter type: 0, none
	const rows = Buffer.alloc(size * (size * 4 + 1));
	for (let y = 0; y < size; y++) {
		pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
	}
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(rows, { level: 9 })),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

const hex = (rgb) =>
	`#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
const [[x1, y1], [x2, y2], [x3, y3]] = CHECK;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}"><title>Checkit</title><rect width="${VIEWBOX}" height="${VIEWBOX}" rx="${CORNER_RADIUS}" fill="${hex(PRIMARY)}"/><path d="M${x1} ${y1} ${x2} ${y2} ${x3} ${y3}" fill="none" stroke="${hex(FOREGROUND)}" stroke-width="${CHECK_HALF_WIDTH * 2}" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`;

const outputs = [
	["icon-192.png", 192, false],
	["icon-512.png", 512, false],
	["icon-maskable-512.png", 512, true],
	["apple-touch-icon.png", 180, true],
];
const publicDir = new URL("../public/", import.meta.url);
writeFileSync(new URL("favicon.svg", publicDir), svg);
for (const [name, size, fullBleed] of outputs) {
	writeFileSync(new URL(name, publicDir), png(size, draw(size, fullBleed)));
}
console.log(`Icons written to ${publicDir.pathname}`);
