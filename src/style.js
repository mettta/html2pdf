import SELECTOR from './selector.js';

export default class Style {

  constructor(config) {
    this.config = config;

    // TODO put SELECTOR here (use config for templates ID)

    this.charWidth = '10px'; // TODO get from calculations
  }

  create() {
    // Make sure that the print margins (set for @page)
    // are NO LARGER than the corresponding indents
    // used for the the printable area,
    // to avoid overfilling the printable area and the mismatch
    // between preview and the flow processed by paged media.
    // Here it is reduced by 1 pixel for safety:

    // TODO config {value, unit}

    return this._baseStyle() + this._testStyle();
  }

  // ***   @page {
  // ***     ...
  // ***     /* margin-bottom: calc(${this.config.printBottomMargin} - 2px); */
  // ***     margin-bottom: 0;
  // ***    }
  // In this way we allow content to be theoretically printed on the bottom margin.
  // And we leave it up to the printer to decide whether to print there or not.
  // And in this way we avoid extra blank pages when some pixel
  // of the invisible lower margin does not "fit" in the area to be printed.

  _baseStyle() {
    return `

@page {
  size: A4;
  /* 2 values: width then height */
  size: ${this.config.printWidth} ${this.config.printHeight};

  margin-left: ${this.config.printLeftMargin};
  margin-right: ${this.config.printRightMargin};
  margin-top: ${this.config.printTopMargin};
  margin-bottom: 0; /* hack */
}

${SELECTOR.root} {
  /* reset user styles */
  display: block;

  /* for proper printable flow positioning */
  position: relative;

  /* to compensate for possible BG in the parent node */
  z-index: 1;

  /* set print styles: affects previews */
  margin: 0 auto;
  width: calc(${this.config.printWidth} - ${this.config.printLeftMargin} - ${this.config.printRightMargin});
  font-size: ${this.config.printFontSize};

  /* protection against unpredictability of margins */
  padding-top: .1px;
  padding-bottom: calc(2 * ${this.config.virtualPagesGap});
}

${SELECTOR.contentFlowStart},
${SELECTOR.contentFlowEnd},
${SELECTOR.pageDivider} {
  display: block;
  /* to avoid the effect of margins of neighboring elements on the positioning of this marker: */
  overflow: auto;
}

${SELECTOR.virtualPaper} {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(min-content, max-content) minmax(min-content, max-content) 1fr minmax(min-content, max-content) minmax(min-content, max-content);
  place-items: stretch stretch;
  place-content: stretch stretch;
  width: calc(${this.config.printWidth} - ${this.config.printLeftMargin} - ${this.config.printRightMargin});
  height: ${this.config.printHeight};
  font-size: ${this.config.printFontSize};
}

${SELECTOR.virtualPaper}::before {
  position: absolute;
  content: '';
  width: ${this.config.printWidth};
  height: ${this.config.printHeight};
  left: -${this.config.printLeftMargin};
  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.1) 2px 2px 12px 0px;
  z-index: -1;
}

${SELECTOR.paperFooter},
${SELECTOR.paperHeader} {
  display: block;
  position: relative;
}

${SELECTOR.headerContent},
${SELECTOR.footerContent} {
  display: block;
  font-size: small;
}

${SELECTOR.headerContent} p,
${SELECTOR.footerContent} p {
  margin: 0;
}

${SELECTOR.headerContent} {
  padding-bottom: ${this.config.headerMargin};
  /* padding-top: 1px; */
  /* Page numbers: */
  padding-top: 10px;
}

${SELECTOR.footerContent} {
  padding-top: ${this.config.footerMargin};
  /* padding-bottom: 1px; */
  /* Page numbers: */
  min-height: 32px;
}

${SELECTOR.tocPageNumber} {
  min-width: 3ch;
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
}

${SELECTOR.pageNumberRoot} {
  display: flex;
  column-gap: 2px;
  position: absolute;
  /* left: 100%; */
  right: 0;
  text-align: right;
  line-height: 1;
}

${SELECTOR.headerContent} ${SELECTOR.pageNumberRoot} {
  top: 0;
}

${SELECTOR.footerContent} ${SELECTOR.pageNumberRoot} {
  bottom: 0;
}

${SELECTOR.paperFlow} {
  display: block;
  position: absolute;
  width: 100%;
  z-index: -1;
  /* affect only screen */
  padding-bottom: 100px;
}

${SELECTOR.contentFlow} {
  display: block;
}

${SELECTOR.runningSafety} {
  display: block;
  overflow: auto;
}

${SELECTOR.virtualPaperTopMargin} {
  display: block;
  height: ${this.config.printTopMargin};
}

${SELECTOR.virtualPaperBottomMargin} {
  display: block;
  height: ${this.config.printBottomMargin};
}

${SELECTOR.virtualPaperGap} {
  display: block;
  padding-top: ${this.config.virtualPagesGap};
}

${SELECTOR.paperBody} {
  display: block;
}

${SELECTOR.frontpageContent} {
  display: block;
  transform-origin: top center;
  padding: .1px;
  height: 100%;
}

.null {
  display: inline;
  padding: 0;
  margin: 0;
  font: 0;
  color: transparent;
  line-height: 0;
  border: none;
  outline: none;
  background: none;
  background-color: transparent;
}

${SELECTOR.word},
${SELECTOR.textNode},
${SELECTOR.textLine},
${SELECTOR.textGroup},
${SELECTOR.neutral},
${SELECTOR.neutral} span {
  display: inline;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  line-height: inherit;
  background: none;
  background-color: transparent;
}

${SELECTOR.textGroup} {
  display: block;
}

/*${SELECTOR.split} ${SELECTOR.textGroup} {
  display: inline;
}*/

${SELECTOR.complexTextBlock} > ${SELECTOR.textLine} {
  /* Firefox and inconsistent values of offset top for inline element */
  display: inline-block;
  // TODO: it removes spaces between parts of the string, it should leave the text inline after processing.
}

${SELECTOR.textGroup} ${SELECTOR.textLine} {
  display: inline;
}

${SELECTOR.complexTextBlock} {
  display: block;
}

${SELECTOR.complexTextBlock} ${SELECTOR.complexTextBlock} {
  display: inline;
}

${SELECTOR.printPageBreak} {
  display: block;
}

${SELECTOR.printForcedPageBreak} {
  display: block;
  visibility: hidden;
  height: 0;
  overflow: hidden;
}

@media print {
  ${SELECTOR.root} {
    /* to prevent a blank last page */
    padding: 0;
  }

  ${SELECTOR.paperFlow} {
    padding-bottom: 0;
  }

  ${SELECTOR.contentFlow} {
    -webkit-mask-image: none !important;
            mask-image: none !important;
  }

  ${SELECTOR.printIgnore} {
    display: contents;
  }

  ${SELECTOR.printHide},
  ${SELECTOR.virtualPaper}::before,
  ${SELECTOR.virtualPaperTopMargin},
  ${SELECTOR.virtualPaperBottomMargin},
  ${SELECTOR.virtualPaperGap} {
    display: none;
  }

  ${SELECTOR.virtualPaper} {
    break-inside: avoid;
    height: auto;
  }

  ${SELECTOR.paperBody} {
    break-inside: avoid;
  }

  ${SELECTOR.printPageBreak} {
    break-after: page;
    /* padding: .1px; */
    overflow: auto;
  }

  ${SELECTOR.printForcedPageBreak} {
    /* JUST MANUAL! */
    /* break-after: page; */
  }

  ${SELECTOR.flagNoBreak} {
    /*
    TODO: temporary commented!
    When splitting blocks, printPageBreak falls INTO this element,
    and in Firefox it causes a blank page.
    FIX the split of complex blocks and check in Firefox.
    */
    /* break-inside: avoid-page; */
  }
}

/* arrangement */
${SELECTOR.topCutPart} {
  margin-top: 0 !important;
  border-top: none !important;
}
${SELECTOR.bottomCutPart} {
  margin-bottom: 0 !important;
  border-bottom: none !important;
}
    `;
  }

  _testStyle() {
    return this.config.debugMode ?
    `
/* FOR TEST */
${SELECTOR.contentFlow} {
  background:repeating-linear-gradient(
    -45deg,
    rgba(222, 222, 222, .1),
    rgba(222, 222, 222, .1) 10px,
    rgba(222, 222, 222, .2) 10px,
    rgba(222, 222, 222, .2) 20px
  );
}

${SELECTOR.virtualPaperGap} {
  background: #ff000020;
}

${SELECTOR.paperFooter},
${SELECTOR.paperHeader} {
  background: #fa96ff20;
}
${SELECTOR.paperBody} {
  background: #ffee0020;
}
${SELECTOR.runningSafety} {
  background: #f200ff;
  outline: 0.1px solid #f200ff88;
}
${SELECTOR.frontpageContent} {
  background: #00fcff20;
}

${SELECTOR.neutral} {
  background: #00ffee10;
}

${SELECTOR.textNode} {
  background: #00ff0010;
}

${SELECTOR.textGroup},
${SELECTOR.textLine} {
  background: #0000ff08;
}

    ` : '';
  }
}
