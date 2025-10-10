



##### Margins at the page boundaries

- **A | split | B**
  The split point is equal to the starting element top without margin.
  The larger of the opposing margins is covered by the budget of the previous page.
  The top margin of the first element is reset to zero (and does not use the budget of the new page).

- **A1 || slice || A2**
  Wrapper clone cuts are executed by functions `markTopCut()` / `markBottomCut()`
  *(removes margins and borders)*.
  Sliced block content wrappers are executed by functions `markCleanTopCut()` / `markCleanBottomCut()`
  *(removes margins, borders, and **padding**)*.
