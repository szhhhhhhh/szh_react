import { TAG_TEXT, TAG_HOST } from "../constants";
export function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type);
    updateDOM(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}

export function updateDOM(dom, oldProps, newProps) {
  if (!dom) return;
  for (let prop in oldProps) {
    if (prop !== "children") {
      // 在旧的props中有，新的props中没
      if (!newProps.hasOwnProperty(prop)) {
        dom.removeAttribute(prop);
      } else {
        // 直接移除属性
        setProp(dom, prop, newProps[prop]);
      }
    }
  }
  for (let key in newProps) {
    if (key !== "children") {
      if (!oldProps.hasOwnProperty(key)) {
        setProp(dom, key, newProps[key]);
      }
    }
  }
}
export function commitDeletion(currentFiber, returnDOM) {
  if (currentFiber.tag === TAG_HOST || currentFiber.tag === TAG_TEXT) {
    if (returnDOM.contains(currentFiber.stateNode))
      //判断一下要删除的dom节点是否在returnDOM中
      returnDOM.removeChild(currentFiber.stateNode);
  } else {
    commitDeletion(currentFiber.child, returnDOM);
  }
}
function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value;
  } else if (key === "style") {
    if (value) {
      for (let styleName in value) {
        dom.style[styleName] = value[styleName];
      }
    }
  } else {
    dom.setAttribute(key, value);
  }
}
