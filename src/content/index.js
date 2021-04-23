import simple from './simple';
import text from './text';
import long from './long';
import table from './table';
import image from './image';

export default function _emulateContent() {
  const temp = document.createElement('div');
  temp.innerHTML = image;
  document.body.append(temp);
}
