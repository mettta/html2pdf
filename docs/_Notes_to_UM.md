
### Browser extensions garbage injections

Some browser extensions inject invisible elements into the page (usually inside the BODY). Although they are not displayed, they can still affect the page height calculation during pagination — most often visible on the last page.
To prevent such distortions:
- wrap your content in a container other than BODY;
- or enable the `data-garbage-selectors` option when invoking the plugin.  In that case, specify stable selectors of elements that should be removed from the DOM before pagination calculations.

### Zero margins on page start / end?

Elements located on either side of a page break lose their external margins. If you want to keep empty space at the top of a new page (for example, before an H1 heading), use padding instead of margin.
For instance, add a top padding inside the element defined by data-page-break-before-selectors.
