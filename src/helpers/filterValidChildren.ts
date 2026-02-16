import React from "react";

const filterValidChildren = (child: React.ReactNode): React.ReactNode[] => {
  if (child === null || child === undefined) {
    return [];
  }
  if (React.isValidElement(child)) {
    const childElement = child as React.ReactElement<any>;
    if (childElement.type === React.Fragment) {
      return React.Children.toArray(childElement.props.children).flatMap(
        filterValidChildren,
      );
    }
    return [childElement];
  }
  return [child];
};

export default filterValidChildren;
