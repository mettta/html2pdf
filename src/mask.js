export default function addCSSMask({
  targetElement,
  maskHeight,
  maskWindow,
  maskTopPosition,
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
      transparent ${maskHeight}px
    );
            mask-image: linear-gradient(
              black 0,
              black ${maskWindow}px,
              transparent ${maskWindow}px,
              transparent ${maskHeight}px
            );
    -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
    -webkit-mask-size: 100% ${maskHeight}px;
            mask-size: 100% ${maskHeight}px;
    -webkit-mask-position: 100% ${maskTopPosition}px;
            mask-position: 100% ${maskTopPosition}px;
    -webkit-mask-repeat: repeat-y;
            mask-repeat: repeat-y;
    -webkit-mask-origin: border-box;
            mask-origin: border-box;
    `;
}
