import React from "react";
import TreeSelect from "antd/lib/tree-select";
import Typography from "antd/lib/typography";
import sizeMe from "react-sizeme";
import convertModuleList from "./moduleListConverter";
import mergeModuleList from "./moduleListsMerger";
import SelectedChipList from "./SelectedChipsList";
import ChipTreeMap from "./ChipTreeMap";

const rng1 = require("./data/moduleList_rng1sub.json");
const rng2 = require("./data/moduleList_rng2.json");

const SHOW_PARENT = TreeSelect.SHOW_PARENT;

class ModuleSelector extends React.Component {
  constructor(props) {
    super(props);
    const moduleData = mergeModuleList([
      convertModuleList(rng1)
      // convertModuleList(rng2)
    ]);
    this.state = {
      value: [],
      chipState: moduleData
        .filter(md => md.isLeaf)
        .map(md => ({
          id: md.id,
          title: md.title,
          value: md.value,
          selected: false
        })),
      moduleData: moduleData
    };
  }

  getCheckedLeaves = nodes => {
    let leaves = [];
    for (let n of nodes) {
      const n_ = n.node ? n.node : n;
      if (n_.props.isLeaf) {
        leaves.push(n_.key);
      } else {
        leaves = leaves.concat(this.getCheckedLeaves(n_.props.children));
      }
    }
    return leaves;
  };

  updateChipState = sel => {
    const { chipState } = this.state;
    chipState.map(c => {
      c.selected = sel.includes(c.id);
      return c;
    });
    this.setState({ chipState });
  };

  onChange = (value, label, extra) => {
    this.setState({ value });
    this.updateChipState(this.getCheckedLeaves(extra.allCheckedNodes));
  };

  getSiblings = nodeValue => {
    const node = this.state.moduleData.filter(d => d.value === nodeValue)[0];
    const children = this.state.moduleData.filter(d => d.pId === node.pId);
    const siblings = children.filter(d => d.id !== node.id).map(d => d.value);
    return siblings;
  };
  getParent = nodeValue => {
    const node = this.state.moduleData.filter(d => d.value === nodeValue)[0];
    const parent = this.state.moduleData.filter(d => d.id === node.pId)[0];
    return parent.value;
  };

  removeLeaf = (treeNodes, leaf) => {
    if (treeNodes.includes(leaf)) {
      return treeNodes.filter(d => d !== leaf);
    } else {
      const parent = this.getParent(leaf);
      const siblings = this.getSiblings(leaf);
      return this.removeLeaf(treeNodes.concat(siblings), parent);
    }
  };

  onCloseTag = chipToRemove => {
    const { value, chipState } = this.state;
    this.setState({ value: this.removeLeaf(value, chipToRemove.value) });
    this.setState({
      chipState: chipState.map(d =>
        d.value === chipToRemove.value ? { ...d, selected: false } : d
      )
    });
  };

  chipStateToValue = chipState => {
    const rootNode = this.state.moduleData
      .filter(d => d.pId === "")
      .map(d => d.value);
    const unselected = chipState.filter(d => !d.selected).map(d => d.value);
    return [rootNode]
      .concat(unselected)
      .reduce((accumulator, currentValue) =>
        this.removeLeaf(accumulator, currentValue)
      );
  };

  onUpdateMap = chipState => {
    this.setState({
      value: this.chipStateToValue(chipState),
      chipState: chipState
    });
  };

  calcHeight = (chipState, totalWidth) => {
    const nLevels = chipState[0].value.split("_").length;
    const allValuesSplitted = chipState.map(d => d.value.split("_"));
    const nLevelsIndices = [...Array(nLevels).keys()];
    const uniqueComponents = nLevelsIndices.map(idx =>
      allValuesSplitted.map(d => d[idx]).filter((v, i, a) => a.indexOf(v) === i)
    );
    const columnChipCounts = nLevelsIndices
      .filter(d => d % 2 === 0)
      .map(idx => uniqueComponents[idx].length)
      .reduce((l, r) => l * r);
    const rowChipCountsList = nLevelsIndices
      .filter(d => d % 2 === 1)
      .map(idx => uniqueComponents[idx].length);
    const rowChipCounts =
      nLevels % 2 === 1
        ? [1].concat(rowChipCountsList).reduce((l, r) => l * r)
        : [1]
            .concat(rowChipCountsList)
            .slice(0, -1)
            .reduce((l, r) => l * r);

    const singleChipWidth =
      (totalWidth - columnChipCounts * 2) / columnChipCounts;
    const totalChipHeight = singleChipWidth * rowChipCounts;

    const rowHeadSpanCountList = nLevelsIndices
      .slice(0, -1)
      .filter(d => d % 2 === 1)
      .map(idx => uniqueComponents[idx].length)
      .map((d, i, a) => a.slice(0, i + 1).reduce((l, r) => l * r));
    const columnHeadSpanCountList =
      nLevels % 2 === 0
        ? rowHeadSpanCountList
        : rowHeadSpanCountList.slice(0, -1);
    const totalHeadSpanCount =
      rowHeadSpanCountList.reduce((l, r) => l + r) +
      columnHeadSpanCountList.reduce((l, r) => l + r) +
      1;
    const totalHeadSpanHeight = 18 * totalHeadSpanCount;
    const totalHeight = totalChipHeight + totalHeadSpanHeight;

    return totalHeight;
  };

  render() {
    const { width } = this.props.size;
    const tProps = {
      treeData: this.state.moduleData,
      treeDataSimpleMode: true,
      value: this.state.value,
      onChange: this.onChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      filterTreeNode: (inputValue, treeNode) =>
        treeNode.props.value.toLowerCase().includes(inputValue.toLowerCase()),
      searchPlaceholder: "Please select",
      allowClear: false,
      style: {
        width: "100%"
      }
    };

    const sclProps = {
      chipState: this.state.chipState,
      onCloseTag: this.onCloseTag
    };

    const ctmProps = {
      chipState: this.state.chipState,
      value: this.state.value,
      onUpdateMap: this.onUpdateMap,
      width: width,
      height: this.calcHeight(this.state.chipState, width)
    };

    return (
      <div>
        <Typography.Text strong>Make selection here:</Typography.Text>
        <TreeSelect {...tProps} />
        <SelectedChipList {...sclProps} />
        <ChipTreeMap {...ctmProps} />
      </div>
    );
  }
}

export default sizeMe()(ModuleSelector);
