import simple from './simple.js';
import text from './text.js';
import long from './long.js';
import table from './table.js';
import image from './image.js'; // todo
import pre from './pre.js';
import strictDoc from './strictDoc.js';
import __try from './__try.js';

export default function _emulateContent() {
  const temp = document.createElement('div');

  // ! to test change this:
  const testContent = __try;

  temp.innerHTML = testContent;
  document.body.append(temp);
}
