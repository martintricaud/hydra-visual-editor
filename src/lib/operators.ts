import * as R from 'ramda';
import type { Args, Product, Endo, Synth, NaryFunction, Operator, HydraFactory } from './types';
// @ts-ignore
import Hydra from 'hydra-synth';

const emptySynthFactory:HydraFactory = ()=>(canvas: HTMLCanvasElement) => { return new Hydra({ canvas: canvas, makeGlobal: false, detectAudio: false }).synth }
const defaultSynthFactory:HydraFactory = ()=>(canvas: HTMLCanvasElement) => { return new Hydra({ canvas: canvas, makeGlobal: false, detectAudio: false }).synth.osc(60, 0.1, 0) }
export const operators = {
    // Math Operators
    add: {
        operation: R.add as Product<number>,
        dummyInputs: [() => 1, () => 1],
    } as Operator<[number, number], number>,
    subtract: {
        operation: R.subtract as Product<number>,
        dummyInputs: [() => 2, () => 1],
    } as Operator<[number, number], number>,
    multiply: {
        operation: R.multiply as Product<number>,
        dummyInputs: [() => 2, () => 3],
    } as Operator<[number, number], number>,
    divide: {
        operation: R.divide as Product<number>,
        dummyInputs: [() => 6, () => 2],
    } as Operator<[number, number], number>,
    abs: {
        operation: Math.abs as Endo<number>,
        dummyInputs: [() => -5],
    } as Operator<[number], number>,
    pow: {
        operation: Math.pow as (a: number, b: number) => number,
        dummyInputs: [() => 2, () => 3],
    } as Operator<[number, number], number>,
    sqrt: {
        operation: Math.sqrt as Endo<number>,
        dummyInputs: [() => 16],
    } as Operator<[number], number>,
    min: {
        operation: Math.min as Product<number>,
        dummyInputs: [() => 5, () => 3],
    } as Operator<[number, number], number>,
    max: {
        operation: Math.max as Product<number>,
        dummyInputs: [() => 5, () => 3],
    } as Operator<[number, number], number>,
    clamp: {
        operation: ((value: number, min: number, max: number) => Math.min(Math.max(value, min), max)),
        dummyInputs: [() => 5, () => 0, () => 10],
    } as Operator<[number, number, number], number>,
    // Logic Operators
    and: {
        operation: (a: boolean, b: boolean) => a && b,
        dummyInputs: [() => true, () => true],
    } as Operator<[boolean, boolean], boolean>,
    or: {
        operation: (a: boolean, b: boolean) => a || b,
        dummyInputs: [() => true, () => false],
    } as Operator<[boolean, boolean], boolean>,
    not: {
        operation: (a: boolean) => !a,
        dummyInputs: [() => true],
    } as Operator<[boolean], boolean>,
    xor: {
        operation: (a: boolean, b: boolean) => a !== b,
        dummyInputs: [() => true, () => false],
    } as Operator<[boolean, boolean], boolean>,
    greater: {
        operation: (a: number, b: number) => a > b,
        dummyInputs: [() => 5, () => 3],
    } as Operator<[number, number], boolean>,
    less: {
        operation: (a: number, b: number) => a < b,
        dummyInputs: [() => 3, () => 5],
    } as Operator<[number, number], boolean>,
    equal: {
        operation: (a: number, b: number) => a === b,
        dummyInputs: [() => 5, () => 5],
    } as Operator<[number, number], boolean>,
    // Vector Operators
    vec2: {
        operation: (x: number, y: number): [number, number] => [x, y],
        dummyInputs: [() => 1, () => 2],
    } as Operator<[number, number], [number, number]>,
    vec3: {
        operation: (x: number, y: number, z: number): [number, number, number] => [x, y, z],
        dummyInputs: [() => 1, () => 2, () => 3],
    } as Operator<[number, number, number], [number, number, number]>,
    vec4: {
        operation: (x: number, y: number, z: number, w: number): [number, number, number, number] => [x, y, z, w],
        dummyInputs: [() => 1, () => 2, () => 3, () => 4],
    } as Operator<[number, number, number, number], [number, number, number, number]>,
    dot: {
        operation: (a: number[], b: number[]): number => R.sum(R.zipWith(R.multiply, a, b)),
        dummyInputs: [() => [1, 2, 3], () => [4, 5, 6]],
    } as Operator<[number[], number[]], number>,
    cross: {
        operation: (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ],
        dummyInputs: [() => [1, 0, 0], () => [0, 1, 0]],
    } as Operator<[[number, number, number], [number, number, number]], [number, number, number]>,
    length: {
        operation: (vector: number[]): number => Math.sqrt(R.sum(vector.map(x => x * x))),
        dummyInputs: [() => [3, 4]],
    } as Operator<[number[]], number>,
    normalize: {
        operation: (vector: number[]): number[] => {
            const len = Math.sqrt(R.sum(vector.map(x => x * x)));
            return vector.map(x => x / len);
        },
        dummyInputs: [() => [3, 4]],
    } as Operator<[number[]], number[]>,
    // Hydra Operators
    hydraNoise: {
        operation: (hydraFactory: HydraFactory, scale: number, offset: number) => {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["noise"](scale, offset)},
        dummyInputs: [emptySynthFactory, () => 10, () => 0.1]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraVoronoi:{
        operation: (hydraFactory: HydraFactory, scale: number = 5, speed: number = 0.3, blending: number = 0.3) => {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["voronoi"](scale, speed, blending)},
        dummyInputs: [emptySynthFactory, () => 5, () => 0.3, () => 0.3]
    } as Operator<[HydraFactory, number, number, number], HydraFactory>,

    hydraOsc: {
        operation: (hydraFactory: HydraFactory, frequency: number = 60, sync: number = 0.1, offset: number = 0) => {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["osc"](frequency, sync, offset)},
        dummyInputs: [emptySynthFactory, () => 60, () => 0.1, () => 0]
    } as Operator<[HydraFactory, number, number, number], HydraFactory>,

    hydraShape:{
        operation: (hydraFactory: HydraFactory, sides: number = 3, radius: number = 0.3, smoothing: number = 0.01) => {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["shape"](sides, radius, smoothing)},
        dummyInputs: [emptySynthFactory, () => 3, () => 0.3, () => 0.01]
    } as Operator<[HydraFactory, number, number, number], HydraFactory>,

    hydraGradient:{
        operation: (hydraFactory: HydraFactory, speed: number = 1) => {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["gradient"](speed)},
        // dummyInputs: {speed: 1}
        dummyInputs: [emptySynthFactory, () => 1]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraSolid:{
        operation: (hydraFactory: HydraFactory, r: number = 1, g: number = 1, b: number = 1, a: number = 1) => {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["solid"](r, g, b, a)},
        dummyInputs: [emptySynthFactory, () => 1, () => 1, () => 1, () => 1]
    } as Operator<[HydraFactory, number, number, number, number], HydraFactory>,
    hydraGeometry:{
        operation: (hydraFactory: HydraFactory, x: number = 1, y: number = 1, z: number = 1) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["geometry"](x, y, z)},
        dummyInputs: [emptySynthFactory, () => 1, () => 1, () => 1]
    } as Operator<[HydraFactory, number, number, number], HydraFactory>,

    hydraRotate:{
        operation: (hydraFactory: HydraFactory, angle: number = 0.1, speed: number = 0, offset: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["rotate"](angle, speed, offset)},
        dummyInputs: [defaultSynthFactory, () => 0.1, () => 0, () => 0]
    } as Operator<[HydraFactory, number, number, number], HydraFactory>,

    hydraScale:{
        operation: (hydraFactory: HydraFactory, amount: number = 1.5, xMult: number = 1, yMult: number = 1) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["scale"](amount, xMult, yMult)},
        dummyInputs: [defaultSynthFactory, () => 1.5, () => 1, () => 1]
    } as Operator<[HydraFactory, number, number, number], HydraFactory>,

    hydraPixelate:{
        operation: (hydraFactory: HydraFactory, x: number = 20, y: number = 20) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["pixelate"](x, y)},
        dummyInputs: [defaultSynthFactory, () => 20, () => 20]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraRepeat:{
        operation: (hydraFactory: HydraFactory, x: number = 3, y: number = 3, offsetX: number = 0, offsetY: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["repeat"](x, y, offsetX, offsetY)},
        dummyInputs: [defaultSynthFactory, () => 3, () => 3, () => 0, () => 0]
    } as Operator<[HydraFactory, number, number, number, number], HydraFactory>,

    hydraRepeatX:{
        operation: (hydraFactory: HydraFactory, reps: number = 3, offset: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["repeatX"](reps, offset)},
        dummyInputs: [defaultSynthFactory, () => 3, () => 0]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraRepeatY:{
        operation: (hydraFactory: HydraFactory, reps: number = 3, offset: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["repeatY"](reps, offset)},
        dummyInputs: [defaultSynthFactory, () => 3, () => 0]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraKaleid:{
        operation: (hydraFactory: HydraFactory, nSides: number = 4) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["kaleid"](nSides)},
        dummyInputs: [defaultSynthFactory, () => 4]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraScrollX:{
        operation: (hydraFactory: HydraFactory, scroll: number = 0.5, speed: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["scrollX"](scroll, speed)},
        dummyInputs: [defaultSynthFactory, () => 0.5, () => 0]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraScrollY:{
        operation: (hydraFactory: HydraFactory, scroll: number = 0.5, speed: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["scrollY"](scroll, speed)},
        dummyInputs: [defaultSynthFactory, () => 0.5, () => 0]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraPosterize: {
        operation: (hydraFactory: HydraFactory, bins: number = 3, gamma: number = 0.6) => {
            return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["posterize"](bins, gamma)
        },
        dummyInputs: [defaultSynthFactory, () => 3, () => 0.6]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraShift:{
        operation: (hydraFactory: HydraFactory, r: number = 0.5, g: number = 0, b: number = 0, a: number = 0) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["shift"](r, g, b, a)},
        dummyInputs: [defaultSynthFactory,() => 0.5, () => 0, () => 0, () => 0]
    } as Operator<[HydraFactory, number, number, number, number], HydraFactory>,

    hydraInvert:{
        operation: (hydraFactory: HydraFactory, amount: number = 1) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["invert"](amount)},
        dummyInputs: [defaultSynthFactory,() => 1]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraContrast:{
        operation: (hydraFactory: HydraFactory, amount: number = 1.6) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["contrast"](amount)},
        dummyInputs: [defaultSynthFactory,() => 1.6]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraBrightness:{
        operation: (hydraFactory: HydraFactory, amount: number = 0.4) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["brightness"](amount)},
        dummyInputs: [defaultSynthFactory,() => 0.4]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraLuma:{
        operation: (hydraFactory: HydraFactory, threshold: number = 0.5, tolerance: number = 0.1) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["luma"](threshold, tolerance)},
        dummyInputs: [defaultSynthFactory,() => 0.5, () => 0.1]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraThresh:{
        operation: (hydraFactory: HydraFactory, threshold: number = 0.5, tolerance: number = 0.04) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["thresh"](threshold, tolerance)},
        dummyInputs: [defaultSynthFactory,() => 0.5, () => 0.04]
    } as Operator<[HydraFactory, number, number], HydraFactory>,

    hydraColor:{
        operation: (hydraFactory: HydraFactory, r: number = 1, g: number = 1, b: number = 1, a: number = 1) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["color"](r, g, b, a)},
        dummyInputs: [defaultSynthFactory,() => 1, () => 1, () => 1, () => 1]
    } as Operator<[HydraFactory, number, number, number, number], HydraFactory>,

    hydraSaturate:{
        operation: (hydraFactory: HydraFactory, amount: number = 2) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["saturate"](amount)},
        dummyInputs: [defaultSynthFactory,() => 2]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraHue:{
        operation: (hydraFactory: HydraFactory, hue: number = 0.4) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["hue"](hue)},
        dummyInputs: [defaultSynthFactory,() => 0.4]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraColorama:{
        operation: (hydraFactory: HydraFactory, amount: number = 0.005) =>  {return (canvas: HTMLCanvasElement) => hydraFactory(canvas)["colorama"](amount)},
        dummyInputs: [defaultSynthFactory,() => 0.005]
    } as Operator<[HydraFactory, number], HydraFactory>,

    hydraAdd:{
        operation: (hydraSource1: HydraFactory, hydraSource2: HydraFactory, amount: number = 1) =>  {return (canvas: HTMLCanvasElement) => hydraSource1(canvas)["add"](hydraSource2(canvas), amount)},
        dummyInputs: [defaultSynthFactory, defaultSynthFactory, () => 1]
    } as  Operator<[HydraFactory, HydraFactory, number], HydraFactory>,

    hydraLayer:{
        operation: (hydraSource1: any, hydraSource2: any) => {return (canvas: HTMLCanvasElement) => hydraSource1(canvas)["layer"](hydraSource2(canvas))},
        dummyInputs: [defaultSynthFactory,defaultSynthFactory]
    } as Operator<[HydraFactory, Synth], HydraFactory>,

    hydraBlend: {
        operation: (hydraSource1: HydraFactory, hydraSource2: HydraFactory, amount: number = 0.5) => {return (canvas: HTMLCanvasElement) => hydraSource1(canvas)["blend"](hydraSource2(canvas), amount)},
        dummyInputs: [defaultSynthFactory, defaultSynthFactory, () => 0.5]
    } as Operator<[HydraFactory, HydraFactory, number], HydraFactory>,

    // hydraMult:{
    //     operation: (hydraSource1: any, hydraSource2: any, amount: number = 0.5) => hydraSource1["mult"](hydraSource2, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number], HydraFactory>,

    // hydraDiff:{
    //     operation: (hydraSource1: any, hydraSource2: any) => hydraSource1["diff"](hydraSource2)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance]
    // } as Operator<[HydraFactory, Synth], HydraFactory>,

    // hydraMask:{
    //     operation: (hydraSource1: any, hydraSource2: any) => hydraSource1["mask"](hydraSource2)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance]
    // } as Operator<[HydraFactory, Synth], HydraFactory>,

    // hydraModulateRepeat:{
    //     operation: (hydraSource1: any, hydraSource2: any, repeat: number = 3, amount: number = 0.5) => hydraSource1["modulateRepeat"](hydraSource2, repeat, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 3, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulateRepeatX:{
    //     operation: (hydraSource1: any, hydraSource2: any, repeat: number = 3, amount: number = 0.5) => hydraSource1["modulateRepeatX"](hydraSource2, repeat, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 3, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulateRepeatY:{
    //     operation: (hydraSource1: any, hydraSource2: any, repeat: number = 3, amount: number = 0.5) => hydraSource1["modulateRepeatY"](hydraSource2, repeat, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 3, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulateKaleid:{
    //     operation: (hydraSource1: any, hydraSource2: any, nSides: number = 4) => hydraSource1["modulateKaleid"](hydraSource2, nSides)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance,() => 4]
    // } as Operator<[HydraFactory, Synth, number], HydraFactory>,

    // hydraModulateScrollX:{
    //     operation: (hydraSource1: any, hydraSource2: any, scroll: number = 0.5, speed: number = 0) => hydraSource1["modulateScrollX"](hydraSource2, scroll, speed)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 3, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulateScrollY:{
    //     operation: (hydraSource1: any, hydraSource2: any, scroll: number = 0.5, speed: number = 0) => hydraSource1["modulateScrollY"](hydraSource2, scroll, speed)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 3, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulate:{
    //     operation: (hydraSource1: any, hydraSource2: any, amount: number = 0.5) => hydraSource1["modulate"](hydraSource2, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number], HydraFactory>,

    // hydraModulateScale:{
    //     operation: (hydraSource1: any, hydraSource2: any, amount: number = 0.5) => hydraSource1["modulateScale"](hydraSource2, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 0.5]
    // } as Operator<[HydraFactory, Synth, number], HydraFactory>,

    // hydraModulatePixelate:{
    //     operation: (hydraSource1: any, hydraSource2: any, x: number = 20, y: number = 20) => hydraSource1["modulatePixelate"](hydraSource2, x, y)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 20, () => 20]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulateRotate:{
    //     operation: (hydraSource1: any, hydraSource2: any, angle: number = 0.1, speed: number = 0) => hydraSource1["modulateRotate"](hydraSource2, angle, speed)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 0.1, () => 0]
    // } as Operator<[HydraFactory, Synth, number, number], HydraFactory>,

    // hydraModulateHue:{
    //     operation: (hydraSource1: any, hydraSource2: any, amount: number = 0.4) => hydraSource1["modulateHue"](hydraSource2, amount)},

    //     dummyInputs: [defaultSynthFactory,makeHydraInstance, () => 0.4]
    // } as Operator<[HydraFactory, Synth, number], HydraFactory>,
} as const;



/**
 * ConcatArgs<T> recursively concatenates the argument tuple types of a tuple of functions T.
 * For example, if T = [f1, f2, f3] and
 *   f1: (a: string, b: number) => any
 *   f2: (c: boolean) => any
 *   f3: (d: number, e: number) => any
 * then ConcatArgs<T> = [string, number, boolean, number, number]
 */
type ConcatArgs<T extends any[]> =
    T extends [infer F, ...infer R]
    ? [...Args<F>, ...ConcatArgs<R extends any[] ? R : []>]
    : [];

/**
 * fanIn takes an array of functions F and a function G, and returns a function that takes all arguments for F (flattened),
 * applies each f in F to its arguments, and calls G with the results.
 *
 * Example:
 *   function double(x) { return 2*x; }
 *   function add(x, y) { return x + y; }
 *   function sub(x, y) { return x - y; }
 *   const h = foo([double, add], sub);
 *   h(3, 4, 5) // sub(double(3), add(4, 5)) => sub(6, 9) => -3
 */
export function fanIn<F extends NaryFunction<any[], any>[], G extends NaryFunction<any[], any>>(F: F, G: G): (...args: ConcatArgs<F>) => ReturnType<G> {
    // Compute the arity of each function in F
    const arities = F.map(f => f.length ?? 0);
    // Compute the start index for each function's arguments
    const argStarts = arities.reduce<number[]>((acc, arity, i) => {
        acc.push(i === 0 ? 0 : acc[i - 1] + arities[i - 1]);
        return acc;
    }, []);
    return (...args: any[]) => {
        const results = F.map((f, i) => {
            const start = argStarts[i];
            const end = start + arities[i];
            return f(...args.slice(start, end));
        });
        return G(...results);
    };
}