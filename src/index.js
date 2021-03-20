import logMe from './temp.js';

function component() {
  const element = document.createElement('div');
  const btn = document.createElement('button');

  element.innerHTML = 'Hello';

  btn.innerHTML = 'Click me and check the console!';
  btn.onclick = logMe;

  element.appendChild(btn);

  return element;
}

document.body.appendChild(component());
