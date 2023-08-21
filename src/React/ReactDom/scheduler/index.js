// 从根节点开始渲染和调度
// render diff对比新旧虚拟dom进行增量更新或创建 render的成果是effectList和fiber树
// 这个节点比较花时间所以对任务进行拆分，拆分维度是虚拟dom,此阶段可以暂停
// commit进行dom更新创建阶段，此阶段不能暂停
import { update, reconcileChildren } from "../updateHost";
import {
  DELETION,
  ELEMENT_TEXT,
  PLACEMENT,
  UPDATE,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
} from "../../../constants";
import { updateDOM, commitDeletion } from "../../../utils/dom";
import { UpdateQueue, Update } from "../../updateQueue";
let nextUnitOfWork; //下一个工作单元
let workInProgressRoot; //正在渲染的根树
let currentRoot; //当前根树
export let workInProgressFiber = null;
export let hookIndex = 0;
export let deletions = []; //删除的节点
export function scheduleRoot(rootFiber) {
  if (currentRoot && currentRoot.alternate) {
    // 双缓冲机制，AB不断计算
    workInProgressRoot = currentRoot.alternate;
    workInProgressRoot.alternate = currentRoot;
    if (rootFiber) workInProgressRoot.props = rootFiber.props;
  } else if (currentRoot) {
    // 如果至少渲染过一次，那么当前渲染的树alternate指向上一次渲染的树
    if (rootFiber) {
      //currentRoot存在，说明至少已经渲染一次
      rootFiber.alternate = currentRoot;
      workInProgressRoot = rootFiber;
    } else {
      workInProgressRoot = {
        ...currentRoot,
        alternate: currentRoot,
      };
    }
  } else {
    workInProgressRoot = rootFiber;
  }
  workInProgressRoot.firstEffect =
    workInProgressRoot.lastEffect =
    workInProgressRoot.nextEffect =
      null;
  nextUnitOfWork = workInProgressRoot;

  //工作循环
  function workLoop(deadline) {
    let shouldYield = false; //是否要让出时间片 【对浏览器的控制权】
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 执行完一个任务后
      shouldYield = deadline.timeRemaining() < 1; // 没有剩余时间，要让出控制权
    }
    // 副作用链收集完成后，开始进行提交
    if (!nextUnitOfWork && workInProgressRoot) {
      //没有剩余任务，进行commit操作
      console.log("render finished");
      // 进行提交阶段
      commitRoot();
    }
    // 再次请求任务调度
    requestIdleCallback(workLoop, { timeout: 500 });
  }

  //将虚拟dom转化成fiber单链表
  function performUnitOfWork(currentFiber) {
    beginWork(currentFiber);
    if (currentFiber.child) return currentFiber.child;
    while (currentFiber) {
      completeUnitOfWork(currentFiber);
      if (currentFiber.sibling) return currentFiber.sibling;
      currentFiber = currentFiber.return;
    }
  }

  //创建真实dom元素和子fiber
  function beginWork(currentFiber) {
    update(currentFiber);
  }

  //构建effectList
  function completeUnitOfWork(workInProgressFiber) {
    let returnFiber = workInProgressFiber.return;
    if (returnFiber) {
      if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = workInProgressFiber.firstEffect;
      }
      if (workInProgressFiber.lastEffect) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = workInProgressFiber.firstEffect;
        }
        returnFiber.lastEffect = workInProgressFiber.lastEffect;
      }
      if (workInProgressFiber.effectTag) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = workInProgressFiber;
        } else {
          returnFiber.firstEffect = workInProgressFiber;
        }
        returnFiber.lastEffect = workInProgressFiber;
      }
    }
  }

  //提交阶段
  function commitRoot() {
    deletions.forEach(commitWork); //执行effect list之前，先把该删除的元素删除
    let currentFiber = workInProgressRoot.firstEffect;
    while (currentFiber) {
      commitWork(currentFiber);
      currentFiber = currentFiber.nextEffect;
    }
    deletions.length = 0;
    currentRoot = workInProgressRoot;
    workInProgressRoot = null;
  }
  //提交阶段处理dom节点
  function commitWork(currentFiber) {
    if (!currentFiber) return;
    let returnFiber = currentFiber.return;
    // 现在判断不是dom节点，说明是类组件，类组件的对象要往上层查找
    while (
      returnFiber.tag !== TAG_HOST &&
      returnFiber.tag !== TAG_ROOT &&
      returnFiber.tag !== TAG_TEXT
    ) {
      //
      returnFiber = returnFiber.return;
    }
    let returnDOM = returnFiber.stateNode;
    if (currentFiber.effectTag === PLACEMENT) {
      //新增加节点
      let nextFiber = currentFiber;
      // 如果要挂载的节点不是dom，比如类组件fiber，一直向上查找第一个子节点，直到找到dom节点为止
      while (nextFiber.tag !== TAG_HOST && nextFiber.tag !== TAG_TEXT) {
        nextFiber = currentFiber.child;
      }
      // 新增 节点
      if (nextFiber.stateNode) {
        returnDOM.appendChild(nextFiber.stateNode);
      }
    } else if (currentFiber.effectTag === DELETION) {
      // 删除节点
      // returnDOM.removeChild(currentFiber.stateNode);
      return commitDeletion(currentFiber, returnDOM);
    } else if (currentFiber.effectTag === UPDATE) {
      if (currentFiber.type === ELEMENT_TEXT) {
        // currentFiber.alternate 表示的上个fiber对象
        if (currentFiber.alternate.props.text !== currentFiber.props.text)
          currentFiber.stateNode.textContent = currentFiber.props.text;
      } else {
        updateDOM(
          currentFiber.stateNode, //dom节点
          currentFiber.alternate.props, // 旧props属性
          currentFiber.props // 新props属性
        );
      }
    }
    currentFiber.effectTag = null;
  }

  //todo expirationTime
  requestIdleCallback(workLoop, { timeout: 500 });
}
export function useReducer(reducer, initialValue) {
  // 定义了多次hooks，通过hookIndex进行区分不同的hooks
  let newHook =
    workInProgressFiber.alternate &&
    workInProgressFiber.alternate.hooks &&
    workInProgressFiber.alternate.hooks[hookIndex];
  if (newHook) {
    newHook.state = newHook.updateQueue.forceUpdate(newHook.state);
  } else {
    newHook = {
      state: initialValue,
      updateQueue: new UpdateQueue(),
    };
  }
  const dispatch = (action) => {
    newHook.updateQueue.enqueueUpdate(
      // reducer为null的时候，就是useState的hooks实现
      new Update(reducer ? reducer(newHook.state, action) : action)
    );
    scheduleRoot();
  };
  workInProgressFiber.hooks[hookIndex++] = newHook;
  return [newHook.state, dispatch];
}

let lastStates = [];
let stateIndex = 0;
export function useState(initialState) {
  lastStates[stateIndex] = lastStates[stateIndex] || initialState;
  let currentIndex = stateIndex;
  function setState(newState) {
    lastStates[currentIndex] = newState;
    scheduleRoot();
    stateIndex = 0;
  }
  return [lastStates[stateIndex++], setState];
}
export function updateFunctionComponent(currentFiber) {
  workInProgressFiber = currentFiber;
  hookIndex = 0; // 每个hook对应着不同的索引，所以hook不能放到判断语句中，hook的创建必须放在顶层
  workInProgressFiber.hooks = [];
  const newChildren = [currentFiber.type(currentFiber.props)]; //让函数执行
  reconcileChildren(currentFiber, newChildren);
}
