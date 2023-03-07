/** Used primarily for logging or tracing in function pipelines.
 * Execute some arbitrary side-effect function using the piped value
 * and return the value unchanged.
 *
 * @example
 * pipe(
 *     42,
 *     tee(console.log), // logs `42`
 *     double,
 *     String
 * );
 * // returns "84"
 */
export const tee =
    <A>(f: (a: A) => void) =>
    (a: A) => {
        f(a)
        return a
    }

/** Used primarily for logging or tracing in function pipelines.
 * Execute some arbitrary side-effect function using the value
 * resolved from the Promise and return the value unchanged.
 *
 * @example
 * await pipe(
 *     Promise.resolve(10),
 *     teeAsync(console.log), // logs `10`. Using `tee` would log the Promise object
 *     p => p.then(n => n * 2)
 * ); // yields `20`
 */
export const teeAsync =
    <A>(f: (a: A) => void) =>
    (p: Promise<A>) =>
        p.then(a => {
            f(a)
            return a
        })
