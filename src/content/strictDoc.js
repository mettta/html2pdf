const text = `
<header class="layout_header">
  <p>StrictDoc <span class="document-view-type">Printable Document</span></p>
</header>

<main class="layout_main">

  <div class="content" html2pdf>

    <template html2pdf-header>

      <header class="pdf-header">

        <div class="pdf-header__main">
          <div class="pdf-header__title">
            A Practical Tutorial on Modified Condition/ Decision Coverage
          </div>
          <div class="pdfPageNumber">
            <span class="current"></span>
            of
            <span class="total"></span>
          </div>
        </div>
        <div class="pdf-header__aside">
          <div>COM_PRJ_DOC_NUM.0.1</div>
          <div>Version 0.1</div>
          <div>03.03.2021</div>
        </div>

      </header>

    </template>

    <template html2pdf-frontpage>

      <div class="frontpage">
        <div class="frontpage__top">
          <div class="frontpage__adress">
            <div>XYZ GmbH</div>
            <div>Zermatter Str. 160B</div>
            <div>13000 Berlin, Germany</div>
            <div>https://github.com/strictdoc-project/strictdoc.git/</div>
          </div>
        </div>
        <div class="frontpage__middle">
          <div class="frontpage__document-title">A Practical Tutorial on Modified Condition/ Decision Coverage</div>
          <div class="frontpage__document-subtitle">A Long Subtitle that can be a project subtitle or a project context.
          </div>
        </div>
        <div class="frontpage__bottom">

          <table class="frontpage__infotable">
            <tr>
              <td>Document ref:</td>
              <td colspan="3">COM_PRJ_DOC_NUM.0.1</td>
            </tr>
            <tr>
              <td>Version no.:</td>
              <td colspan="3">0.1</td>
            </tr>
            <tr>
              <td>Version date:</td>
              <td colspan="3">03.03.2021</td>
            </tr>
            <tr>
              <th>Function</th>
              <th>Name</th>
              <th>Company</th>
              <th>Signature/Date</th>
            </tr>
            <tr>
              <td>Prepared by</td>
              <td>Stanislav Pankevich</td>
              <td>StrictDoc</td>
              <td></td>
            </tr>
            <tr>
              <td>Reviewed by</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>Approved by</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </table>
        </div>
      </div>

    </template>

    <template html2pdf-footer>

      <footer class="pdf-footer">
        <div class="pdf-footer__copywrite">© 2021 StrictDoc GmbH</div>
        <div class="pdf-footer__copywrite-text">
          This document is not&nbsp;to&nbsp;be reproduced, modified, adapted, published, translated
          in&nbsp;any&nbsp;material form in&nbsp;whole or in&nbsp;part without the&nbsp;prior written permission
          of&nbsp;XYZ as&nbsp;the&nbsp;proprietor of&nbsp;this&nbsp;document.
        </div>
      </footer>

    </template>



    <div id="printableFlow" class="printable_flow">

      <h1 class="printable">Table of contents</h1>
      <h2 class="printable">Table of contents</h2>
      <h3 class="printable">Table of contents</h3>
      <h4 class="printable">Table of contents</h4>
      <h5 class="printable">Table of contents</h5>
      <h6 class="printable">Table of contents</h6>

      <ul class="toc printable breakable">
        <li><a href="#Introduction">
            <span class="section-number">1</span>
            Introduction
          </a></li>
        <li><a href="#Examples">
            <span class="section-number">2</span>
            Examples
          </a></li>
        <li><a href="#Getting-started">
            <span class="section-number">3</span>
            Getting started
          </a>
          <ul>
            <li><a href="#Requirements">
                <span class="section-number">3.1</span>
                Requirements
              </a></li>
            <li><a href="#Installing-StrictDoc-as-a-Pip-package-recommended-way-">
                <span class="section-number">3.2</span>
                Installing StrictDoc as a Pip package (recommended way)
              </a></li>
            <li><a href="#Installing-StrictDoc-from-GitHub-developer-mode-">
                <span class="section-number">3.3</span>
                Installing StrictDoc from GitHub (developer mode)
              </a></li>
            <li><a href="#Hello-world">
                <span class="section-number">3.4</span>
                Hello world
              </a></li>
          </ul>
        </li>
        <li><a href="#SDoc-syntax">
            <span class="section-number">4</span>
            SDoc syntax
          </a>
          <ul>
            <li><a href="#Document-structure">
                <span class="section-number">4.1</span>
                Document structure
              </a>
              <ul>
                <li><a href="#Strict-rule-1-One-empty-line-between-all-nodes">
                    <span class="section-number">4.1.1</span>
                    Strict rule #1: One empty line between all nodes
                  </a></li>
                <li><a href="#Strict-rule-2-No-content-is-allowed-outside-of-SDoc-grammar">
                    <span class="section-number">4.1.2</span>
                    Strict rule #2: No content is allowed outside of SDoc grammar
                  </a></li>
              </ul>
            </li>
            <li><a href="#Grammar-elements">
                <span class="section-number">4.2</span>
                Grammar elements
              </a>
              <ul>
                <li><a href="#Document">
                    <span class="section-number">4.2.1</span>
                    Document
                  </a></li>
                <li><a href="#Requirement">
                    <span class="section-number">4.2.2</span>
                    Requirement
                  </a>
                  <ul>
                    <li><a href="#UID">
                        <span class="section-number">4.2.2.1</span>
                        UID
                      </a></li>
                    <li><a href="#References">
                        <span class="section-number">4.2.2.2</span>
                        References
                      </a></li>
                    <li><a href="#Comment">
                        <span class="section-number">4.2.2.3</span>
                        Comment
                      </a></li>
                    <li><a href="#Rationale">
                        <span class="section-number">4.2.2.4</span>
                        Rationale
                      </a></li>
                    <li><a href="#Special-fields">
                        <span class="section-number">4.2.2.5</span>
                        Special fields
                      </a></li>
                  </ul>
                </li>
                <li><a href="#Section">
                    <span class="section-number">4.2.3</span>
                    Section
                  </a>
                  <ul>
                    <li><a href="#Nesting-sections">
                        <span class="section-number">4.2.3.1</span>
                        Nesting sections
                      </a></li>
                    <li><a href="#Free-text">
                        <span class="section-number">4.2.3.2</span>
                        Free text
                      </a></li>
                  </ul>
                </li>
                <li><a href="#Composite-requirement">
                    <span class="section-number">4.2.4</span>
                    Composite requirement
                  </a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a href="#Export-options">
            <span class="section-number">5</span>
            Export options
          </a>
          <ul>
            <li><a href="#HTML-documentation-tree-by-StrictDoc">
                <span class="section-number">5.1</span>
                HTML documentation tree by StrictDoc
              </a>
              <ul>
                <li><a href="#Standalone-HTML-pages-experimental-">
                    <span class="section-number">5.1.1</span>
                    Standalone HTML pages (experimental)
                  </a></li>
              </ul>
            </li>
            <li><a href="#HTML-export-via-Sphinx">
                <span class="section-number">5.2</span>
                HTML export via Sphinx
              </a></li>
            <li><a href="#PDF-export-via-Sphinx-LaTeX">
                <span class="section-number">5.3</span>
                PDF export via Sphinx/LaTeX
              </a></li>
          </ul>
        </li>
        <li><a href="#Options">
            <span class="section-number">6</span>
            Options
          </a>
          <ul>
            <li><a href="#Parallelization">
                <span class="section-number">6.1</span>
                Parallelization
              </a></li>
          </ul>
        </li>
        <li><a href="#StrictDoc-and-other-tools">
            <span class="section-number">7</span>
            StrictDoc and other tools
          </a>
          <ul>
            <li><a href="#StrictDoc-and-Doorstop">
                <span class="section-number">7.1</span>
                StrictDoc and Doorstop
              </a></li>
            <li><a href="#StrictDoc-and-Sphinx">
                <span class="section-number">7.2</span>
                StrictDoc and Sphinx
              </a></li>
            <li><a href="#StrictDoc-and-Sphinx-Needs">
                <span class="section-number">7.3</span>
                StrictDoc and Sphinx-Needs
              </a></li>
          </ul>
        </li>
        <li><a href="#StrictDoc-Requirements">
            <span class="section-number">8</span>
            StrictDoc Requirements
          </a>
          <ul>
            <li><a href="#Project-goals">
                <span class="section-number">8.1</span>
                Project goals
              </a>
              <ul>
                <li><a href="#GOAL-1-TOOL-SUPPORT">
                    <span class="section-number">8.1.1</span>
                    Software support for writing requirements and specifications documents
                  </a></li>
                <li><a href="#GOAL-2-REDUCE-DOCUMENTATION-HAZARDS">
                    <span class="section-number">8.1.2</span>
                    Reduce documentation hazards
                  </a></li>
                <li><a href="#GOAL-3-NO-RUNAWAY-DOCUMENTATION">
                    <span class="section-number">8.1.3</span>
                    No (or less) run-away documentation
                  </a></li>
                <li><a href="#GOAL-4-CHANGE-MANAGEMENT">
                    <span class="section-number">8.1.4</span>
                    Change management
                  </a></li>
              </ul>
            </li>
            <li><a href="#High-level-requirements">
                <span class="section-number">8.2</span>
                High-level requirements
              </a>
              <ul>
                <li><a href="#SDOC-HIGH-REQS-MANAGEMENT">
                    <span class="section-number">8.2.1</span>
                    Requirements management
                  </a></li>
                <li><a href="#SDOC-HIGH-DATA-MODEL">
                    <span class="section-number">8.2.2</span>
                    Data model
                  </a></li>
                <li><a href="#Command-line-interface">
                    <span class="section-number">8.2.3</span>
                    Command-line interface
                  </a></li>
                <li><a href="#Platform-support">
                    <span class="section-number">8.2.4</span>
                    Platform support
                  </a>
                  <ul>
                    <li><a href="#macOS-support">
                        <span class="section-number">8.2.4.1</span>
                        macOS support
                      </a></li>
                    <li><a href="#Linux-support">
                        <span class="section-number">8.2.4.2</span>
                        Linux support
                      </a></li>
                    <li><a href="#Windows-support">
                        <span class="section-number">8.2.4.3</span>
                        Windows support
                      </a></li>
                  </ul>
                </li>
                <li><a href="#Requirements-validation">
                    <span class="section-number">8.2.5</span>
                    Requirements validation
                  </a></li>
                <li><a href="#Requirements-text-format">
                    <span class="section-number">8.2.6</span>
                    Requirements text format
                  </a></li>
                <li><a href="#Linking-requirements">
                    <span class="section-number">8.2.7</span>
                    Linking requirements
                  </a></li>
                <li><a href="#Scalability">
                    <span class="section-number">8.2.8</span>
                    Scalability
                  </a></li>
                <li><a href="#SDOC-HIGH-REQS-TRACEABILITY">
                    <span class="section-number">8.2.9</span>
                    Traceability
                  </a></li>
                <li><a href="#Visualization">
                    <span class="section-number">8.2.10</span>
                    Visualization
                  </a></li>
                <li><a href="#Open-source-software">
                    <span class="section-number">8.2.11</span>
                    Open source software
                  </a></li>
              </ul>
            </li>
            <li><a href="#Implementation-requirements">
                <span class="section-number">8.3</span>
                Implementation requirements
              </a>
              <ul>
                <li><a href="#SDOC-IMPL-PARAL">
                    <span class="section-number">8.3.1</span>
                    Parallelization
                  </a></li>
                <li><a href="#SDOC-IMPL-INCREMENTAL">
                    <span class="section-number">8.3.2</span>
                    Incremental generation
                  </a></li>
              </ul>
            </li>
            <li><a href="#Data-model">
                <span class="section-number">8.4</span>
                Data model
              </a>
              <ul>
                <li><a href="#SDOC-DM-MODEL">
                    <span class="section-number">8.4.1</span>
                    Modeling capability
                  </a></li>
                <li><a href="#Section-item">
                    <span class="section-number">8.4.2</span>
                    Section item
                  </a></li>
                <li><a href="#Requirement-item">
                    <span class="section-number">8.4.3</span>
                    Requirement item
                  </a>
                  <ul>
                    <li><a href="#Statement">
                        <span class="section-number">8.4.3.1</span>
                        Statement
                      </a></li>
                    <li><a href="#Content-body">
                        <span class="section-number">8.4.3.2</span>
                        Content body
                      </a></li>
                    <li><a href="#UID-identifier">
                        <span class="section-number">8.4.3.3</span>
                        UID identifier
                      </a>
                      <ul>
                        <li><a href="#UID-identifier-format">
                            <span class="section-number">8.4.3.3.1</span>
                            UID identifier format
                          </a></li>
                      </ul>
                    </li>
                    <li><a href="#Title">
                        <span class="section-number">8.4.3.4</span>
                        Title
                      </a></li>
                    <li><a href="#References">
                        <span class="section-number">8.4.3.5</span>
                        References
                      </a></li>
                    <li><a href="#Comments">
                        <span class="section-number">8.4.3.6</span>
                        Comments
                      </a></li>
                    <li><a href="#Special-fields">
                        <span class="section-number">8.4.3.7</span>
                        Special fields
                      </a></li>
                  </ul>
                </li>
                <li><a href="#Composite-Requirement-item">
                    <span class="section-number">8.4.4</span>
                    Composite Requirement item
                  </a></li>
                <li><a href="#Links">
                    <span class="section-number">8.4.5</span>
                    Links
                  </a>
                  <ul>
                    <li><a href="#Parent-links">
                        <span class="section-number">8.4.5.1</span>
                        Parent links
                      </a></li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><a href="#SDOC-file-format">
                <span class="section-number">8.5</span>
                SDOC file format
              </a>
              <ul>
                <li><a href="#SDOC-FMT-PRIMARY">
                    <span class="section-number">8.5.1</span>
                    Primary text implementation
                  </a></li>
                <li><a href="#SDOC-FMT-GRAMMAR">
                    <span class="section-number">8.5.2</span>
                    Grammar
                  </a></li>
                <li><a href="#Type-safety">
                    <span class="section-number">8.5.3</span>
                    Type safety
                  </a></li>
              </ul>
            </li>
            <li><a href="#Document-Generators">
                <span class="section-number">8.6</span>
                Document Generators
              </a>
              <ul>
                <li><a href="#HTML-Export">
                    <span class="section-number">8.6.1</span>
                    HTML Export
                  </a>
                  <ul>
                    <li><a href="#Single-document-Normal-form">
                        <span class="section-number">8.6.1.1</span>
                        Single document: Normal form
                      </a></li>
                    <li><a href="#Single-document-Tabular-form">
                        <span class="section-number">8.6.1.2</span>
                        Single document: Tabular form
                      </a></li>
                    <li><a href="#Single-document-1-level-traceability">
                        <span class="section-number">8.6.1.3</span>
                        Single document: 1-level traceability
                      </a></li>
                    <li><a href="#Single-document-Deep-traceability">
                        <span class="section-number">8.6.1.4</span>
                        Single document: Deep traceability
                      </a></li>
                    <li><a href="#Left-panel-Table-of-contents">
                        <span class="section-number">8.6.1.5</span>
                        Left panel: Table of contents
                      </a></li>
                  </ul>
                </li>
                <li><a href="#PDF-Export">
                    <span class="section-number">8.6.2</span>
                    PDF Export
                  </a>
                  <ul>
                    <li><a href="#Sphinx-documentation-generator">
                        <span class="section-number">8.6.2.1</span>
                        Sphinx documentation generator
                      </a></li>
                  </ul>
                </li>
                <li><a href="#Excel-Export">
                    <span class="section-number">8.6.3</span>
                    Excel Export
                  </a></li>
              </ul>
            </li>
            <li><a href="#Validation">
                <span class="section-number">8.7</span>
                Validation
              </a>
              <ul>
                <li><a href="#Valid-HTML-markup">
                    <span class="section-number">8.7.1</span>
                    Valid HTML markup
                  </a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a href="#Design-decisions">
            <span class="section-number">9</span>
            Design decisions
          </a>
          <ul>
            <li><a href="#Building-blocks">
                <span class="section-number">9.1</span>
                Building blocks
              </a>
              <ul>
                <li><a href="#TextX">
                    <span class="section-number">9.1.1</span>
                    TextX
                  </a></li>
                <li><a href="#Jinja2">
                    <span class="section-number">9.1.2</span>
                    Jinja2
                  </a></li>
                <li><a href="#Sphinx-and-Docutils">
                    <span class="section-number">9.1.3</span>
                    Sphinx and Docutils
                  </a></li>
              </ul>
            </li>
            <li><a href="#SDoc-grammar">
                <span class="section-number">9.2</span>
                SDoc grammar
              </a>
              <ul>
                <li><a href="#No-indentation">
                    <span class="section-number">9.2.1</span>
                    No indentation
                  </a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a href="#Backlog">
            <span class="section-number">10</span>
            Backlog
          </a>
          <ul>
            <li><a href="#Generated-file-names">
                <span class="section-number">10.1</span>
                Generated file names
              </a></li>
            <li><a href="#Validation-Uniqueness-of-UID-identifiers-in-a-document-tree">
                <span class="section-number">10.2</span>
                Validation: Uniqueness of UID identifiers in a document tree
              </a></li>
            <li><a href="#StrictDoc-as-library">
                <span class="section-number">10.3</span>
                StrictDoc as library
              </a></li>
            <li><a href="#BACKLOG-FUZZY-SEARCH">
                <span class="section-number">10.4</span>
                Fuzzy requirements search
              </a></li>
            <li><a href="#Export-capabilities">
                <span class="section-number">10.5</span>
                Export capabilities
              </a>
              <ul>
                <li><a href="#CSV-import-export">
                    <span class="section-number">10.5.1</span>
                    CSV import/export
                  </a></li>
                <li><a href="#PlantUML-export">
                    <span class="section-number">10.5.2</span>
                    PlantUML export
                  </a></li>
                <li><a href="#ReqIF-import-export">
                    <span class="section-number">10.5.3</span>
                    ReqIF import/export
                  </a></li>
                <li><a href="#Confluence-import-export">
                    <span class="section-number">10.5.4</span>
                    Confluence import/export
                  </a></li>
                <li><a href="#Tex-export">
                    <span class="section-number">10.5.5</span>
                    Tex export
                  </a></li>
                <li><a href="#Doorstop-import-export">
                    <span class="section-number">10.5.6</span>
                    Doorstop import/export
                  </a></li>
                <li><a href="#Markdown-support-for-text-and-code-blocks">
                    <span class="section-number">10.5.7</span>
                    Markdown support for text and code blocks
                  </a></li>
              </ul>
            </li>
            <li><a href="#Traceability-and-coverage">
                <span class="section-number">10.6</span>
                Traceability and coverage
              </a>
              <ul>
                <li><a href="#Linking-with-implementation-artifacts">
                    <span class="section-number">10.6.1</span>
                    Linking with implementation artifacts
                  </a></li>
                <li><a href="#Requirement-checksumming">
                    <span class="section-number">10.6.2</span>
                    Requirement checksumming
                  </a></li>
                <li><a href="#Documentation-coverage">
                    <span class="section-number">10.6.3</span>
                    Documentation coverage
                  </a></li>
              </ul>
            </li>
            <li><a href="#Filtering-by-tags">
                <span class="section-number">10.7</span>
                Filtering by tags
              </a></li>
            <li><a href="#Open-questions">
                <span class="section-number">10.8</span>
                Open questions
              </a>
              <ul>
                <li><a href="#One-or-many-input-sdoc-trees">
                    <span class="section-number">10.8.1</span>
                    One or many input sdoc trees
                  </a></li>
              </ul>
            </li>
            <li><a href="#Advanced">
                <span class="section-number">10.9</span>
                Advanced
              </a>
              <ul>
                <li><a href="#Facts-table-Invariants-calculation-">
                    <span class="section-number">10.9.1</span>
                    Facts table. Invariants calculation.
                  </a></li>
                <li><a href="#FMEA-FMECA-tables">
                    <span class="section-number">10.9.2</span>
                    FMEA/FMECA tables
                  </a></li>
                <li><a href="#Graphical-User-Interface-GUI-">
                    <span class="section-number">10.9.3</span>
                    Graphical User Interface (GUI)
                  </a></li>
                <li><a href="#Web-server-and-editable-HTML-pages">
                    <span class="section-number">10.9.4</span>
                    Web server and editable HTML pages
                  </a></li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>

      <div class="printable pagebreak"></div>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Introduction"></div>
          <h1 class="section-title printable" data-level="1">
            Introduction
          </h1>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>StrictDoc is software for writing technical requirements and specifications.</p>
              <p>Summary of StrictDoc features:</p>
              <ul class="simple">
                <li>The documentation files are stored as human-readable text files.</li>
                <li>A simple domain-specific language DSL is used for writing the documents. The
                  text format for encoding this language is called SDoc (strict-doc).</li>
                <li>StrictDoc reads <tt class="docutils literal">*.sdoc</tt> files and builds an in-memory
                  representation of the
                  document tree.</li>
                <li>From this in-memory representation, StrictDoc can generate the documentation
                  into a number of formats including HTML, RST, PDF, Excel.</li>
                <li>The focus of the tool is modeling requirements and specifications documents.
                  Such documents consist of multiple statements like &quot;system X shall do Y&quot;
                  called requirements.</li>
                <li>The requirements can be linked together to form the relationships, such as
                  &quot;parent-child&quot;, and from these connections, many useful features, such as
                  <a class="reference external"
                    href="https://en.wikipedia.org/wiki/Requirements_traceability">Requirements Traceability</a>
                  and Documentation Coverage, can be derived.
                </li>
                <li>Special fields support. The StrictDoc's grammar can be extended to support
                  arbitrary special fields, such as <tt class="docutils literal">PRIORITY</tt>, <tt
                    class="docutils literal">OWNER</tt>, or even more
                  specialized fields, such as <tt class="docutils literal">Automotive Safety Integrity Level (ASIL)</tt>
                  or
                  <tt class="docutils literal">ECSS verification method</tt>.
                </li>
                <li>Good performance of the <a class="reference external"
                    href="https://github.com/textX/textX">textX</a>
                  parser and parallelized incremental generation of documents: generation of
                  document trees with up to 2000-3000 requirements into HTML pages stays within
                  a few seconds. From the second run, only changed documents are regenerated.
                  Further performance tuning should be possible.</li>
              </ul>
              <p><strong>Warning:</strong> The StrictDoc project is still under construction. See the Roadmap
                section to get an idea of the overall project direction.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Examples"></div>
          <h1 class="section-title printable" data-level="2">
            Examples
          </h1>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>&quot;Hello World&quot; example of the text language:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: SDOC-HIGH-REQS-MANAGEMENT
TITLE: Requirements management
STATEMENT: StrictDoc shall enable requirements management.
</pre>
            </div>

          </div>
          <div class="free-text printable">
            <div class="document">
              <p>For a more comprehensive example check the source file of this documentation
                which is written using StrictDoc:
                <a class="reference external"
                  href="https://github.com/strictdoc-project/strictdoc/blob/master/docs/strictdoc.sdoc">strictdoc.sdoc</a>.
              </p>
              <ul class="simple">
                <li><a class="reference external"
                    href="https://strictdoc.readthedocs.io/en/latest/strictdoc-html">StrictDoc HTML export</a></li>
                <li><a class="reference external" href="https://strictdoc.readthedocs.io/en/latest">StrictDoc HTML
                    export using Sphinx</a></li>
                <li><a class="reference external"
                    href="https://strictdoc.readthedocs.io/_/downloads/en/latest/pdf/">StrictDoc PDF export using
                    Sphinx</a></li>
              </ul>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Getting-started"></div>
          <h1 class="section-title printable" data-level="3">
            Getting started
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Requirements"></div>
          <h2 class="section-title printable" data-level="3.1">
            Requirements
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <ul class="simple">
                <li>Python 3.6+</li>
                <li>macOS, Linux or Windows</li>
              </ul>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Installing-StrictDoc-as-a-Pip-package-recommended-way-"></div>
          <h2 class="section-title printable" data-level="3.2">
            Installing StrictDoc as a Pip package (recommended way)
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <pre class="code text literal-block">
pip install strictdoc
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Installing-StrictDoc-from-GitHub-developer-mode-"></div>
          <h2 class="section-title printable" data-level="3.3">
            Installing StrictDoc from GitHub (developer mode)
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p><strong>Note:</strong> Use this way of installing StrictDoc only if you want to make changes
                in StrictDoc's source code. Otherwise, install StrictDoc as a Pip package
                (see above).</p>
              <p>StrictDoc uses Poetry, so <a class="reference external" href="https://python-poetry.org">Poetry</a> has
                to be
                installed. To install Poetry, read the instructions here:
                <a class="reference external" href="https://python-poetry.org/docs/#installation">Poetry /
                  Installation</a>.
              </p>
              <p>When Poetry is installed, clone StrictDoc:</p>
              <pre class="code text literal-block">
git clone https://github.com/strictdoc-project/strictdoc.git &amp;&amp; cd strictdoc
poetry install
poetry run strictdoc
poetry run invoke test
</pre>
              <p>StrictDoc can also be developed and run without Poetry:</p>
              <pre class="code text literal-block">
git clone https://github.com/strictdoc-project/strictdoc.git &amp;&amp; cd strictdoc
pip install -r requirements.txt
python3 strictdoc/cli/main.py
# for running tests:
pip install invoke pytest pytidylib html5lib
invoke test
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Hello-world"></div>
          <h2 class="section-title printable" data-level="3.4">
            Hello world
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <pre class="code text literal-block">
git clone --depth 1 https://github.com/strictdoc-project/strictdoc &amp;&amp; cd strictdoc
strictdoc export docs/
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="SDoc-syntax"></div>
          <h1 class="section-title printable" data-level="4">
            SDoc syntax
          </h1>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>StrictDoc defines a special syntax for writing specifications documents. This
                syntax is called SDoc and it's grammar is encoded with the
                <a class="reference external" href="https://github.com/textX/textX">textX</a>
                tool.
              </p>
              <p>The grammar is defined using textX language for defining grammars and is
                located in a single file:
                <a class="reference external"
                  href="https://github.com/strictdoc-project/strictdoc/blob/master/strictdoc/backend/dsl/grammar.py">grammar.py</a>.
              </p>
              <p>This is how a minimal possible SDoc document looks like:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc
</pre>
              <p>This documentation is written using StrictDoc. Here is the source file:
                <a class="reference external"
                  href="https://github.com/strictdoc-project/strictdoc/blob/master/docs/strictdoc.sdoc">strictdoc.sdoc</a>.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Document-structure"></div>
          <h2 class="section-title printable" data-level="4.1">
            Document structure
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>An SDoc document consists of a <tt class="docutils literal">[DOCUMENT]</tt> declaration followed by one
                or many
                <tt class="docutils literal">[REQUIREMENT]</tt> or <tt
                  class="docutils literal">[COMPOSITE_REQUIREMENT]</tt> statements which can be grouped
                into <tt class="docutils literal">[SECTION]</tt> blocks.
              </p>
              <p>The following grammatical constructs are currently supported:</p>
              <ul class="simple">
                <li><tt class="docutils literal">DOCUMENT</tt>
                  <ul>
                    <li><tt class="docutils literal">FREE_TEXT</tt></li>
                  </ul>
                </li>
                <li><tt class="docutils literal">REQUIREMENT</tt> and <tt
                    class="docutils literal">COMPOSITE_REQUIREMENT</tt></li>
                <li><tt class="docutils literal">SECTION</tt>
                  <ul>
                    <li><tt class="docutils literal">FREE_TEXT</tt></li>
                  </ul>
                </li>
              </ul>
              <p>Each construct is described in more detail below.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Strict-rule-1-One-empty-line-between-all-nodes"></div>
          <h3 class="section-title printable" data-level="4.1.1">
            Strict rule #1: One empty line between all nodes
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>StrictDoc's grammar requires each node, such as <tt class="docutils literal">[REQUIREMENT]</tt>, <tt
                  class="docutils literal">[SECTION]</tt>,
                etc., to be separated with exactly one empty line from the nodes surrounding it.
                This rule is valid for all nodes. Absence of an empty line or presence of more
                than one empty line between two nodes will result in an SDoc parsing error.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Strict-rule-2-No-content-is-allowed-outside-of-SDoc-grammar"></div>
          <h3 class="section-title printable" data-level="4.1.2">
            Strict rule #2: No content is allowed outside of SDoc grammar
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>StrictDoc's grammar does not allow any content to be written outside of the SDoc
                grammatical constructs. It is assumed that the critical content shall always be
                written in form of requirements:
                <tt class="docutils literal">[REQUIREMENT]</tt> and <tt
                  class="docutils literal">[COMPOSITE_REQUIREMENT]</tt>. Non-critical content shall
                be specified using <tt class="docutils literal">[FREETEXT]</tt> nodes. By design, the <tt
                  class="docutils literal">[FREETEXT]</tt> nodes can
                be only attached to the <tt class="docutils literal">[DOCUMENT]</tt> and <tt
                  class="docutils literal">[SECTION]</tt> nodes.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Grammar-elements"></div>
          <h2 class="section-title printable" data-level="4.2">
            Grammar elements
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Document"></div>
          <h3 class="section-title printable" data-level="4.2.1">
            Document
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p><tt class="docutils literal">[DOCUMENT]</tt> element must always be present in an SDoc document. It is
                a root
                of an SDoc document graph.</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc
(newline)
</pre>
              <p><tt class="docutils literal">DOCUMENT</tt> declaration must always have a <tt
                  class="docutils literal">TITLE</tt> field. It can have
                optional configuration fields and an optional <tt class="docutils literal">[FREETEXT]</tt> block.</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[FREETEXT]
StrictDoc is software for writing technical requirements and specifications.
[/FREETEXT]
</pre>
              <p>Supported configuration fields:</p>
              <p><tt class="docutils literal">SPECIAL_FIELDS</tt> (see Requirement / Special fields below).</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Requirement"></div>
          <h3 class="section-title printable" data-level="4.2.2">
            Requirement
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>Minimal &quot;Hello World&quot; program with 3 empty requirements:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]

[REQUIREMENT]

[REQUIREMENT]
</pre>
              <p>Supported fields:</p>
              <ul class="simple">
                <li><tt class="docutils literal">UID</tt> (unique identifier)</li>
                <li><tt class="docutils literal">SPECIAL_FIELDS</tt></li>
                <li><tt class="docutils literal">REFS</tt></li>
                <li><tt class="docutils literal">TITLE</tt></li>
                <li><tt class="docutils literal">STATEMENT</tt></li>
                <li><tt class="docutils literal">RATIONALE</tt></li>
                <li><tt class="docutils literal">COMMENT</tt> (multiple comments are possible)</li>
              </ul>
              <p>Currently, all <tt class="docutils literal">[REQUIREMENT]</tt>'s are optional but most of the time at
                least
                the <tt class="docutils literal">STATEMENT:</tt> field must be present as well as the <tt
                  class="docutils literal">TITLE:</tt> field.</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
TITLE: Requirements management
STATEMENT: StrictDoc shall enable requirements management.
</pre>
              <p><strong>Observation:</strong> Many real-world documents have requirements with statements and
                titles but some documents only use statements without title in which case their
                title becomes their UID. Example:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: REQ-001
STATEMENT: StrictDoc shall enable requirements management.
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="UID"></div>
          <h4 class="section-title printable" data-level="4.2.2.1">
            UID
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p><strong>Observation:</strong> Some documents do not use unique identifiers which makes it
                impossible to trace their requirements to each other. Within StrictDoc's
                framework, it is assumed that a good requirements document has all of its
                requirements uniquely identifiable, however, the <tt class="docutils literal">UID</tt> field is optional
                to
                accommodate for documents without connections between requirements.</p>
              <p>StrictDoc does not impose any limitations on the format of a UID. Examples of
                typical conventions for naming UIDs:</p>
              <ul class="simple">
                <li><tt class="docutils literal"><span class="pre">REQ-001</span></tt>, <tt
                    class="docutils literal"><span class="pre">SCA-001</span></tt> (scalability), <tt
                    class="docutils literal"><span class="pre">PERF-001</span></tt> (performance), etc.</li>
                <li><tt class="docutils literal">cES1008</tt>, <tt class="docutils literal">cTBL6000.1</tt> (example
                  from NASA cFS requirements)</li>
                <li>Requirements without a number, e.g. <tt class="docutils literal"><span
                      class="pre">SDOC-HIGH-DATA-MODEL</span></tt> (StrictDoc)</li>
                <li><tt class="docutils literal">SAVOIR.OBC.PM.80</tt> (SAVOIR guidelines)</li>
              </ul>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: SDOC-HIGH-DATA-MODEL
STATEMENT: STATEMENT: StrictDoc shall be based on a well-defined data model.
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="References"></div>
          <h4 class="section-title printable" data-level="4.2.2.2">
            References
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>The <tt class="docutils literal">[REQUIREMENT]</tt> / <tt class="docutils literal">REFS:</tt> field is
                used to connect requirements to each
                other:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: REQ-001
STATEMENT: StrictDoc shall enable requirements management.

[REQUIREMENT]
UID: REQ-002
REFS:
- TYPE: Parent
  VALUE: REQ-001
TITLE: Requirement #2's title
STATEMENT: Requirement #2 statement
</pre>
              <p><strong>Note:</strong> The <tt class="docutils literal">TYPE: Parent</tt> is the only supported type of
                connection. In the
                future, linking requirements to files will be possible.</p>
              <p><strong>Note:</strong> By design, StrictDoc will only show parent or child links if both
                requirements connected with a reference have <tt class="docutils literal">UID</tt> defined.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Comment"></div>
          <h4 class="section-title printable" data-level="4.2.2.3">
            Comment
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>A requirement can have one or more comments explaining this requirement. The
                comments can be single-line or multiline.</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: REQ-001
STATEMENT: StrictDoc shall enable requirements management.
COMMENT: Clarify the meaning or give additional information here.
COMMENT: &gt;&gt;&gt;
This is a multiline comment.

The content is split via \n\n.

Each line is rendered as a separate paragraph.
&lt;&lt;&lt;
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Rationale"></div>
          <h4 class="section-title printable" data-level="4.2.2.4">
            Rationale
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>A requirement can have a <tt class="docutils literal">RATIONALE:</tt> field that explains why such a
                requirement exists. Like comments, the rationale field can be single-line or
                multiline.</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: REQ-001
STATEMENT: StrictDoc shall enable requirements management.
COMMENT: Clarify the meaning or give additional information here.
RATIONALE: The presence of the REQ-001 is justified.
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Special-fields"></div>
          <h4 class="section-title printable" data-level="4.2.2.5">
            Special fields
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p><strong>Observation:</strong> Different industries have their own types of requirements
                documents. These documents often have specialized meta information which is
                different from industry to industry. Example: <tt class="docutils literal">ECSS_VERIFICATION</tt> field
                in the
                European space industry or <tt class="docutils literal">ASIL</tt> in the automotive industry.</p>
              <p>StrictDoc allows extending its grammar with custom fields that are specific to
                a particular document.</p>
              <p>First, such fields have to be registered on a document level using the
                <tt class="docutils literal">SPECIAL_FIELDS</tt> field:
              </p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc
SPECIAL_FIELDS:
- NAME: ASIL
  TYPE: String
- NAME: ECSS_VERIFICATION
  TYPE: String
  REQUIRED: Yes
</pre>
              <p>This registration adds these fields to the parser that will recognize them
                as special fields defined by a user. Declaring a special field as
                <tt class="docutils literal">REQUIRED: Yes</tt> makes this field mandatory for each and every
                requirement in
                the document.
              </p>
              <p>When the fields are registered on the document level, it becomes possible to
                declare them as the <tt class="docutils literal">[REQUIREMENT]</tt> special fields:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[REQUIREMENT]
UID: REQ-001
SPECIAL_FIELDS:
  ASIL: D
  ECSS_VERIFICATION: R,A,I,T
STATEMENT: StrictDoc shall enable requirements management.
</pre>
              <p><strong>Note:</strong> The <tt class="docutils literal">TYPE: String</tt> is the only supported type of
                a special field. In
                the future, more specialized types are envisioned, such as <tt class="docutils literal">Int</tt>, <tt
                  class="docutils literal">Enum</tt>,
                <tt class="docutils literal">Tag</tt>.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Section"></div>
          <h3 class="section-title printable" data-level="4.2.3">
            Section
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>The <tt class="docutils literal">[SECTION]</tt> element is used for creating document chapters and
                grouping
                requirements into logical groups. It is equivalent to the use of <tt class="docutils literal">#</tt>,
                <tt class="docutils literal">##</tt>,
                <tt class="docutils literal">###</tt>, etc., in Markdown and <tt class="docutils literal"><span
                    class="pre">====</span></tt>, <tt class="docutils literal"><span class="pre">----</span></tt>, <tt
                  class="docutils literal"><span class="pre">~~~~</span></tt> in RST.
              </p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[SECTION]
TITLE: High-level requirements

[REQUIREMENT]
UID: HIGH-001
STATEMENT: ...

[/SECTION]

[SECTION]
TITLE: Implementation requirements

[REQUIREMENT]
UID: IMPL-001
STATEMENT: ...

[/SECTION]
</pre>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Nesting-sections"></div>
          <h4 class="section-title printable" data-level="4.2.3.1">
            Nesting sections
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>Sections can be nested within each other.</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[SECTION]
TITLE: Chapter

[SECTION]
TITLE: Subchapter

[REQUIREMENT]
STATEMENT: ...

[/SECTION]

[/SECTION]
</pre>
              <p>StrictDoc creates section numbers automatically. In the example above, the
                sections will have their titles numbered accordingly: <tt class="docutils literal">1 Chapter</tt> and
                <tt class="docutils literal">1.1 Subchapter</tt>.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Free-text"></div>
          <h4 class="section-title printable" data-level="4.2.3.2">
            Free text
          </h4>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>A section can have a block of <tt class="docutils literal">[FREETEXT]</tt> connected to it:</p>
              <pre class="code text literal-block">
[DOCUMENT]
TITLE: StrictDoc

[SECTION]
TITLE: Free text

[FREETEXT]
A sections can have a block of \`\`[FREETEXT]\`\` connected to it:

...
[/FREETEXT]

[/SECTION]
</pre>
              <p>According to the Strict Rule #2, arbitrary content cannot be written outside
                of StrictDoc's grammar structure. <tt class="docutils literal">[SECTION] / [FREETEXT]</tt> is therefore
                a
                designated grammar element for writing free text content.</p>
              <p><strong>Note:</strong> Free text can also be called &quot;nonnormative&quot; or &quot;informative&quot;
                text
                because it does not contribute anything to the traceability information of the
                document. The nonnormative text is there to give a context to the reader and
                help with the conceptual understanding of the information. If a certain
                information influences or is influenced by existing requirements, it has to be
                promoted to the requirement level: the information has to be broken down into
                atomic <tt class="docutils literal">[REQUIREMENT]</tt> statements and get connected to the other
                requirement
                statements in the document.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Composite-requirement"></div>
          <h3 class="section-title printable" data-level="4.2.4">
            Composite requirement
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>A <tt class="docutils literal">[COMPOSITE_REQUIREMENT]</tt> is a requirement that combines requirement
                properties of a <tt class="docutils literal">[REQUIREMENT]</tt> element and grouping features of a <tt
                  class="docutils literal">[SECTION]</tt>
                element. This element can be useful in lower-level specifications documents
                where a given section of a document has to describe a single feature and the
                description requires a one or more levels of nesting. In this case, it might be
                natural to use a composite requirement that is tightly connected to a few
                related sub-requirements.</p>
              <pre class="code text literal-block">
[COMPOSITE_REQUIREMENT]
STATEMENT: Statement

[REQUIREMENT]
STATEMENT: Substatement #1

[REQUIREMENT]
STATEMENT: Substatement #2

[REQUIREMENT]
STATEMENT: Substatement #3

[/COMPOSITE_REQUIREMENT]
</pre>
              <p>Special feature of <tt class="docutils literal">[COMPOSITE_REQUIREMENT]</tt>: like <tt
                  class="docutils literal">[SECTION]</tt> element, the
                <tt class="docutils literal">[COMPOSITE_REQUIREMENT]</tt> elements can be nested within each other.
                However,
                <tt class="docutils literal">[COMPOSITE_REQUIREMENT]</tt> cannot nest sections.
              </p>
              <p><strong>Note:</strong> Composite requirements should not be used in every document. Most
                often, a more basic combination of nested <tt class="docutils literal">[SECTION]</tt> and <tt
                  class="docutils literal">[REQUIREMENT]</tt>
                elements should do the job.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Export-options"></div>
          <h1 class="section-title printable" data-level="5">
            Export options
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="HTML-documentation-tree-by-StrictDoc"></div>
          <h2 class="section-title printable" data-level="5.1">
            HTML documentation tree by StrictDoc
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>This is a default export option supported by StrictDoc.</p>
              <p>The following command creates an HTML export:</p>
              <pre class="code text literal-block">
strictdoc export docs/ --formats=html --output-dir output-html
</pre>
              <p><strong>Example:</strong> This documentation is exported by StrictDoc to HTML:
                <a class="reference external" href="https://strictdoc.readthedocs.io/en/latest/strictdoc-html">StrictDoc
                  HTML export</a>.
              </p>
              <p><strong>Note:</strong> The options <tt class="docutils literal"><span
                    class="pre">--formats=html</span></tt> and <tt class="docutils literal"><span
                    class="pre">--output-dir</span> <span class="pre">output-html</span></tt> can be
                skipped because HTML export is a default export option and the default output
                folder is <tt class="docutils literal">output</tt>.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Standalone-HTML-pages-experimental-"></div>
          <h3 class="section-title printable" data-level="5.1.1">
            Standalone HTML pages (experimental)
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>The following command creates a normal HTML export with all pages having their
                assets embedded into HTML using Data URI / Base64:</p>
              <pre class="code text literal-block">
strictdoc export docs/ --formats=html-standalone --output-dir output-html
</pre>
              <p>The generated document are self-contained HTML pages that can be shared via
                email as single files. This option might be especially useful if you work with
                a single document instead of a documentation tree with multiple documents.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="HTML-export-via-Sphinx"></div>
          <h2 class="section-title printable" data-level="5.2">
            HTML export via Sphinx
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>The following command creates an RST export:</p>
              <pre class="code text literal-block">
strictdoc export YourDoc.sdoc --formats=rst --output-dir output
</pre>
              <p>The created RST files can be copied to a project created using Sphinx, see
                <a class="reference external"
                  href="https://docs.readthedocs.io/en/stable/intro/getting-started-with-sphinx.html">Getting Started
                  with Sphinx</a>.
              </p>
              <pre class="code text literal-block">
cp -v output/YourDoc.rst docs/sphinx/source/
cd docs/sphinx &amp;&amp; make html
</pre>
              <p><a class="reference external" href="https://strictdoc.readthedocs.io/en/latest/">StrictDoc's own
                  Sphinx/HTML documentation</a>
                is generated this way, see the Invoke task:
                <a class="reference external"
                  href="https://github.com/strictdoc-project/strictdoc/blob/5c94aab96da4ca21944774f44b2c88509be9636e/tasks.py#L48">invoke
                  sphinx</a>.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="PDF-export-via-Sphinx-LaTeX"></div>
          <h2 class="section-title printable" data-level="5.3">
            PDF export via Sphinx/LaTeX
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>The following command creates an RST export:</p>
              <pre class="code text literal-block">
strictdoc export YourDoc.sdoc --formats=rst --output-dir output
</pre>
              <p>The created RST files can be copied to a project created using Sphinx, see
                <a class="reference external"
                  href="https://docs.readthedocs.io/en/stable/intro/getting-started-with-sphinx.html">Getting Started
                  with Sphinx</a>.
              </p>
              <pre class="code text literal-block">
cp -v output/YourDoc.rst docs/sphinx/source/
cd docs/sphinx &amp;&amp; make pdf
</pre>
              <p><a class="reference external"
                  href="https://strictdoc.readthedocs.io/_/downloads/en/latest/pdf/">StrictDoc's own Sphinx/PDF
                  documentation</a>
                is generated this way, see the Invoke task:
                <a class="reference external"
                  href="https://github.com/strictdoc-project/strictdoc/blob/5c94aab96da4ca21944774f44b2c88509be9636e/tasks.py#L48">invoke
                  sphinx</a>.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Options"></div>
          <h1 class="section-title printable" data-level="6">
            Options
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Parallelization"></div>
          <h2 class="section-title printable" data-level="6.1">
            Parallelization
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>To improve performance for the large document trees (1000+ requirements),
                StrictDoc parallelizes reading and generation of the documents using
                process-based parallelization: <tt class="docutils literal">multiprocessing.Pool</tt> and
                <tt class="docutils literal">multiprocessing.Queue</tt>.
              </p>
              <p>Parallelization improves performance but can also complicate understanding
                behavior of the code if something goes wrong.</p>
              <p>To disable parallelization use the <tt class="docutils literal"><span
                    class="pre">--no-parallelization</span></tt> option:</p>
              <pre class="code text literal-block">
strictdoc export --no-parallelization docs/
</pre>
              <p><strong>Note:</strong> Currently, only the generation of HTML documents is parallelized, so
                this option will only have effect on the HTML export. All other export options
                are run from the main thread. Reading of the SDoc documents is parallelized for
                all export options and is disabled with this option as well.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="StrictDoc-and-other-tools"></div>
          <h1 class="section-title printable" data-level="7">
            StrictDoc and other tools
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="StrictDoc-and-Doorstop"></div>
          <h2 class="section-title printable" data-level="7.1">
            StrictDoc and Doorstop
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>The StrictDoc project is a close successor of another project called
                <a class="reference external" href="https://github.com/doorstop-dev/doorstop">Doorstop</a>.
              </p>
              <blockquote>
                Doorstop is a requirements management tool that facilitates the storage of
                textual requirements alongside source code in version control.</blockquote>
              <p>The author of Doorstop has published a <a class="reference external"
                  href="http://www.scirp.org/journal/PaperInformation.aspx?PaperID=44268#.UzYtfWRdXEZ">paper about
                  Doorstop</a>
                where the rationale behind text-based requirements management is provided.</p>
              <p>The first version of StrictDoc had started as a fork of the Doorstop project.
                However, after a while, the StrictDoc was started from scratch as a separate
                project. At this point, StrictDoc and Doorstop do not share any code but
                StrictDoc still shares with Doorstop their common underlying design principles:</p>
              <ul class="simple">
                <li>Both Doorstop and StrictDoc are written using Python. Both are pip packages which are
                  easy-to-install.</li>
                <li>Both Doorstop and StrictDoc provide a command-line interface.</li>
                <li>Both Doorstop and StrictDoc use text files for requirements management.</li>
                <li>Both Doorstop and StrictDoc encourage collocation of code and documentation.
                  When documentation is hosted close to code it has less chances of diverging
                  from the actual implementation or becoming outdated.</li>
                <li>As the free and open source projects, both Doorstop and StrictDoc seem to
                  struggle to find resources for development of specialized GUI interfaces this
                  is why both tools give a preference to supporting exporting documentation
                  pages to HTML format as the primary export feature.</li>
              </ul>
              <p>StrictDoc differs from Doorstop in a number of aspects:</p>
              <ul class="simple">
                <li>Doorstop stores requirements in YAML files, one separate file per requirement
                  (<a class="reference external"
                    href="https://github.com/doorstop-dev/doorstop/blob/804153c67c7c5466ee94e9553118cc3df03a56f9/reqs/REQ001.yml">example</a>).
                  The document in Doorstop is assembled from the requirements files into a
                  single logical document during the document generation process.
                  StrictDoc's documentation unit is one document stored in an .sdoc file. Such a
                  document can have multiple requirements grouped by sections.</li>
                <li>In YAML files, Doorstop stores requirements properties such as
                  <tt class="docutils literal">normative: true</tt> or <tt class="docutils literal">level: 2.3</tt> for
                  which Doorstop provides validations.
                  Such a design decision, in fact, assumes an existence of implicitly-defined
                  grammar which is encoded &quot;ad-hoc&quot; in the parsing and validation rules of
                  Doorstop.
                  StrictDoc takes a different approach and defines its grammar explicitly using
                  a tool for creating Domain-Specific Languages called <a class="reference external"
                    href="https://github.com/textX/textX">textX</a>.
                  TextX support allows StrictDoc to encode a strict type-safe grammar in a
                  <a class="reference external"
                    href="https://github.com/strictdoc-project/strictdoc/blob/93486a0e9fb30b141187587eae9e995cd86c6cbf/strictdoc/backend/dsl/grammar.py">single
                    grammar file</a>
                  that StrictDoc uses to parse the documentation files
                  using the parsing capabilities provided by textX out of the box.
                </li>
              </ul>
              <p>The roadmap of StrictDoc contains a work item for supporting the export/import
                to/from Doorstop format.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="StrictDoc-and-Sphinx"></div>
          <h2 class="section-title printable" data-level="7.2">
            StrictDoc and Sphinx
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>Both Sphinx and StrictDoc are both documentation generators but StrictDoc is at
                a higher level of abstraction: StrictDoc's specialization is requirements and
                specifications documents. StrictDoc can generate documentation to a number of
                formats including HTML format as well as the RST format which is a default
                input format for Sphinx. A two stage generation is therefore possible:
                StrictDoc generates RST documentation which then can be generated to HTML, PDF,
                and other formats using Sphinx.</p>
              <p>If you are reading this documentation at
                <a class="reference external"
                  href="https://strictdoc.readthedocs.io/en/latest">https://strictdoc.readthedocs.io/en/latest</a>
                then you are already looking at the example: this documentation stored in
                <a class="reference external"
                  href="https://github.com/strictdoc-project/strictdoc/blob/master/docs/strictdoc.sdoc">strictdoc.sdoc</a>
                is converted to RST format by StrictDoc which is further converted to the HTML
                website by readthedocs which uses Sphinx under the hood. The
                <tt class="docutils literal">StrictDoc <span class="pre">-&gt;</span> RST <span class="pre">-&gt;</span>
                  Sphinx <span class="pre">-&gt;</span> PDF</tt> example is also generated using readthedocs:
                <a class="reference external"
                  href="https://strictdoc.readthedocs.io/_/downloads/en/latest/pdf/">StrictDoc</a>.
              </p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="StrictDoc-and-Sphinx-Needs"></div>
          <h2 class="section-title printable" data-level="7.3">
            StrictDoc and Sphinx-Needs
          </h2>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p><a class="reference external"
                  href="https://sphinxcontrib-needs.readthedocs.io/en/latest/">Sphinx-Needs</a> is a
                text-based requirements management system based on Sphinx. It is implemented
                as a Sphinx extension that extends the
                <a class="reference external"
                  href="https://docutils.sourceforge.io/docs/user/rst/quickref.html">reStructuredText (RST)</a>
                markup language with additional syntax for writing requirements documents.
              </p>
              <p>Sphinx-Needs was a great source of inspiration for the second version of
                StrictDoc which was first implemented as a Sphinx extension and then as a more
                independent library on top of <a class="reference external"
                  href="https://docutils.sourceforge.io/">docutils</a>
                that Sphinx uses for the underlying RST syntax processing work.</p>
              <p>The similarities between Sphinx-Needs and StrictDoc:</p>
              <ul class="simple">
                <li>In contrast to Doorstop, both Sphinx-Needs and StrictDoc do not split a
                  document into many small files, one file per single requirement (see
                  discussion
                  <a class="reference external"
                    href="https://github.com/doorstop-dev/doorstop/issues/401">doorstop#401</a>). Both
                  tools follow the &quot;file per document&quot; approach.
                </li>
                <li>Sphinx-Needs has a
                  <a class="reference external"
                    href="https://sphinxcontrib-needs.readthedocs.io/en/latest/directives/index.html">well-developed
                    language</a>
                  based on custom RST directives, such
                  as <tt class="docutils literal">req::</tt>, <tt class="docutils literal">spec::</tt>, <tt
                    class="docutils literal">needtable::</tt>, etc. The RST document is parsed
                  by Sphinx/docutils into RST abstract syntax tree (AST) which allows creating
                  an object graph out for the documents and their requirements from the RST
                  document. StrictDoc uses textX for building an AST from a SDoc document.
                  Essentially, both Sphinx-Needs and StrictDoc works in a similar way but use
                  different markup languages and tooling for the job.
                </li>
              </ul>
              <p>The difference between Sphinx-Needs and StrictDoc:</p>
              <ul class="simple">
                <li>RST tooling provided by Sphinx/docutils is very powerful, yet it can also be
                  rather limiting. The RST syntax and underlying docutils tooling do not allow
                  much flexibility needed for creating a language for defining requirements
                  using a custom and explicit grammar, a feature that became a cornerstone of
                  StrictDoc. This was a major reason why the third generation of
                  StrictDoc started with a migration from docutils to
                  <a class="reference external" href="https://github.com/textX/textX">textX</a> which is a
                  dedicated tool for creating custom Domain-Specific Languages. After the
                  migration to textX, StrictDoc is no longer restricted to the limitations of
                  the RST document, while it is still possible to generate SDoc files to RST
                  using StrictDoc and then further generate RST to HTML/PDF and other formats
                  using Sphinx.
                </li>
                <li>Sphinx-Needs has an impressive list of config options and features that
                  StrictDoc is missing. Examples: Customizing the look of the requirements,
                  <a class="reference external"
                    href="https://sphinxcontrib-needs.readthedocs.io/en/latest/roles.html">Roles</a>,
                  <a class="reference external"
                    href="https://sphinxcontrib-needs.readthedocs.io/en/latest/services/index.html">Services</a>
                  and
                  <a class="reference external"
                    href="https://sphinxcontrib-needs.readthedocs.io/en/latest/index.html">others</a>.
                </li>
              </ul>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="StrictDoc-Requirements"></div>
          <h1 class="section-title printable" data-level="8">
            StrictDoc Requirements
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Project-goals"></div>
          <h2 class="section-title printable" data-level="8.1">
            Project goals
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="GOAL-1-TOOL-SUPPORT"></div>
          <h3 class="section-title printable" data-level="8.1.1">
            Software support for writing requirements and specifications documents
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>GOAL-1-TOOL-SUPPORT</dd>
            </div>

          </dl>
          <ul class="requirement_child printable">
            <li>
              <a href="#SDOC-HIGH-REQS-MANAGEMENT">
                <span class="requirement_child-uid">SDOC-HIGH-REQS-MANAGEMENT</span>
                Requirements management
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>There shall exist free and lightweight yet capable software for writing
                requirements and specifications documents</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Technical documentation is hard, it can be an extremely laborious process.
                Software shall support engineers in their work with documentation.</p>
            </div>

          </div>
          <div class="requirement_comment printable">
            <div class="document">
              <p>The state of the art for many small companies working with
                requirements: using Excel for requirements management in the projects with
                hundreds or thousands of requirements.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="GOAL-2-REDUCE-DOCUMENTATION-HAZARDS"></div>
          <h3 class="section-title printable" data-level="8.1.2">
            Reduce documentation hazards
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>GOAL-2-REDUCE-DOCUMENTATION-HAZARDS</dd>
            </div>

          </dl>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>There shall exist no (or less) opportunity for writing incorrect or inconsistent
                documentation.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Every serious engineering activity, such as safety engineering or systems
                engineering, starts with requirements. The more critical is a product the higher
                the importance of good documentation.</p>
              <p>Technical documentation can be and often becomes a source of hazards.
                It is recognized that many failures stem from inadequate requirements
                engineering. While it is not possible to fix the problem of inadequate
                requirements engineering in general, it is definitely possible to improve
                software that supports engineers in activities such as requirements engineering
                and writing technical documentation.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="GOAL-3-NO-RUNAWAY-DOCUMENTATION"></div>
          <h3 class="section-title printable" data-level="8.1.3">
            No (or less) run-away documentation
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>GOAL-3-NO-RUNAWAY-DOCUMENTATION</dd>
            </div>

          </dl>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Software shall support engineers in keeping documentation up-to-date.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Technical documentation easily becomes outdated. Many existing tools for
                documentation do not provide any measures for ensuring overall consistency of
                documents and documentation trees.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="GOAL-4-CHANGE-MANAGEMENT"></div>
          <h3 class="section-title printable" data-level="8.1.4">
            Change management
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>GOAL-4-CHANGE-MANAGEMENT</dd>
            </div>

          </dl>
          <ul class="requirement_child printable">
            <li>
              <a href="#BACKLOG-FUZZY-SEARCH">
                <span class="requirement_child-uid">BACKLOG-FUZZY-SEARCH</span>
                Fuzzy requirements search
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Software shall provide capabilities for change management and impact assessment.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Change management is difficult. The bigger the project is, the harder it is to
                maintain its documentation. If a change is introduced to a project, it usually
                requires a full revision of its requirements.</p>
            </div>

          </div>
          <div class="requirement_comment printable">
            <div class="document">
              <p>When the basic capabilities of StrictDoc are in place, it should be possible
                to do a more advanced analysis of requirements and requirement trees:</p>
              <ul class="simple">
                <li>Finding similar or relevant requirements.</li>
                <li>Enforce invariants that should be hold. Example: mass or power budget.</li>
              </ul>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="High-level-requirements"></div>
          <h2 class="section-title printable" data-level="8.2">
            High-level requirements
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-HIGH-REQS-MANAGEMENT"></div>
          <h3 class="section-title printable" data-level="8.2.1">
            Requirements management
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-HIGH-REQS-MANAGEMENT</dd>
            </div>

          </dl>
          <ul class="requirement_parent printable">
            <li>
              <a href="#GOAL-1-TOOL-SUPPORT">
                <span class="requirement_parent-uid">GOAL-1-TOOL-SUPPORT</span>
                Software support for writing requirements and specifications documents
              </a>
            </li>
          </ul>
          <ul class="requirement_child printable">
            <li>
              <a href="#SDOC-DM-MODEL">
                <span class="requirement_child-uid">SDOC-DM-MODEL</span>
                Modeling capability
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall enable requirements management.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-HIGH-DATA-MODEL"></div>
          <h3 class="section-title printable" data-level="8.2.2">
            Data model
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-HIGH-DATA-MODEL</dd>
            </div>

          </dl>
          <ul class="requirement_child printable">
            <li>
              <a href="#SDOC-DM-MODEL">
                <span class="requirement_child-uid">SDOC-DM-MODEL</span>
                Modeling capability
              </a>
            </li>
            <li>
              <a href="#SDOC-FMT-GRAMMAR">
                <span class="requirement_child-uid">SDOC-FMT-GRAMMAR</span>
                Grammar
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall be based on a well-defined data model.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>StrictDoc is a result of several attempts to find a solution for working with
                text-based requirements:</p>
              <ul class="simple">
                <li>StrictDoc, first generation: Markdown-based C++ program. Custom requirements
                  metadata in YAML.</li>
                <li>StrictDoc, second generation: RST/Sphinx-based Python program. Using Sphinx
                  extensions to manage meta information.</li>
              </ul>
              <p>The result of these efforts was the realization that a text-based requirements
                and specifications management tool could be built on top of a domain-specific
                language (DSL) created specifically for the purpose of writing requirements and
                specifications documents. Such a language allows an explicit definition of a
                document data model which is called &quot;grammar&quot;.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Command-line-interface"></div>
          <h3 class="section-title printable" data-level="8.2.3">
            Command-line interface
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall provide a command-line interface.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Platform-support"></div>
          <h3 class="section-title printable" data-level="8.2.4">
            Platform support
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall work on all major platforms.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="macOS-support"></div>
          <h4 class="section-title printable" data-level="8.2.4.1">
            macOS support
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall work on macOS systems.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Linux-support"></div>
          <h4 class="section-title printable" data-level="8.2.4.2">
            Linux support
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall work on Linux systems.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Windows-support"></div>
          <h4 class="section-title printable" data-level="8.2.4.3">
            Windows support
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall work on Windows systems.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Requirements-validation"></div>
          <h3 class="section-title printable" data-level="8.2.5">
            Requirements validation
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall allow validation of requirement documents.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Requirements-text-format"></div>
          <h3 class="section-title printable" data-level="8.2.6">
            Requirements text format
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall allow storage of requirements in a plain-text human readable form.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Linking-requirements"></div>
          <h3 class="section-title printable" data-level="8.2.7">
            Linking requirements
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support linking requirements to each other.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Scalability"></div>
          <h3 class="section-title printable" data-level="8.2.8">
            Scalability
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall allow working with large documents and document trees containing at least 10000
                requirement items.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-HIGH-REQS-TRACEABILITY"></div>
          <h3 class="section-title printable" data-level="8.2.9">
            Traceability
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-HIGH-REQS-TRACEABILITY</dd>
            </div>

          </dl>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support traceability of requirements.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Visualization"></div>
          <h3 class="section-title printable" data-level="8.2.10">
            Visualization
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall provide means for visualization of requirement documents.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Open-source-software"></div>
          <h3 class="section-title printable" data-level="8.2.11">
            Open source software
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall always be free and open source software.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Implementation-requirements"></div>
          <h2 class="section-title printable" data-level="8.3">
            Implementation requirements
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-IMPL-PARAL"></div>
          <h3 class="section-title printable" data-level="8.3.1">
            Parallelization
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-IMPL-PARAL</dd>
            </div>

          </dl>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall enable parallelization of the time-consuming parts of the code.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-IMPL-INCREMENTAL"></div>
          <h3 class="section-title printable" data-level="8.3.2">
            Incremental generation
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-IMPL-INCREMENTAL</dd>
            </div>

          </dl>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall enable incremental generation of the documents.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>When exporting documentation tree, StrictDoc shall regenerate only changed
                documents and files.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Data-model"></div>
          <h2 class="section-title printable" data-level="8.4">
            Data model
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-DM-MODEL"></div>
          <h3 class="section-title printable" data-level="8.4.1">
            Modeling capability
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-DM-MODEL</dd>
            </div>

          </dl>
          <ul class="requirement_parent printable">
            <li>
              <a href="#SDOC-HIGH-REQS-MANAGEMENT">
                <span class="requirement_parent-uid">SDOC-HIGH-REQS-MANAGEMENT</span>
                Requirements management
              </a>
            </li>
            <li>
              <a href="#SDOC-HIGH-DATA-MODEL">
                <span class="requirement_parent-uid">SDOC-HIGH-DATA-MODEL</span>
                Data model
              </a>
            </li>
          </ul>
          <ul class="requirement_child printable">
            <li>
              <a href="#SDOC-FMT-PRIMARY">
                <span class="requirement_child-uid">SDOC-FMT-PRIMARY</span>
                Primary text implementation
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc's Data Model shall accommodate for maximum possible standard requirement document formats.
              </p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Examples of standard requirements documents include but are not limited to:</p>
              <ul class="simple">
                <li>Non-nested requirement lists split by categories
                  (e.g., Functional Requirements, Interface Requirements, Performance Requirements, etc.)</li>
              </ul>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Section-item"></div>
          <h3 class="section-title printable" data-level="8.4.2">
            Section item
          </h3>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Requirement-item"></div>
          <h3 class="section-title printable" data-level="8.4.3">
            Requirement item
          </h3>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Statement"></div>
          <h4 class="section-title printable" data-level="8.4.3.1">
            Statement
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Requirement item shall have a statement.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Content-body"></div>
          <h4 class="section-title printable" data-level="8.4.3.2">
            Content body
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Requirement item might have an content body.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="UID-identifier"></div>
          <h4 class="section-title printable" data-level="8.4.3.3">
            UID identifier
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Requirement item might have an UID identifier.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="UID-identifier-format"></div>
          <h5 class="section-title printable" data-level="8.4.3.3.1">
            UID identifier format
          </h5>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall not impose any restrictions on the UID field format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Conventions used for requirement UIDs can be very different. And there seems to
                be no way to define a single rule.</p>
              <p>Some examples:</p>
              <ul class="simple">
                <li>FUN-003</li>
                <li>cES1008, cTBL6000.1 (NASA cFS)</li>
                <li>Requirements without a number, e.g. SDOC-HIGH-DATA-MODEL (StrictDoc)</li>
                <li>SAVOIR.OBC.PM.80 (SAVOIR)</li>
              </ul>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Title"></div>
          <h4 class="section-title printable" data-level="8.4.3.4">
            Title
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Requirement item might have an title.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="References"></div>
          <h4 class="section-title printable" data-level="8.4.3.5">
            References
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Requirement item might have one or more references.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Comments"></div>
          <h4 class="section-title printable" data-level="8.4.3.6">
            Comments
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Requirement item might have one or more comments.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Special-fields"></div>
          <h4 class="section-title printable" data-level="8.4.3.7">
            Special fields
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support customization of the default Requirement's grammar with special fields.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Examples:</p>
              <ul class="simple">
                <li>RAIT compliance fields (Review of design, analysis, inspection, testing)</li>
                <li>Automotive Safety Integrity Level level (ASIL).</li>
              </ul>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Composite-Requirement-item"></div>
          <h3 class="section-title printable" data-level="8.4.4">
            Composite Requirement item
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>TBD</p>
            </div>

          </div>
        </section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Links"></div>
          <h3 class="section-title printable" data-level="8.4.5">
            Links
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc's data model shall support linking document content nodes to each other.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Parent-links"></div>
          <h4 class="section-title printable" data-level="8.4.5.1">
            Parent links
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc's data model shall support linking a requirement to another requirement using PARENT link.
              </p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="SDOC-file-format"></div>
          <h2 class="section-title printable" data-level="8.5">
            SDOC file format
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-FMT-PRIMARY"></div>
          <h3 class="section-title printable" data-level="8.5.1">
            Primary text implementation
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-FMT-PRIMARY</dd>
            </div>

          </dl>
          <ul class="requirement_parent printable">
            <li>
              <a href="#SDOC-DM-MODEL">
                <span class="requirement_parent-uid">SDOC-DM-MODEL</span>
                Modeling capability
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>SDOC format shall support encoding the Strict Doc Data Model in a plain-text human readable form.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="SDOC-FMT-GRAMMAR"></div>
          <h3 class="section-title printable" data-level="8.5.2">
            Grammar
          </h3>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>SDOC-FMT-GRAMMAR</dd>
            </div>

          </dl>
          <ul class="requirement_parent printable">
            <li>
              <a href="#SDOC-HIGH-DATA-MODEL">
                <span class="requirement_parent-uid">SDOC-HIGH-DATA-MODEL</span>
                Data model
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>SDOC format shall be based on a fixed grammar.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Type-safety"></div>
          <h3 class="section-title printable" data-level="8.5.3">
            Type safety
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>SDOC format shall allow type-safe encoding of requirement documents.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Document-Generators"></div>
          <h2 class="section-title printable" data-level="8.6">
            Document Generators
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="HTML-Export"></div>
          <h3 class="section-title printable" data-level="8.6.1">
            HTML Export
          </h3>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Single-document-Normal-form"></div>
          <h4 class="section-title printable" data-level="8.6.1.1">
            Single document: Normal form
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall export single document pages in a normal document-like form.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Single-document-Tabular-form"></div>
          <h4 class="section-title printable" data-level="8.6.1.2">
            Single document: Tabular form
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall export single document pages in a tabular form.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Single-document-1-level-traceability"></div>
          <h4 class="section-title printable" data-level="8.6.1.3">
            Single document: 1-level traceability
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall export 1-level traceability document.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Single-document-Deep-traceability"></div>
          <h4 class="section-title printable" data-level="8.6.1.4">
            Single document: Deep traceability
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall export deep traceability document.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Left-panel-Table-of-contents"></div>
          <h4 class="section-title printable" data-level="8.6.1.5">
            Left panel: Table of contents
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall export all HTML pages with Table of Contents.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="PDF-Export"></div>
          <h3 class="section-title printable" data-level="8.6.2">
            PDF Export
          </h3>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Sphinx-documentation-generator"></div>
          <h4 class="section-title printable" data-level="8.6.2.1">
            Sphinx documentation generator
          </h4>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support exporting documents to Sphinx/RST format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Excel-Export"></div>
          <h3 class="section-title printable" data-level="8.6.3">
            Excel Export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support exporting documents to Excel format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Validation"></div>
          <h2 class="section-title printable" data-level="8.7">
            Validation
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Valid-HTML-markup"></div>
          <h3 class="section-title printable" data-level="8.7.1">
            Valid HTML markup
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc's HTML export tests shall validate the generated HTML markup.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>First candidate: Table of contents and its nested <tt class="docutils literal"><span
                    class="pre">&lt;ul&gt;/&lt;li&gt;</span></tt> items.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Design-decisions"></div>
          <h1 class="section-title printable" data-level="9">
            Design decisions
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Building-blocks"></div>
          <h2 class="section-title printable" data-level="9.1">
            Building blocks
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="TextX"></div>
          <h3 class="section-title printable" data-level="9.1.1">
            TextX
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>TextX shall be used for StrictDoc grammar definition and parsing of the sdoc files.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>TextX is an easy-to-install Python tool. It is fast, works out of the box.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Jinja2"></div>
          <h3 class="section-title printable" data-level="9.1.2">
            Jinja2
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Jinja2 shall be used for rendering HTML templates.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Sphinx-and-Docutils"></div>
          <h3 class="section-title printable" data-level="9.1.3">
            Sphinx and Docutils
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>Sphinx and Docutils shall be used for the following capabilities:</p>
              <ul class="simple">
                <li>Support of Restructured Text (reST) format</li>
                <li>Generation of RST documents into HTML</li>
                <li>Generation of RST documents into PDF using LaTeX</li>
                <li>Generating documentation websites using Sphinx</li>
              </ul>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="SDoc-grammar"></div>
          <h2 class="section-title printable" data-level="9.2">
            SDoc grammar
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="No-indentation"></div>
          <h3 class="section-title printable" data-level="9.2.1">
            No indentation
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>SDoc grammar's building blocks shall not allow any indentation.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Rationale: Adding indentation to any of the fields does not scale well when the
                documents have deeply nested section structure as well as when the size of the
                paragraphs becomes sufficiently large. Keeping every keyword like [REQUIREMENT]
                or [COMMENT] with no indentation ensures that one does not have to think about
                possible indentation issues.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Backlog"></div>
          <h1 class="section-title printable" data-level="10">
            Backlog
          </h1>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Generated-file-names"></div>
          <h2 class="section-title printable" data-level="10.1">
            Generated file names
          </h2>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall preserve original document file names when generating to all export formats.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>StrictDoc used to create file names that were document names. This has been
                changed for HTML but not yet for RST.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Validation-Uniqueness-of-UID-identifiers-in-a-document-tree"></div>
          <h2 class="section-title printable" data-level="10.2">
            Validation: Uniqueness of UID identifiers in a document tree
          </h2>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall ensure that each UID used in a document tree is unique.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>This is implemented but the error message shall be made more readable.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="StrictDoc-as-library"></div>
          <h2 class="section-title printable" data-level="10.3">
            StrictDoc as library
          </h2>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support it use as a Python library.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>Such a use allows a more fine-grained access to the StrictDoc's modules, such
                as Grammar, Import, Export classes, etc.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="BACKLOG-FUZZY-SEARCH"></div>
          <h2 class="section-title printable" data-level="10.4">
            Fuzzy requirements search
          </h2>
          <dl class="requirement_meta printable">
            <div>
              <dt>UID</dt>
              <dd>BACKLOG-FUZZY-SEARCH</dd>
            </div>

          </dl>
          <ul class="requirement_parent printable">
            <li>
              <a href="#GOAL-4-CHANGE-MANAGEMENT">
                <span class="requirement_parent-uid">GOAL-4-CHANGE-MANAGEMENT</span>
                Change management
              </a>
            </li>
          </ul>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support finding relevant requirements.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>
          <div class="requirement_comment printable">
            <div class="document">
              <p>This feature can be implemented in the CLI as well as in the future GUI. A fuzzy
                requirements search can help to find existing requirements and also identify
                relevant requirements when creating new requirements.</p>
            </div>

          </div>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Export-capabilities"></div>
          <h2 class="section-title printable" data-level="10.5">
            Export capabilities
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="CSV-import-export"></div>
          <h3 class="section-title printable" data-level="10.5.1">
            CSV import/export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support exporting documents to CSV format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="PlantUML-export"></div>
          <h3 class="section-title printable" data-level="10.5.2">
            PlantUML export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support exporting documents to PlantUML format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="ReqIF-import-export"></div>
          <h3 class="section-title printable" data-level="10.5.3">
            ReqIF import/export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support ReqIF format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Confluence-import-export"></div>
          <h3 class="section-title printable" data-level="10.5.4">
            Confluence import/export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support importing/exporting documents from/to Confluence HTML storage format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Tex-export"></div>
          <h3 class="section-title printable" data-level="10.5.5">
            Tex export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support exporting documents to Tex format.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Doorstop-import-export"></div>
          <h3 class="section-title printable" data-level="10.5.6">
            Doorstop import/export
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support import and exporting documents from/to
                <a class="reference external" href="https://github.com/doorstop-dev/doorstop">Doorstop</a> format.
              </p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Markdown-support-for-text-and-code-blocks"></div>
          <h3 class="section-title printable" data-level="10.5.7">
            Markdown support for text and code blocks
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support rendering text/code blocks into Markdown syntax.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Traceability-and-coverage"></div>
          <h2 class="section-title printable" data-level="10.6">
            Traceability and coverage
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Linking-with-implementation-artifacts"></div>
          <h3 class="section-title printable" data-level="10.6.1">
            Linking with implementation artifacts
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support linking requirements to files.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Requirement-checksumming"></div>
          <h3 class="section-title printable" data-level="10.6.2">
            Requirement checksumming
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support calculation of checksums for requirements.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Documentation-coverage"></div>
          <h3 class="section-title printable" data-level="10.6.3">
            Documentation coverage
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall generate requirements coverage information.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Filtering-by-tags"></div>
          <h2 class="section-title printable" data-level="10.7">
            Filtering by tags
          </h2>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support filtering filtering by tags.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Open-questions"></div>
          <h2 class="section-title printable" data-level="10.8">
            Open questions
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="One-or-many-input-sdoc-trees"></div>
          <h3 class="section-title printable" data-level="10.8.1">
            One or many input sdoc trees
          </h3>
        </section>
        <section data-section="description" class="docsection_section">
          <div class="free-text printable">
            <div class="document">
              <p>StrictDoc supports this for HTML already but not for RST.</p>
              <p>When passed
                <tt class="docutils literal">strictdoc export ... /path/to/doctree1, /path/to/doctree2,
                  /path/to/doctree3</tt>,
                the following is generated:
              </p>
              <pre class="code text literal-block">
output folder:
- doctree1/
  - contents
- doctree2/
  - contents
- doctree3/
  - contents
</pre>
              <p>and all three doctrees' requirements are merged into a single documentation
                space with cross-linking possible.</p>
              <p>The question is if it is worth supporting this case further or StrictDoc should
                only work with one input folder with a single doc tree.</p>
            </div>

          </div>
        </section>
      </article>
      <article class="docsection">

        <header class="docsection-headers">
          <div data-section='meta'></div>
          <div data-section='description'></div>
        </header>

        <section data-section="meta" class="docsection_section">
          <div data-role='anchor' id="Advanced"></div>
          <h2 class="section-title printable" data-level="10.9">
            Advanced
          </h2>
        </section>
        <section data-section="description" class="docsection_section"></section>
      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Facts-table-Invariants-calculation-"></div>
          <h3 class="section-title printable" data-level="10.9.1">
            Facts table. Invariants calculation.
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support creation of fact tables and allow calculation of
                invariants for constraints enforcement.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="FMEA-FMECA-tables"></div>
          <h3 class="section-title printable" data-level="10.9.2">
            FMEA/FMECA tables
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall support creation of FMEA/FMECA safety analysis documents.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Graphical-User-Interface-GUI-"></div>
          <h3 class="section-title printable" data-level="10.9.3">
            Graphical User Interface (GUI)
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall provide a Graphical User Interface (GUI).</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>
      <article class="requirement">

        <header class="requirement_headers">
          <div data-section='meta'></div>
          <div data-section='statement'></div>
          <div data-section='comment'></div>
        </header>

        <section class="requirement_section" data-section='meta'>
          <div data-role='anchor' id="Web-server-and-editable-HTML-pages"></div>
          <h3 class="section-title printable" data-level="10.9.4">
            Web server and editable HTML pages
          </h3>

        </section>
        <section class="requirement_section" data-section='statement'>
          <div class="requirement_statement printable breakable">
            <div class="document">
              <p>StrictDoc shall provide a web server that serves as a StrictDoc backend for
                reading and writing SDoc files.</p>
            </div>

          </div>


        </section>
        <section class="requirement_section" data-section='comment'>

        </section>

      </article>

    </div>
  </div>

</main>
`;

export default text;
