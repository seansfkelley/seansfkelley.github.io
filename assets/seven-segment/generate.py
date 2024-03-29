#!/usr/bin/env python3.10

import sys

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

# yes, I get the irony of using a full Python dict to store 7 bytes indexed (effectively) by [0, 6]
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
  # note: x & -x computes the lowest bit, which we use here to pick "any arbitrary bit"
  # https://stackoverflow.com/questions/18806481/how-can-i-get-the-value-of-the-least-significant-bit-in-a-number

  # this is a bitwise graph traversal. it's almost BFS, but since we always choose the lowest order
  # bit as the next item, it uses an unordered set rather than a queue to hold the unvisited items.
  current = s & -s
  visited = current
  pending = current
  while pending:
    current = pending & -pending
    pending &= ~current
    unvisited_neighbors = NEIGHBORS[current] & ~visited & s
    pending |= unvisited_neighbors
    visited |= unvisited_neighbors
  return visited == s

KNOWN_PATTERNS = {
  A | B | C | D | E | F,     # 0, O, o
  B | C,                     # 1, l
  F | E,                     # 1, l (alt)
  A | B | G | E | D,         # 2, Z, z
  A | B | G | C | D,         # 3
  F | G | B | C,             # 4
  A | F | G | C | D,         # 5, S
  A | F | E | D | C | G,     # 6
  F | E | D | C | G,         # 6 (alt)
  A | B | C,                 # 7
  F | A | B | C,             # 7 (alt)
  A | B | C | D | E | F | G, # 8, B
  G | F | A | B | C | D,     # 9
  G | F | A | B | C,         # 9 (alt), q
  E | F | A | B | C | G,     # A
  A | B | C | D | E | G,     # a
  F | E | D | C | G,         # b
  A | F | E | D,             # C
  G | E | D | C | B,         # d
  A | F | E | D | G,         # E
  G | B | A | F | E | D,     # e
  A | F | E | G,             # F
  A | F | E | D | C,         # G
  F | E | G | B | C,         # H
  F | E | G | C,             # h
  B | C | D,                 # J
  B | C | D | E,             # J (alt)
  F | E | D,                 # L
  E | F | A | B | G,         # P, p
  F | E | D | G,             # t
  F | E | D | C | B,         # U
  F | G | B | C | D,         # y
}

def is_novel(s):
  return s not in KNOWN_PATTERNS

def to_ascii_art(s):
  string = ''

  def p(segment, text, end='\n'):
    nonlocal string
    if s & segment:
      string += text + end
    else:
      string += (' ' * len(text)) + end

  p(A, ' ___ ')
  p(F, '|   ', end='')
  p(B,     '|')
  p(G, ' --- ')
  p(E, '|   ', end='')
  p(C,     '|')
  p(D, ' ‾‾‾ ')

  return string

def to_pattern(s):
  return ''.join(letter for (letter, value) in zip('abcdefg', (A, B, C, D, E, F, G)) if s & value)

VERBOSE = '--verbose' in sys.argv or '-v' in sys.argv

patterns = []
for s in range(128):
  if is_full_height(s) and is_connected(s) and is_novel(s):
    pattern = to_pattern(s)
    if VERBOSE:
      print(f'bit pattern: {s:07b} ; text pattern: {pattern}')
      print(to_ascii_art(s))
    patterns.append(pattern)

if VERBOSE:
  print(f'total: {len(patterns)}')
else:
  print('\n'.join(patterns))
