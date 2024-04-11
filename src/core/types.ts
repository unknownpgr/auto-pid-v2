export type N0 = 0;
export type N1 = 1;
export type N2 = 2;
export type N3 = 3;
export type N4 = 4;
export type N5 = 5;
export type N6 = 6;
export type N7 = 7;
export type N8 = 8;
export type N9 = 9;
export type N10 = 10;

export type NumberN = N0 | N1 | N2 | N3 | N4 | N5 | N6 | N7 | N8 | N9 | N10;

export type Array0<T = number> = readonly [];
export type Array1<T = number> = readonly [T];
export type Array2<T = number> = readonly [T, T];
export type Array3<T = number> = readonly [T, T, T];
export type Array4<T = number> = readonly [T, T, T, T];
export type Array5<T = number> = readonly [T, T, T, T, T];
export type Array6<T = number> = readonly [T, T, T, T, T, T];
export type Array7<T = number> = readonly [T, T, T, T, T, T, T];
export type Array8<T = number> = readonly [T, T, T, T, T, T, T, T];
export type Array9<T = number> = readonly [T, T, T, T, T, T, T, T, T];
export type Array10<T = number> = readonly [T, T, T, T, T, T, T, T, T, T];

export type ArrayOf<T = number> = {
  0: Array0<T>;
  1: Array1<T>;
  2: Array2<T>;
  3: Array3<T>;
  4: Array4<T>;
  5: Array5<T>;
  6: Array6<T>;
  7: Array7<T>;
  8: Array8<T>;
  9: Array9<T>;
  10: Array10<T>;
};
