import simple from './simple';
import text from './text';
import long from './long';
import table from './table';
import image from './image';
import pre from './pre';

export default function _emulateContent() {
  const temp = document.createElement('div');
  temp.innerHTML = pre;
  document.body.append(temp);
}
