# Hydra Visual Editor

Hydra Visual Editor (HVE) is an ongoing attempt to build a visual editor for video synthesis on top of the hydra-synth engine by Olivia Jack

## Architecture

HVE is a test-bench of sorts for a couple of ideas that I've been nurturing regarding the architecture of reactive systems.
To the best of my knowledge, no reactive framework exposes the network of reactive dependancies as a first-class object that can be amended at runtime.


In HVE, the reactive program is exposed as a graph object, using the implementation provided by Graphology.
Graphology's base graph class is extended with a few niceties.
In particular there are two methods that do most of the heavy lifting (and which loosely adapt some concepts from category theory):

- one function to compute **pushouts** (a generalization of function composition that works even when operators have multiple inputs and outputs)
- one function to compute the **colimit** of a graph of operators (which you can think of as the result of iteratively applying pushouts to “stitch together” all upstream operators of a node into a single composite system).
    
The output of any node is given by evaluating the colimit of its ancestor graph.
All you need to do is wrap the computation of colimits into a reactive statement, and voilà.





