# Design notes and references

This is an original implementation. It does not copy the code, illustrations, or page structure of the references below. It adapts several broader interaction principles to a computational-neuroscience portfolio.

## Bruno Simon — portfolio as an environment

https://bruno-simon.com/

The portfolio behaves like a coherent world rather than a stack of unrelated documents. Here, the six-layer cortical field persists across every page. Scroll changes cortical depth and every click becomes part of the neural visual system.

## Distill — scientific communication native to the web

https://distill.pub/

https://distill.pub/2020/communicating-with-interactive-articles/

Distill shows how a research page can explain a question, model, result, and limitation rather than merely display a citation. The publication atlas follows that principle with plain-language sections and direct navigation while keeping the implementation easy to edit.

## Nicky Case — interaction as explanation

https://ncase.me/

https://ncase.me/neurons/

Small, legible interactions can make abstract systems tangible. The background burst gives immediate feedback; Concept Atlas cards expand into definitions, concrete examples, and neighboring ideas.

## Immersive Garden — procedural continuity

https://immersive-g.com/

Immersive sites often use a persistent visual grammar that changes with narrative position. This template maps the full length of each page continuously onto cortical layers L1 through L6, so pages of different lengths still traverse the complete depth.

## Research-specific visual grammar

- Cyan indicates signals, active paths, and primary actions.
- Violet indicates models, interacting systems, and secondary structure.
- Amber indicates translation, current role, dates, or clinically relevant direction.
- Large serif headings create a slow scientific-reading rhythm.
- Compact interface labels resemble annotations on an analysis dashboard.
- Publication figures are placed inside neutral light frames to preserve their original legibility.
- The cortical canvas remains behind the content and never carries essential information.

## Resulting design rules

1. The visual effect must support identity without obstructing reading.
2. Scientific claims must remain understandable without animation.
3. Interaction should provide immediate but restrained feedback.
4. The publication list must work as navigation, not only bibliography.
5. Each paper should expose its question, method, and result in plain language.
6. Biological heterogeneity should appear as a design principle, not visual noise.
7. Content editing should not require rebuilding the graphics engine.
8. The complete site must remain deployable as static HTML, CSS, and JavaScript.
