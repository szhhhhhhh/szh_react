import React from "./React";
import "./global.css";
class ClassCounter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { number: 0 };
  }
  onClick = () => {
    this.setState((s) => ({ number: s.number + 1 }));
  };
  render() {
    return (
      <div id="counter">
        <span>{this.state.number}</span>
        <button onClick={this.onClick}>加1</button>
      </div>
    );
  }
}
const reducer = (state, action) => {
  switch (action.type) {
    case "add":
      return { count: state.count + 1 };
    default:
      return state;
  }
};
function FunctionCounter(props) {
  const [countState, dispatch] = React.useReducer(reducer, { count: 0 });
  const [count2, setCount2] = React.useState(1);

  return (
    <div id="counter">
      <span>{countState.count}</span>
      <br />
      <span>{count2}</span>
      <button onClick={() => dispatch({ type: "add" })}>加1</button>
      <button onClick={() => setCount2(count2 + 1)}>加2</button>
    </div>
  );
}
React.render(<FunctionCounter />, document.getElementById("root"));
