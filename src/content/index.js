import simple from './simple';
import text from './text';

export default function _emulateContent() {
  const temp = document.createElement('div');
  temp.innerHTML = simple;
  document.body.append(temp);
}
