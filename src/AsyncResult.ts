import { Result } from "./Result";
import { Async } from "./Async";

export interface AsyncResult<A, E> {
    (): Promise<Result<A, E>>;
}

const map =
    <A, B, E = unknown>(f: (a: A) => B) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.map(f));

const mapErr =
    <A, Ea, Eb>(f: (a: Ea) => Eb) =>
    (async: AsyncResult<A, Ea>): AsyncResult<A, Eb> =>
    () =>
        async().then(Result.mapErr(f));

const bind =
    <A, B, E = unknown>(f: (a: A) => Result<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.bind(f));

const Ok =
    <A, E = unknown>(ok: A): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.Ok(ok));

const Err =
    <E, A = unknown>(err: E): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.Err(err));

const ofResult =
    <A, E>(result: Result<A, E>): AsyncResult<A, E> =>
    () =>
        Promise.resolve(result);

const ofAsync =
    <A, E = unknown>(async: Async<A>): AsyncResult<A, E> =>
    () =>
        async().then(a => Result.Ok(a));

const tryCatch =
    <A>(mightThrow: Async<A>, onThrow?: (err: unknown) => Error): AsyncResult<A, Error> =>
    async () => {
        const toError = (err: unknown) =>
            err instanceof Error ? err : Error(String(err));

        try {
            return Result.Ok(await mightThrow());
        } catch (err) {
            return Result.Err(onThrow != null ? onThrow(err) : toError(err));
        }
    };

export const AsyncResult = {
    Ok,
    Err,
    map,
    mapErr,
    bind,
    ofResult,
    ofAsync,
    tryCatch,
};
