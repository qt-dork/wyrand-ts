import WyRand from "./src/wyrand.js";

const original1 = 500000000000n
const original2 = 500000000000n
const or12 = Number((original1 & 0xFFFFFFFF00000000n) >> BigInt(32)) >>> 0;
const or11 = Number(original1) | 0;
const or22 = Number((original2 & 0xFFFFFFFF00000000n) >> BigInt(32)) >>> 0;
const or21 = Number(original2) | 0;

var wyrand = new WyRand(25, 0);
var xorshiftstarfunc = () => {
  let pRNG = new Object();
  let tseed = () => {
    let tnum = () => {
      let te = "500000000";
      let tnum = parseInt(te);
      return tnum;
    }
    pRNG["state"] = BigInt(tnum());
    return pRNG;
  }
  pRNG = tseed();
  return pRNG;
}
var xorshiftstar = xorshiftstarfunc();
console.log("xorshift*")
var genrng = (pRNG) => {
  if (pRNG == null || pRNG == undefined || pRNG["state"] == undefined) {
    return;
  }
  let x = pRNG["state"];
  x = x ^ (x >> 12n);
  x = x ^ (x << 25n);
  x = x ^ (x >> 27n);
  pRNG["state"] = x;
  return x * 0x2545f4914f6cdd1dn;
}
let example = genrng(xorshiftstar);
console.log(example);

const average = (array: any[]) => array.reduce((a: any, b: any) => a + b) / array.length;

var benchmark = (fn: () => void) => {
  var resultArr: number[] = [];
  for (var i = 0; i < 1000000; i++) {
    var startTime = performance.now();
    fn();
    var endTime = performance.now();
    resultArr.push(endTime - startTime);
    if (i % 1000 == 0) {
      console.log(i);
    }
  }
  return average(resultArr);
}

const mul64Benchmark = benchmark(() => {WyRand.mul64(or11, or12, or21, or22)});
console.log("mul64: " + mul64Benchmark);
const mul64to128Benchmark = benchmark(() => {WyRand.mul64to128(or11, or12, or21, or22)});
console.log("mul64to128: " + mul64to128Benchmark);
const wyrandBenchmark = benchmark(() => {wyrand.next64()});
console.log("wyrand: " + wyrandBenchmark);
const mathRandomBenchmark = benchmark(() => {Math.random()});
console.log("math.random: " + mathRandomBenchmark);
// const xorshiftstarBenchmark = benchmark(() => {genrng(xorshiftstar)});
// console.log("xorshift*: " + xorshiftstarBenchmark);


console.log(`average of 1000000 ops of mul64 is ${mul64Benchmark}`);
console.log(`average of 1000000 ops of mul64to128 is ${mul64to128Benchmark}`);
console.log(`average of 1000000 ops of wyrand is ${wyrandBenchmark}`);
console.log(`average of 1000000 ops of math.random is ${mathRandomBenchmark}`);
console.log(`average of 1000000 ops of xorshift* is DNF`);