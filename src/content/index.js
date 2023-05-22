import simple from './simple';
import text from './text';
import long from './long';
import table from './table';
import image from './image'; // todo
import pre from './pre';
import strictDoc from './strictDoc';
import __try from './__try';

export default function _emulateContent() {
  const temp = document.createElement('div');

  // ! to test change this:
  const testContent = __try;

  temp.innerHTML = testContent;
  document.body.append(temp);
}
