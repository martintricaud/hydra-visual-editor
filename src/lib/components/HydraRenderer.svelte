<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import type {HydraFactory} from '../types'
    export let synthFactory: any;

    let canvas: HTMLCanvasElement;
    let hydra: any;
    let currentFactory = synthFactory;

    onMount(async () => {
        await tick(); // wait for DOM bindings to complete

        if (!canvas) {
            console.error("Canvas not found");
            return;
        }

        console.log(typeof synthFactory(canvas))
        hydra = synthFactory()(canvas).out();
    });

    // React when synthFactory changes
    $: if (synthFactory !== currentFactory && canvas) {
        currentFactory = synthFactory;
        hydra = synthFactory()(canvas).out();
    }

    onDestroy(() => {
        if (hydra?.canvas?.remove) hydra.canvas.remove();
        hydra = null;
    });
</script>



<canvas
    class="hydra-canvas"
    bind:this={canvas}
    width={640}
    height={480}
    style="width: 100%; height: auto;"
></canvas>