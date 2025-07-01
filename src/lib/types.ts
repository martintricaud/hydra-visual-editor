// @ts-ignore
import Hydra from 'hydra-synth';
// Foundational type utilities for the project


export type Obj = Record<string, any>;
export type Endo<A> = (a: A) => A;
export type Product<A> = (a: A, b: A) => A;
export type Constraint<A, B> = (a: A) => Endo<B>;
export type Function<A, B> = (a: A) => B; 
export type NaryFunction<Args extends any[] = any[], B = any> = (...args: Args) => B;
export type Always<A> = (x: any) => A;
export type Map<A> = Record<string, A>;
export type Point = {
    x: number,
    y: number,
}
export type NodeWidget = {
    position: Point;
    dimensions: Point;
    }
export type Operator<A extends any[], B> = {
    operation: (...args: A) => B;
    dummyInputs: { [K in keyof A]: () => A[K] };
};
export type Synth = InstanceType<typeof Hydra>;

// Args<T> extracts the argument tuple type from a function type T
export type Args<T> = T extends (...args: infer A) => any ? A : never;

export type HydraFactory = (canvas: HTMLCanvasElement) => Synth
