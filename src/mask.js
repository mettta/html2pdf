export function generateCSSMask({
  maskStep,
  maskWindow,
  maskFirstShift,
}) {
    // We have different units being used (mm, px, ...),
    // and they can also be changed by the user in the configs.
    // Therefore, we will rely on the actual rendering
    // rather than the parameters from the pre-calculated layout.

    // We take the print area window, and the height of the page + gap,
    // and then push down to the height of the top margin.
    // And repeat vertically.

    // ${SELECTOR.root}::after
    // Safety placeholder for the bottom margin of the paper.
    // Works together with the mask in media print mode:
    // -- the mask shows the content window,
    // -- the bottom margin of the page is zero, to prevent overflow,
    // -- a strip (h=printBottomMargin) in the color of the paper (can be changed in the Config)
    //    is added to the bottom margin on each page.

    return `
    -webkit-mask-image: linear-gradient(
      black 0,
      black ${maskWindow}px,
      transparent ${maskWindow}px,
      transparent ${maskStep}px
    );
            mask-image: linear-gradient(
              black 0,
              black ${maskWindow}px,
              transparent ${maskWindow}px,
              transparent ${maskStep}px
            );
    -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
    -webkit-mask-size: 100% ${maskStep}px;
            mask-size: 100% ${maskStep}px;
    -webkit-mask-position: 100% ${maskFirstShift}px;
            mask-position: 100% ${maskFirstShift}px;
    -webkit-mask-repeat: repeat-y;
            mask-repeat: repeat-y;
    -webkit-mask-origin: border-box;
            mask-origin: border-box;
    `;
}

export function addInlineCSSMask({
  targetElement,
  maskStep,
  maskWindow,
  maskFirstShift,
}) {
    // The mask is only needed at preview time.
    // Mask canceled in @media print.
    // We have different units being used (mm, px, ...),
    // and they can also be changed by the user in the configs.
    // Therefore, we will rely on the actual rendering
    // rather than the parameters from the pre-calculated layout.

    // We take the print area window, and the height of the page + gap,
    // and then push down to the height of the top margin.
    // And repeat vertically.

    targetElement.style = `
    -webkit-mask-image: linear-gradient(
      black 0,
      black ${maskWindow}px,
      transparent ${maskWindow}px,
      transparent ${maskStep}px
    );
            mask-image: linear-gradient(
              black 0,
              black ${maskWindow}px,
              transparent ${maskWindow}px,
              transparent ${maskStep}px
            );
    -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
    -webkit-mask-size: 100% ${maskStep}px;
            mask-size: 100% ${maskStep}px;
    -webkit-mask-position: 100% ${maskFirstShift}px;
            mask-position: 100% ${maskFirstShift}px;
    -webkit-mask-repeat: repeat-y;
            mask-repeat: repeat-y;
    -webkit-mask-origin: border-box;
            mask-origin: border-box;
    `;
}
