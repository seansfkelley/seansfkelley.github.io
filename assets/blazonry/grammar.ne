# Note: nothing is case insensitive here because it is assumed to only parse lowercase input.

@{%
  const lexer = moo.compile({
    __: {
      match: /[ \t\n\v\f,;]+/,
      lineBreaks: true,
    },
    word: {
      match: /[-a-z]+/,
      type: moo.keywords({
        singular: ["a", "an"],
        ornament: ["embattled", "embattled-counter-embattled", "engrailed", "indented", "wavy", "undy"],
        tincture: ["azure", "or", "argent", "gules", "vert", "sable", "purpure", "counterchanged"],
        variedName: ["barry bendy", "barry", "bendy", "checky", "chequey", "chevronny", "lozengy", "paly"],
        party: ["party", "parted"],
        quarterly: "quarterly",
        of_: "of",
        on: "on",
        in_: "in",
        per: "per",
        between: "between",
        overall: "overall",
        and: "and",
        canton: "canton",
      }),
    },
  });

  function nop() { return undefined; }
  function literal(l) { return () => l; }
%}

@builtin "postprocessors.ne"
@lexer lexer

Enter ->
  ComplexContent ".":? {% nth(0) %}

ComplexContent ->
    SimpleField   {% id %}
  | PartyPerField {% id %}
  | Quarterly     {% id %}

SimpleField ->
    %tincture (%__ SimpleContent {% nth(1) %}):*                                {% $({
      tincture: 0, content: 1
    }) %}
  | Varied %__ %tincture %__ %and %__ %tincture (%__ SimpleContent {% nth(1) %}):* {% $({
      varied: 0, first: 2, second: 6, content: 7
    }) %}

Varied ->
  %variedName (%__ %of_ %__ Plural {% nth(3) %}):? {% $({ type: 0, count: 1 }) %}

PartyPerField ->
  (%party %__):? %per %__ Direction (%__ %ornament {% nth(1) %}):? %__ %tincture %__ %and %__ %tincture (%__ SimpleContent {% nth(1) %}):? {% $({
    party: 3, ornament: 4, first: 6, second: 10, content: 11
  }) %}

Quarterly ->
  %quarterly %__ Quartering (%__ Quartering {% nth(1) %}):* (%__ %overall %__ SimpleContent {% nth(3) %}):? {% (d) => ({
    quarters: [d[2], ...d[3]], overall: d[4]
  }) %}

SimpleContent ->
    Ordinary %__ %between %__ Charge                   {% $({ on: 0, surround: 4 }) %}
  | %on %__ Ordinary %__ Charge                       {% $({ on: 2, charge: 4 }) %}
  | %on %__ Ordinary %__ %between %__ Charge %__ Charge {% $({ on: 2, surround: 6, charge: 8 }) %}
  | Ordinary                                         {% id %}
  | Charge                                           {% id %}
  | Canton                                           {% id %}

Quartering ->
  (
    (QuarterName %__ {% nth(0) %}):+ %and %__ {% nth(0) %}
  ):? QuarterName %__ ComplexContent {% (d) => ({ quarters: [...(d[0] ?? []), d[1]], content: d[3] }) %}

Canton ->
    %singular %__ %canton %__ %tincture                                            {% $({ canton: 4 }) %}
  | %on %__ %singular %__ %canton %__ %tincture (%__ SimpleContent {% nth(1) %}):+ {% $({ canton: 6, content: 7 }) %}

# Note that we do not support multiple ordinaries. Yet?
Ordinary ->
    %singular %__ OrdinaryName (%__ %ornament {% nth(1) %}):? (%__ %tincture {% nth(1) %}):? %__ "cotised" %__ %tincture {% (d) => ({
      ordinary: d[2], ornament: d[3], tincture: d[4] ?? d[8], cotised: d[8]
    }) %}
  | %singular %__ OrdinaryName (%__ %ornament {% nth(1) %}):? %__ %tincture {% $({
      ordinary: 2, ornament: 3, tincture : 5
    }) %}

