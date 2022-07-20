export default class WyRand {
  seed: Uint32Array;
  static imul = Math.imul || function (a: number, b: number)  {
    const ah = (a >>> 16) & 0xffff, al = a & 0xffff;
    const bh = (b >>> 16) & 0xffff, bl = b & 0xffff;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0)
  };
  constructor();
  constructor(seedLo32: number, seedHi32: number);
  constructor(seed: bigint);
  constructor(stateArray: [number, number]);
  constructor(seed?: any, seedHi32?: number) {
    this.seed = new Uint32Array(2);
    const isArrayOfNumbers = (value: any[]) => { return Array.isArray(value) && value.length && value.every(item => typeof item === "string") };
    if (seed != null && (typeof seed === "object") && isArrayOfNumbers(seed)) {
      if (seed.length !== 2) {
        throw new Error("Expected array of length 2");
      }
      this.seed[0] = seed[0];
      this.seed[1] = seed[1];
    }
    let sl32 = 0;
    let sh32 = 0;
    if (typeof seed === 'bigint' && typeof BigInt === 'function') {
      const bU32Max = 0xffffffffn;
      const b32 = 32n;
      sl32 = Number(seed & bU32Max);
      sh32 = Number((seed >> b32) & bU32Max);
    } else {
      if (seed != null && seedHi32 != null) {
        sl32 = seed >>> 0;
        sh32 = seedHi32 >>> 0;
      } else {
        sl32 = (Math.random() * 0xffffffff) >>> 0;
        sh32 = (Math.random() * 0xffffffff) >>> 0;
      }
    }

    this.seed[0] = sl32;
    this.seed[1] = sh32;
    return this;
  }
  private static add64(aLo: number, aHi: number, bLo: number, bHi: number, out: Uint32Array) {
    const lo = (aLo >>> 0) + (bLo >>> 0) >>> 0;
    const hi = (aHi >>> 0) + (bHi >>> 0) >>> 0;
    const carry = (lo < aLo) as any >>> 0;
    out[0] = lo;
    out[1] = (hi + carry) >>> 0;
  }
  private static mul32to64(lhs: number, rhs: number, out: Uint32Array) {
    lhs >>>= 0;
    rhs >>>= 0;
    if (lhs < 32767 && rhs < 65536) {
      out[0] = lhs * rhs;
      out[1] = (out[0] < 0) ? -1 : 0;
      return;
    }
    const a00 = lhs & 0xFFFF, a16 = lhs >>> 16;
    const b00 = rhs & 0xFFFF, b16 = rhs >>> 16;
    const c00 = this.imul(a00, b00);
    let c16 = (c00 >>> 16) + this.imul(a16, b00);
    let c32 = c16 >>> 16;
    c16 = (c16 & 0xFFFF) + this.imul(a00, b16);
    c32 += c16 >>> 16;
    let c48 = c32 >>> 16;
    c32 = (c32 & 0xFFFF) + this.imul(a16, b16);
    c48 += c32 >>> 16;
    out[0] = ((c16 & 0xFFFF) << 16) | (c00 & 0xFFFF);
    out[1] = ((c48 & 0xFFFF) << 16) | (c32 & 0xFFFF);
  }
  static mul64to128(lhsLo: number, lhsHi:number, rhsLo: number, rhsHi: number, out: Uint32Array) {
    lhsLo >>>= 0; lhsHi >>>= 0; rhsLo >>>= 0; rhsHi >>>= 0;
    const store = new Uint32Array(8);
    const t = new Uint32Array(2);
    if ((lhsLo < 2147483647 && lhsHi === 0) && (rhsLo < 4294967295 && rhsHi === 0)) {
      WyRand.mul32to64(lhsLo, rhsLo, t);
      out[0] = t[0]; out[1] = t[1]; out[2] = 0; out[3] = 0;
      return;
    }
    // p0
    WyRand.mul32to64(lhsLo, rhsLo, t);
    store[0] = t[0]; store[1] = t[1];
    // p1
    WyRand.mul32to64(lhsLo, rhsHi, t);
    store[2] = t[0]; store[3] = t[1];
    // p2
    WyRand.mul32to64(lhsHi, rhsLo, t);
    store[4] = t[0]; store[5] = t[1];
    // p3
    WyRand.mul32to64(lhsHi, rhsHi, t);
    store[6] = t[0]; store[7] = t[1];
    WyRand.add64(store[1], 0, store[2], 0, t);
    WyRand.add64(t[0], t[1], t[4], 0, t)
    const carry = t[1];
    out[0] = store[0]; out[1] = store[1] + store[3] + store[4];
    WyRand.add64(store[6], store[7], store[3], 0, t);
    WyRand.add64(t[0], t[1], store[5], 0, t);
    WyRand.add64(t[0], t[1], carry, 0, t);
    out[2] = t[0]; out[3] = t[1];
  }
  getSeed(): [number, number] {
    return [this.seed[0], this.seed[1]];
  }
  setSeed(seed: [number, number]) {
    this.seed[0] = seed[0];
    this.seed[1] = seed[1];
  }
  next64(): Uint32Array {
    WyRand.add64(this.seed[0], this.seed[1], 0x78bd642f, 0xa0761d64, this.seed);
    const xorLo = (this.seed[0] ^ 0xa0b428db) >>> 0;
    const xorHi = (this.seed[1] ^ 0xe7037ed1) >>> 0;
    const t = new Uint32Array(4);
    WyRand.mul64to128(this.seed[0], this.seed[1], xorLo, xorHi, t);
    const result = new Uint32Array(2);
    result[0] = t[0] ^ t[2]; result[1] = t[1] ^ t[3];
    return result;
  }

  fastNext64(): Uint32Array {
    WyRand.add64(this.seed[0], this.seed[1], 0x78bd642f, 0xa0761d64, this.seed);
    let aLo = this.seed[0] >>> 0; let aHi = this.seed[1] >>> 0;
    let bLo = (this.seed[0] ^ 0xa0b428db) >>> 0; let bHi = (this.seed[1] ^ 0xe7037ed1) >>> 0;
    const store = new Uint32Array(8);
    const t = new Uint32Array(2);
    // hh
    WyRand.mul32to64(aHi, bHi, t);
    store[0] = t[0]; store[1] = t[1];
    // hl
    WyRand.mul32to64(aHi, bLo, t);
    store[2] = t[0]; store[3] = t[1];
    // lh
    WyRand.mul32to64(aLo, bHi, t);
    store[4] = t[0]; store[5] = t[1];
    // ll
    WyRand.mul32to64(aLo, bLo, t);
    store[6] = t[0]; store[7] = t[1];
    aLo = store[3] ^ store[0]; aHi = store[2] ^ store[1];
    bLo = store[5] ^ store[6]; bHi = store[4] ^ store[7];
    t[0] = aLo ^ bLo; t[1] = aHi ^ bHi;
    return t;
  }
  next32(): number {
    return this.next64()[0];
  }
  integer(): number;
  integer(max: number): number;
  integer(max?: number): number {
    let x = this.next32() >>> 0;
    if (max === undefined) {
      return x;
    };
    let range = max >>> 0;
    let m = new Uint32Array(2);
    WyRand.mul32to64(x, max, m);
    let l = m[0] >>> 0;
    if (l < range) {
      let t = -range >>> 0;
      if (t >= range) {
        t -= range;
        if (t >= range) {
          t %= range;
        }
      }
      while (l < t) {
        x = this.next32() >>> 0;
        WyRand.mul32to64(x, range, m);
        l = m[0] >>> 0;
      }
    }
    return m[1];
  }
  number() {
    const num = this.next64();
    let floatBits = new ArrayBuffer(16);
    let float = new Float64Array(floatBits);
    let uint = new Uint32Array(floatBits);
    let carry = num[1] & 0x0000_07ff;
    num[1] >>>= 11; carry = carry << 21;
    num[0] >>>= 11; num[0] = num[0] | carry;
    uint[0] = num[0]; uint[1] = num[1];
    uint[2] = 0x0000_0000; uint[3] = 0x0020_0000;
    float[1] = 1.0 / float[1];
    return float[0] * float[1];
  }
  range(min: number, max: number): number {
    return this.integer(max - min) + min;
  }
  boolean(): boolean {
    return (this.next64()[0] & 1) === 1;
  }
  choose<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot choose from an empty array");
    }
    return items[this.integer(items.length)];
  }
  shuffle<T>(array: T[]): T[] {
    const result = array.slice();
    const len = array.length;
    for (let i = 0; i < len; i++) {
      const j = this.integer(len - i);
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }
}