/** Extra Sm-category (Math Symbol) Unicode glyphs not in symbols_art.
 *  Commands sourced from KaTeX symbol definitions, intersected with
 *  Unicode UCD category Sm. All glyphs are East-Asian-Width N/Na/A
 *  (single column), safe for monospace layout.
 */

export const symbolsExtra: Record<string, string[]> = {
  // Relations (negated, ordering variants, equality variants)
  "lt": ["<"], // U+0003C  less-than sign
  "gt": [">"], // U+0003E  greater-than sign
  "nleftarrow": ["↚"], // U+0219A  leftwards arrow with stroke
  "nrightarrow": ["↛"], // U+0219B  rightwards arrow with stroke
  "twoheadrightarrow": ["↠"], // U+021A0  rightwards two headed arrow
  "rightarrowtail": ["↣"], // U+021A3  rightwards arrow with tail
  "nleftrightarrow": ["↮"], // U+021AE  left right arrow with stroke
  "nLeftrightarrow": ["⇎"], // U+021CE  left right double arrow with stroke
  "nRightarrow": ["⇏"], // U+021CF  rightwards double arrow with stroke
  "backepsilon": ["∍"], // U+0220D  small contains as member
  "varpropto": ["∝"], // U+0221D  proportional to
  "shortmid": ["∣"], // U+02223  divides
  "nmid": ["∤"], // U+02224  does not divide
  "shortparallel": ["∥"], // U+02225  parallel to
  "nparallel": ["∦"], // U+02226  not parallel to
  "thicksim": ["∼"], // U+0223C  tilde operator
  "backsim": ["∽"], // U+0223D  reversed tilde
  "nsim": ["≁"], // U+02241  not tilde
  "eqsim": ["≂"], // U+02242  minus tilde
  "ncong": ["≆"], // U+02246  approximately but not actually equal to
  "thickapprox": ["≈"], // U+02248  almost equal to
  "approxeq": ["≊"], // U+0224A  almost equal or equal to
  "Bumpeq": ["≎"], // U+0224E  geometrically equivalent to
  "bumpeq": ["≏"], // U+0224F  difference between
  "doteqdot": ["≑"], // U+02251  geometrically equal to
  "Doteq": ["≑"], // U+02251  geometrically equal to
  "fallingdotseq": ["≒"], // U+02252  approximately equal to or the image of
  "risingdotseq": ["≓"], // U+02253  image of or approximately equal to
  "eqcirc": ["≖"], // U+02256  ring in equal to
  "circeq": ["≗"], // U+02257  ring equal to
  "triangleq": ["≜"], // U+0225C  delta equal to
  "leqq": ["≦"], // U+02266  less-than over equal to
  "geqq": ["≧"], // U+02267  greater-than over equal to
  "lneqq": ["≨"], // U+02268  less-than but not equal to
  "gneqq": ["≩"], // U+02269  greater-than but not equal to
  "between": ["≬"], // U+0226C  between
  "nless": ["≮"], // U+0226E  not less-than
  "ngtr": ["≯"], // U+0226F  not greater-than
  "nleq": ["≰"], // U+02270  neither less-than nor equal to
  "ngeq": ["≱"], // U+02271  neither greater-than nor equal to
  "lesssim": ["≲"], // U+02272  less-than or equivalent to
  "gtrsim": ["≳"], // U+02273  greater-than or equivalent to
  "lessgtr": ["≶"], // U+02276  less-than or greater-than
  "gtrless": ["≷"], // U+02277  greater-than or less-than
  "preccurlyeq": ["≼"], // U+0227C  precedes or equal to
  "succcurlyeq": ["≽"], // U+0227D  succeeds or equal to
  "precsim": ["≾"], // U+0227E  precedes or equivalent to
  "succsim": ["≿"], // U+0227F  succeeds or equivalent to
  "nprec": ["⊀"], // U+02280  does not precede
  "nsucc": ["⊁"], // U+02281  does not succeed
  "nsubseteq": ["⊈"], // U+02288  neither a subset of nor equal to
  "nsupseteq": ["⊉"], // U+02289  neither a superset of nor equal to
  "subsetneq": ["⊊"], // U+0228A  subset of with not equal to
  "supsetneq": ["⊋"], // U+0228B  superset of with not equal to
  "vDash": ["⊨"], // U+022A8  true
  "Vdash": ["⊩"], // U+022A9  forces
  "Vvdash": ["⊪"], // U+022AA  triple vertical bar right turnstile
  "nvdash": ["⊬"], // U+022AC  does not prove
  "nvDash": ["⊭"], // U+022AD  not true
  "nVdash": ["⊮"], // U+022AE  does not force
  "nVDash": ["⊯"], // U+022AF  negated double vertical bar double right turnstile
  "vartriangleleft": ["⊲"], // U+022B2  normal subgroup of
  "vartriangleright": ["⊳"], // U+022B3  contains as normal subgroup
  "trianglerighteq": ["⊵"], // U+022B5  contains as normal subgroup or equal to
  "origof": ["⊶"], // U+022B6  original of
  "imageof": ["⊷"], // U+022B7  image of
  "multimap": ["⊸"], // U+022B8  multimap
  "backsimeq": ["⋍"], // U+022CD  reversed tilde equals
  "Subset": ["⋐"], // U+022D0  double subset
  "Supset": ["⋑"], // U+022D1  double superset
  "pitchfork": ["⋔"], // U+022D4  pitchfork
  "lll": ["⋘"], // U+022D8  very much less-than
  "llless": ["⋘"], // U+022D8  very much less-than
  "ggg": ["⋙"], // U+022D9  very much greater-than
  "gggtr": ["⋙"], // U+022D9  very much greater-than
  "lesseqgtr": ["⋚"], // U+022DA  less-than equal to or greater-than
  "gtreqless": ["⋛"], // U+022DB  greater-than equal to or less-than
  "curlyeqprec": ["⋞"], // U+022DE  equal to or precedes
  "curlyeqsucc": ["⋟"], // U+022DF  equal to or succeeds
  "npreceq": ["⋠"], // U+022E0  does not precede or equal
  "nsucceq": ["⋡"], // U+022E1  does not succeed or equal
  "lnsim": ["⋦"], // U+022E6  less-than but not equivalent to
  "gnsim": ["⋧"], // U+022E7  greater-than but not equivalent to
  "precnsim": ["⋨"], // U+022E8  precedes but not equivalent to
  "succnsim": ["⋩"], // U+022E9  succeeds but not equivalent to
  "ntriangleleft": ["⋪"], // U+022EA  not normal subgroup of
  "ntriangleright": ["⋫"], // U+022EB  does not contain as normal subgroup
  "ntrianglelefteq": ["⋬"], // U+022EC  not normal subgroup of or equal to
  "ntrianglerighteq": ["⋭"], // U+022ED  does not contain as normal subgroup or equal
  "Longleftarrow": ["⟸"], // U+027F8  long leftwards double arrow
  "Longrightarrow": ["⟹"], // U+027F9  long rightwards double arrow
  "Longleftrightarrow": ["⟺"], // U+027FA  long left right double arrow
  "leqslant": ["⩽"], // U+02A7D  less-than or slanted equal to
  "geqslant": ["⩾"], // U+02A7E  greater-than or slanted equal to
  "lessapprox": ["⪅"], // U+02A85  less-than or approximate
  "gtrapprox": ["⪆"], // U+02A86  greater-than or approximate
  "lneq": ["⪇"], // U+02A87  less-than and single-line not equal to
  "gneq": ["⪈"], // U+02A88  greater-than and single-line not equal to
  "lnapprox": ["⪉"], // U+02A89  less-than and not approximate
  "gnapprox": ["⪊"], // U+02A8A  greater-than and not approximate
  "lesseqqgtr": ["⪋"], // U+02A8B  less-than above double-line equal above greater-than
  "gtreqqless": ["⪌"], // U+02A8C  greater-than above double-line equal above less-than
  "eqslantless": ["⪕"], // U+02A95  slanted equal to or less-than
  "eqslantgtr": ["⪖"], // U+02A96  slanted equal to or greater-than
  "precneqq": ["⪵"], // U+02AB5  precedes above not equal to
  "succneqq": ["⪶"], // U+02AB6  succeeds above not equal to
  "precapprox": ["⪷"], // U+02AB7  precedes above almost equal to
  "succapprox": ["⪸"], // U+02AB8  succeeds above almost equal to
  "precnapprox": ["⪹"], // U+02AB9  precedes above not almost equal to
  "succnapprox": ["⪺"], // U+02ABA  succeeds above not almost equal to
  "subseteqq": ["⫅"], // U+02AC5  subset of above equals sign
  "supseteqq": ["⫆"], // U+02AC6  superset of above equals sign
  "subsetneqq": ["⫋"], // U+02ACB  subset of above not equal to
  "supsetneqq": ["⫌"], // U+02ACC  superset of above not equal to

  // Binary operators
  "dotplus": ["∔"], // U+02214  dot plus
  "smallsetminus": ["∖"], // U+02216  set minus
  "circledcirc": ["⊚"], // U+0229A  circled ring operator
  "circledast": ["⊛"], // U+0229B  circled asterisk operator
  "circleddash": ["⊝"], // U+0229D  circled dash
  "boxplus": ["⊞"], // U+0229E  squared plus
  "boxminus": ["⊟"], // U+0229F  squared minus
  "boxdot": ["⊡"], // U+022A1  squared dot operator
  "intercal": ["⊺"], // U+022BA  intercalate
  "veebar": ["⊻"], // U+022BB  xor
  "barwedge": ["⊼"], // U+022BC  nand
  "centerdot": ["⋅"], // U+022C5  dot operator
  "divideontimes": ["⋇"], // U+022C7  division times
  "ltimes": ["⋉"], // U+022C9  left normal factor semidirect product
  "rtimes": ["⋊"], // U+022CA  right normal factor semidirect product
  "leftthreetimes": ["⋋"], // U+022CB  left semidirect product
  "rightthreetimes": ["⋌"], // U+022CC  right semidirect product
  "curlyvee": ["⋎"], // U+022CE  curly logical or
  "curlywedge": ["⋏"], // U+022CF  curly logical and
  "Cap": ["⋒"], // U+022D2  double intersection
  "doublecap": ["⋒"], // U+022D2  double intersection
  "Cup": ["⋓"], // U+022D3  double union
  "doublecup": ["⋓"], // U+022D3  double union
  "lessdot": ["⋖"], // U+022D6  less-than with dot
  "gtrdot": ["⋗"], // U+022D7  greater-than with dot
  "doublebarwedge": ["⩞"], // U+02A5E  logical and with double overbar

  // N-ary / large operators
  "intop": ["∫"], // U+0222B  integral
  "iint": ["∬"], // U+0222C  double integral
  "iiint": ["∭"], // U+0222D  triple integral
  "oiint": ["∯"], // U+0222F  surface integral
  "oiiint": ["∰"], // U+02230  volume integral
  "bigwedge": ["⋀"], // U+022C0  n-ary logical and
  "bigvee": ["⋁"], // U+022C1  n-ary logical or
  "bigcap": ["⋂"], // U+022C2  n-ary intersection
  "bigcup": ["⋃"], // U+022C3  n-ary union
  "bigodot": ["⨀"], // U+02A00  n-ary circled dot operator
  "bigoplus": ["⨁"], // U+02A01  n-ary circled plus operator
  "bigotimes": ["⨂"], // U+02A02  n-ary circled times operator
  "biguplus": ["⨄"], // U+02A04  n-ary union operator with plus
  "bigsqcup": ["⨆"], // U+02A06  n-ary square union operator

  // Opening delimiters
  "lVert": ["∥"], // U+02225  parallel to
  "lmoustache": ["⎰"], // U+023B0  upper left or lower right curly bracket section

  // Closing delimiters
  "rVert": ["∥"], // U+02225  parallel to
  "rmoustache": ["⎱"], // U+023B1  upper right or lower left curly bracket section

  // Punctuation
  "cdotp": ["⋅"], // U+022C5  dot operator

  // Ordinary symbols
  "Game": ["⅁"], // U+02141  turned sans-serif capital g
  "nexists": ["∄"], // U+02204  there does not exist
  "varnothing": ["∅"], // U+02205  empty set
  "measuredangle": ["∡"], // U+02221  measured angle
  "sphericalangle": ["∢"], // U+02222  spherical angle
  "varvdots": ["⋮"], // U+022EE  vertical ellipsis
  "blacklozenge": ["⧫"], // U+029EB  black lozenge
};
