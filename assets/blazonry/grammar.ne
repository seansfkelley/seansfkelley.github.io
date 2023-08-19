# Note: nothing is case insensitive here because it is assumed to only parse lowercase input.

@builtin "postprocessors.ne"

@{%
  function nop() { return undefined; }
  function literal(l) { return () => l; }
  function spread(o) { return (delegate) => ({ ...id(delegate), ...o }); }
%}

SIMPLE_CHARGE[S, P] ->
    Singular __ $S (__ Posture {% nth(1) %}):? __ Tincture                               {% (d) => ({
      count: 1, posture: d[3], tincture: d[5]
    }) %}
  | Plural __ $P (__ Posture {% nth(1) %}):? __ Tincture (__ InDirection {% nth(1) %}):? {% (d) => ({
      count: d[0], posture: d[3], tincture: d[5], direction: d[6]
    }) %}

Enter ->
  ComplexContent (_ "."):? {% nth(0) %}

ComplexContent ->
    SimpleField   {% id %}
  | PartyPerField {% id %}
  | Quarterly     {% id %}

SimpleField ->
    Tincture (__ SimpleContent {% nth(1) %}):*                                {% $({
      tincture: 0, content: 1
    }) %}
  | Varied __ Tincture __ "and" __ Tincture (__ SimpleContent {% nth(1) %}):* {% $({
      varied: 0, first: 2, second: 6, content: 7
    }) %}

Varied ->
  VariedName (__ "of" __ Plural {% nth(3) %}):? {% $({ type: 0, count: 1 }) %}

PartyPerField ->
  (Party __):? "per" __ Direction (__ Ornament {% nth(1) %}):? __ Tincture __ "and" __ Tincture (__ SimpleContent {% nth(1) %}):? {% $({
    party: 3, ornament: 4, first: 6, second: 10, content: 11
  }) %}

Party ->
    "party"  {% nop %}
  | "parted" {% nop %}

Quarterly ->
  "quarterly" __ Quartering (__ Quartering {% nth(1) %}):* (__ "overall" __ SimpleContent {% nth(3) %}):? {% (d) => ({
    quarters: [d[2], ...d[3]], overall: d[4]
  }) %}

SimpleContent ->
    Ordinary __ "between" __ Charge                   {% $({ on: 0, surround: 4 }) %}
  | "on" __ Ordinary __ Charge                        {% $({ on: 2, charge: 4 }) %}
  | "on" __ Ordinary __ "between" __ Charge __ Charge {% $({ on: 2, surround: 6, charge: 8 }) %}
  | Ordinary                                          {% id %}
  | Charge                                            {% id %}
  | Canton                                            {% id %}

Quartering ->
  (
    (QuarterName __ {% nth(0) %}):+ "and" __ {% nth(0) %}
  ):? QuarterName __ ComplexContent {% (d) => ({ quarters: [...(d[0] ?? []), d[1]], content: d[3] }) %}

Canton ->
    "a" __ "canton" __ Tincture                                           {% $({ canton: 4 }) %}
  | "on" __ "a" __ "canton" __ Tincture (__ SimpleContent {% nth(1) %}):+ {% $({ canton: 6, content: 7 }) %}

# Note that we do not support multiple ordinaries. Yet?
Ordinary ->
    Singular __ OrdinaryName (__ Ornament {% nth(1) %}):? (__ Tincture {% nth(1) %}):? __ "cotised" __ Tincture {% (d) => ({
      ordinary: d[2], ornament: d[3], tincture: d[4] ?? d[8], cotised: d[8]
    }) %}
  | Singular __ OrdinaryName (__ Ornament {% nth(1) %}):? __ Tincture {% $({
      ordinary: 2, ornament: 3, tincture : 5
    }) %}

Charge ->
    SIMPLE_CHARGE["rondel", "rondels"] {% spread({ charge: 'rondel' }) %}
  | SIMPLE_CHARGE["mullet", "mullets"] {% spread({ charge: 'mullet' }) %}
  | Lion                                                                                                   {% id %}

Lion ->
  (
      "a" __ "lion"     {% literal(1) %}
    | Plural __ "lions" {% nth(0) %}
  ) (__ LionPose {% nth(1) %}):? (__ Posture {% nth(1) %}):? __ Tincture (__ LionModifiers {% nth(1) %}):? (__ InDirection {% nth(1) %}):? {% (d) => ({
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
    LionModifier __ Tincture __ "and" __ LionModifier __ Tincture {% (d) => ({ [d[0]]: d[2], [d[6]]: d[8] }) %}
  | LionModifier __ Tincture                                      {% (d) => ({ [d[0]]: d[2] }) %}
  | LionModifier __ "and" __ LionModifier __ Tincture             {% (d) => ({ [d[0]]: d[6], [d[4]]: d[6] }) %}

Singular ->
    "a"  {% nop %}
  | "an" {% nop %}

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
    "in" __ Direction {% nth(2) %}
  # Special case: things can be "in cross" but they can't be "party per cross". (It is synonymous
  # with "quarterly" but we don't allow it because it's a pain to implement.)
  | "in" __ "cross"   {% nth(2) %}

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

Tincture ->
    "azure"          {% id %}
  | "or"             {% id %}
  | "argent"         {% id %}
  | "gules"          {% id %}
  | "vert"           {% id %}
  | "sable"          {% id %}
  | "purpure"        {% id %}
  | "counterchanged" {% id %}

OrdinaryName ->
    "bend sinister" {% id %}
  | "bend"          {% id %}
  | "fess"          {% id %}
  | "cross"         {% id %}
  | "chevron"       {% id %}
  | "pale"          {% id %}
  | "saltire"       {% id %}
  | "chief"         {% id %}

VariedName ->
    "barry bendy" {% id %}
  | "barry"       {% id %}
  | "bendy"       {% id %}
  | "checky"      {% id %}
  | "chequey"     {% literal("checky") %}
  | "chevronny"   {% id %}
  | "lozengy"     {% id %}
  | "paly"        {% id %}

Ornament ->
    "embattled-counter-embattled" {% id %}
  | "embattled"                   {% id %}
  | "engrailed"                   {% id %}
  | "indented"                    {% id %}
  | "wavy"                        {% id %}
  | "undy"                        {% literal("wavy") %}
  # TODO: More.

_  -> whitespace:* {% nop %}
__ -> whitespace:+ {% nop %}

# Note that comma and semicolon are considered, effectively, whitespace. They are not used to
# delimit anything that is not already delimited by whitespace.
whitespace -> [ \t\n\v\f,;] {% id %}
