import simple from './simple';
import text from './text';

export default function _emulateContent() {
  const temp = document.createElement('div');
  temp.innerHTML = text;
  document.body.append(temp);
}
