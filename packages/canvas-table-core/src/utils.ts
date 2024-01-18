export function get_font_metrics(ctx: CanvasRenderingContext2D, font: string) {
  ctx.save();

  ctx.font = font;
  const { fontBoundingBoxAscent, fontBoundingBoxDescent } = ctx.measureText("M");

  ctx.restore();

  return {
    fontBoundingBoxAscent,
    fontBoundingBoxDescent
  };
}

export function create_font_specifier(font_family: string, font_Size: string, font_style: string) {
  return [font_style, font_Size, font_family].join(" ");
}

export function shallow_merge<T1, T2>(obj1: T1, obj2: T2): T1 & T2;
export function shallow_merge<T1, T2, T3>(obj1: T1, obj2: T2, obj3: T3): T1 & T2 & T3;
export function shallow_merge<T extends any[]>(...args: T): any {
  const result = args[0];

  for (const obj of args.slice(1)) {
    if (obj === null || obj === undefined) {
      continue;
    }

    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

export function shallow_match<T1 extends object, T2 extends object>(obj1: T1, obj2: T2) {
  for (const key of Object.keys(obj1)) {
    const o1 = obj1 as any;
    const o2 = obj2 as any;
    if (o1[key] !== undefined && o1[key] !== o2[key]) {
      return false;
    }
  }
  return true;
}

export function is_empty(obj: Record<string, unknown>) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

export function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(
  value: number,
  from_min: number,
  from_max: number,
  to_min: number,
  to_max: number
) {
  if (value <= from_min) {
    return to_min;
  } else if (value >= from_max) {
    return to_max;
  } else {
    return ((value - from_min) * (to_max - to_min)) / (from_max - from_min) + to_min;
  }
}

export function is_point_in_rect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
) {
  return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
}

export function is_whitespace(c: string) {
  return (
    c === " " ||
    c === "\n" ||
    c === "\t" ||
    c === "\r" ||
    c === "\f" ||
    c === "\v" ||
    c === "\u00a0" ||
    c === "\u1680" ||
    c === "\u2000" ||
    c === "\u200a" ||
    c === "\u2028" ||
    c === "\u2029" ||
    c === "\u202f" ||
    c === "\u205f" ||
    c === "\u3000" ||
    c === "\ufeff"
  );
}

export function is_number(val: any) {
  return typeof val === "number";
}

export function is_object(val: any) {
  return val != null && val.constructor.name === "Object";
}
