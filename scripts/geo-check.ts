import { parseLocation } from "../src/lib/geo";

const cases: [string, { latitude: number; longitude: number } | null][] = [
  ["-6.2,106.8", { latitude: -6.2, longitude: 106.8 }],
  [" -6.2, 106.8 ", { latitude: -6.2, longitude: 106.8 }],
  ["https://www.google.com/maps/@-6.2008,106.8456,17z", { latitude: -6.2008, longitude: 106.8456 }],
  ["https://www.google.com/maps/place/Jakarta/@-6.1754,106.8272,12z", { latitude: -6.1754, longitude: 106.8272 }],
  ["https://www.google.com/maps?q=-6.2,106.8", { latitude: -6.2, longitude: 106.8 }],
  ["https://www.google.com/maps?ll=-6.2,106.8", { latitude: -6.2, longitude: 106.8 }],
  ["https://maps.app.goo.gl/abc123", null],
  ["https://example.com/@-6.2,106.8", null],
  ["bukan link", null],
  ["", null],
  ["999,106", null],
  ["-6.2,999", null],
];

for (const [input, expected] of cases) {
  const got = parseLocation(input)?.coords ?? null;
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    console.error("FAIL:", JSON.stringify(input), "got", got, "expected", expected);
    process.exit(1);
  }
}
console.log("geo-check OK");
