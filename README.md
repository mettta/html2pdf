# HTML2PDF

`html2pdf` is a JavaScript tool that allows you to print HTML pages or specific
sections of them with precision. It ensures accurate printing by dividing the
selected HTML content into printable pages and providing a preview in a browser.
Additionally, you have the option to customize the printed pages by adding a
front page and running titles according to your preferences.

Key features of HTML2PDF include:

- Precise printing of HTML pages or fragments, supporting various formats
  (default A4).
- The focus of the tool is printing documents that have titles, chapters,
  paragraphs, etc. Non-document content should be also supported just fine.
- Careful formatting and page splitting based on the logical content of a
  document: avoiding hanging lines, accurate printing of multipage tables, etc.
- The tool accurately renders HTML pages, showcasing exactly how they will
  appear on the printed page.
- It also offers a Python API, allowing you to programmatically print HTML to
  PDF.

With HTML2PDF, you can achieve high-quality printed outputs of your HTML content
while maintaining control over the formatting and layout.

## Building and running on localhost

First install dependencies:

```sh
npm install
```

To create a production build:

```sh
npm run build
```

To create a development build:

```sh
npm run start
```

## Running

```sh
node dist/bundle.js
```

## Testing

To run unit tests:

```sh
npm test
```

## Testing web server

To run the web server:

```sh
npm run test_server
```

Open server at [http://127.0.0.1:8080](http://127.0.0.1:8080).

## HTML2PDF API

...

## How it works

HTML2PDF attaches to an existing page and modifies its DOM to transform it into
a printable page.

HTML2PDF activates when the window.onload event happens. Users can choose
specific content for printing, and if nothing is selected, the whole page will
be prepared for printing. To mark a particular HTML block as printable, add the
id="printTHIS" attribute to its tag.

### Two layers

When HTML2PDF processes an HTML page, it creates two layers:

1. **Paper flow** which is a layer with pages that visualizes the preview of the
   page for printing. The pages in this layer are blank white pages showing the
   geometry of the printed output.
2. **Content flow** which is a content layer with the user content that is split
   and arranged according to the pages of the layer 1.

The algorithm does the following:

- If only a specific HTML block/tag is selected for printing with `printTHIS`,
  it marks all other HTML tags as "don't print".
- It takes the inner content of the tag marked with `printTHIS` out of the DOM.
  Let's call this content **printable content**.
- It processes the printable content and brings the updated content back to the
  DOM, in the form of the Content flow layer.
- At the same time, using `position: absolute`, the Paper flow layer is put
  behind the Content flow layer to provide a preview of how the printed content
  will look like on paper.

The main task and the challenge of the algorithm is to find the points where the
content must be split into separate pages.

### HTML layout edge cases

The algorithm considers several edge cases separately, for example, how to split
paragraphs of text, tables, multi-page tables, images, etc. If your document has
a sophisticated structure with a large number of non-trivially positioned
elements, the algorithm may produce unexpected results. In that case, the
algorithm will still visualize the result of its work, and you will be able to
see that something went wrong at a certain point. It is part of the project's
roadmap to implement as many such corner cases as possible.

### Estimating page content size

The algorithm knows exactly what are the physical dimensions of a printed page
based on a format selected by a user (i.e. the A4, A5 or A3 pages).

To estimate how much content can fit into a single page, the algorithm traverses
the content DOM top-down recursively, only descending into the child tags if
there is an opportunity for a smarter splitting of the content between pages.

For every given tag, the algorithm decides if it can place this tag on a current
page. If the whole tag's content fits into the page, the algorithm places it
entirely. If the tag's content only partially fits the page, the algorithm tries
to split the tag into two parts, one for this page and one for the next page.

In some cases, for example when handling an image that does not fit into one
page, the algorithm can downscale the image with a certain tolerance (currently,
to no less than 80% of the image's original size).

# Copyright

Copyright (c) 2023 Maryna Balioura mettta@gmail.com. See LICENSE for details.
