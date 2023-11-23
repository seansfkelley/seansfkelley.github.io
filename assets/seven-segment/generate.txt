#!/usr/bin/env python3.10

from enum import IntFlag
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

  # this is a bitwise BFS, hence the names
  current = s & -s
  visited = current
  queue = current
  while queue:
    current = queue & -queue
    queue &= ~current
    unvisited_neighbors = NEIGHBORS[current] & ~visited & s
    queue |= unvisited_neighbors
    visited |= unvisited_neighbors
  return visited == s

KNOWN_PATTERNS = {
  A | B | C | D | E | F,     # 0, O
  B | C,                     # 1, l
  F | E,                     # 1, l (alt)
  A | B | G | E | D,         # 2
  A | B | G | C | D,         # 3
  F | G | B | C,             # 4
  A | F | G | C | D,         # 5, S
  A | F | E | D | C | G,     # 6
  F | E | D | C | G,         # 6 (alt)
  A | B | C,                 # 7
  F | A | B | C,             # 7 (alt)
  A | B | C | D | E | F | G, # 8, B
  G | F | A | B | C | D,     # 9
  G | F | A | B | C,         # 9 (alt)
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

def to_pattern(s):
  pattern = ''
  for (letter, value) in zip('abcdefg', (A, B, C, D, E, F, G)):
    if s & value:
      pattern += letter
  return pattern

VERBOSE = '--verbose' in sys.argv or '-v' in sys.argv

patterns = []
for s in range(128):
  if is_full_height(s) and is_connected(s) and is_novel(s):
    pattern = to_pattern(s)
    if VERBOSE:
      print(f'bit pattern: {s:07b} ; text pattern: {pattern}')
      display(s)
    patterns.append(pattern)

if VERBOSE:
  print(f'total: {len(patterns)}')
else:
  print('\n'.join(patterns))
