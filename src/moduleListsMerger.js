const _merge = (ax, ay) =>
  ax.concat(ay.filter(d => !ax.map(d => d.id).includes(d.id)));

const mergeModuleList = arrs => arrs.reduce((lhs, rhs) => _merge(lhs, rhs));

export default mergeModuleList;
