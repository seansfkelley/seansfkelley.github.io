---
layout: post
title: JSC > JSX
---

where does jsx cause problems?
- hooks violate true functions
- hooks want static analysis but are Hungarian notated
- dependencies are obnoxiousj
- verbose closing tags
  - https://stackoverflow.com/questions/4370488/why-does-xml-have-such-verbose-closing-tags
  - counterargument: react components are small and validated by a compiler (unlike illegal XML which could end up sent over the network before being caught)
- easier literal props
- not allowing compact literal syntax
- hooks allow complex logic between function definitions (this is a blessing and a curse... I've seen it put to good use with things like useDebounced)

// https://github.com/tc39/proposal-decorators/blob/master/EXTENSIONS.md#let-decorators

## today

```
export function Whatever(props) {
  const [foo, setFoo] = useState(props.initialFoo);

  const onWhatever = useCallback(() => {
    setFoo(false);
  });

  const onDoubleWhatever = useCallback(() => {
    onWhatever();
  }, [onWhatever]);

  return (
    <div foo={foo} bar={1}>
      here be dragons
    </div>
  );
}
```

## v1

```
export component Whatever {
  hook [foo, setFoo] = state(props.initialFoo);
  hook onWhatever = callback(() => {
    setFoo(foo);
  });
  hook onDoubleWhatever = callback(() => {
    onWhatever();
  });

  return (
    <div foo bar=1>
      here be dragons
    </>
  );
}
```

## v2

```
export component Whatever {
  hooks {
    [foo, setFoo] = state(props.initialFoo);

    onWhatever = callback(() => {
      setFoo(foo);
    });

    // but there is value being able to compute intermediate values here...

    onDoubleWhatever = callback(() => {
      onWhatever();
    });
  }

  render {
    <div foo bar=1>
      here be dragons
    </>
  }
}
```
