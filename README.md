# Hydra Visual Editor

Hydra Visual Editor (HVE) is an ongoing attempt to build a visual editor for video synthesis on top of the hydra-synth engine by Olivia Jack

## Architecture

HVE is a test-bench of sorts for a couple of ideas that I've been nurturing regarding the architecture of reactive systems.
To the best of my knowledge, no reactive framework exposes the network of reactive dependancies as a first-class object that can be amended at runtime.
In HVE, the reactive program is exposed as a graph object, using the implementation provided by Graphology.
Graphology's base graph class is extended with a few niceties, namely a method to compute the colimit of a diagram (this will sound familiar to categoricians).
The core idea is that the observable value at any output port of a diagram is the colimit of the ancestor graph at that point. 
For now, the colimit is computed with the assumption that the graph is acyclic.





