import {
  TAG_ROOT,
  TAG_TEXT,
  ELEMENT_TEXT,
  PLACEMENT,
  TAG_HOST,
  UPDATE,
  DELETION,
  TAG_CLASS,
  TAG_FUNCTION_COMPONENT,
} from "../../../constants";
import { deletions, updateFunctionComponent } from "../scheduler";
import { createDOM } from "../../../../src/utils/dom";
import { UpdateQueue } from "../../updateQueue";
export function update(currentFiber) {
  switch (currentFiber.tag) {
    case TAG_ROOT:
      updateHostRoot(currentFiber);
      break;
    case TAG_TEXT:
      updateHostText(currentFiber);
      break;
    case TAG_HOST:
      updateHost(currentFiber);
      break;
    case TAG_CLASS:
      updateClassComponent(currentFiber);
      break;
    case TAG_FUNCTION_COMPONENT:
      updateFunctionComponent(currentFiber);
      break;
  }
}
function updateClassComponent(currentFiber) {
  if (!currentFiber.stateNode) {
    // 类组件的stateNode组件实例不存在，则创建
    // currentFiber.type 是类组件的名称
    currentFiber.stateNode = new currentFiber.type(currentFiber.props);
    currentFiber.stateNode.internalFiber = currentFiber;
    currentFiber.updateQueue = new UpdateQueue();
  }
  // 给类组件实例的state 赋值
  currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(
    currentFiber.stateNode.state
  );
  let newElement = currentFiber.stateNode.render();
  const newChildren = [newElement];
  reconcileChildren(currentFiber, newChildren);
}

function updateHostRoot(currentFiber) {
  let newChildren = currentFiber.props.children; //[element,...]
  reconcileChildren(currentFiber, newChildren);
}
function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
}
function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
  const newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

//vDom=>fiber
export function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0; //新子节点索引
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
  if (oldFiber)
    oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
  let prevSibling; //上一个新的子fiber
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex];
    let tag;
    let newFiber;
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
    if (
      newChild &&
      typeof newChild.type === "function" &&
      newChild.type.prototype.isReactComponent
    ) {
      // 处理类组件
      tag = TAG_CLASS;
    } else if (newChild && typeof newChild.type === "function") {
      tag = TAG_FUNCTION_COMPONENT;
    } else if (newChild && newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT; //是文本节点
    } else if (newChild && typeof newChild.type === "string") {
      tag = TAG_HOST; // 是原生DOM节点
    }
    if (sameType) {
      if (oldFiber.alternate) {
        newFiber = oldFiber.alternate; // 如果类型一致，并且存在上上次Fiber结构，就可以复用
        newFiber.props = newChild.props;
        newFiber.alternate = oldFiber;
        newFiber.effectTag = UPDATE;
        newFiber.updateQueue =
          (oldFiber && oldFiber.updateQueue) || new UpdateQueue(); // 给类fiber对象使用，已经更新过一次
        newFiber.nextEffect = null;
      } else {
        // 更新Fiber，条件：老Fiber和新虚拟DOM类型一样，可以复用老的DOM节点
        newFiber = {
          tag: oldFiber.tag,
          type: oldFiber.type,
          props: newChild.props,
          stateNode: oldFiber.stateNode,
          return: currentFiber,
          updateQueue: (oldFiber && oldFiber.updateQueue) || new UpdateQueue(), // 给类fiber对象使用
          alternate: oldFiber,
          effectTag: UPDATE,
          nextEffect: null,
        };
      }
    } else {
      if (newChild) {
        // 创建Fiber
        newFiber = {
          tag, //TAG_HOST
          type: newChild.type, // div
          props: newChild.props,
          stateNode: null, // div还没有创建DOM原生
          return: currentFiber, // 父Fiber returnFiber
          effectTag: PLACEMENT, // 副作用标识，render阶段会收集effectlist。收集副作用 添加、删除、更新
          updateQueue: new UpdateQueue(),
          nextEffect: null, //effect list是一个单链表
        };
      }
      if (oldFiber) {
        // 如果类型不一样，仍旧存在oldFiber的话，将oldFiber删除
        oldFiber.effectTag = DELETION;
        deletions.push(oldFiber);
      }
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling; //旧的是Fiber结构，新的是虚拟dom。oldFiber向后移动指针
    }
    if (newFiber) {
      // newChildIndex说明是子元素中 的第一个节点
      if (newChildIndex === 0) {
        currentFiber.child = newFiber;
      } else {
        // 创建链表关系
        prevSibling.sibling = newFiber;
      }
      // 创建链表关系
      prevSibling = newFiber;
    }
    newChildIndex += 1;
  }
}
