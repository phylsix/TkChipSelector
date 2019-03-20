const uniqueLevels = data => {
  let levels = [];
  for (let i = 0; i !== data.length; ++i) {
    if (data[i].level === undefined) {
      let errMsg = "data missing 'level' attribute!";
      console.error(errMsg);
      throw errMsg;
    }
    levels.push(data[i].level);
  }
  const distinct = (value, index, self) => {
    return self.indexOf(value) === index;
  };
  let distinctLevels = levels.filter(distinct);
  return distinctLevels.sort((a, b) => a - b);
};

const levelCheck = levels => levels[levels.length - 1] === levels.length - 1;

const constructComponents = (data, sortedLevels) => {
  let res = [];
  for (let i = 0; i < sortedLevels.length; i++) {
    const level = sortedLevels[i];

    for (let ic = 0; ic < data.length; ic++) {
      const c = data[ic];
      if (c.level === level) {
        if (!c.numbered) {
          res.push(c.name);
        } else {
          let subRes = [];
          for (let iname = 0; iname < c.name.length; iname++) {
            const name_ = c.name[iname];
            const numberedName = c.index.map(x => name_ + x);
            subRes = subRes.concat(numberedName);
          }
          res.push(subRes);
        }

        break;
      }
    }

    continue;
  }

  return res;
};

const composeComponents2 = componentList => {
  // composing to flat
  let res = [];
  let lastParentNodes = [];

  for (let ic = 0; ic < componentList.length; ic++) {
    const componentsThisLevel = componentList[ic];
    let currentNodes = [];

    for (let jc = 0; jc < componentsThisLevel.length; jc++) {
      const c_id = componentsThisLevel[jc].toLowerCase();
      const c_title = componentsThisLevel[jc];
      const c_value = componentsThisLevel[jc];
      const c_isLeaf = ic + 1 === componentList.length;

      if (ic === 0) {
        let self = {
          id: c_id,
          pId: "",
          title: c_title,
          value: c_value,
          isLeaf: c_isLeaf
        };
        res.push(self);
        currentNodes.push(self);
      } else {
        const lastParentNode_ = lastParentNodes[lastParentNodes.length - 1];
        for (let kp = 0; kp < lastParentNode_.length; kp++) {
          const pn_id = lastParentNode_[kp].id;
          const pn_title = lastParentNode_[kp].title;
          const pn_value = lastParentNode_[kp].value;
          let self = {
            id: [pn_id, c_id].join("-"),
            pId: lastParentNode_[kp].id,
            title: [pn_title, c_title].join("_"),
            value: [pn_value, c_value].join("_"),
            isLeaf: c_isLeaf
          };
          res.push(self);
          currentNodes.push(self);
        }
      }
    }

    lastParentNodes.push(currentNodes);
  }

  return res;
};

const composeComponents = componentList => {
  let res = [];

  const getChildren = (parentNode, arr) => {
    let res = [];
    const level = parentNode.key.split("-").length;
    const childIdentifiers = arr[level];
    for (let ic = 0; ic < childIdentifiers.length; ic++) {
      const cIdentifier = childIdentifiers[ic];

      let self = {
        title: [parentNode.title, cIdentifier].join("_"),
        value: [parentNode.value, cIdentifier].join("_"),
        key: [parentNode.key, cIdentifier.toLowerCase()].join("-")
      };
      if (level < arr.length - 1) {
        self["children"] = getChildren(self, arr);
      }
      res.push(self);
    }
    return res;
  };

  for (let inode = 0; inode < componentList[0].length; inode++) {
    let self = {
      title: componentList[0][inode],
      value: componentList[0][inode],
      key: componentList[0][inode].toLowerCase()
    };
    self["children"] = getChildren(self, componentList);

    res.push(self);
  }

  return res;
};

const convertModuleList = data => {
  const distinctLevels = uniqueLevels(data);

  if (!levelCheck(distinctLevels)) {
    let errMsg = "levels are not continuous: " + distinctLevels.toString();
    console.error(errMsg);
    throw errMsg;
  }

  const subIdentifiers = constructComponents(data, distinctLevels);
  const converted = composeComponents2(subIdentifiers);

  return converted;
};

export default convertModuleList;
