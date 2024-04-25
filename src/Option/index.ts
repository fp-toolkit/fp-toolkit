import type { NonNullish } from "../prelude"
import * as _Option from "./Option"

export type Option<A extends NonNullish> = _Option.Option<A>
export const Option = _Option
