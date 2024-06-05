import type { NonNullish } from "../prelude"
import * as _Rec from "./Rec"

export type Rec<K extends string, V extends NonNullish> = _Rec.Rec<K, V>
export const Rec = _Rec
