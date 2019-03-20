import React from "react";
import { scaleSequential } from "d3-scale";
import { interpolateGnBu } from "d3-scale-chromatic";
import { format as d3format } from "d3-format";
import {
  treemap as d3treemap,
  hierarchy as d3hierarchy,
  treemapSliceDice as d3treemapSliceDice
} from "d3-hierarchy";
import { select as d3select, selectAll as d3selectAll } from "d3-selection";
import { nest as d3nest } from "d3-collection";
import uid from "./uid";

const color = scaleSequential([0, 8], interpolateGnBu);

class ChipTreeMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...props
    };
    this.createMap = this.createMap.bind(this);
    this.updateMap = this.updateMap.bind(this);
  }

  componentDidMount() {
    this.createMap();
  }

  componentDidUpdate() {
    this.state.chipState = this.props.chipState; // It's anti-pattern, but don't want to render
    this.updateMap();
  }

  hovered = hover => d => {
    d3selectAll(d.ancestors().map(d => d.node))
      .select("rect")
      .attr(
        "stroke",
        hover ? "black" : d => (d.height === 1 ? "#ccc" : "none")
      );
  };

  clicked = d => {
    const allselected = d
      .leaves()
      .map(
        d => this.state.chipState.filter(c => c.id === d.data.id)[0].selected
      )
      .every(d => d);
    const needAlternate = allselected
      ? d.leaves().map(d => d.data.id)
      : d
          .leaves()
          .filter(
            d =>
              !this.state.chipState.filter(c => c.id === d.data.id)[0].selected
          )
          .map(d => d.data.id);
    // calculate to-be-updated chipState and value, then make calls to callback
    const { chipState } = this.state;
    const updatedChipState = chipState.map(c =>
      needAlternate.includes(c.id) ? { ...c, selected: !c.selected } : c
    );
    this.props.onUpdateMap(updatedChipState);
  };

  createMap() {
    const { chipState } = this.state;

    const chipStateWithArea = chipState.map(d => ({ ...d, area: 1 }));
    const nNestedLevels = chipStateWithArea[0].title.split("_").length - 1;
    const nestKeys = [...Array(nNestedLevels).keys()].map(i => d =>
      d.title.split("_")[i]
    );
    const keychains = [d3nest()]
      .concat(nestKeys)
      .reduce((accumulator, currentvalue) => accumulator.key(currentvalue));
    const nestedChipState = {
      key: "detector",
      values: keychains.entries(chipStateWithArea)
    };

    const formatNum = d3format(",d");
    const treemapping = data =>
      d3treemap()
        .size([this.state.width, this.state.height])
        .paddingOuter(1)
        .paddingTop(15)
        .paddingInner(1)
        .tile(d3treemapSliceDice)
        .round(true)(d3hierarchy(data, d => d.values).sum(d => d.area));

    const root = treemapping(nestedChipState);

    const svg = d3select(this.node)
      .style("width", "100%")
      .style("height", "auto")
      .style("font", "10px sans-serif");

    const shadow = uid("shadow");

    svg
      .append("filter")
      .attr("id", shadow.id)
      .append("feDropShadow")
      .attr("flood-opacity", 0.3)
      .attr("dx", 0)
      .attr("stdDeviation", 3);

    const node = svg
      .selectAll("g")
      .data(
        d3nest()
          .key(d => d.height)
          .entries(root.descendants())
      )
      .join("g")
      .attr("filter", shadow)
      .selectAll("g")
      .data(d => d.values)
      .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .each(function(d) {
        d.node = this;
      })
      .on("mouseover", this.hovered(true))
      .on("mouseout", this.hovered(false))
      .on("click", this.clicked);

    node.append("title").text(d =>
      d.data.title
        ? d.data.title
        : `${d
            .ancestors()
            .reverse()
            .map(d => d.data.key)
            .join("/")}`
    );

    node
      .append("rect")
      .attr("id", d => (d.nodeUid = uid("node")).id)
      .attr("fill", d =>
        d.data.title && d.data.selected ? "#3182bd" : color(d.height)
      )
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

    node
      .append("clipPath")
      .attr("id", d => (d.clipUid = uid("clip")).id)
      .append("use")
      .attr("xlink:href", d => d.nodeUid.href);

    node
      .append("text")
      .attr("clip-path", d => d.clipUid)
      .selectAll("tspan")
      .data(d => [d.data.title || d.data.key, formatNum(d.value)])
      .join("tspan")
      .attr("fill-opacity", (d, i, nodes) =>
        i === nodes.length - 1 ? 0.7 : null
      )
      .text(d => d);

    node
      .filter(d => d.children)
      .selectAll("tspan")
      .attr("dx", 3)
      .attr("y", 13);

    node
      .filter(d => !d.children)
      .selectAll("tspan")
      .attr("x", 3)
      .attr(
        "y",
        (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
      );

    return svg.node();
  }

  updateMap() {
    const svg = d3select(this.node);
    const chips = svg
      .selectAll("g")
      .data()
      .filter(d => d.data && d.data.key === "detector")[0]
      .leaves();

    chips.forEach(c => {
      const node = d3select(c).node();
      d3select(node.node)
        .select("rect")
        .attr("fill", d =>
          this.state.chipState.filter(c => c.id === d.data.id)[0].selected
            ? "#3182bd"
            : color(d.height)
        );
    });
  }

  render() {
    const { height } = this.state;
    return (
      <svg width="100%" height={height} ref={node => (this.node = node)} />
    );
  }
}

export default ChipTreeMap;
