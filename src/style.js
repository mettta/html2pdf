import SELECTOR from './selector';

export default class Style {

  constructor(config) {
    this.config = config;

    // TODO put SELECTOR here (use config for templates ID)
  }

  create() {
    // Make sure that the print margins (set for @page)
    // are NO LARGER than the corresponding indents
    // used for the the printable area,
    // to avoid overfilling the printable area and the mismatch
    // between preview and the flow processed by paged media.
    // Here it is reduced by 1 pixel for safety:

    // TODO config {value, unit}

    return `

  @page {
    size: A4;
    /* 2 values: width then height */
    size: ${this.config.printWidth + this.config.printUnits} ${this.config.printHeight + this.config.printUnits};

    margin-left: ${this.config.printLeftMargin - 1 + this.config.printUnits};
    margin-right: ${this.config.printRightMargin - 1 + this.config.printUnits};
    margin-top: ${this.config.printTopMargin - 0 + this.config.printUnits};
    margin-bottom: ${this.config.printBottomMargin - 2 + this.config.printUnits};
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
    width: ${this.config.printWidth - this.config.printLeftMargin - this.config.printRightMargin}${this.config.printUnits};
    font-size: ${this.config.printFontSize};

    /* protection against unpredictability of margins */
    padding-top: .1px;
    padding-bottom: ${this.config.virtualPagesGap * 2 + this.config.screenUnits};
  }

  ${SELECTOR.virtualPaper} {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(min-content, max-content) minmax(min-content, max-content) 1fr minmax(min-content, max-content) minmax(min-content, max-content);
    place-items: stretch stretch;
    place-content: stretch stretch;
    width: ${this.config.printWidth - this.config.printLeftMargin - this.config.printRightMargin}${this.config.printUnits};
    height: ${this.config.printHeight}${this.config.printUnits};
    font-size: ${this.config.printFontSize};
  }

  ${SELECTOR.virtualPaper}::before {
    position: absolute;
    content: '';
    width: ${this.config.printWidth}${this.config.printUnits};
    height: ${this.config.printHeight}${this.config.printUnits};
    left: -${this.config.printLeftMargin}${this.config.printUnits};
    background-color: #fff;
    box-shadow: rgba(0, 0, 0, 0.1) 2px 2px 12px 0px;
    z-index: -1;
  }

  ${SELECTOR.headerContent} {
    display: block;
    padding-bottom: ${this.config.headerMargin}${this.config.screenUnits};
  }

  ${SELECTOR.footerContent} {
    display: block;
    padding-top: ${this.config.footerMargin}${this.config.screenUnits};
  }

  ${SELECTOR.paperFlow} {
    position: absolute;
    width: 100%;
    z-index: -1;
    /* affect only screen */
    padding-bottom: 100px;
  }

  ${SELECTOR.runningSafety} {
    display: block;
    padding: .1px;
  }

  ${SELECTOR.virtualPaperTopMargin} {
    display: block;
    height: ${this.config.printTopMargin}${this.config.printUnits};
  }

  ${SELECTOR.virtualPaperBottomMargin} {
    display: block;
    height: ${this.config.printBottomMargin}${this.config.printUnits};
  }

  ${SELECTOR.virtualPaperGap} {
    display: block;
    padding-top: ${this.config.virtualPagesGap}${this.config.screenUnits};
  }

  ${SELECTOR.frontpageContent} {
    display: block;
    transform-origin: top center;
    padding: .1px;
    height: 100%;
  }

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

  @media print {
    ${SELECTOR.root} {
      /* to prevent a blank last page */
      padding: 0;
    }

    ${SELECTOR.paperFlow} {
      padding-bottom: 0;
    }

    ${SELECTOR.printIgnore},
    ${SELECTOR.virtualPaper} {
      display: contents;
    }

    ${SELECTOR.virtualPaper}::before,
    ${SELECTOR.printHide},
    ${SELECTOR.virtualPaperTopMargin},
    ${SELECTOR.virtualPaperBottomMargin},
    ${SELECTOR.virtualPaperGap} {
      display: none;
    }

    ${SELECTOR.printPageBreak} {
      break-after: page;
      padding: .1px;
    }

    ${SELECTOR.printForcedPageBreak} {
      /* JUST MANUAL! */
      /* break-after: page; */
    }

    ${SELECTOR.printNoBreak} {
      break-inside: avoid-page;
    }
  }

  /* FOR TEST */
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
  }
  ${SELECTOR.frontpageContent} {
    background: #00fcff20;
  }

  ${SELECTOR.neutral} {
    background: #00ffee10;
  }

  [filler] {
    background:repeating-linear-gradient(
      -45deg,
      rgba(0, 175, 255, .1),
      rgba(0, 175, 255, .1) 10px,
      rgba(0, 175, 255, .15) 10px,
      rgba(0, 175, 255, .15) 20px
    );
  }

`
  }
}
