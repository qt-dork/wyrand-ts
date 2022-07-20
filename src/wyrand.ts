// This is based off of both Thom Chiovoloni's implementation of the pcg random 
// number generator algorithm in JS, and Absolucy's implementation of the
// WyRand algorithm in Rust. You can find them both at:
// Thom's PCG implementation:
// https://github.com/thomcc/pcg-random
// Absolucy's WyRand implementation:
// https://github.com/Absolucy/nanorand-rs/blob/main/src/rand/wyrand.rs

const MASK16 = 0xffff;
const MASK32 = 0xffffffff;

/**
 * A random number generator based on the implementation of
 * the WyRand algorithm, which you can find here:
 * <https://github.com/wangyi-fudan/wyhash>
 * 
 * Note that this is not a cryptographically secure random
 * number generator. Do not use this generator in
 * cryptographically sensitive applications.
 */
export default class WyRand {
  seed: Uint32Array;
  static imul = Math.imul || function (a: number, b: number)  {
    const ah = (a >>> 16) & MASK16, al = a & MASK16;
    const bh = (b >>> 16) & MASK16, bl = b & MASK16;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0)
  };
  /**
   * Constructs a random number generator that uses the
   * WyRand algorithm.
   * 
   * ### Overloads
   * 
   * The constructor has several overloads, taking between 0
   * and 2 arguments.
   * 
   * - `new WyRand()`: Produce a `WyRand` with a random seed.
   *   The seed is actually generated using Math.random(),
   *   making it incredibly easy to predict, but it's still
   *   a seed!
   * 
   * - `new WyRand(seedLo32: number, seedHi32: number)`:
   *   Produce a `WyRand` that uses `seedLo32` and `seedHi32`
   *   as the 2 parts of the 64-bit seed.
   * 
   * - `new WyRand(seed: bigint)`: If `bigint`s are
   *   supported, you can provide the seed as a `bigint`.
   *   (Note that `bigint` support is not at all required
   *   to use this library).
   * 
   * - `new WyRand(seedArray: [number, number])`: construct
   *   a `WyRand` using a state array (which should have been
   *   returned by `getSeed()`).
   */
  constructor();
  constructor(seedLo32: number, seedHi32: number);
  constructor(seed: bigint);
  constructor(stateArray: [number, number]);
  constructor(seed?: any, seedHi32?: number) {
    this.seed = new Uint32Array(2);
    const isArrayOfNumbers = (value: any[]) => { return Array.isArray(value) && value.length && value.every(item => typeof item === "string") };

    // Did we get a state array?
    if (seed != null && (typeof seed === "object") && isArrayOfNumbers(seed)) {
      if (seed.length !== 2) {
        throw new Error("Expected array of length 2");
      }
      this.seed[0] = seed[0]; this.seed[1] = seed[1];
    }

    let sl32 = 0, sh32 = 0;
    // Did we get a bigint?
    if (typeof seed === 'bigint' && typeof BigInt === 'function') {
      const bU32Max = 0xffffffffn;
      const b32 = 32n;
      sl32 = Number(seed & bU32Max); sh32 = Number((seed >> b32) & bU32Max);
    } else {
      if (seed != null && seedHi32 != null) {
        sl32 = seed >>> 0; sh32 = seedHi32 >>> 0;
      } else {
        // No seed was provided. Generate one randomly.
        sl32 = (Math.random() * MASK32) >>> 0; sh32 = (Math.random() * MASK32) >>> 0;
      }
    }
    this.seed[0] = sl32; this.seed[1] = sh32;
    return this;
  }

  /**
   * Returns a copy of the seed as a JS Array. It's recommended to use this with `setSeed`.
   */
  getSeed(): [number, number] {
    return [this.seed[0], this.seed[1]];
  }

  /**
   * Set the state of the random number generator to an
   * array (which should be equivalent to one returned from
   * `getSeed`)
   * @param seed A seed array, which you can get from `getSeed`
   */
  setSeed(seed: [number, number]) {
    this.seed[0] = seed[0] >>> 0; this.seed[1] = seed[1] >>> 0;
  }

  /**
   * Generates a random 64 bit integer between
   * `[0, 0xffff_ffff_ffff_ffff]`, inclusive in the form of
   * an array of two 32 bit integers.
   * 
   * It's recommended to use `integer` instead of this function,
   * as it has less bias and is more practical.
   * 
   * If you really want a 64-bit number, use `bigint` instead.
   * 
   * @returns A random 64 bit integer in the form of a `Uint32Array` of length 2. The first element is the low 32 bits, the second element is the high 32 bits.
   */
  gen(): Uint32Array {
    WyRand.add64(this.seed[0], this.seed[1], 0x78bd642f, 0xa0761d64, this.seed);

    const xorLo = (this.seed[0] ^ 0xa0b428db) >>> 0;
    const xorHi = (this.seed[1] ^ 0xe7037ed1) >>> 0;
    const t = new Uint32Array(4);
    WyRand.mul64to128(this.seed[0], this.seed[1], xorLo, xorHi, t);

    const result = new Uint32Array(2);
    result[0] = t[0] ^ t[2]; result[1] = t[1] ^ t[3];
    return result;
  }

  /**
   * Generates a random 64 bit integer between
   * `[0, 0xffff_ffff_ffff_ffff]`, inclusive in the form of
   * an array of two 32 bit integers.
   * 
   * It's faster than `next64` but your results may not be the same.
   * 
   * @returns A random 64 bit integer in the form of a `Uint32Array` of length 2. The first element is the low 32 bits, the second element is the high 32 bits.
   */
  fastGen(): Uint32Array {
    WyRand.add64(this.seed[0], this.seed[1], 0x78bd642f, 0xa0761d64, this.seed);
    let aLo = this.seed[0] >>> 0, aHi = this.seed[1] >>> 0;
    let bLo = (this.seed[0] ^ 0xa0b428db) >>> 0, bHi = (this.seed[1] ^ 0xe7037ed1) >>> 0;

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

  /**
   * Generates a random 32 bit integer between
   * `[0, 0xffff_ffff]`, inclusive.
   * 
   * You should not use this with the `%` operator, as it
   * will introduce bias, instead, use the `integer` method.
   * 
   * @returns A random 32 bit integer in the range `[0, 0xffff_ffff]`
   */
  gen32(): number {
    return this.gen()[0];
  }


  /**
   * Get a uniformly distributed 32 bit integer between
   * `[0, max)`. That is: including zero, not including `max`.
   * @returns A random 32 bit integer in the range `[0, max)`
   */
  integer(): number;
  integer(max: number): number;
  integer(max?: number): number {
    let x = this.fastGen()[0] >>> 0;
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
        x = this.fastGen()[0] >>> 0;
        WyRand.mul32to64(x, range, m);
        l = m[0] >>> 0;
      }
    }
    return m[1];
  }

  /**
   * @returns A uniformly distributed 64-bit integer between `[0, 0xffff_ffff_ffff_ffff]`, inclusive.
   */
  bigint(): bigint {
    let x = this.gen();
    return BigInt(x[0]) << 32n | BigInt(x[1]);
  }

  /**
   * Get a uniformly distributed IEEE-754 double precision
   * floating point number between 0.0 and 1.0.
   * 
   * That is, `some_wyrand.number()` is (essentially)
   * equivalent to `Math.random()`.
   */
  number() {
    const num = this.gen();
    let floatBits = new ArrayBuffer(16);
    let float = new Float64Array(floatBits);
    let uint = new Uint32Array(floatBits);
    // (x >> 11)
    let carry = num[1] & 0x0000_07ff;
    num[1] >>>= 11; carry = carry << 21;
    num[0] >>>= 11; num[0] = num[0] | carry;
    uint[0] = num[0]; uint[1] = num[1];
    //  (1. / (UINT64_C(1) << 53))
    uint[2] = 0x0000_0000; uint[3] = 0x0020_0000;
    float[1] = 1.0 / float[1];
    // all together now!
    return float[0] * float[1];
  }

  /**
   * Produces a random within the bound of the given range.
   * It includes the lower bound and excludes the upper one.
   * @returns A random number in the range `[min, max)`
   */
  range(min: number, max: number): number {
    return this.integer(max - min) + min;
  }

  /**
   * Returns a random boolean.
   */
  boolean(): boolean {
    return (this.fastGen()[0] & 1) === 1;
  }

  /**
   * Chooses a random item in the given array.
   * 
   * @error If the array is empty
   * @param items An array of type `T` to choose an element from.
   * @returns An element of type `T` from the given array.
   */
  choose<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot choose from an empty array");
    }
    return items[this.integer(items.length)];
  }

  /**
   * Returns a shuffled copy of the array.
   * 
   * @param array The array to shuffle.
   * @returns A shuffled copy of the array.
   */
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

  /***************************************************************
   * Interface for doing 64-bit arithmetic.                      *
   * This takes up 100 lines of code and I'd like it to be less. *
   * But also it's really fast.                                  *
   ***************************************************************/

  // Add two 64 bit numbers (given in parts), and store the
  // result in out.
  private static add64(aLo: number, aHi: number, bLo: number, bHi: number, out: Uint32Array) {
    const lo = (aLo >>> 0) + (bLo >>> 0) >>> 0;
    const hi = (aHi >>> 0) + (bHi >>> 0) >>> 0;
    const carry = (lo < aLo) as any >>> 0;
    // convert back to 64 bit number
    out[0] = lo; out[1] = (hi + carry) >>> 0;
  }

  // Multiply two 64 bit numbers (given in parts), and 
  // store the result in out.
  private static mul32to64(lhs: number, rhs: number, out: Uint32Array) {
    // fun fact, the reason why there's so many bitwise shifts of 0 is that
    // if we don't, JS will convert them into floats. This is actually faster
    // than not doing the bitwise shifts, because we never have to do the 
    // expensive and unnecessary float conversion.
    lhs >>>= 0; rhs >>>= 0;

    // check if it all fits in 32 bits
    if (lhs < 32767 && rhs < 65536) {
      out[0] = lhs * rhs; out[1] = (out[0] < 0) ? -1 : 0;
      return;
    }

    // convert to 16 bit numbers
    const a00 = lhs & MASK16, a16 = lhs >>> 16;
    const b00 = rhs & MASK16, b16 = rhs >>> 16;

    // math
    const c00 = this.imul(a00, b00);
    let c16 = (c00 >>> 16) + this.imul(a16, b00); let c32 = c16 >>> 16;
    c16 = (c16 & MASK16) + this.imul(a00, b16);
    c32 += c16 >>> 16; let c48 = c32 >>> 16;
    c32 = (c32 & MASK16) + this.imul(a16, b16);
    c48 += c32 >>> 16;

    // convert to 64 bit number
    out[0] = ((c16 & MASK16) << 16) | (c00 & MASK16);
    out[1] = ((c48 & MASK16) << 16) | (c32 & MASK16);
  }

  // Multiply two 64 bit numbers (given in parts), and
  // store the result in out (128 bits).
  private static mul64to128(lhsLo: number, lhsHi:number, rhsLo: number, rhsHi: number, out: Uint32Array) {
    // force the inputs to remain 32 bit ints
    lhsLo >>>= 0; lhsHi >>>= 0; rhsLo >>>= 0; rhsHi >>>= 0;
    const store = new Uint32Array(8); const t = new Uint32Array(2);

    // check if it all fits in 64 bits
    // if it does, we can just use the existing 32 bit to 64 bit multiplication
    if ((lhsLo < 2147483647 && lhsHi === 0) && (rhsLo < 4294967295 && rhsHi === 0)) {
      WyRand.mul32to64(lhsLo, rhsLo, t);
      out[0] = t[0]; out[1] = t[1];
      out[2] = 0; out[3] = 0;
      return;
    }
    
    // get products
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

    // get carry
    WyRand.add64(store[1], 0, store[2], 0, t);
    WyRand.add64(t[0], t[1], t[4], 0, t)
    const carry = t[1];

    // low 64 bits
    out[0] = store[0]; out[1] = store[1] + store[3] + store[4];
    // high 64 bits
    WyRand.add64(store[6], store[7], store[3], 0, t);
    WyRand.add64(t[0], t[1], store[5], 0, t);
    WyRand.add64(t[0], t[1], carry, 0, t);
    out[2] = t[0]; out[3] = t[1];
  }
}