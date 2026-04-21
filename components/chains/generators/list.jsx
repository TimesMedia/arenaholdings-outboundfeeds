'use strict';

import React from 'react';

export default function createList(ListType, ItemType = 'li') {
  const ListComponent = ({ children }) => {
    return (
      <ListType>
        {children &&
          children.map((child, index) => (
            <ItemType key={index}>{child}</ItemType>
          ))}
      </ListType>
    );
  };

  ListComponent.displayName = 'ListComponent';

  return ListComponent;
}