import simple from './simple';
import text from './text';
import long from './long';

export default function _emulateContent() {
  const temp = document.createElement('div');
  temp.innerHTML = long;
  document.body.append(temp);
}
