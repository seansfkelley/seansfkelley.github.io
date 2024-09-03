#!/usr/bin/env yarn tsx

import { readFile } from "node:fs/promises";
import {} from "node:path";
import { parse, Node, NodeType } from "node-html-parser";
import { SvgPath } from "./svg-lib/svg";

function usage(): never {
  console.log(`usage: ${process.argv[1]} [FILE...]`);
  process.exit(1);
}

if (process.argv.length < 3) {
  usage();
}

type Transform =
  | {
      scale: [number, number];
    }
  | {
      translate: [number, number];
    };

const TRANSFORM_REGEX =
  /\s*((scale)\(([-.0-9]+)(,\s*([-.0-9]+))?\)|((translate)\(([-.0-9]+),\s*([-.0-9]+)\)))\s*/g;

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
      yield {
        translate: [+translateX, +translateY],
      };
    }
  }

  if (start != transform.length) {
    throw new Error("did not exhaust transform string");
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

  for (const path of svg.querySelectorAll("path[d]")) {
    const d = new SvgPath(path.getAttribute("d")!);

    let current = path;
    while (current != null) {
      const transform = current.getAttribute("transform");
      for (const t of extractTransforms(transform || "")) {
        if ("scale" in t) {
          d.scale(t.scale[0], t.scale[1]);
        } else if ("translate" in t) {
          d.translate(t.translate[0], t.translate[1]);
        } else {
          throw new Error("unrecognized transform");
        }
      }
      current = current.parentNode;
    }

    path.setAttribute("path", d.asString());
  }

  // console.log(document.toString().replaceAll(/><\/path>/g, "/>"));
}

for (const filename of process.argv.slice(2)) {
  await processFile(filename);
}
