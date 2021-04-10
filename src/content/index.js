import simple from './simple';
import text from './text';
import long from './long';
import table from './table';

export default function _emulateContent() {
  const temp = document.createElement('div');
  temp.innerHTML = table;
  document.body.append(temp);
}
