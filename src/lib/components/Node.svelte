<script lang="ts">
  import { operators } from "../operators";
  import { draggable } from "../actions/draggable";
  import type { Operator } from "../types";
  import { graphStore, DataFlowGraph } from "../stores/graphStore";
  import { writable } from "svelte/store";
  import HydraRenderer from './HydraRenderer.svelte';
  // @ts-ignore
  export let key: string;
  export let position: { x: number; y: number } = { x: 0, y: 0 };
  export let operationName: keyof typeof operators;
  export let onDragMove: (key: string, dx: number, dy: number) => void;
  import { get } from "svelte/store";

  //make the operation of the node a "writable" so that it can be changed at runtime
  const op = writable<Operator<any, any>>(operators[operationName]);
  $: op.set(operators[operationName]);
  $: opExpression = $op.operation;
  $: inputCount = $op.dummyInputs.length ?? 0;
  $: ports = Array.from({ length: inputCount })
$: console.log("hello")
$: console.log(get(graphStore.data) instanceof DataFlowGraph)
  $: colimit = get(graphStore.data).colimit(key)[key]

  
 
  let previewResult: ReturnType<typeof opExpression>;
  $: previewResult = colimit();
 
  // Inline style for absolute positioning
  $: nodeStyle = `
  left: ${position.x}px;
  top: ${position.y}px;`

</script>

<div class="node" data-nodeid={key} style={nodeStyle} use:draggable={{key, onMove: onDragMove }}>
  <!-- Input ports -->
  <div class="portArray inputPorts">
    {#each ports as _, i}
      <div class="port round"></div>
    {/each}
  </div>
  <!-- Main content -->
  <!-- TODO: replace with a more robust condition -->
  <div class="nodeContent">
    <div class="operationName">{operationName}</div>
    {#if operationName.startsWith("hydra")} 
    <HydraRenderer synthFactory={colimit} />
    {:else}
    <div class="outputPreview">{colimit()}</div>
    {/if}
  </div>
  <!-- Output port -->
  <div class="portArray outputPorts">
    <div class="port round"></div>
  </div>
</div>

<style>
  * {
    color: #444;
  }
  .node,
  .port {
    border: 1px solid #444;
    background-color: #ccc;
  }
  .node {
    position: absolute;
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    box-sizing: border-box;
    justify-content: space-between;
  }
  .nodeContent {
    padding-bottom: .5em;
    display: flex;
    flex-direction: column;
    align-items:center ;
    gap: .5em;
    margin: 0 auto;
    width: 12ch;
  }
  .operationName {
    margin-bottom: 4px;
  }
  .outputPreview {
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    object-fit: contain;
  }
  .portArray {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: .5em;
  }
  .inputPorts {
    left: -0.5em;
  }
  .outputPorts {
    right: -0.5em;
  }
  .port {
    width: 1em;
    height: 1em;
    margin: 0;
    pointer-events: auto;
  }

  .round {
    border-radius: 50%;
  }


</style>
