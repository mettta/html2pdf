

    // this._newGetInternalSplitters({children});
    // return


  // ****************************************
  // ****************************************
  // ****************************************


  // def enumerate_trail_no_clone(list_of_elements, stack=None):
  // task_list = deque(list_of_elements)
  // stack = [] if stack is None else stack
  // while len(task_list) > 0:
  //     element: DomElement = task_list.popleft()

  //     yield element, stack

  //     if element.children is not None:
  //         stack.append(element)
  //         yield from enumerate_trail_no_clone(element.children, stack)
  //         stack.pop()

  _enumerateListWithStack(list_of_elements, callback, stack = []) {
    const task_list = [...list_of_elements];

    while (task_list.length > 0) {
      const currentElement = task_list.shift();

      callback(currentElement, stack);

      if (currentElement.children.length > 0) {
        stack.push(currentElement);
        this._enumerateListWithStack(currentElement.children, callback, stack);
        stack.pop();
      }
    }
  }

  _newGetInternalSplitters({
    rootNode,
    children,
    pageBottom,
    firstPartHeight,
    fullPageHeight,
    result = [],
    trail = [],
    currentTrail = [],
    indexTracker = [],
  }) {
    this._enumerateListWithStack(children, (currentElement, stack) => {
      console.log('🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦\n', currentElement, '\n', stack);
    });
  }



  // ****************************************
  // ****************************************
  // ****************************************