Charge ->
    %singular %__ SimpleChargeName (%__ Posture {% nth(1) %}):? %__ %tincture                                   {% (d) => ({
      count: 1, charge: d[2], posture: d[3], tincture: d[5]
    }) %}
  | Plural %__ SimpleChargeName "s" (%__ Posture {% nth(1) %}):? %__ %tincture (%__ InDirection {% nth(1) %}):? {% $({
      count: 0, charge: 2, posture: 4, tincture: 6, direction : 7
    }) %}
  | Lion                                                                                                   {% id %}

Lion ->
  (
      %singular %__ "lion" {% literal(1) %}
    | Plural %__ "lions"   {% nth(0) %}
  ) (%__ LionPose {% nth(1) %}):? (%__ Posture {% nth(1) %}):? %__ %tincture (%__ LionModifiers {% nth(1) %}):? (%__ InDirection {% nth(1) %}):? {% (d) => ({
    charge: "lion",
    count: d[0],
    pose: d[1] ?? "rampant",
    posture: d[2],
    tincture: d[4],
    ...d[5],
    direction: d[6],
  }) %}

LionPose ->
    "rampant" {% id %}
  | "passant" {% id %}
  # other variants: "passant guardant", "reguardant"

LionModifier ->
    "armed"   {% id %}
  | "langued" {% id %}
  # other variants: "crowned", "double queued"

LionModifiers ->
  # This is unfortunately rather repetitive, due to the optional nature of the tincture
  # specification when using both "armed" and "langued". Not sure how to tighten it up.
    LionModifier %__ %tincture %__ %and %__ LionModifier %__ %tincture {% (d) => ({ [d[0]]: d[2], [d[6]]: d[8] }) %}
  | LionModifier %__ %tincture                                      {% (d) => ({ [d[0]]: d[2] }) %}
  | LionModifier %__ %and %__ LionModifier %__ %tincture             {% (d) => ({ [d[0]]: d[6], [d[4]]: d[6] }) %}

Plural ->
    "two"    {% literal(2) %}
  | "three"  {% literal(3) %}
  | "four"   {% literal(4) %}
  | "five"   {% literal(5) %}
  | "six"    {% literal(6) %}
  | "seven"  {% literal(7) %}
  | "eight"  {% literal(8) %}
  | "nine"   {% literal(9) %}
  | "ten"    {% literal(10) %}
  | "eleven" {% literal(11) %}
  | "twelve" {% literal(12) %}

Direction ->
    "pale"          {% id %}
  | "fess"          {% id %}
  | "bend sinister" {% id %}
  | "bend"          {% id %}
  | "chevron"       {% id %}
  | "saltire"       {% id %}

InDirection ->
    %in_ %__ Direction {% nth(2) %}
  # Special case: things can be "in cross" but they can't be "party per cross". (It is synonymous
  # with "quarterly" but we don't allow it because it's a pain to implement.)
  | %in_ %__ "cross"   {% nth(2) %}

QuarterName ->
    "first"  {% literal(1) %}
  | "1st"    {% literal(1) %}
  | "second" {% literal(2) %}
  | "2nd"    {% literal(2) %}
  | "third"  {% literal(3) %}
  | "3rd"    {% literal(3) %}
  | "fourth" {% literal(4) %}
  | "4th"    {% literal(4) %}

Posture ->
    "palewise"    {% id %}
  | "fesswise"    {% id %}
  | "bendwise"    {% id %}
  | "saltirewise" {% id %}

OrdinaryName ->
    "bend sinister" {% id %}
  | "bend"          {% id %}
  | "fess"          {% id %}
  | "cross"         {% id %}
  | "chevron"       {% id %}
  | "pale"          {% id %}
  | "saltire"       {% id %}
  | "chief"         {% id %}

SimpleChargeName ->
    "rondel" {% id %}
  | "mullet" {% id %}
