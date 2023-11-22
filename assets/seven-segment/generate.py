#!/usr/bin/env python3

from enum import IntFlag

# https://en.wikipedia.org/wiki/Seven-segment_display_character_representations
# ┌─ A ─┐
# F     B
# ├─ G ─┤
# E     C
# └─ D ─┘
A = 1 << 6
B = 1 << 5
C = 1 << 4
D = 1 << 3
E = 1 << 2
F = 1 << 1
G = 1 << 0

TOP_ROW = B | F
BOT_ROW = C | E

def is_full_height(s):
  return s & TOP_ROW and s & BOT_ROW

NEIGHBORS = {
  A: B | F,
  B: A | C | G,
  C: B | D | G,
  D: C | E,
  E: D | F | G,
  F: A | E | G,
  G: B | C | E | F,
}

def is_connected(s):
  for segment in (A, B, C, D, E, F, G):
    if s & segment and not (s & NEIGHBORS[segment]):
      return False
  return True

KNOWN_PATTERNS = {
  A | B | C | D | E | F,     # 0
  B | C,                     # 1
  F | E,                     # 1 (alt)
  A | B | G | E | D,         # 2
  A | B | G | C | D,         # 3
  F | G | B | C | D,         # 4
  A | F | G | C | D,         # 5
  A | F | E | D | C | G,     # 6
  F | E | D | C | G,         # 6 (alt)
  A | B | C,                 # 7
  F | A | B | C,             # 7 (alt)
  A | B | C | D | E | F | G, # 8
  G | F | A | B | C | D,     # 9
  G | F | A | B | C,         # 9 (alt)
}

def is_novel(s):
  return s not in KNOWN_PATTERNS

def display(s):
  def p(segment, text, end='\n'):
    if s & segment:
      print(text, end=end)
    else:
      print(' ' * len(text), end=end)

  p(A, ' ___ ')
  p(F, '|   ', end='')
  p(B,     '|')
  p(G, ' --- ')
  p(E, '|   ', end='')
  p(C,     '|')
  p(D, ' ‾‾‾ ')

count = 0
for s in range(128):
  if is_full_height(s) and is_connected(s) and is_novel(s):
    count += 1
    print(f'bit pattern: {s}')
    display(s)
    print()

print(f'total: {count}')
