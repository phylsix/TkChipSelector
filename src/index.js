import React from "react";
import ReactDOM from "react-dom";
import "antd/dist/antd.css";
import "./index.css";

import ModuleSelector from "./moduleSelector";
import ErrorBoundary from "./ErrorBoundary";

class App extends React.Component {
  render() {
    return (
      <div style={{ width: "85%", margin: "100px auto" }}>
        <div>
          <ErrorBoundary>
            <ModuleSelector />
          </ErrorBoundary>
        </div>
      </div>
    );
  }
}
ReactDOM.render(<App />, document.getElementById("root"));
