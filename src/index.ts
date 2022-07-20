import WyRand from "./wyrand";

export { default as WyRand } from "./wyrand";

export const random = new WyRand(Date.now(), 0);
export default new WyRand(Date.now(), 0);