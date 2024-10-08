# Note: nothing is case insensitive here because it is assumed to only parse lowercase input.

@builtin "postprocessors.ne"

@{%
  function nop() { return undefined; }
  function literal(l) { return () => l; }
  function slugify(delegate) { return id(delegate).replaceAll(' ', '-'); }
  function spread(o) { return (delegate) => ({ ...id(delegate), ...o }); }
%}

SIMPLE_CHARGE[S, P] ->
    Singular __ $S (__ Posture {% nth(1) %}):? __ Coloration                             {% (d) => ({
      count: 1, posture: d[3], coloration: d[5]
    }) %}
  | Plural __ $P (__ Posture {% nth(1) %}):? __ Coloration (__ Placement {% nth(1) %}):? {% (d) => ({
      count: d[0], posture: d[3], coloration: d[5], placement: d[6]
    }) %}

SIMPLE_UNCOLORED_CHARGE[S, P] ->
    Singular __ $S (__ Posture {% nth(1) %}):?                             {% (d) => ({
      count: 1, posture: d[3]
    }) %}
  | Plural __ $P (__ Posture {% nth(1) %}):? (__ Placement {% nth(1) %}):? {% (d) => ({
      count: d[0], posture: d[3], placement: d[4]
    }) %}

Blazon ->
  EscutcheonContent (
      _ "." __ Inescutcheon _ ".":? {% nth(3) %}
    | (_ "."):?                     {% nop %}
  ) {% $({ main: 0, inescutcheon: 1 }) %}

EscutcheonContent ->
    SimpleField      {% id %}
  | PartitionedField {% id %}
  | Quartered        {% id %}

SimpleField ->
  Coloration (__ Charge {% nth(1) %}):* {% $({
    coloration: 0, charges: 1
  }) %}

Coloration ->
    Variation                 {% id %}
  | CounterchangeableTincture {% $({ tincture: 0 }) %}

CounterchangeableTincture ->
    Tincture         {% id %}
  | "counterchanged" {% id %}

Variation ->
  VariationName (__ Treatment {% nth(1) %}):? (__ "of" __ Plural {% nth(3) %}):? __ Tincture __ "and" __ Tincture {%
    $({ type: 0, treatment: 1, count: 2, first: 4, second: 8 })
  %}

PartitionedField ->
  (("party" | "parted") __):? "per" __ Direction (__ Treatment {% nth(1) %}):? __ Coloration __ "and" __ Coloration (__ Charge {% nth(1) %}):* {% $({
    partition: 3, treatment: 4, first: 6, second: 10, charges: 11
  }) %}

QuarteringPrefix ->
    "quarterly"                                  {% nop %}
  | (("party" | "parted") __):? "per" __ "cross" {% nop %}

Quartered ->
  QuarteringPrefix __ Quartering (__ Quartering {% nth(1) %}):* (__ "overall" __ Charge {% nth(3) %}):? {% (d) => ({
    quarters: [d[2], ...d[3]], overall: d[4]
  }) %}

Charge ->
    Ordinary __ "between" __ NonOrdinaryCharge                              {% $({ on: 0, surround: 4 }) %}
  | "on" __ Ordinary __ NonOrdinaryCharge                                   {% $({ on: 2, charge: 4 }) %}
  | "on" __ Ordinary __ "between" __ NonOrdinaryCharge __ NonOrdinaryCharge {% $({ on: 2, surround: 6, charge: 8 }) %}
  | Ordinary                                                                {% id %}
  | NonOrdinaryCharge                                                       {% id %}
  | Canton                                                                  {% id %}

Quartering ->
  (
    (QuarterName __ {% nth(0) %}):+ "and" __ {% nth(0) %}
  ):? QuarterName __ EscutcheonContent {% (d) => ({ quarters: [...(d[0] ?? []), d[1]], content: d[3] }) %}

Canton ->
    "a" __ "canton" __ Coloration                                    {% $({ canton: 4 }) %}
  | "on" __ "a" __ "canton" __ Coloration (__ Charge {% nth(1) %}):+ {% $({ canton: 6, charges: 7 }) %}

Ordinary ->
    Singular __ OrdinaryName (__ Treatment {% nth(1) %}):? (__ Coloration {% nth(1) %}):? __ "cotised" __ Coloration {% (d) => ({
      ordinary: d[2], treatment: d[3], coloration: d[4] ?? d[8], cotised: d[8]
    }) %}
  | Singular __ OrdinaryName (__ Treatment {% nth(1) %}):? __ Coloration {% $({
      ordinary: 2, treatment: 3, coloration : 5
    }) %}

NonOrdinaryCharge ->
    SIMPLE_CHARGE[("rondel" | "roundel"), ("rondels" | "roundels")]                       {% spread({ charge: 'rondel' }) %}
  | SIMPLE_CHARGE["mullet", "mullets"]                                                    {% spread({ charge: 'mullet' }) %}
  | SIMPLE_CHARGE["fret", "frets"]                                                        {% spread({ charge: 'fret' }) %}
  | SIMPLE_CHARGE["escallop", "escallops"]                                                {% spread({ charge: 'escallop' }) %}
  | SIMPLE_CHARGE[("fleur-de-lys" | "fleur-de-lis"), ("fleurs-de-lys" | "fleurs-de-lis")] {% spread({ charge: 'fleur-de-lys' }) %}
  | SIMPLE_UNCOLORED_CHARGE["bezant", "bezants"]                                          {% spread({ charge: 'rondel', coloration: { tincture: 'or' } }) %}
  | SIMPLE_UNCOLORED_CHARGE["torteau", ("torteaus" | "torteaux")]                         {% spread({ charge: 'rondel', coloration: { tincture: 'gules' } }) %}
  | SIMPLE_UNCOLORED_CHARGE["fountain", "fountains"]                                      {% spread({ charge: 'rondel', coloration: { type: 'barry', treatment: 'wavy', first: 'azure', second: 'argent', count: 8 } }) %}
  | Lion                                                                                  {% id %}
  | Escutcheon                                                                            {% id %}

