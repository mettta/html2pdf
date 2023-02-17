import simple from './simple';
import text from './text';
import long from './long';
import table from './table';
import image from './image';
import pre from './pre';
import strictDoc from './strictDoc';

export default function _emulateContent() {
  const temp = document.createElement('div');
  console.log(strictDoc);
  temp.innerHTML = strictDoc;
  document.body.append(temp);
}
