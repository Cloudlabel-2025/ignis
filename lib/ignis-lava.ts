// Molten cores are much brighter and more saturated than orange-lit rocks.
export function isMolten(red: number, green: number, blue: number) {
  return red > 225 && green > 105 && green < red * .91 && blue < 105 && red - blue > 150;
}

export function lavaPools(mask: Uint8Array, width: number, height: number) {
  const pools: {x:number;y:number}[] = [];
  const radius = 7;
  for (let y = Math.max(radius, Math.floor(height * .2)); y < height-radius; y += 13) {
    for (let x = radius; x < width-radius; x += 19) {
      // A bubble needs a pool around it, not one bright pixel on a rock edge.
      if ([-radius, 0, radius].every(dy => [-radius, 0, radius].every(dx => mask[(y+dy)*width+x+dx] === 255))) {
        pools.push({ x: x / width, y: y / height });
      }
    }
  }
  return pools;
}
