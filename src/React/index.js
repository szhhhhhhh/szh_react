import { ELEMENT_TEXT } from "../constants";
import ReactDom from "./ReactDom/v16.8";
import { UpdateQueue, Update } from "./updateQueue";
import { scheduleRoot, useReducer, useState } from "./ReactDom/scheduler";
function createElement(type, config, ...children) {
  delete config.__self;
  delete config.__source;
  return {
    type,
    props: {
      ...config,
      children: children.map((child) => {
        return typeof child === "object"
          ? child
          : {
              type: ELEMENT_TEXT,
              props: {
                text: child,
                children: [],
              },
            };
      }),
    },
  };
}
class Component {
  constructor(props) {
    this.props = props;
    this.updateQueue = new UpdateQueue();
  }
  setState(payload) {
    let update = new Update(payload);
    this.internalFiber.updateQueue.enqueueUpdate(update);
    scheduleRoot();
  }
}
Component.prototype.isReactComponent = {}; // 表示类组件
const React = {
  createElement,
  Component,
  render: ReactDom.render,
  useReducer,
  useState,
};
export default React;
