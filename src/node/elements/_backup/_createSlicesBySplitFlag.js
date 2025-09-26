
  _createSlicesBySplitFlag(inputArray) {
    // {
    //   id,
    //   element,
    //   children: [],
    //   split: true | false,
    // }

    this._debug._ && console.group(`_createSlicesBySplitFlag`);

    const sliceWrapper = this._node.createWithFlagNoBreak();
    this._DOM.setStyles(sliceWrapper, { display: 'contents' });
    sliceWrapper.classList.add("🧰");

    // *** иниццируем для первого элемента оболочку sliceWrapper
    const slices = [sliceWrapper];
    let wrappers = [sliceWrapper]; // Реальные элементы, нужно клонировать массив для нового
    let currentTargetInSlice = sliceWrapper;

    const createWrapperFromArray = (array) => {
      if (array.length === 0) {
        return null;
      }

      const wrapper = array[0];
      let currentWrapper = wrapper;

      for (let i = 1; i < array.length; i++) {
        const child = array[i];
        this._DOM.insertAtEnd(currentWrapper, child);
        currentWrapper = child;
      }

      this._debug._ && console.log(' createWrapperFromArray:', wrapper);
      return wrapper;
    }

    const processChildren = (children, parent = null) => {
      this._debug._ && console.group('processChildren');
      this._debug._ && console.log('*start* children', children)

      for (let i = 0; i < children.length; i++) {
        processObj(children[i]);
      }

      this._debug._ && console.log('- wrappers BEFORE pop:', [...wrappers]);
      const a = wrappers.pop();
      this._debug._ && console.log('- wrappers.pop()', a);
      this._debug._ && console.log('- parent', parent);
      this._debug._ && console.log('- wrappers AFTER pop:', [...wrappers]);

      currentTargetInSlice = wrappers.at(-1);
      // TODO сделать функцию
      this._debug._ && console.log('🎯🎯 currentTargetInSlice', currentTargetInSlice)
      this._debug._ && console.log('🎯 wrappers.at(-1)', wrappers.at(-1))
      this._debug._ && console.log('*END* children', children)

      this.logGroupEnd(`processChildren`);
    }

    const processObj = (obj) => {

      const hasChildren = obj.children?.length > 0;
      const hasSplitFlag = obj.split;
      const currentElement = obj.element;
      const id = obj.id;

      this._debug._ && console.group(`processObj # ${id}`); // Collapsed
      this._debug._ && console.log('currentElement', currentElement);
      currentElement && this._DOM.removeNode(currentElement);

      if(hasSplitFlag) {
        this._debug._ && console.log('••• hasSplitFlag');
        // start new object
        // const currentWrapper = slices.at(-1);
        // const nextWrapper = this._DOM.cloneNode(currentWrapper);
        wrappers = wrappers.map(wrapper => {
          const clone = this._DOM.cloneNodeWrapper(wrapper); // ???? может делать клоны не тут а при создании?
          clone.classList.add("🚩");
          return clone
        });
        this._debug._ && console.log('• hasSplitFlag: NEW wrappers.map:', [...wrappers]);
        const nextWrapper = createWrapperFromArray(wrappers);

        slices.push(nextWrapper);
        this._debug._ && console.log('• hasSplitFlag: slices.push(nextWrapper):', [...slices]);
        // find container in new object

        currentTargetInSlice = wrappers.at(-1);
        this._debug._ && console.log('• hasSplitFlag: currentTargetInSlice:', currentTargetInSlice);
      }

      // TODO проверить, когда есть оба флага

      if(hasChildren) {
        this._debug._ && console.log('••• hasChildren');
        // make new wrapper
        const cloneCurrentElementWrapper = this._DOM.cloneNodeWrapper(currentElement);

        // add cloneCurrentElementWrapper to wrappers
        wrappers.push(cloneCurrentElementWrapper); // ???????????

        this._debug._ && console.log('• hasChildren: wrappers.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...wrappers]);
        // add cloneCurrentElementWrapper to slice
        this._debug._ && console.log('• hasChildren: currentTargetInSlice (check):', currentTargetInSlice);

        if(currentTargetInSlice) {
          this._debug._ && console.log('• hasChildren: currentTargetInSlice', 'TRUE, add to existing', cloneCurrentElementWrapper);
          // add to existing as a child
          this._DOM.insertAtEnd(currentTargetInSlice, cloneCurrentElementWrapper);
        } else {
          this._debug._ && console.log('• hasChildren: currentTargetInSlice', 'FALSE, init the first', cloneCurrentElementWrapper);
          // init the first
          cloneCurrentElementWrapper.classList.add('🏁first');

          this._DOM.setStyles(cloneCurrentElementWrapper, { background: 'yellow' });
          slices.push(cloneCurrentElementWrapper);
          this._debug._ && console.log('• hasChildren: slices.push(cloneCurrentElementWrapper)', cloneCurrentElementWrapper, [...slices]);
        }
        // update wrapper bookmark
        currentTargetInSlice = wrappers.at(-1) // = cloneCurrentElementWrapper
        this._debug._ && console.log('• hasChildren:  currentTargetInSlice (=):', currentTargetInSlice);


        processChildren(obj.children, currentElement);

      } else { // !!! внесли под ELSE

        // insert current Element
        currentTargetInSlice = wrappers.at(-1);
        this._debug._ && console.log('insert currentElement', currentElement, 'to target', currentTargetInSlice);
        this._DOM.insertAtEnd(currentTargetInSlice, currentElement);
      }

      this.logGroupEnd(`processObj # ${id}`);
    }

    this._debug._ && console.log('#######  currentTargetInSlice (=):', currentTargetInSlice);

    processChildren(inputArray);

    this._debug._ && console.log('slices:', slices)
    this._debug._ && slices.forEach(slice => console.log('slice:', slice))

    this.logGroupEnd(`_createSlicesBySplitFlag`);
    return slices
  }
