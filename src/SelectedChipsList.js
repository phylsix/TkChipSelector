import React from "react";
import Button from "antd/lib/button";
import Drawer from "antd/lib/drawer";
import Tag from "antd/lib/tag";

class SelectedChipList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...props,
      drawerVisible: false
    };
  }

  showDrawer = () => {
    this.setState({ drawerVisible: true });
  };

  onDrawerClose = () => {
    this.setState({ drawerVisible: false });
  };

  handleClose = chip => {
    this.props.onCloseTag(chip);
  };

  render() {
    const bProps = {
      type: "primary",
      size: "small",
      onClick: this.showDrawer
    };

    const dProps = {
      title: "Selected Chips",
      width: "280",
      placement: "right",
      closable: false,
      onClose: this.onDrawerClose,
      visible: this.state.drawerVisible
    };

    const tProps = {
      color: "blue",
      closable: true
    };

    return (
      <div>
        <Button {...bProps}>List selected</Button>
        <Drawer {...dProps}>
          {this.props.chipState
            .filter(c => c.selected)
            .map(c => (
              <Tag {...tProps} key={c.id} onClose={e => this.handleClose(c)}>
                {c.title}
              </Tag>
            ))}
        </Drawer>
      </div>
    );
  }
}

export default SelectedChipList;
