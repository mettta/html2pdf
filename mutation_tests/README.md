# Special fuzz / mutation tests

This directory contains special tests found via fuzzing and related experiments.

## How to run fuzz tests

Run fuzz tests from the **html2pdf4doc_python** project.
When a fuzz test produces a failure, copy the failing HTML output here.

## Where to store failing outputs

Use the `mutation_tests` subdirectory as a storage for failing outputs.

Convention:

- If the original output directory was `output`, store it as
  `mutation_tests/output_20251111`
  (replace the date with the day the failure was found).
- If you do **not** want to add this directory to the regular tree, prefix it with a double underscore:
  `mutation_tests/__output_20251111`.

## Investigating HTML cases

HTML files here are meant for investigation and reproduction.

To investigate, edit the script tag in the HTML and make sure the bundle is called with at least assertions, or with full debug logs:


```html
<script
  ...
  data-console-assert="true"
  data-forced-debug-mode="true"
  ...
></script>
```

## Testing with the current bundle

The output produced by **html2pdf4doc_python** includes the embedded script
`html2pdf4doc/html2pdf4doc_js/html2pdf4doc.min.js` that was used when the error was generated.

If you want to check how the case behaves with the current bundle:
  1.  Regenerate the bundle (`npm run build`).
  2.  Update the script tag in the HTML to:

```html
<script src="../../../../../../../dist/bundle.js"
  data-console-assert="true"
  data-forced-debug-mode="true"
  ...
></script>
```
