#!/usr/bin/env yarn tsx

import { readFile, writeFile } from "node:fs/promises";
import { parse, Node, NodeType, TextNode } from "node-html-parser";
import { SvgPath } from "./svg-lib/svg";

function usage(): never {
  console.log(`usage: ${process.argv[1]} [FILE...]`);
  process.exit(1);
}

if (process.argv.length < 3) {
  usage();
}

type Transform =
  | { scale: [number, number] }
  | { translate: [number, number] }
  | { skew: [number, number] }
  | { rotate: number; origin: [number, number] };

const TRANSFORM_REGEX =
  /\s*((scale)\(([-.0-9]+)([ ,]+([-.0-9]+))?\)|((translate)\(([-.0-9]+)[ ,]+([-.0-9]+)\))|((rotate)\(([-.0-9]+)([ ,]+([-.0-9]+))?([ ,]+([-.0-9]+))?\))|((matrix)\(([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)[ ,]+([-.0-9]+)\)))\s*/g;

const RADIANS_TO_DEG = 180 / Math.PI;

function* extractTransforms(transform: string): Generator<Transform> {
  let start = 0;
  let match: RegExpMatchArray | null | undefined;
  while ((match = TRANSFORM_REGEX.exec(transform)) != null) {
    if (match.index != start) {
      throw new Error("non-contiguous matches");
    }

    const [
      all,
      ,
      isScale,
      scaleArg1,
      ,
      scaleArg2,
      ,
      isTranslate,
      translateX,
      translateY,
      ,
      isRotate,
      angle,
      ,
      originX,
      ,
      originY,
      ,
      isMatrix,
      // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix
      matrix1,
      matrix2,
      matrix3,
      matrix4,
      matrix5,
      matrix6,
    ] = match;

    start = match.index + all.length;

    if (isScale) {
      yield {
        scale:
          scaleArg2 == null
            ? [+scaleArg1, +scaleArg1]
            : [+scaleArg1, +scaleArg2],
      };
    } else if (isTranslate) {
      yield { translate: [+translateX, +translateY] };
    } else if (isRotate) {
      yield { rotate: +angle, origin: [+(originX || "0"), +(originY || "0")] };
    } else if (isMatrix) {
      // Adapted from https://stackoverflow.com/a/32125700 because I am lazy.
      const angle = Math.atan2(+matrix2, +matrix1);
      const denom = Math.pow(+matrix1, 2) + Math.pow(+matrix2, 2);
      const scaleX = Math.sqrt(denom);
      const scaleY = (+matrix1 * +matrix4 - +matrix3 * +matrix2) / scaleX;
      const skewX = Math.atan2(
        +matrix1 * +matrix3 + +matrix2 * +matrix4,
        denom
      );

      // Seems to be the correct order here, but I think that's just a function of whichever order
      // the matrix happened to be constructed in -- hopefully, a consistent ordering of several
      // transforms from Inkscape or something like that.
      yield { translate: [+matrix5, +matrix6] };
      yield { rotate: angle * RADIANS_TO_DEG, origin: [0, 0] };
      yield { scale: [scaleX, scaleY] };
      yield { skew: [skewX * RADIANS_TO_DEG, 0] };
    }
  }

  if (start != transform.length) {
    throw new Error(`did not exhaust transform string: ${transform}`);
  }
}

async function processFile(filename: string) {
  const document = parse(await readFile(filename, "utf-8"));
  const svg = document.querySelector("svg");

  function assertIsGOrPath(n: Node) {
    if (n.nodeType === NodeType.ELEMENT_NODE) {
      if (n.rawTagName === "g" || n.rawTagName === "path") {
        n.childNodes.forEach(assertIsGOrPath);
      } else {
        throw new Error(`all nodes must be g or path; got ${n.rawTagName}`);
      }
    }
  }
  svg.childNodes.forEach(assertIsGOrPath);

  const flattenedPaths = [];

  for (const path of svg.querySelectorAll("path[d]")) {
    const d = new SvgPath(path.getAttribute("d")!);

    let current = path;
    while (current != null) {
      const transform = current.getAttribute("transform");
      for (const t of [...extractTransforms(transform || "")].reverse()) {
        if ("scale" in t) {
          d.scale(t.scale[0], t.scale[1]);
        } else if ("translate" in t) {
          d.translate(t.translate[0], t.translate[1]);
        } else if ("skew" in t) {
          if (t.skew[0] !== 0 || t.skew[1] !== 0) {
            throw new Error(`unsupported: non-zero skew: ${t.skew}`);
          }
        } else if ("rotate" in t) {
          d.rotate(t.origin[0], t.origin[1], t.rotate);
        } else {
          throw new Error("unrecognized transform");
        }
      }
      current = current.parentNode;
    }

    path.removeAttribute("transform");
    path.setAttribute("d", d.asString());
    flattenedPaths.push(path);
  }

  while (svg.childNodes.length > 0) {
    svg.removeChild(svg.lastChild);
  }

  for (const p of flattenedPaths) {
    svg.appendChild(new TextNode("\n  "));
    svg.appendChild(p);
  }
  svg.appendChild(new TextNode("\n"));

  await writeFile(filename, document.toString().replaceAll(/><\/path>/g, "/>"));
}

for (const filename of process.argv.slice(2)) {
  await processFile(filename);
}
