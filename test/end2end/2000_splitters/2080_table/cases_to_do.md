# TODO and tests

## Case: TD padding-top and offsetTop

### 📄 Description of the Case: TD padding-top and offsetTop

**Context**:

When splitting a table into parts based on the available page height, each TD cell might also need to be split.
To determine how much content can fit into the first part, we use:
 - firstPartHeight / fullPageHeight — the available space inside the TD.
 - offsetTop of child elements — to understand how far the content extends vertically.

Important:
firstPartHeight is already reduced by the TD shell contribution, including padding-top.
This means the available height already accounts for the top padding.

However:
 - Inside the TD, the browser calculates offsetTop starting from padding-top, not from the edge of the TD.
 - The first content element will have offsetTop = padding-top, not 0.

⸻

**Problem**:

If we compare offsetTop directly to firstPartHeight, we end up counting padding-top twice:
1️⃣ First, we subtracted it when calculating the available height.
2️⃣ Then we assume the content starts from padding-top (instead of 0).

Result:
 - The logic thinks less content fits than it actually does.
 - This leads to false detection of insufficient space.
 - Content splitting becomes incorrect, and unnecessary empty space may appear.

⸻

**Solution**:

We normalize offsetTop by subtracting padding-top.
This makes offsetTop measured from the top edge of the TD, just like firstPartHeight.

Now:
 - Both available height and offsetTop work in the same coordinate system.
 - padding-top is counted exactly once.

⸻

### ✅ Examples for Testing:

1️⃣ **Minimal TD with padding-top**
 - padding-top: 20px
 - Inside the TD, an element with margin-top: 0
 - The element is small, e.g., height: 10px
 - Available height is calculated as 100px - 20px = 80px
 - offsetTop will be 20px, after normalization — 0px.
 - Expected: the element correctly fits into the first part.

⸻

2️⃣ **TD without padding-top** (control case)
 - padding-top: 0
 - Ensure that normalization (-0) does not break behavior.
 - offsetTop = 0 remains 0.

⸻

3️⃣ **Multiple elements with margins**
 - padding-top: 30px
 - First element with margin-top: 0
 - Second element with margin-top: 50px
 - offsetTop of the first will be 30px → normalize to 0
 - offsetTop of the second will be 80px → normalize to 50px
 - Verify that both elements are correctly assessed: whether the second fits into the available space or not.