Lion ->
  (
      # Don't bother to restrict to "a" as singular, this makes it easier to play with different charges.
      Singular __ "lion" {% literal(1) %}
    | Plural __ "lions"  {% nth(0) %}
  ) (__ LionAttitude {% nth(1) %}):? (__ Posture {% nth(1) %}):? __ Coloration (__ LionModifiers {% nth(1) %}):? (__ Placement {% nth(1) %}):? {% (d) => ({
    charge: "lion",
    count: d[0],
    attitude: d[1] ?? "rampant",
    posture: d[2],
    coloration: d[4],
    ...d[5],
    placement: d[6],
  }) %}

LionAttitude ->
    "rampant"            {% slugify %}
  | "rampant guardant"   {% slugify %}
  | "rampant reguardant" {% slugify %}
  | "passant"            {% slugify %}
  | "passant guardant"   {% slugify %}
  | "passant reguardant" {% slugify %}

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

Escutcheon ->
  (
    # Don't bother to restrict to "an" as singular, this makes it easier to play with different charges.
      Singular __ "escutcheon" {% literal(1) %}
    | Plural __ "escutcheons"  {% nth(0) %}
  ) __ EscutcheonContent (__ Posture {% nth(1) %}):? (__ Placement {% nth(1) %}):? {% (d) => ({
    charge: "escutcheon",
    count: d[0],
    content: d[2],
    posture: d[3],
    placement: d[4],
  }) %}

Inescutcheon ->
  "an" __ "inescutcheon" (__ Location {% nth(1) %}):? __ EscutcheonContent {% $({ location: 3, content: 5 }) %}

Singular ->
    "a"  {% nop %}
  | "an" {% nop %}

Plural ->
    "two"      {% literal(2) %}
  | "three"    {% literal(3) %}
  | "four"     {% literal(4) %}
  | "five"     {% literal(5) %}
  | "six"      {% literal(6) %}
  | "seven"    {% literal(7) %}
  | "eight"    {% literal(8) %}
  | "nine"     {% literal(9) %}
  | "ten"      {% literal(10) %}
  | "eleven"   {% literal(11) %}
  | "twelve"   {% literal(12) %}
  | "thirteen" {% literal(13) %}

Direction ->
    "bend"          {% id %}
  | "bend sinister" {% id %}
  | "chevron"       {% id %}
  | "fess"          {% id %}
  | "pale"          {% id %}
  | "saltire"       {% id %}

Placement ->
    "in" __ Direction {% nth(2) %}
  # Special case: things can be "in cross" but they can't be "party per cross". (It is synonymous
  # with "quarterly" but we don't allow it because it's a pain to implement.)
  | "in" __ "cross"   {% nth(2) %}

Location -> "in" __ ("chief" {% id %} | "base" {% id %}) {% nth(2) %}

QuarterName ->
    ("first" | "1st" | "(1)")  {% literal(1) %}
  | ("second" | "2nd" | "(2)") {% literal(2) %}
  | ("third" | "3rd" | "(3)")  {% literal(3) %}
  | ("fourth" | "4th" | "(4)") {% literal(4) %}

Posture ->
    "bendwise"          {% id %}
  | "bendwise sinister" {% id %}
  | "fesswise"          {% id %}
  | "palewise"          {% id %}

Tincture ->
    "argent"         {% id %}
  | "azure"          {% id %}
  | "gules"          {% id %}
  | "or"             {% id %}
  | "purpure"        {% id %}
  | "sable"          {% id %}
  | "vert"           {% id %}
  | "cendrée"        {% literal("cendree") %}
  | "ermine"         {% id %}
  | "ermines"        {% id %}
  | "erminois"       {% id %}
  | "pean"           {% id %}
  | "vair"           {% id %}

OrdinaryName ->
    "bend"          {% id %}
  | "bend sinister" {% id %}
  | "fess"          {% id %}
  | "cross"         {% id %}
  | "chevron"       {% id %}
  | "pale"          {% id %}
  | "saltire"       {% id %}
  | "chief"         {% id %}

VariationName ->
    "barry"            {% id %}
  | "barry bendy"      {% id %}
  | "bendy"            {% id %}
  | "bendy sinister"   {% id %}
  | "checky"           {% id %}
  | "chequey"          {% literal("checky") %}
  | "chevronny"        {% id %}
  | "fusilly"          {% id %}
  # It's unclear if any other variation can get modified in this way, so I didn't generalize it.
  | "fusilly in bends" {% id %}
  | "lozengy"          {% id %}
  | "paly"             {% id %}

Treatment ->
    "embattled"                   {% id %}
  | "embattled-counter-embattled" {% id %}
  | "engrailed"                   {% id %}
  | "indented"                    {% id %}
  | "wavy"                        {% id %}
  | "undy"                        {% literal("wavy") %}

_  -> whitespace:* {% nop %}
__ -> whitespace:+ {% nop %}

# Note that comma, colon and semicolon are considered, effectively, whitespace. They are not used to
# delimit anything that is not already delimited by whitespace.
whitespace -> [ \t\n\v\f,;:] {% id %}
