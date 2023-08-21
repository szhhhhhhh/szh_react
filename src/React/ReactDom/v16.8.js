import { TAG_ROOT } from "../../constants";
import { scheduleRoot } from "./scheduler";
const render = (element, container) => {
  let rootFiber = {
    tag: TAG_ROOT,
    stateNode: container, //此fiber对应的dom节点
    props: {
      children: [element],
    }, //fiber属性
    // child
    // sibling
    // return
  };
  scheduleRoot(rootFiber);
};
const ReactDom = {
  render,
};
export default ReactDom;
