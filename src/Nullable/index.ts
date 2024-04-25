import type { NonNullish } from "../prelude"
import * as _Nullable from "./Nullable"

export type Nullable<A extends NonNullish> = _Nullable.Nullable<A>
export const Nullable = _Nullable
