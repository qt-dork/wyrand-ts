import WyRand from "./src/wyrand.js";

// setTimeout(() => {
//   let wyrand = new WyRand(25, 0);

//   let [out1, out2] = wyrand.next64();
//   console.log([out1, out2]);
// }, 5000);

let wyrand = new WyRand(0x12345678, 0x87654321);

for (let i = 0; i < 10000; i++) {
  const out = wyrand.fastNext32();
  console.log(out);
}

