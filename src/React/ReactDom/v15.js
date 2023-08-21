// vDom=>realDom
// v15 以前是这样的，层级特别多，节点特别的多是这样做的，一气呵成不能暂停
// 因为js单线程的，而且ui渲染和js执行是互斥的
const render = (element, parentDom) => {
  let dom = document.createElement(element.type); //根据虚拟dom类型创建对应真实dom
  Object.keys(element.props)
    .filter((key) => key !== "children") //过滤掉children，并且那搭配当前虚拟dom的全部属性
    .forEach((key) => {
      dom[key] = element.props[key]; //添加属性
    });
  if (Array.isArray(element.props.children)) {
    element.props.children.map((el) => render(el, dom));
  }
  parentDom.appendChild(dom);
};
const ReactDom = {
  render,
};
export default ReactDom;
